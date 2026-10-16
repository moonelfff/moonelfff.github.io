import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { activateRelease, applicationRoot, releaseHtaccess, retainedAssetPaths } from "../beget/deploy.mjs";

const site = "/home/m/account/site";
const sha = "a".repeat(40);
const release = `${site}/releases/${sha}-1234abcd`;
const original = [
  "RewriteEngine On",
  "RewriteRule ^ https://example.com%{REQUEST_URI} [R=308,L,NE]",
  `PassengerAppRoot ${site}/app`,
  `PassengerNodejs ${site}/app/.beget-node`,
  "PassengerStartupFile server.cjs",
  "PassengerAppEnv production",
  "",
].join("\r\n");

test("Passenger switch preserves redirects, supports CRLF and points to the release", () => {
  const result = releaseHtaccess(original, site, release);
  assert.equal(applicationRoot(result, site), release);
  assert.ok(result.includes(`PassengerNodejs ${release}/.beget-node`));
  assert.ok(result.includes("PassengerStartupFile scripts/beget/server.cjs"));
  assert.ok(result.startsWith(original.split("PassengerAppRoot")[0]));
  assert.ok(result.endsWith("PassengerAppEnv production\r\n"));
});

test("ambiguous roots, traversal and releases outside managed directories are rejected", () => {
  assert.throws(() => applicationRoot(`${original}PassengerAppRoot ${site}/other\n`, site));
  assert.throws(() => applicationRoot(original.replace(`${site}/app`, "/other/site"), site));
  assert.throws(() => releaseHtaccess(original, site, `${site}/releases/../other`));
  assert.throws(() => releaseHtaccess(original.replace("PassengerNodejs ", "#PassengerNodejs "), site, release));
});

test("retained assets cannot escape the static directory", () => {
  assert.deepEqual(retainedAssetPaths(["chunks/a.js", "media/font.woff2"]), ["chunks/a.js", "media/font.woff2"]);
  for (const invalid of [["../secret"], ["/secret"], ["a/../../b"], ["a\\..\\b"], ["a//b"], [7], null]) {
    assert.throws(() => retainedAssetPaths(invalid));
  }
});

test("failed public verification atomically restores the exact previous configuration", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "beget-rollback-"));
  const filename = path.join(directory, ".htaccess");
  try {
    await writeFile(filename, original);
    await assert.rejects(activateRelease(filename, "new release", async () => {
      assert.equal(await readFile(filename, "utf8"), "new release");
      throw new Error("Public smoke check failed");
    }), /Public smoke check failed/);
    assert.equal(await readFile(filename, "utf8"), original);
    await activateRelease(filename, "verified release", async () => {});
    assert.equal(await readFile(filename, "utf8"), "verified release");
  } finally {
    await rm(directory, { recursive: true });
  }
});
