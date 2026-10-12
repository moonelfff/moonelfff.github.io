const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function transliterate(value: string): string {
  return Array.from(value.toLowerCase(), (char) => CYRILLIC_TO_LATIN[char] ?? char).join("");
}

/** Converts any text (including Cyrillic) into a `a-z0-9-` slug. */
export function normalizeSlug(value: string): string {
  return transliterate(value)
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Returns `base` or `base-2`, `base-3`... and marks the result as used. */
export function makeUniqueSlug(base: string, used: Set<string>): string {
  const root = base || "tariff";
  let candidate = root;

  for (let suffix = 2; used.has(candidate); suffix += 1) {
    candidate = `${root}-${suffix}`;
  }

  used.add(candidate);
  return candidate;
}
