import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  copyFile, lstat, mkdir, readFile, readdir, rename, rm, writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TABLES = {
  site_content: ["key", "value"],
  tariffs: ["id", "slug", "title", "description_md", "is_active", "sort_order"],
  tariff_packages: ["id", "tariff_id", "title", "price_regular", "price_discounted", "currency", "sort_order"],
  psychological_tests: ["id", "slug", "title", "description", "version", "schema_json", "scoring_json", "sort_order"],
};
const JSON_COLUMNS = new Set(["schema_json", "scoring_json"]);
const INTEGER_COLUMNS = new Set(["sort_order", "price_regular", "price_discounted", "version"]);
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const sha256 = (data) => createHash("sha256").update(data).digest("hex");

export function fail(message) {
  const error = new Error(message);
  error.safeMessage = message;
  throw error;
}

export async function runCli(main) {
  try {
    await main();
  } catch (error) {
    // Driver/HTTP errors can contain passwords, connection strings, SQL, or content.
    console.error(error.safeMessage || "Operation failed. Check configuration, permissions and database availability; sensitive error details are suppressed.");
    process.exitCode = 1;
  }
}

export function parseArgs(allowedValues = [], allowedFlags = []) {
  const result = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (Object.hasOwn(result, key)) fail("Duplicate command option.");
    if (allowedFlags.includes(key)) result[key] = true;
    else if (allowedValues.includes(key) && args[i + 1] && !args[i + 1].startsWith("--")) result[key] = args[++i];
    else fail("Unknown or incomplete command option.");
  }
  return result;
}

export function safeRelative(value) {
  if (typeof value !== "string" || !value || value.length > 2048 ||
      value.includes("\\") || /[\x00-\x1f\x7f:%?#]/u.test(value)) fail("Unsafe file path.");
  const parts = value.split("/");
  if (parts.some((part) => !part || part === "." || part === ".." ||
      part.endsWith(".") || part.endsWith(" ") ||
      part.toLowerCase().startsWith(".env") ||
      /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\.|$)/i.test(part))) fail("Unsafe file path.");
  return value;
}

export function contained(root, relative) {
  return path.join(root, ...safeRelative(relative).split("/"));
}

export function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return !relative || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export async function exists(target) {
  try { await lstat(target); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

export async function noSymlinks(target) {
  let current = path.parse(path.resolve(target)).root;
  for (const part of path.resolve(target).slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink()) fail("Symbolic links are not permitted.");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

export async function mediaRoot(env = process.env) {
  if (!env.MEDIA_ROOT || !path.isAbsolute(env.MEDIA_ROOT)) fail("MEDIA_ROOT must be an absolute directory outside the public root.");
  const root = path.resolve(env.MEDIA_ROOT);
  const publicRoot = path.join(PROJECT_ROOT, "public");
  if (root === path.parse(root).root || isInside(publicRoot, root) || isInside(root, PROJECT_ROOT)) {
    fail("MEDIA_ROOT must not contain the project or be inside its public root.");
  }
  await noSymlinks(root);
  if (await exists(root)) {
    if (!(await lstat(root)).isDirectory()) fail("MEDIA_ROOT is not a directory.");
  }
  return root;
}

export async function connect(env = process.env) {
  for (const name of ["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"]) {
    if (!env[name]) fail(`Missing ${name}.`);
  }
  const port = Number(env.MYSQL_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail("Invalid MYSQL_PORT.");
  const { createConnection } = await import("mysql2/promise");
  const connection = await createConnection({
    host: env.MYSQL_HOST, port, user: env.MYSQL_USER, password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE, charset: "utf8mb4", multipleStatements: false,
    ssl: env.MYSQL_SSL_CA ? { ca: await readFile(env.MYSQL_SSL_CA, "utf8"), rejectUnauthorized: true, verifyIdentity: true } : undefined,
  });
  try {
    await connection.query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION'");
    const [[row]] = await connection.query("SELECT GET_LOCK('site-data-cli', 0) AS acquired");
    if (Number(row.acquired) !== 1) fail("Another MySQL maintenance command is running.");
    return connection;
  } catch (error) {
    await connection.end();
    throw error;
  }
}

export async function initialize(connection) {
  const sql = await readFile(new URL("./mysql/schema.sql", import.meta.url), "utf8");
  for (const statement of sql.split(";").map((part) => part.trim()).filter(Boolean)) {
    await connection.query(statement);
  }
}

export function normalizeRows(table, rows) {
  if (!Object.hasOwn(TABLES, table) || !Array.isArray(rows)) fail("Invalid table data.");
  const columns = TABLES[table];
  const seen = new Set();
  return rows.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) fail("Invalid table row.");
    const result = {};
    for (const column of columns) {
      let value = row[column];
      if (column === "is_active") {
        if (![true, false, 0, 1].includes(value)) fail("Invalid active flag.");
        value = Number(value);
      } else if (INTEGER_COLUMNS.has(column)) {
        if (!(column === "price_discounted" && value === null) &&
            (!Number.isInteger(value) || value < -2147483648 || value > 2147483647)) fail("Invalid integer field.");
      } else {
        if (JSON_COLUMNS.has(column) && typeof value === "object" && value !== null) value = JSON.stringify(value);
        if (typeof value !== "string") fail("Invalid text field.");
        if (JSON_COLUMNS.has(column)) {
          try { JSON.parse(value); } catch { fail("Invalid JSON field."); }
        }
        const maximum = column === "id" || column === "tariff_id" ? 64 :
          column === "key" || column === "slug" ? 255 : column === "currency" ? 16 : null;
        if (maximum && (!value || [...value].length > maximum)) fail("Invalid identifier length.");
      }
      result[column] = value;
    }
    const key = result[columns[0]];
    if (seen.has(key)) fail("Duplicate primary key.");
    seen.add(key);
    return result;
  }).sort((a, b) => a[columns[0]] < b[columns[0]] ? -1 : a[columns[0]] > b[columns[0]] ? 1 : 0);
}

export function normalizeTables(tables) {
  if (!tables || typeof tables !== "object" ||
      Object.keys(tables).sort().join() !== Object.keys(TABLES).sort().join()) fail("Snapshot must contain exactly the four site tables.");
  return Object.fromEntries(Object.keys(TABLES).map((table) => [table, normalizeRows(table, tables[table])]));
}

export async function readTables(connection, lock = false) {
  const tables = {};
  for (const [table, columns] of Object.entries(TABLES)) {
    const [rows] = await connection.query(`SELECT ${columns.map((c) => `\`${c}\``).join(",")} FROM \`${table}\`${lock ? " FOR UPDATE" : ""}`);
    tables[table] = normalizeRows(table, rows);
  }
  return tables;
}

