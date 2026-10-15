import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { TABLES, inventory, loadSnapshot, readTables, storagePath } from "./mysql-utils.mjs";

test("real MySQL/MariaDB CLI import, backup, restore and FK rollback", {
  skip: process.env.MYSQL_INTEGRATION !== "1",
}, async (t) => {
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(process.env.MYSQL_HOST), "Integration tests require a loopback database");
  assert.match(process.env.MYSQL_DATABASE || "", /_test$/, "Integration database name must end with _test");
  const { createConnection } = await import("mysql2/promise");
  const db = await createConnection({
    host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE, charset: "utf8mb4",
  });
  let ownsTables = false;
  t.after(async () => {
    try {
      if (ownsTables) {
        for (const table of Object.keys(TABLES).reverse()) await db.query(`DELETE FROM \`${table}\``);
      }
    } finally {
      await db.end();
    }
  });
  const dir = path.resolve(`.mysql-integration-${randomUUID()}`);
  await mkdir(dir);
  t.after(() => rm(dir, { recursive: true, force: true }));
  const root = path.join(dir, "media");
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0ioAAAAASUVORK5CYII=", "base64");
  const objects = new Map([["profile/фото.png", image], ["og/share.png", image]]);
  let sourceUrl;
  const tables = {
    site_content: [],
    tariffs: [{ id: "integration-tariff", slug: "integration", title: "Консультация 🦋", description_md: "**Текст**", is_active: true, sort_order: 0 }],
    tariff_packages: [{ id: "integration-package", tariff_id: "integration-tariff", title: "Встреча", price_regular: 5000, price_discounted: null, currency: "₽", sort_order: 0 }],
    psychological_tests: [{ id: "integration-test", slug: "integration", title: "Тест", description: "", version: 1, schema_json: { pages: [] }, scoring_json: {}, sort_order: 0 }],
  };
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, sourceUrl);
    let body;
    if (url.pathname === "/storage/v1/bucket") body = [{ name: "site-images", public: true }, { name: "private-images", public: false }];
    else if (url.pathname.startsWith("/rest/v1/")) {
      const table = url.pathname.split("/").at(-1);
      const offset = Number(url.searchParams.get("offset"));
      body = tables[table].slice(offset, offset + 1);
    } else if (url.pathname === "/storage/v1/object/list/private-images") {
      let raw = "";
      for await (const chunk of request) raw += chunk;
      const { offset } = JSON.parse(raw);
      body = offset ? [] : [{ name: "secret.png", id: "private-photo", metadata: { size: image.length } }];
    } else if (url.pathname === "/storage/v1/object/authenticated/private-images/secret.png") {
      response.end(image);
      return;
    } else if (url.pathname === "/storage/v1/object/list/site-images") {
      let raw = "";
      for await (const chunk of request) raw += chunk;
      const { prefix, offset } = JSON.parse(raw);
      body = offset ? [] : !prefix ? [{ name: "profile", id: null }, { name: "og", id: null }] :
        [...objects].filter(([key]) => key.startsWith(`${prefix}/`)).map(([key, bytes]) => ({
          name: key.split("/").at(-1), id: key, metadata: { size: bytes.length }, updated_at: "2026-01-01",
        }));
    } else if (url.pathname.startsWith("/storage/v1/object/authenticated/site-images/")) {
      const object = decodeURIComponent(url.pathname.slice("/storage/v1/object/authenticated/site-images/".length));
      response.end(objects.get(object));
      return;
    } else {
      response.writeHead(404).end();
      return;
    }
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  sourceUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise((resolve) => server.close(resolve)));
  tables.site_content = [{ key: "content_json", value: JSON.stringify({
    profileImageUrl: `${sourceUrl}/storage/v1/object/public/site-images/profile/${encodeURIComponent("фото.png")}`,
    ogImageUrl: `${sourceUrl}/storage/v1/object/public/site-images/og/share.png`,
  }) }];
  tables.psychological_tests[0].schema_json = {
    pages: [], logo: `${sourceUrl}/storage/v1/object/public/site-images/og/share.png`,
  };
  const env = {
    ...process.env, MEDIA_ROOT: root, SUPABASE_URL: sourceUrl, SUPABASE_SERVICE_ROLE_KEY: "local-test-only",
  };
  const cli = (script, args = [], expectedCode = 0) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join("scripts", script), ...args], { env, windowsHide: true });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      try { assert.equal(code, expectedCode, output); resolve(output); } catch (error) { reject(error); }
    });
  });
  await cli("init-mysql.mjs");
  const baseline = await readTables(db);
  assert.ok(Object.values(baseline).every((rows) => !rows.length), "Integration database must be empty");
  ownsTables = true;
  await cli("import-supabase-to-mysql.mjs");
  const imported = await readTables(db);
  assert.equal(imported.tariffs[0].title, "Консультация 🦋");
  assert.equal(imported.tariff_packages[0].price_discounted, null);
  const profilePath = storagePath("site-images", "profile/фото.png");
  assert.match(profilePath, /^profile\/[a-z0-9._-]+$/i);
  assert.equal(JSON.parse(imported.site_content[0].value).profileImageUrl, `/media/${profilePath}`);
  assert.equal(JSON.parse(imported.psychological_tests[0].schema_json).logo, "/media/og/share.png");
  assert.deepEqual(await readFile(path.join(root, ...profilePath.split("/"))), image);
  assert.deepEqual(await readFile(path.join(root, "_private", "private-images", "secret.png")), image);
  const files = await inventory(root);
  await cli("import-supabase-to-mysql.mjs", [], 1);
  const backup = path.join(dir, "backup");
  await cli("backup-mysql.mjs", ["--output", backup]);
  assert.deepEqual((await loadSnapshot(backup)).tables, imported);
  await db.query("UPDATE tariffs SET title = 'changed'");
  await writeFile(path.join(root, "og", "share.png"), "changed");
  await cli("restore-mysql.mjs", ["--input", backup], 1);
  await cli("restore-mysql.mjs", ["--input", backup, "--confirm", process.env.MYSQL_DATABASE], 1);
  const beforeRestore = path.join(dir, "before-restore");
  await cli("restore-mysql.mjs", [
    "--input", backup, "--confirm", process.env.MYSQL_DATABASE, "--force", "--pre-backup", beforeRestore,
  ]);
  assert.equal((await loadSnapshot(beforeRestore)).tables.tariffs[0].title, "changed");
  assert.deepEqual(await readTables(db), imported);
  assert.deepEqual(await inventory(root), files);
  tables.site_content.push({
    key: "private.md",
    value: `![Private](${sourceUrl}/storage/v1/object/sign/private-images/secret.png?token=local-only)`,
  });
  const privateFailure = await cli("import-supabase-to-mysql.mjs", [
    "--force", "--pre-backup", path.join(dir, "before-private-reference"),
  ], 1);
  assert.match(privateFailure, /private storage object/);
  assert.doesNotMatch(privateFailure, /token=local-only/);
  assert.deepEqual(await readTables(db), imported);
  assert.deepEqual(await inventory(root), files);
  tables.site_content.pop();
  tables.tariff_packages[0].tariff_id = "missing-foreign-key";
  await cli("import-supabase-to-mysql.mjs", ["--force", "--pre-backup", path.join(dir, "before-failed-import")], 1);
  assert.deepEqual(await readTables(db), imported, "Real foreign-key failure must roll back every table");
  assert.deepEqual(await inventory(root), files);
});
