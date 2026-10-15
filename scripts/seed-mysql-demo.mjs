import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  connect, destinationNotEmpty, fail, makeStage, mediaRoot, parseArgs,
  replaceData, runCli, sha256,
} from "./mysql-utils.mjs";

await runCli(async () => {
  const args = parseArgs(["--confirm"]);
  if (process.env.DATA_PROVIDER !== "mysql" || process.env.SITE_PREVIEW !== "1" ||
      !process.env.MYSQL_DATABASE || args["--confirm"] !== process.env.MYSQL_DATABASE) {
    fail("Demo seed requires DATA_PROVIDER=mysql, SITE_PREVIEW=1 and --confirm <MYSQL_DATABASE>.");
  }
  const root = await mediaRoot();
  const connection = await connect();
  let stage;
  try {
    if (await destinationNotEmpty(connection, root)) {
      fail("Demo database and media directory must be empty. Existing data was not changed.");
    }
    const seed = new URL("../supabase/seed/", import.meta.url);
    const content = JSON.parse(await readFile(new URL("content.json", seed), "utf8"));
    Object.assign(content, {
      fullName: "Тестовая версия сайта",
      professionDescription: "Демонстрационные данные · MySQL",
      info: { title: "Проверка хостинга Beget", contentPath: "/profile.md" },
      profileImageUrl: "/media/profile/demo.webp",
      ogImageUrl: "/media/og/demo.jpg",
      priceHeader: "Демонстрационные услуги",
      blogDescriptionPath: "/blog.md",
      blog: "Открыть тесты",
      blogLink: "/tests",
      bookConsultation: "Тестовая запись — не отправляется",
      priceCardBookLabel: "Проверить",
      testLink: "/tests",
    });
    for (const key of ["instagramLink", "telegramLink", "vkMessengerLink", "b17Link"]) content[key] = "/tests";
    content.pricelist = [
      { title: "Демо-консультация", descriptionPath: "/pricelist/demo.md", packages: [
        { name: "Пробная встреча", price: { regular: { amount: 1000, currency: "₽" } } },
      ] },
      { title: "Демо-пакет", descriptionPath: "/pricelist/package.md", packages: [
        { name: "Три встречи", price: {
          regular: { amount: 3000, currency: "₽" },
          discounted: { amount: 2500, currency: "₽" },
        } },
      ] },
    ];
    const markdown = {
      "profile.md": "## Тестовый стенд\n\nЭтот сайт работает на Beget с MySQL и локальными изображениями. Все данные демонстрационные. Запись на консультацию здесь не производится.\n\n[Открыть демонстрационные тесты](/tests)",
      "blog.md": "## Что можно проверить\n\nГлавную страницу, цены, изображения и прохождение двух коротких тестов. Ответы и результаты не сохраняются. Не вводите реальные персональные данные.",
      "pricelist/demo.md": "Тестовое описание услуги. Цена демонстрационная, услуга не оказывается.",
      "pricelist/package.md": "Тестовое описание пакета со скидкой. Запись и оплата недоступны.",
    };
    const tariffs = content.pricelist.map((item, index) => ({
      id: randomUUID(), slug: `demo-${index + 1}`, title: item.title,
      description_md: markdown[item.descriptionPath.slice(1)], is_active: true, sort_order: index,
    }));
    const packages = content.pricelist.flatMap((item, index) => item.packages.map((pkg, order) => ({
      id: randomUUID(), tariff_id: tariffs[index].id, title: pkg.name,
      price_regular: pkg.price.regular.amount, price_discounted: pkg.price.discounted?.amount ?? null,
      currency: "₽", sort_order: order,
    })));
    const tests = JSON.parse(await readFile(new URL("tests.json", seed), "utf8"))
      .filter((test) => test.slug.startsWith("demo-"))
      .map((test, index) => ({
        id: randomUUID(), slug: test.slug, title: test.title,
        description: `Демонстрационный тест для проверки сайта. Не является диагностикой.\n\n${test.description}`,
        version: test.version, schema_json: test.schema, scoring_json: test.scoring, sort_order: index,
      }));
    if (tests.length !== 2) fail("Expected exactly two demonstration tests in seed input.");
    const tables = {
      site_content: [
        { key: "content_json", value: JSON.stringify(content) },
        ...Object.entries(markdown).map(([key, value]) => ({ key, value })),
      ],
      tariffs, tariff_packages: packages, psychological_tests: tests,
    };
    stage = await makeStage(root);
    const image = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="#d8d3dc"/><circle cx="400" cy="350" r="170" fill="#82718c"/><path d="M100 1000v-200a300 300 0 0 1 600 0v200" fill="#82718c"/></svg>');
    const outputs = [
      { path: "profile/demo.webp", bytes: await sharp(image).webp({ quality: 90 }).toBuffer() },
      { path: "og/demo.jpg", bytes: await sharp(image).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 84 }).toBuffer() },
    ];
    const files = [];
    for (const output of outputs) {
      const filename = path.join(stage, ...output.path.split("/"));
      await mkdir(path.dirname(filename), { recursive: true });
      await writeFile(filename, output.bytes, { flag: "wx", mode: 0o600 });
      files.push({ path: output.path, size: output.bytes.length, sha256: sha256(output.bytes) });
    }
    files.sort((a, b) => a.path.localeCompare(b.path));
    await replaceData(connection, root, stage, tables, files);
    console.log(`Demo data installed: ${tariffs.length} tariffs, ${tests.length} tests, ${files.length} images. No Supabase access.`);
  } finally {
    if (stage) await rm(stage, { recursive: true, force: true });
    await connection.end();
  }
});
