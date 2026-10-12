// Восстановление из бэкапа, созданного scripts/backup-supabase.mjs.
// Таблицы должны уже существовать (схема: supabase/schema.sql или миграции).
// Строки записываются через upsert по первичному ключу, файлы Storage перезаписываются.
// Таблицы обрабатываются в порядке внешних ключей (родительские раньше дочерних).
//
// Использование: node scripts/restore-supabase.mjs <папка_бэкапа>
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const baseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dir = process.argv[2] ? path.resolve(process.argv[2]) : null;
const CHUNK = 500;

if (!baseUrl || !key || !dir) {
  console.error("Использование: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/restore-supabase.mjs <папка_бэкапа>");
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

const spec = JSON.parse(await readFile(path.join(dir, "schema.openapi.json"), "utf8"));
const tableFiles = (await readdir(path.join(dir, "tables"))).filter((file) => file.endsWith(".json"));
const tables = tableFiles.map((file) => file.replace(/\.json$/, ""));

function dependencies(table) {
  const properties = spec.definitions?.[table]?.properties ?? {};
  const parents = new Set();
  for (const column of Object.values(properties)) {
    const match = /<fk table='([^']+)'/.exec(String(column.description ?? ""));
    if (match && match[1] !== table && tables.includes(match[1])) parents.add(match[1]);
  }
  return parents;
}

const ordered = [];
const pending = new Set(tables);
while (pending.size) {
  const ready = [...pending].filter((table) => [...dependencies(table)].every((parent) => !pending.has(parent)));
  const batch = ready.length ? ready : [...pending];
  for (const table of batch) {
    ordered.push(table);
    pending.delete(table);
  }
}

for (const table of ordered) {
  const rows = JSON.parse(await readFile(path.join(dir, "tables", `${table}.json`), "utf8"));
  for (let index = 0; index < rows.length; index += CHUNK) {
    await request(`${baseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows.slice(index, index + CHUNK)),
    });
  }
  console.log(`table ${table}: ${rows.length} rows`);
}

async function walk(folder) {
  const result = [];
  for (const entry of await readdir(folder)) {
    const full = path.join(folder, entry);
    if ((await stat(full)).isDirectory()) result.push(...(await walk(full)));
    else result.push(full);
  }
  return result;
}

const storageDir = path.join(dir, "storage");
const manifest = JSON.parse(await readFile(path.join(dir, "manifest.json"), "utf8"));

for (const bucket of manifest.buckets ?? []) {
  // Бакет может отсутствовать в новом проекте; ошибку «уже существует» игнорируем.
  await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id: bucket.bucket, name: bucket.bucket, public: bucket.public }),
  });

  const bucketDir = path.join(storageDir, bucket.bucket);
  const files = bucket.files ? await walk(bucketDir) : [];
  for (const file of files) {
    const objectPath = path.relative(bucketDir, file).split(path.sep).map(encodeURIComponent).join("/");
    await request(`${baseUrl}/storage/v1/object/${bucket.bucket}/${objectPath}`, {
      method: "POST",
      headers: { "x-upsert": "true", "Content-Type": "application/octet-stream" },
      body: await readFile(file),
    });
  }
  console.log(`bucket ${bucket.bucket}: ${files.length} files`);
}

console.log("Восстановление завершено");