export async function inventory(root, prefix = "") {
  if (!await exists(root)) return [];
  await noSymlinks(root);
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const relative = safeRelative(prefix ? `${prefix}/${entry.name}` : entry.name);
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await inventory(full, relative));
    else if (entry.isFile()) {
      const bytes = await readFile(full);
      files.push({ path: relative, size: bytes.length, sha256: sha256(bytes) });
    } else fail("Only regular files and directories are permitted.");
  }
  return files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

export async function copyMedia(source, target, files) {
  for (const file of files) {
    const from = contained(source, file.path);
    const to = contained(target, file.path);
    await noSymlinks(from);
    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(from, to, constants.COPYFILE_EXCL);
  }
  await verifyMedia(target, files);
}

export async function verifyMedia(root, files) {
  if (JSON.stringify(await inventory(root)) !== JSON.stringify(files)) fail("Media integrity verification failed.");
}

export async function snapshot(connection, root, output) {
  if (!output) fail("A snapshot destination is required.");
  const dir = path.resolve(output);
  if (isInside(root, dir) || isInside(dir, root) || isInside(path.join(PROJECT_ROOT, "public"), dir)) {
    fail("Snapshot directory must be outside MEDIA_ROOT and the public root.");
  }
  await noSymlinks(dir);
  if (await exists(dir)) fail("Snapshot destination already exists.");
  await mkdir(path.dirname(dir), { recursive: true });
  const stage = `${dir}.partial-${randomUUID()}`;
  try {
    await mkdir(stage, { mode: 0o700 });
    await mkdir(path.join(stage, "media"), { mode: 0o700 });
    await connection.query("START TRANSACTION WITH CONSISTENT SNAPSHOT");
    try {
      const tables = await readTables(connection);
      const files = await inventory(root);
      await copyMedia(root, path.join(stage, "media"), files);
      await verifyMedia(root, files);
      const payload = JSON.stringify(tables);
      await writeFile(path.join(stage, "tables.json"), payload, { flag: "wx", mode: 0o600 });
      await writeFile(path.join(stage, "manifest.json"), JSON.stringify({
        format: "site-mysql-snapshot", version: 1, createdAt: new Date().toISOString(),
        tables: Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, rows.length])),
        tablesSha256: sha256(payload), files,
      }, null, 2), { flag: "wx", mode: 0o600 });
      await loadSnapshot(stage);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    await rename(stage, dir);
  } catch (error) {
    await rm(stage, { recursive: true, force: true });
    throw error;
  }
}

