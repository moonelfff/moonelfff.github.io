import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const root = new URL("../../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL(".next/server/next-font-manifest.json", root), "utf8"));
const chunks = new URL(".next/static/chunks/", root);
const styles = await Promise.all(
  (await readdir(chunks)).filter(name => name.endsWith(".css"))
    .map(name => readFile(new URL(name, chunks), "utf8")),
);
const faces = styles.join("\n").match(/@font-face\s*\{[^}]+\}/g) ?? [];

test("only first-screen Mulish weights are preloaded", () => {
  assert.ok(Object.keys(manifest.app).some(route => route.endsWith("/src/app/page")));
  for (const fonts of Object.values(manifest.app)) {
    assert.equal(fonts.length, 2);
    assert.ok(fonts.some(file => file.includes("subset_Mulish_Regular")));
    assert.ok(fonts.some(file => file.includes("subset_Mulish_SemiBold")));
    assert.equal(new Set(fonts).size, 2);
    for (const file of fonts) assert.ok(!path.isAbsolute(file));
  }
});

test("all Mulish weights and italics still share the same family", () => {
  const mulish = faces.filter(face => /font-family:\s*["']?Mulish["']?;/.test(face));
  assert.equal(mulish.length, 6);
  for (const [weight, style] of [
    [400, "normal"], [400, "italic"], [500, "normal"],
    [600, "normal"], [700, "normal"], [700, "italic"],
  ]) {
    assert.equal(mulish.filter(face =>
      new RegExp(`font-weight:\\s*${weight}(?:;|\\})`).test(face) &&
      new RegExp(`font-style:\\s*${style}(?:;|\\})`).test(face),
    ).length, 1, `Missing or duplicate Mulish ${weight} ${style}`);
  }
});
