import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { listStorage, readSourceTables, supabaseSource } from "./import-supabase-to-mysql.mjs";
import {
  TABLES, contained, copyMedia, destinationNotEmpty, exists, inventory, loadSnapshot,
  makeStage, mediaRoot, normalizeRows, normalizeTables, prepareReplacement, replaceData,
  rewriteContent, safeRelative, sha256, snapshot, storagePath,
} from "./mysql-utils.mjs";

function fixture() {
  return {
    site_content: [{ key: "content_json", value: '{"name":"Екатерина 🦋"}' }],
    tariffs: [{ id: "tariff-1", slug: "consultation", title: "Консультация", description_md: "**Текст**", is_active: true, sort_order: 0 }],
    tariff_packages: [{ id: "package-1", tariff_id: "tariff-1", title: "Одна встреча", price_regular: 5000, price_discounted: null, currency: "₽", sort_order: 0 }],
    psychological_tests: [{ id: "test-1", slug: "test", title: "Тест", description: "", version: 1, schema_json: { pages: [] }, scoring_json: {}, sort_order: 0 }],
  };
}

class MemoryDatabase {
  constructor(tables = Object.fromEntries(Object.keys(TABLES).map((table) => [table, []]))) {
    this.tables = normalizeTables(tables);
    this.commits = 0;
    this.rollbacks = 0;
    this.events = [];
  }
  async beginTransaction() { this.previous = structuredClone(this.tables); this.events.push("begin"); }
  async commit() {
    if (this.failCommit) throw new Error("Simulated commit failure");
    this.previous = undefined;
    this.commits++;
    this.events.push("commit");
  }
  async rollback() {
    if (this.previous) this.tables = this.previous;
    this.previous = undefined;
    this.rollbacks++;
    this.events.push("rollback");
  }
  async query(sql) {
    if (sql.startsWith("START TRANSACTION")) return this.beginTransaction();
    const table = /(?:FROM|INTO) `(\w+)`/.exec(sql)?.[1];
    assert.ok(Object.hasOwn(TABLES, table), `Unexpected SQL: ${sql}`);
    if (sql.startsWith("SELECT COUNT")) return [[{ total: this.tables[table].length }]];
    if (sql.startsWith("SELECT")) {
      const rows = structuredClone(this.tables[table]);
      if (this.corruptRead && !sql.endsWith("FOR UPDATE") && rows.length) rows[0][TABLES[table][1]] = "corrupt";
      return [rows];
    }
    if (sql.startsWith("DELETE")) { this.tables[table] = []; this.events.push(`delete:${table}`); return []; }
    throw new Error("Unsupported query");
  }
  async execute(sql, values) {
    if (this.failInsert) throw new Error("Simulated insert failure with potentially sensitive data");
    const table = /INTO `(\w+)`/.exec(sql)[1];
    this.tables[table].push(Object.fromEntries(TABLES[table].map((column, index) => [column, values[index]])));
    this.events.push(`insert:${table}`);
  }
}

