// Loads initial data from supabase/seed into Supabase.
// Usage: npm run seed            (only fills what is missing)
//        npm run seed -- --force (overwrites existing data)
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const force = process.argv.includes("--force");
const seedDir = path.join(import.meta.dirname, "..", "supabase", "seed");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function check(error, what) {
  if (error) {
    throw new Error(`${what}: ${error.message}`);
  }
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-я0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function count(table) {
  const { count: total, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  check(error, `count ${table}`);
  return total ?? 0;
}

async function seedContent() {
  if (!force && (await count("site_content")) > 0) {
    console.log("site_content: not empty, skipped");
    return;
  }

  const contentRaw = fs.readFileSync(path.join(seedDir, "content.json"), "utf-8");
  const rows = [{ key: "content_json", value: contentRaw }];

  const markdownDir = path.join(seedDir, "markdown");
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });

  for (const file of walk(markdownDir)) {
    rows.push({
      key: path.relative(markdownDir, file).split(path.sep).join("/"),
      value: fs.readFileSync(file, "utf-8"),
    });
  }

  const { error } = await supabase
    .from("site_content")
    .upsert(rows, { onConflict: "key" });
  check(error, "upsert site_content");
  console.log(`site_content: ${rows.length} rows`);
}

async function seedTariffs() {
  if (!force && (await count("tariffs")) > 0) {
    console.log("tariffs: not empty, skipped");
    return;
  }

  const content = JSON.parse(
    fs.readFileSync(path.join(seedDir, "content.json"), "utf-8"),
  );

  const tariffRows = content.pricelist.map((item, index) => {
    const mdPath = path.join(
      seedDir,
      "markdown",
      item.descriptionPath.replace(/^\/+/, ""),
    );
    return {
      slug: slugify(item.title) || `tariff-${index + 1}`,
      title: item.title,
      description_md: fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf-8") : "",
      is_active: true,
      sort_order: index,
    };
  });

  const { data: saved, error } = await supabase
    .from("tariffs")
    .upsert(tariffRows, { onConflict: "slug" })
    .select("id,slug");
  check(error, "upsert tariffs");

  const idBySlug = new Map(saved.map((row) => [row.slug, row.id]));
  const { error: deleteError } = await supabase
    .from("tariff_packages")
    .delete()
    .in("tariff_id", [...idBySlug.values()]);
  check(deleteError, "clear tariff_packages");

  const packageRows = content.pricelist.flatMap((item, index) =>
    item.packages.map((pkg, pkgIndex) => ({
      tariff_id: idBySlug.get(tariffRows[index].slug),
      title: pkg.name,
      price_regular: pkg.price.regular.amount,
      price_discounted: pkg.price.discounted?.amount ?? null,
      currency: pkg.price.regular.currency,
      sort_order: pkgIndex,
    })),
  );

  const { error: packagesError } = await supabase
    .from("tariff_packages")
    .insert(packageRows);
  check(packagesError, "insert tariff_packages");
  console.log(`tariffs: ${tariffRows.length}, packages: ${packageRows.length}`);
}

async function seedTests() {
  if (!force && (await count("psychological_tests")) > 0) {
    console.log("psychological_tests: not empty, skipped");
    return;
  }

  const tests = JSON.parse(fs.readFileSync(path.join(seedDir, "tests.json"), "utf-8"));
  const rows = tests.map((test, index) => ({
    slug: test.slug,
    title: test.title,
    description: test.description,
    version: test.version,
    schema_json: test.schema,
    scoring_json: test.scoring,
    sort_order: index,
  }));

  const { error } = await supabase
    .from("psychological_tests")
    .upsert(rows, { onConflict: "slug" });
  check(error, "upsert psychological_tests");
  console.log(`psychological_tests: ${rows.length}`);
}

await seedContent();
await seedTariffs();
await seedTests();
console.log("Done.");
