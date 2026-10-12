// Универсальный бэкап Supabase: все таблицы схемы public + все файлы Storage.
// Список таблиц и ключей берётся из OpenAPI-описания PostgREST, поэтому
// новые таблицы и колонки подхватываются автоматически.
//
// Использование: node scripts/backup-supabase.mjs [папка, по умолчанию ./backup]
// Нужны переменные: NEXT_PUBLIC_SUPABASE_URL (или SUPABASE_URL) и SUPABASE_SERVICE_ROLE_KEY.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const outDir = path.resolve(process.argv[2] || "backup");
const PAGE_SIZE = 1000;

if (!baseUrl || !key) {
  console.error("Не заданы SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function request(url, init = {}) {
  const response = await fetch(url, { ...init, headers: { ...headers, ...init.headers } });
  if (!response.ok) {
    throw new Error(`${init.method || "GET"} ${url} -> ${response.status} ${await response.text()}`);
  }
  return response;
}

async function loadSchema() {
  const response = await request(`${baseUrl}/rest/v1/`, { headers: { Accept: "application/openapi+json" } });
  const spec = await response.json();
  const tables = Object.keys(spec.paths ?? {})
    .filter((route) => route !== "/" && !route.startsWith("/rpc/"))
    .map((route) => route.slice(1));
  return { spec, tables };
}

function primaryKeyColumns(spec, table) {
  const properties = spec.definitions?.[table]?.properties ?? {};
  return Object.entries(properties)
    .filter(([, column]) => String(column.description ?? "").includes("<pk/>"))
    .map(([name]) => name);
}

async function dumpTable(spec, table) {
  const pk = primaryKeyColumns(spec, table);
  const order = pk.length ? `&order=${pk.map((column) => `${column}.asc`).join(",")}` : "";
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const response = await request(`${baseUrl}/rest/v1/${table}?select=*${order}`, {
      headers: { Range: `${from}-${from + PAGE_SIZE - 1}`, "Range-Unit": "items" },
    });
    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  await writeFile(path.join(outDir, "tables", `${table}.json`), JSON.stringify(rows, null, 2));
  return rows.length;
}

async function listObjects(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const response = await request(`${baseUrl}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } }),
    });
    const items = await response.json();
    for (const item of items) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        files.push(...(await listObjects(bucket, fullPath)));
      } else {
        files.push(fullPath);
      }
    }
    if (items.length < 100) break;
  }
  return files;
}

async function dumpStorage() {
  const buckets = await (await request(`${baseUrl}/storage/v1/bucket`)).json();
  const summary = [];

  for (const bucket of buckets) {
    const files = await listObjects(bucket.name);
    for (const file of files) {
      const encodedPath = file.split("/").map(encodeURIComponent).join("/");
      const response = await request(`${baseUrl}/storage/v1/object/${bucket.name}/${encodedPath}`);
      const target = path.join(outDir, "storage", bucket.name, ...file.split("/"));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, Buffer.from(await response.arrayBuffer()));
    }
    summary.push({ bucket: bucket.name, public: bucket.public, files: files.length });
  }
  return summary;
}

await mkdir(path.join(outDir, "tables"), { recursive: true });

const { spec, tables } = await loadSchema();
await writeFile(path.join(outDir, "schema.openapi.json"), JSON.stringify(spec, null, 2));

const tableCounts = {};
for (const table of tables) {
  tableCounts[table] = await dumpTable(spec, table);
  console.log(`table ${table}: ${tableCounts[table]} rows`);
}

const buckets = await dumpStorage();
for (const item of buckets) {
  console.log(`bucket ${item.bucket}: ${item.files} files`);
}

await writeFile(
  path.join(outDir, "manifest.json"),
  JSON.stringify({ createdAt: new Date().toISOString(), tables: tableCounts, buckets }, null, 2),
);
console.log(`Бэкап сохранён в ${outDir}`);