async function workspace(t) {
  const dir = path.resolve(`.mysql-tooling-test-${randomUUID()}`);
  await mkdir(dir);
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test("paths reject traversal, platform escapes and environment files", () => {
  for (const value of ["", "../x", "/x", "a//x", "a/./x", "a/../x", "a\\x", "C:/x", "a\u0000x", "%2e%2e/x", ".env", "a/.env.local", "nul.txt", "a/x.", "a/x "]) {
    assert.throws(() => safeRelative(value), /Unsafe/);
  }
  assert.equal(safeRelative("profile/фото.webp"), "profile/фото.webp");
  assert.equal(contained(path.resolve("images"), "profile/фото.webp"), path.resolve("images", "profile", "фото.webp"));
});

test("media root must be absolute and cannot overlap public or contain the project", async () => {
  await assert.rejects(mediaRoot({ MEDIA_ROOT: "relative" }), /absolute/);
  await assert.rejects(mediaRoot({ MEDIA_ROOT: path.resolve("public", "media") }), /public/);
  await assert.rejects(mediaRoot({ MEDIA_ROOT: process.cwd() }), /contain/);
  await assert.rejects(mediaRoot({ MEDIA_ROOT: path.parse(process.cwd()).root }), /contain/);
});

test("normalization preserves Unicode, nullable prices, JSON text and deterministic ordering", () => {
  const result = normalizeTables(fixture());
  assert.equal(result.tariffs[0].is_active, 1);
  assert.equal(result.tariff_packages[0].price_discounted, null);
  assert.equal(result.psychological_tests[0].schema_json, '{"pages":[]}');
  assert.match(result.site_content[0].value, /🦋/);
  assert.deepEqual(normalizeRows("site_content", [{ key: "b", value: "2" }, { key: "a", value: "1" }]).map((r) => r.key), ["a", "b"]);
  assert.throws(() => normalizeRows("site_content", [{ key: "x", value: "1" }, { key: "x", value: "2" }]), /Duplicate/);
  assert.throws(() => normalizeRows("tariffs", [{ ...fixture().tariffs[0], is_active: "false" }]), /flag/);
  assert.throws(() => normalizeRows("psychological_tests", [{ ...fixture().psychological_tests[0], schema_json: "invalid" }]), /JSON/);
  assert.throws(() => normalizeRows("tariff_packages", [{ ...fixture().tariff_packages[0], price_regular: 2 ** 32 }]), /integer/);
  assert.throws(() => normalizeTables({ site_content: [] }), /exactly/);
});

test("storage mapping preserves image kinds and namespaces every other bucket", () => {
  assert.equal(storagePath("site-images", "profile/1.webp"), "profile/1.webp");
  assert.equal(storagePath("site-images", "og/1.jpg"), "og/1.jpg");
  assert.equal(storagePath("private", "folder/file.pdf"), "storage/private/folder/file.pdf");
  assert.equal(storagePath("site-images", "old.png"), "storage/site-images/old.png");
  assert.equal(storagePath("site-images", "profile/secret.png", "site-images", false), "_private/site-images/profile/secret.png");
  assert.equal(storagePath("private", "secret.png", "site-images", false), "_private/private/secret.png");
  assert.match(storagePath("site-images", "profile/фото.webp"), /^profile\/[a-f0-9]{64}\.webp$/);
  assert.match(storagePath("site-images", "og/image%20name.png"), /^og\/[a-f0-9]{64}\.png$/);
  assert.throws(() => storagePath("evil/bucket", "file"), /bucket/);
  assert.throws(() => storagePath("site-images", "../secret"), /Unsafe/);
});

test("content rewriting handles public/signed/transformed URLs without touching other origins", () => {
  const url = "https://source.example";
  const rows = [
    { key: "content_json", value: JSON.stringify({
      profile: `${url}/storage/v1/object/public/site-images/profile/%D1%84%D0%BE%D1%82%D0%BE.webp`,
      nested: [{ og: `${url}/storage/v1/render/image/public/site-images/og/a.jpg?width=200` }],
      signed: `${url}/storage/v1/object/sign/site-images/og/a.jpg?token=private`,
      other: "https://other.example/storage/v1/object/public/site-images/og/a.jpg",
      local: "/unchanged.png",
    }) },
    { key: "about.md", value: `${url}/unchanged` },
  ];
  const mappings = new Map([["site-images/profile/фото.webp", "profile/фото.webp"], ["site-images/og/a.jpg", "og/a.jpg"]]);
  const output = rewriteContent(rows, url, mappings);
  const content = JSON.parse(output[0].value);
  assert.equal(content.profile, "/media/profile/%D1%84%D0%BE%D1%82%D0%BE.webp");
  assert.equal(content.nested[0].og, "/media/og/a.jpg");
  assert.equal(content.signed, "/media/og/a.jpg");
  assert.equal(content.other, JSON.parse(rows[0].value).other);
  assert.equal(content.local, "/unchanged.png");
  assert.deepEqual(output[1], rows[1]);
  assert.throws(() => rewriteContent(rows, url, new Map()), /missing storage/);
});

test("Markdown and HTML image URLs are rewritten and private references fail without exposing URLs", () => {
  const url = "https://source.example/storage/v1/object/public/images/photo.png";
  const mappings = new Map([["images/photo.png", "storage/images/photo.png"]]);
  const markdown = `![Фото](${url})\n<img src="${url}">\n[ref]: ${url}\nТекст ${url}.`;
  const rows = [
    { key: "content_json", value: JSON.stringify({ description: markdown }) },
    { key: "about.md", value: markdown },
  ];
  const output = rewriteContent(rows, "https://source.example", mappings);
  const expected = markdown.replaceAll(url, "/media/storage/images/photo.png");
  assert.equal(JSON.parse(output[0].value).description, expected);
  assert.equal(output[1].value, expected);
  for (const row of rows) {
    assert.throws(() => rewriteContent([row], "https://source.example", new Map([
      ["images/photo.png", "_private/images/photo.png"],
    ])), (error) => {
      assert.match(error.safeMessage, /private storage object/);
      assert.doesNotMatch(error.safeMessage, /source\.example|photo\.png/);
      return true;
    });
  }
});

test("Supabase source requests use authentication, refuse redirects and suppress server error bodies", async () => {
  const source = supabaseSource({
    SUPABASE_URL: "https://source.example", SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
  }, async (url, init) => {
    assert.equal(url, "https://source.example/rest/v1/site_content");
    assert.equal(init.headers.Authorization, "Bearer test-only-key");
    assert.equal(init.redirect, "error");
    return new Response("secret response must never appear", { status: 403 });
  });
  await assert.rejects(source.request("/rest/v1/site_content"), (error) => {
    assert.match(error.message, /HTTP 403/);
    assert.doesNotMatch(error.message, /secret response/);
    return true;
  });
  assert.throws(() => supabaseSource({ SUPABASE_URL: "http://remote.example", SUPABASE_SERVICE_ROLE_KEY: "test" }), /HTTPS/);
});

test("Supabase tables pagination follows actual server page size, not requested limit", async () => {
  const data = normalizeTables(fixture());
  data.site_content.push({ key: "other", value: "page two" });
  const requests = [];
  const source = { request: async (route) => {
    const url = new URL(route, "https://source.example");
    const table = url.pathname.split("/").at(-1);
    const offset = Number(url.searchParams.get("offset"));
    requests.push({ table, offset });
    return Response.json(data[table].slice(offset, offset + 1));
  } };
  assert.deepEqual(await readSourceTables(source), normalizeTables(data));
  assert.deepEqual(requests.filter((r) => r.table === "site_content").map((r) => r.offset), [0, 1, 2]);
});

test("Supabase storage enumeration includes every bucket and nested object", async () => {
  const objects = {
    "images:": [{ name: "profile", id: null }, { name: "root.png", id: "root", metadata: { size: 3 } }],
    "images:profile": [{ name: "photo.webp", id: "photo", metadata: { size: 4 } }],
    "private:": [{ name: "notes.pdf", id: "pdf", metadata: { size: 5 } }],
  };
  const source = { request: async (route, init) => {
    if (route === "/storage/v1/bucket") return Response.json([{ name: "images", public: true }, { name: "private", public: false }]);
    assert.equal(init.method, "POST");
    const body = JSON.parse(init.body);
    const bucket = route.split("/").at(-1);
    return Response.json((objects[`${bucket}:${body.prefix}`] || []).slice(body.offset, body.offset + 1));
  } };
  const { files, buckets } = await listStorage(source);
  assert.deepEqual(files.map((file) => `${file.bucket}/${file.object}`), ["images/profile/photo.webp", "images/root.png", "private/notes.pdf"]);
  assert.deepEqual(files.map((file) => file.public), [true, true, false]);
  assert.deepEqual(buckets, [{ name: "images", public: true }, { name: "private", public: false }]);
});

test("listing consistency includes visibility changes even for empty buckets", async () => {
  let isPublic = false;
  const source = { request: async (route) => Response.json(
    route === "/storage/v1/bucket" ? [{ name: "empty", public: isPublic }] : [],
  ) };
  const before = await listStorage(source);
  isPublic = true;
  assert.notEqual(JSON.stringify(before), JSON.stringify(await listStorage(source)));
  await assert.rejects(listStorage({ request: async () => Response.json([{ name: "unknown" }]) }), /visibility/);
});

test("backup and restore roundtrip verifies tables and every media byte", async (t) => {
  const dir = await workspace(t);
  const source = path.join(dir, "source");
  await mkdir(path.join(source, "profile"), { recursive: true });
  const image = Buffer.from([0, 1, 255, 50]);
  await writeFile(path.join(source, "profile", "photo.webp"), image);
  const db = new MemoryDatabase(fixture());
  const backup = path.join(dir, "backup");
  await snapshot(db, source, backup);
  const saved = await loadSnapshot(backup);
  assert.deepEqual(saved.tables, normalizeTables(fixture()));
  assert.deepEqual(saved.files, [{ path: "profile/photo.webp", size: 4, sha256: sha256(image) }]);
  assert.equal(db.commits, 1);
  const destination = path.join(dir, "destination");
  const targetDb = new MemoryDatabase();
  const stage = await makeStage(destination);
  await copyMedia(saved.media, stage, saved.files);
  await replaceData(targetDb, destination, stage, saved.tables, saved.files);
  assert.deepEqual(targetDb.tables, saved.tables);
  assert.deepEqual(await readFile(path.join(destination, "profile", "photo.webp")), image);
  assert.equal(targetDb.commits, 1);
  assert.ok(targetDb.events.indexOf("delete:tariff_packages") < targetDb.events.indexOf("delete:tariffs"));
  assert.ok(targetDb.events.indexOf("insert:tariffs") < targetDb.events.indexOf("insert:tariff_packages"));
  await assert.rejects(snapshot(db, source, backup), /already exists/);
});

test("snapshots reject modified tables, altered media and undeclared media", async (t) => {
  const dir = await workspace(t);
  const source = path.join(dir, "source");
  await mkdir(source);
  await writeFile(path.join(source, "photo.webp"), "original");
  const db = new MemoryDatabase(fixture());
  const backup = path.join(dir, "backup");
  await snapshot(db, source, backup);
  await writeFile(path.join(backup, "media", "photo.webp"), "changed");
  await assert.rejects(loadSnapshot(backup), /integrity/);
  await writeFile(path.join(backup, "media", "photo.webp"), "original");
  await writeFile(path.join(backup, "media", "extra.webp"), "extra");
  await assert.rejects(loadSnapshot(backup), /integrity/);
  await rm(path.join(backup, "media", "extra.webp"));
  await writeFile(path.join(backup, "tables.json"), "{}");
  await assert.rejects(loadSnapshot(backup), /integrity/);
});

test("existing data requires force plus a verified pre-replacement snapshot", async (t) => {
  const dir = await workspace(t);
  const root = path.join(dir, "media");
  const db = new MemoryDatabase(fixture());
  assert.equal(await destinationNotEmpty(db, root), true);
  await assert.rejects(prepareReplacement(db, root, {}), /not empty/);
  await assert.rejects(prepareReplacement(db, root, { force: true }), /pre-backup/);
  const output = path.join(dir, "before");
  await prepareReplacement(db, root, { force: true, preBackup: output });
  assert.deepEqual((await loadSnapshot(output)).tables, normalizeTables(fixture()));
});

test("insert, readback and commit failures roll back all four tables and preserve old media", async (t) => {
  const dir = await workspace(t);
  for (const failure of ["failInsert", "corruptRead", "failCommit"]) {
    const root = path.join(dir, failure);
    await mkdir(root);
    await writeFile(path.join(root, "old.jpg"), "old");
    const stage = await makeStage(root);
    await writeFile(path.join(stage, "new.webp"), "new");
    const files = await inventory(stage);
    const db = new MemoryDatabase(fixture());
    const before = structuredClone(db.tables);
    db[failure] = true;
    await assert.rejects(replaceData(db, root, stage, fixture(), files, { force: true }));
    assert.deepEqual(db.tables, before);
    assert.equal(db.rollbacks, 1);
    assert.equal(db.commits, 0);
    assert.equal(await readFile(path.join(root, "old.jpg"), "utf8"), "old");
    assert.equal(await exists(path.join(root, "new.webp")), false);
  }
});

test("nonempty media alone is protected and environment files are never snapshotted", async (t) => {
  const dir = await workspace(t);
  const root = path.join(dir, "media");
  await mkdir(root);
  await writeFile(path.join(root, "photo.webp"), "image");
  const db = new MemoryDatabase();
  assert.equal(await destinationNotEmpty(db, root), true);
  const stage = await makeStage(root);
  await assert.rejects(replaceData(db, root, stage, db.tables, []), /became nonempty/);
  await writeFile(path.join(root, ".env.local"), "not-a-real-secret");
  await assert.rejects(snapshot(db, root, path.join(dir, "backup")), /Unsafe/);
  assert.equal(await exists(path.join(dir, "backup")), false);
});
