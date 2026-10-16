import { spawn } from "node:child_process";
import { renameSync, writeFileSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { smoke } from "./smoke.mjs";

export function applicationRoot(htaccess, site) {
  const matches = [...htaccess.matchAll(/^PassengerAppRoot ([^\r\n]+)\r?$/gm)];
  if (matches.length !== 1) throw new Error("Expected exactly one PassengerAppRoot.");
  const root = matches[0][1];
  if (!root.startsWith(`${site}/`) || root.includes("..") || /\s/.test(root)) {
    throw new Error("Passenger application must be inside the site directory.");
  }
  return root;
}

export function releaseHtaccess(htaccess, site, release) {
  applicationRoot(htaccess, site);
  if (!new RegExp(`^${site.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/releases/[a-f0-9]{40}-[A-Za-z0-9]{8}$`).test(release)) {
    throw new Error("Invalid release directory.");
  }
  let updated = htaccess;
  for (const [name, value] of [
    ["PassengerAppRoot", release],
    ["PassengerNodejs", `${release}/.beget-node`],
    ["PassengerStartupFile", "scripts/beget/server.cjs"],
  ]) {
    const pattern = new RegExp(`^${name} [^\\r\\n]+\\r?$`, "gm");
    if ([...updated.matchAll(pattern)].length !== 1) throw new Error(`Expected exactly one ${name}.`);
    updated = updated.replace(pattern, `${name} ${value}`);
  }
  return updated;
}

export function retainedAssetPaths(files) {
  if (!Array.isArray(files) || files.some((file) =>
    typeof file !== "string" || !file || path.posix.isAbsolute(file) ||
    file.split("/").some((part) => !part || part === ".." || part === ".") || file.includes("\\"))) {
    throw new Error("Invalid previous static asset manifest.");
  }
  return files;
}

function run(command, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd, stdio: "inherit", env: { ...process.env, ...env },
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed (${signal || code}).`));
    });
  });
}

async function exists(filename) {
  try {
    await fs.access(filename);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function staticFiles(directory, prefix = "") {
  const files = [];
  for (const entry of await fs.readdir(path.join(directory, prefix), { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await staticFiles(directory, relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error("Static assets must not contain symbolic links.");
  }
  return files;
}

function atomicWrite(filename, content) {
  const temporary = `${filename}.deploy-${process.pid}`;
  writeFileSync(temporary, content, { mode: 0o640 });
  renameSync(temporary, filename);
}

export async function activateRelease(filename, content, verify) {
  const original = await fs.readFile(filename, "utf8");
  let switched = false;
  const rollback = () => {
    if (switched) {
      atomicWrite(filename, original);
      switched = false;
      console.error("Restored the previous Passenger release.");
    }
  };
  const interrupted = () => {
    try { rollback(); } finally { process.exit(143); }
  };
  process.once("SIGTERM", interrupted);
  process.once("SIGINT", interrupted);
  try {
    switched = true;
    atomicWrite(filename, content);
    await verify();
    switched = false;
  } catch (error) {
    rollback();
    throw error;
  } finally {
    process.removeListener("SIGTERM", interrupted);
    process.removeListener("SIGINT", interrupted);
  }
}

async function pruneReleases(site, keep) {
  const directory = path.join(site, "releases");
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^[a-f0-9]{40}-[A-Za-z0-9]{8}$/.test(entry.name)) continue;
    const candidate = path.join(directory, entry.name);
    if (keep.has(candidate)) continue;
    const marker = path.join(candidate, ".deploy-release");
    if (!await exists(marker)) continue;
    if ((await fs.readFile(marker, "utf8")).trim() !== entry.name.slice(0, 40)) {
      throw new Error("Release ownership marker does not match.");
    }
    console.log(`Removing retired managed release: ${entry.name}`);
    await fs.rm(candidate, { recursive: true });
  }
}

async function deploy(site, release, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Invalid commit SHA.");
  const control = path.join(site, "deploy");
  const htaccessPath = path.join(site, "public_html/.htaccess");
  const original = await fs.readFile(htaccessPath, "utf8");
  const previous = applicationRoot(original, site);
  const updated = releaseHtaccess(original, site, release);
  if ((await fs.readFile(path.join(release, ".deploy-release"), "utf8")).trim() !== sha) {
    throw new Error("Release marker does not match the requested commit.");
  }
  const config = JSON.parse(await fs.readFile(path.join(control, "config.json"), "utf8"));
  if (config.origin !== "https://ekaterinazhuk.ru" || !/^\d{1,3}(\.\d{1,3}){3}$/.test(config.address)) {
    throw new Error("Invalid production smoke-check target.");
  }
  await run("cp", ["-p", path.join(control, "runtime.env"), path.join(release, ".env.local")], release);
  await fs.appendFile(path.join(release, ".env.local"), `\nBEGET_BUILD=1\nDEPLOY_COMMIT=${sha}\n`);
  await fs.copyFile(path.join(control, "node"), path.join(release, ".beget-node"));
  await fs.chmod(path.join(release, ".beget-node"), 0o750);
  const buildEnv = {
    BEGET_BUILD: "1", NEXT_TELEMETRY_DISABLED: "1",
    RAYON_NUM_THREADS: "1", TOKIO_WORKER_THREADS: "1",
  };
  console.log(`Building isolated release ${sha}.`);
  await run("npm", ["ci", "--include=dev", "--no-audit", "--no-fund"], release, buildEnv);
  await run("npm", ["run", "build"], release, buildEnv);
  await run(process.execPath, ["--test", "scripts/tests/first-screen-build.test.mjs"], release);

  const staticDirectory = path.join(release, ".next/static");
  await fs.writeFile(path.join(release, ".deploy-static.json"), JSON.stringify(await staticFiles(staticDirectory)));
  const previousStatic = path.join(previous, ".next/static");
  const previousManifest = path.join(previous, ".deploy-static.json");
  const previousFiles = await exists(previousManifest)
    ? retainedAssetPaths(JSON.parse(await fs.readFile(previousManifest, "utf8")))
    : await staticFiles(previousStatic);
  for (const relative of previousFiles) {
    const destination = path.join(staticDirectory, relative);
    if (await exists(destination)) continue;
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(previousStatic, relative), destination);
  }
  const cache = path.join(release, ".next/cache");
  const previousImages = path.join(previous, ".next/cache/images");
  if (await exists(previousImages)) {
    await fs.cp(previousImages, path.join(cache, "images"), { recursive: true });
  }
  await fs.mkdir(cache, { recursive: true });
  await run("chmod", ["-R", "g+rwX", cache], release);

  const probe = spawn(process.execPath, ["scripts/beget/server.cjs"], {
    cwd: release, stdio: "inherit", env: { ...process.env, PORT: "3332" },
  });
  const probeExit = new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.once("exit", (code, signal) => resolve({ code, signal }));
  });
  try {
    await Promise.race([
      smoke("http://127.0.0.1:3332", sha),
      probeExit.then(() => { throw new Error("Staging server exited before its smoke checks completed."); }),
    ]);
  } finally {
    probe.kill("SIGTERM");
    const deadline = setTimeout(() => probe.kill("SIGKILL"), 5000);
    await probeExit.finally(() => clearTimeout(deadline));
  }
  // Keep the directory on interruption once Passenger may have started using it.
  await fs.writeFile(path.join(release, ".deploy-keep"), sha);
  await fs.copyFile(htaccessPath, path.join(release, ".rollback.htaccess"));
  await activateRelease(htaccessPath, updated, async () => {
    await smoke(config.origin, sha, config.address);
    await pruneReleases(site, new Set([release, previous]));
    await fs.copyFile(path.join(release, ".rollback.htaccess"), path.join(control, "previous.htaccess"));
    atomicWrite(path.join(control, "state.json"), JSON.stringify({ sha, current: release, previous }, null, 2));
  });
  console.log(`Production deployment completed: ${sha}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  deploy(...process.argv.slice(2)).catch((error) => {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
  });
}
