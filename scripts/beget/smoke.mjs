import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import { setTimeout } from "node:timers/promises";

export function request(origin, pathname, address) {
  const url = new URL(pathname, origin);
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const req = client.get(url, {
      ...(address ? { hostname: address, servername: url.hostname } : {}),
      headers: { Host: url.host, Cookie: "beget=begetok" },
      timeout: 15000,
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
        if (body.length > 2 * 1024 * 1024) req.destroy(new Error("Smoke response too large."));
      });
      res.on("error", reject);
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("timeout", () => req.destroy(new Error(`Request timed out: ${pathname}`)));
    req.on("error", reject);
  });
}

export async function waitForRelease(origin, sha, address, attempts = 20) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await request(origin, "/__hosting-health", address);
      assert.equal(response.status, 200);
      assert.deepEqual(JSON.parse(response.body), { status: "ok", release: sha });
      return;
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await setTimeout(2000);
    }
  }
  throw new Error("Expected release did not become healthy.", { cause: lastError });
}

export async function smoke(origin, sha, address) {
  await waitForRelease(origin, sha, address);
  const read = (pathname) => request(origin, pathname, address);
  const home = await read("/");
  assert.equal(home.status, 200, "Home page must respond with 200.");
  assert.match(home.body, /rel="canonical" href="https:\/\/ekaterinazhuk\.ru\/?"/);
  assert.doesNotMatch(home.body, /<meta name="robots" content="[^"]*noindex/);
  assert.doesNotMatch(String(home.headers["x-robots-tag"] || ""), /noindex/i);
  const content = await read("/api/content");
  assert.equal(content.status, 200);
  const bundle = JSON.parse(content.body);
  assert.equal(bundle.source, "mysql", "Deployment must use the production MySQL provider.");
  assert.ok(bundle.content && Object.keys(bundle.content).length > 0, "Content must not be empty.");
  assert.equal((await read("/tests")).status, 200);
  assert.equal((await read("/api/admin/content")).status, 401);
  const admin = await read("/admin");
  assert.equal(admin.status, 307);
  assert.match(admin.headers.location, /\/admin\/login/);
  const robots = await read("/robots.txt");
  assert.equal(robots.status, 200);
  assert.match(robots.body, /Disallow: \/admin/);
  assert.doesNotMatch(robots.body, /^Disallow: \/\s*$/m);
  const photo = home.body.match(/src="(\/_next\/image\?[^"]+)"/)?.[1];
  assert.ok(photo, "Home page must contain its optimized photo.");
  assert.equal((await read(photo.replaceAll("&amp;", "&"))).status, 200);
  console.log(`Smoke checks passed: ${origin} (${sha}).`);
}
