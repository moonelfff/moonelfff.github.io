import assert from "node:assert/strict";
import { test, after } from "node:test";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loadApp = createRequire(import.meta.url);

// Load application TypeScript with only Next's request-scoped cache stubbed.
const originalLoad = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === "server-only") return {};
  if (name === "next/cache") return { unstable_cache: (fn) => fn, revalidateTag() {} };
  if (name.startsWith("@/")) name = path.join(__dirname, "..", "..", "src", name.slice(2));
  return originalLoad.call(this, name, parent, isMain);
};
Module._extensions[".ts"] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};
const { getDataProvider } = loadApp("../../src/lib/dataProvider.ts");
const { storeImage, readMedia, mediaContentType } = loadApp("../../src/lib/mediaStorage.ts");
const mediaRoute = loadApp("../../src/app/media/[...path]/route.ts");

test("provider defaults to Supabase and rejects unknown providers", () => {
  const previous = process.env.DATA_PROVIDER;
  delete process.env.DATA_PROVIDER;
  assert.equal(getDataProvider(), "supabase");
  process.env.DATA_PROVIDER = "mysql";
  assert.equal(getDataProvider(), "mysql");
  process.env.DATA_PROVIDER = "invalid";
  assert.throws(getDataProvider);
  if (previous === undefined) delete process.env.DATA_PROVIDER;
  else process.env.DATA_PROVIDER = previous;
});

test("filesystem image storage and HTTP response preserve bytes and reject unsafe paths", async () => {
  process.env.DATA_PROVIDER = "mysql";
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "site-media-test-"));
  const outside = await fsp.mkdtemp(path.join(os.tmpdir(), "site-media-outside-"));
  const previous = process.env.MEDIA_ROOT;
  process.env.MEDIA_ROOT = root;
  try {
    const bytes = Buffer.from("image fixture");
    assert.equal(await storeImage("profile/test.webp", bytes, "image/webp"), "/media/profile/test.webp");
    assert.deepEqual(await readMedia(["profile", "test.webp"]), bytes);
    await assert.rejects(storeImage("profile/test.webp", bytes, "image/webp"), { code: "EEXIST" });
    await assert.rejects(storeImage("../escape.webp", bytes, "image/webp"));
    process.env.MEDIA_ROOT = path.join(process.cwd(), "public", "media");
    await assert.rejects(storeImage("profile/test.webp", bytes, "image/webp"), /public root/);
    process.env.MEDIA_ROOT = root;
    await fsp.writeFile(path.join(outside, "private.webp"), bytes);
    await fsp.symlink(outside, path.join(root, "linked"), process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(readMedia(["linked", "private.webp"]), /escapes MEDIA_ROOT/);
    await assert.rejects(storeImage("linked/new.webp", bytes, "image/webp"), /escapes MEDIA_ROOT/);
    await fsp.mkdir(path.join(root, "_private"));
    await fsp.writeFile(path.join(root, "_private", "secret.webp"), bytes);
    for (const segments of [["..", "x.webp"], [".env"], ["x.svg"], ["a/b.png"], ["a\\b.png"], ["_private", "secret.webp"]]) {
      assert.equal(mediaContentType(segments), null);
      assert.equal((await mediaRoute.GET(new Request("https://example.test/media/x"), {
        params: Promise.resolve({ path: segments }),
      })).status, 404);
    }
    const response = await mediaRoute.GET(new Request("https://example.test/media/profile/test.webp"), {
      params: Promise.resolve({ path: ["profile", "test.webp"] }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/webp");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("cache-control"), /immutable/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    assert.equal((await mediaRoute.GET(new Request("https://example.test/media/missing.webp"), {
      params: Promise.resolve({ path: ["missing.webp"] }),
    })).status, 404);
    process.env.DATA_PROVIDER = "supabase";
    assert.equal((await mediaRoute.GET(new Request("https://example.test/media/profile/test.webp"), {
      params: Promise.resolve({ path: ["profile", "test.webp"] }),
    })).status, 404);
  } finally {
    if (previous === undefined) delete process.env.MEDIA_ROOT;
    else process.env.MEDIA_ROOT = previous;
    await fsp.rm(root, { recursive: true, force: true });
    await fsp.rm(outside, { recursive: true, force: true });
  }
});

