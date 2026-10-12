import type { SiteContent } from "@/lib/contentTypes";
import type { Tariff } from "@/lib/tariffStore";
import { normalizeSlug } from "@/lib/slug";

const URL_FIELDS: Array<{ field: keyof SiteContent; label: string }> = [
  { field: "telegramLink", label: "Ссылка Telegram" },
  { field: "vkMessengerLink", label: "Ссылка VK мессенджер" },
  { field: "b17Link", label: "Ссылка B17" },
  { field: "blogLink", label: "Ссылка блога" },
  { field: "instagramLink", label: "Ссылка Instagram" },
];

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function validateContentUrls(content: SiteContent): string[] {
  const errors: string[] = [];

  for (const { field, label } of URL_FIELDS) {
    const value = content[field];
    if (typeof value !== "string" || !value.trim()) {
      errors.push(`${label}: поле не должно быть пустым`);
    } else if (!isHttpUrl(value)) {
      errors.push(`${label}: укажите полный URL, например https://...`);
    }
  }

  return errors;
}

export function validateTariffSlugs(items: Tariff[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const [index, tariff] of items.entries()) {
    const slug = normalizeSlug(tariff.slug ?? "");
    const row = index + 1;

    if (!slug) {
      errors.push(`Тариф #${row}: slug не должен быть пустым`);
    } else if (seen.has(slug)) {
      errors.push(`Тариф #${row}: slug "${slug}" уже используется`);
    } else {
      seen.add(slug);
    }
  }

  return errors;
}