export async function loadSnapshot(input) {
  if (!input) fail("--input is required.");
  const dir = path.resolve(input);
  await noSymlinks(dir);
  await noSymlinks(path.join(dir, "manifest.json"));
  await noSymlinks(path.join(dir, "tables.json"));
  await noSymlinks(path.join(dir, "media"));
  const manifest = JSON.parse(await readFile(path.join(dir, "manifest.json"), "utf8"));
  if (manifest.format !== "site-mysql-snapshot" || manifest.version !== 1 || !Array.isArray(manifest.files)) fail("Unsupported snapshot format.");
  if (!await exists(path.join(dir, "media")) || !(await lstat(path.join(dir, "media"))).isDirectory()) fail("Snapshot media directory is missing.");
  const payload = await readFile(path.join(dir, "tables.json"));
  if (sha256(payload) !== manifest.tablesSha256) fail("Table integrity verification failed.");
  const tables = normalizeTables(JSON.parse(payload.toString("utf8")));
  if (JSON.stringify(Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, rows.length]))) !== JSON.stringify(manifest.tables)) {
    fail("Snapshot row counts do not match.");
  }
  for (const file of manifest.files) {
    safeRelative(file.path);
    if (!Number.isSafeInteger(file.size) || file.size < 0 || !/^[a-f0-9]{64}$/.test(file.sha256)) fail("Invalid media manifest.");
  }
  await verifyMedia(path.join(dir, "media"), manifest.files);
  return { tables, files: manifest.files, media: path.join(dir, "media") };
}

export async function destinationNotEmpty(connection, root) {
  for (const table of Object.keys(TABLES)) {
    const [[row]] = await connection.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
    if (Number(row.total)) return true;
  }
  return (await inventory(root)).length > 0;
}

export async function prepareReplacement(connection, root, { force, preBackup }) {
  if (await destinationNotEmpty(connection, root)) {
    if (!force) fail("Destination is not empty. Use --force and --pre-backup <new-directory> to replace it.");
    if (!preBackup) fail("--pre-backup is required when replacing existing data.");
    await snapshot(connection, root, preBackup);
    console.log("Pre-replacement snapshot verified and saved.");
  }
}

export async function makeStage(root) {
  await mkdir(path.dirname(root), { recursive: true });
  const stage = `${root}.mysql-stage-${randomUUID()}`;
  await mkdir(stage, { mode: 0o700 });
  return stage;
}

export async function replaceData(connection, root, stage, inputTables, files, { force = false } = {}) {
  const tables = normalizeTables(inputTables);
  await noSymlinks(root);
  await noSymlinks(stage);
  await verifyMedia(stage, files);
  let previous;
  let installed = false;
  await connection.beginTransaction();
  try {
    const current = await readTables(connection, true);
    if (!force && (Object.values(current).some((rows) => rows.length) || (await inventory(root)).length)) {
      fail("Destination became nonempty; replacement cancelled.");
    }
    for (const table of Object.keys(TABLES).reverse()) await connection.query(`DELETE FROM \`${table}\``);
    for (const [table, rows] of Object.entries(tables)) {
      const columns = TABLES[table];
      const sql = `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(",")}) VALUES (${columns.map(() => "?").join(",")})`;
      for (const row of rows) await connection.execute(sql, columns.map((column) => row[column]));
    }
    if (JSON.stringify(await readTables(connection)) !== JSON.stringify(tables)) fail("Inserted rows failed verification.");
    if (await exists(root)) {
      const target = `${root}.mysql-previous-${randomUUID()}`;
      await rename(root, target);
      previous = target;
    }
    await rename(stage, root);
    installed = true;
    await verifyMedia(root, files);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (installed) await rename(root, stage);
    if (previous) await rename(previous, root);
    throw error;
  }
  if (previous) {
    try { await rm(previous, { recursive: true }); }
    catch { console.warn("Replacement succeeded; remove the adjacent .mysql-previous directory manually."); }
  }
}