test("MySQL stores round-trip content, tariffs and tests with atomic rollback", {
  skip: !process.env.MYSQL_TEST_DATABASE,
}, async () => {
  assert.match(process.env.MYSQL_TEST_DATABASE, /_test$/, "Use a dedicated disposable database ending in _test");
  if (process.env.MYSQL_INTEGRATION === "1") {
    assert.notEqual(process.env.MYSQL_TEST_DATABASE, process.env.MYSQL_DATABASE,
      "Runtime and CLI integration tests require separate disposable databases");
  }
  process.env.DATA_PROVIDER = "mysql";
  process.env.MYSQL_DATABASE = process.env.MYSQL_TEST_DATABASE;
  const { getMysqlPool } = loadApp("../../src/lib/mysql.ts");
  const pool = getMysqlPool();
  after(() => pool.end());
  for (const table of ["tariff_packages", "tariffs", "psychological_tests", "site_content"]) {
    await pool.query(`DELETE FROM ${table}`);
  }
  const contentStore = loadApp("../../src/lib/contentStore.ts");
  const tariffStore = loadApp("../../src/lib/tariffStore.ts");
  const testStore = loadApp("../../src/lib/tests/testStore.ts");
  const content = {
    fullName: "Тест 😀", info: { contentPath: "/profile.md" },
    blogDescriptionPath: "/blog.md", pricelist: [],
  };
  const saved = await contentStore.saveContentBundle({
    content, markdown: { "profile.md": "# Привет", "blog.md": "Блог" },
  });
  assert.equal(saved.source, "mysql");
  assert.equal(saved.content.fullName, content.fullName);
  assert.equal(await contentStore.getMarkdownByPath("/profile.md"), "# Привет");
  await assert.rejects(contentStore.saveContentBundle({
    content: { ...content, fullName: "Must roll back", info: { contentPath: `/${"x".repeat(256)}.md` } },
    markdown: {},
  }));
  assert.deepEqual(await contentStore.getContentBundle(), saved);

  const tariff = {
    id: "tmp-tariff", slug: "consultation", title: "Консультация",
    descriptionMarkdown: "Текст", isActive: false, sortOrder: 4,
    packages: [{ id: "tmp-package", title: "Встреча", regularAmount: 5000, discountedAmount: null, currency: "₽", sortOrder: 5 }],
  };
  const initial = await tariffStore.saveTariffs([tariff]);
  assert.equal(initial.tariffs[0].isActive, false);
  assert.equal(initial.tariffs[0].packages[0].regularAmount, 5000);
  assert.equal(initial.tariffs[0].packages[0].discountedAmount, null);
  const stable = await tariffStore.saveTariffs(initial.tariffs);
  assert.deepEqual(stable, initial);
  await assert.rejects(tariffStore.saveTariffs([tariff, { ...tariff, id: "tmp-other" }]));
  assert.deepEqual(await tariffStore.getTariffBundle(), stable);
  const pair = await tariffStore.saveTariffs([
    { ...tariff, id: "tmp-other", slug: "followup", isActive: true }, stable.tariffs[0],
  ]);
  assert.deepEqual(pair.tariffs.map((row) => row.slug), ["followup", "consultation"]);
  assert.deepEqual(pair.tariffs.map((row) => row.sortOrder), [0, 1]);
  const swapped = await tariffStore.saveTariffs(pair.tariffs.map((row, index) => ({
    ...row, slug: pair.tariffs[1 - index].slug,
  })));
  assert.deepEqual(swapped.tariffs.map((row) => row.id), pair.tariffs.map((row) => row.id));
  assert.deepEqual(swapped.tariffs.map((row) => row.slug), ["consultation", "followup"]);

  const definition = {
    id: "tmp-test", slug: "test", title: "Тест", description: "Описание", version: 1,
    schema: { elements: [{ type: "text", name: "q1" }] }, scoring: { type: "none" },
  };
  const tests = await testStore.saveTests([definition]);
  assert.equal(tests.source, "mysql");
  assert.deepEqual(await testStore.getTestBySlug("test"), tests.tests[0]);
  assert.equal(await testStore.getPublicTestBySlug("' OR 1=1 --"), null);
  const details = await testStore.getPublicTestBySlug("test");
  assert.equal("scoring" in details, false);
  const summaries = await testStore.getPublicTestSummaries();
  assert.equal(summaries[0].questionCount, 1);
  assert.equal("schema" in summaries[0], false);
  // Duplicate IDs pass application validation but fail inside the transaction.
  await assert.rejects(testStore.saveTests([tests.tests[0], { ...tests.tests[0], slug: "other" }]));
  assert.deepEqual(await testStore.getTestBundle(), tests);
  const ordered = await testStore.saveTests([{ ...definition, id: "tmp-other", slug: "other" }, tests.tests[0]]);
  assert.deepEqual(ordered.tests.map((row) => row.slug), ["other", "test"]);
  await tariffStore.saveTariffs([]);
  assert.deepEqual((await tariffStore.getTariffBundle()).tariffs, []);
  assert.deepEqual((await pool.query("SELECT * FROM tariff_packages"))[0], []);
  await testStore.saveTests([]);
  assert.deepEqual((await testStore.getTestBundle()).tests, []);
});
