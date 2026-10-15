import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TABLES, connect, contained, fail, makeStage, mediaRoot, normalizeTables,
  parseArgs, prepareReplacement, replaceData, rewriteContent, rewriteJsonStorageUrls, rewriteStorageUrls, runCli, safeStorageKey,
  sha256, storagePath, verifyMedia,
} from "./mysql-utils.mjs";

export function supabaseSource(env = process.env, fetchSource = fetch) {
  const rawUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !key) fail("Supabase source URL and service role key are required.");
  const url = new URL(rawUrl);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) fail("Invalid Supabase source URL.");
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    fail("Supabase source must use HTTPS (except a local development instance).");
  }
  const base = url.href.replace(/\/+$/, "");
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const request = async (route, init = {}) => {
    const response = await fetchSource(`${base}${route}`, {
      ...init, redirect: "error", signal: AbortSignal.timeout(120_000),
      headers: { ...headers, ...init.headers },
    });
    if (!response.ok) fail(`Supabase source request failed (HTTP ${response.status}); no destination changes committed.`);
    return response;
  };
  return { base, request };
}

export async function readSourceTables(source) {
  const tables = {};
  for (const [table, columns] of Object.entries(TABLES)) {
    const rows = [];
    for (let offset = 0; ; ) {
      const params = new URLSearchParams({
        select: columns.join(","), order: `${columns[0]}.asc`, offset: String(offset), limit: "1000",
      });
      const response = await source.request(`/rest/v1/${table}?${params}`);
      const page = await response.json();
      if (!Array.isArray(page)) fail("Invalid Supabase table response.");
      rows.push(...page);
      offset += page.length;
      // Continue until empty, rather than assuming the server's page size is 1000.
      if (!page.length) break;
    }
    tables[table] = rows;
  }
  return normalizeTables(tables);
}

export async function listStorage(source) {
  const buckets = await (await source.request("/storage/v1/bucket")).json();
  if (!Array.isArray(buckets)) fail("Invalid Supabase bucket response.");
  const files = [];
  const walk = async (bucket, isPublic, prefix = "", depth = 0) => {
    if (depth > 64) fail("Storage path nesting is too deep.");
    for (let offset = 0; ; ) {
      const page = await (await source.request(`/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } }),
      })).json();
      if (!Array.isArray(page)) fail("Invalid Supabase storage response.");
      if (!page.length) break;
      for (const item of page) {
        safeStorageKey(item.name);
        if (item.name.includes("/")) fail("Unexpected storage listing path.");
        const object = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) await walk(bucket, isPublic, object, depth + 1);
        else if (item.id) files.push({
          bucket, public: isPublic, object, id: item.id, updatedAt: item.updated_at ?? null,
          size: item.metadata?.size ?? null, etag: item.metadata?.eTag ?? null,
        });
        else fail("Storage entry has no object identifier.");
      }
      offset += page.length;
    }
  };
  for (const bucket of buckets) {
    safeStorageKey(bucket.name);
    if (bucket.name.includes("/")) fail("Invalid storage bucket name.");
    if (typeof bucket.public !== "boolean") fail("Supabase bucket visibility is missing; migration cannot safely classify its objects.");
    await walk(bucket.name, bucket.public);
  }
  return {
    buckets: buckets.map((bucket) => ({ name: bucket.name, public: bucket.public })).sort((a, b) => a.name < b.name ? -1 : 1),
    files: files.sort((a, b) => `${a.bucket}/${a.object}` < `${b.bucket}/${b.object}` ? -1 : 1),
  };
}

export async function main() {
  const args = parseArgs(["--pre-backup"], ["--force"]);
  const root = await mediaRoot();
  const source = supabaseSource();
  const connection = await connect();
  let stage;
  try {
    console.log("Stop source and destination application writes for a consistent migration. Supabase is read only.");
    await prepareReplacement(connection, root, { force: args["--force"], preBackup: args["--pre-backup"] });
    const originalTables = await readSourceTables(source);
    const sourceFiles = await listStorage(source);
    const mappings = new Map();
    const targets = new Set();
    const files = [];
    stage = await makeStage(root);
    for (const item of sourceFiles.files) {
      const relative = storagePath(item.bucket, item.object, process.env.SUPABASE_STORAGE_BUCKET || "site-images", item.public);
      // Case-folded uniqueness also protects Windows/macOS destinations.
      if (targets.has(relative.toLowerCase())) fail("Storage objects collide on the destination filesystem.");
      targets.add(relative.toLowerCase());
      const encoded = [item.bucket, ...item.object.split("/")].map(encodeURIComponent).join("/");
      const response = await source.request(`/storage/v1/object/authenticated/${encoded}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (item.size !== null && Number(item.size) !== bytes.length) fail("Downloaded storage size differs from the source listing.");
      const full = contained(stage, relative);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, bytes, { flag: "wx", mode: 0o600 });
      if (sha256(await readFile(full)) !== sha256(bytes)) fail("Downloaded storage checksum failed.");
      mappings.set(`${item.bucket}/${item.object}`, relative);
      files.push({ path: relative, size: bytes.length, sha256: sha256(bytes) });
    }
    files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    await verifyMedia(stage, files);
    if (JSON.stringify(sourceFiles) !== JSON.stringify(await listStorage(source)) ||
        JSON.stringify(originalTables) !== JSON.stringify(await readSourceTables(source))) {
      fail("Supabase changed during migration. Stop writes and retry; destination was not changed.");
    }
    const tables = {
      ...originalTables,
      site_content: rewriteContent(originalTables.site_content, source.base, mappings),
      tariffs: originalTables.tariffs.map((row) => ({
        ...row, description_md: rewriteStorageUrls(row.description_md, source.base, mappings),
      })),
      psychological_tests: originalTables.psychological_tests.map((row) => ({
        ...row,
        description: rewriteStorageUrls(row.description, source.base, mappings),
        schema_json: JSON.stringify(rewriteJsonStorageUrls(JSON.parse(row.schema_json), source.base, mappings)),
        scoring_json: JSON.stringify(rewriteJsonStorageUrls(JSON.parse(row.scoring_json), source.base, mappings)),
      })),
    };
    await replaceData(connection, root, stage, tables, files, { force: args["--force"] });
    for (const [table, rows] of Object.entries(tables)) console.log(`${table}: ${rows.length} verified rows`);
    console.log(`Storage: ${files.length} verified files. Supabase was not modified.`);
  } finally {
    if (stage) await rm(stage, { recursive: true, force: true });
    await connection.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runCli(main);
}