export function safeStorageKey(value) {
  if (typeof value !== "string" || !value || value.length > 2048 || /[\\\x00-\x1f\x7f]/u.test(value) ||
      value.split("/").some((part) => !part || part === "." || part === ".." || part.toLowerCase().startsWith(".env"))) {
    fail("Unsafe storage object path.");
  }
  return value;
}

function mediaSegment(segment, file = false) {
  if (/^[a-z0-9][a-z0-9._-]*$/i.test(segment)) {
    try { safeRelative(segment); return segment; } catch { /* Map platform-reserved names to portable names. */ }
  }
  const extension = file ? /\.[a-z0-9]{1,16}$/i.exec(segment)?.[0].toLowerCase() || ".bin" : "";
  return `${sha256(segment)}${extension}`;
}

export function storagePath(bucket, object, primaryBucket = "site-images", isPublic = true) {
  safeStorageKey(bucket);
  if (bucket.includes("/")) fail("Invalid storage bucket.");
  safeStorageKey(object);
  const parts = object.split("/");
  const portable = parts.map((part, index) => mediaSegment(part, index === parts.length - 1)).join("/");
  if (!isPublic) return safeRelative(`_private/${mediaSegment(bucket)}/${portable}`);
  return bucket === primaryBucket && /^(profile|og)\//.test(object)
    ? portable : safeRelative(`storage/${mediaSegment(bucket)}/${portable}`);
}

export function rewriteStorageUrls(value, baseUrl, mappings) {
  const origin = new URL(baseUrl).origin;
  return value.replace(/https?:\/\/[^\s<>"'`()\[\]]+/g, (candidate) => {
    const suffix = /[.,;!]+$/.exec(candidate)?.[0] || "";
    const address = suffix ? candidate.slice(0, -suffix.length) : candidate;
    let url;
    try { url = new URL(address); } catch { return candidate; }
    if (url.origin !== origin) return candidate;
    const match = /^\/storage\/v1\/(?:object\/(?:public|sign|authenticated)|render\/image\/(?:public|sign|authenticated))\/([^/]+)\/(.+)$/.exec(url.pathname);
    if (!match) return candidate;
    let key;
    try { key = `${decodeURIComponent(match[1])}/${match[2].split("/").map(decodeURIComponent).join("/")}`; }
    catch { fail("Invalid storage URL in site content."); }
    const target = mappings.get(key);
    if (!target) fail("Site content references a missing storage object.");
    if (target.startsWith("_private/")) {
      fail("Site content references a private storage object. Make the intended image public explicitly in Supabase or remove its reference before migration.");
    }
    return `/media/${target.split("/").map(encodeURIComponent).join("/")}${suffix}`;
  });
}

export function rewriteJsonStorageUrls(value, baseUrl, mappings) {
  if (Array.isArray(value)) return value.map((child) => rewriteJsonStorageUrls(child, baseUrl, mappings));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [
      key, rewriteJsonStorageUrls(child, baseUrl, mappings),
    ]));
  }
  return typeof value === "string" ? rewriteStorageUrls(value, baseUrl, mappings) : value;
}

export function rewriteContent(rows, baseUrl, mappings) {
  return rows.map((row) => {
    if (row.key !== "content_json") return { ...row, value: rewriteStorageUrls(row.value, baseUrl, mappings) };
    let content;
    try { content = JSON.parse(row.value); } catch { fail("Invalid content_json."); }
    return { ...row, value: JSON.stringify(rewriteJsonStorageUrls(content, baseUrl, mappings)) };
  });
}
