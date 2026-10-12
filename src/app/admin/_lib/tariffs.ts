import type { Tariff, TariffPackage } from "@/lib/tariffStore";
import { makeUniqueSlug, normalizeSlug } from "@/lib/slug";
import { validateTariffSlugs } from "./validation";

/** Fills in unique slugs and sort orders; throws with a readable message if invalid. */
export function prepareTariffsForSave(tariffs: Tariff[]): Tariff[] {
  const usedSlugs = new Set<string>();
  const withSlugs = tariffs.map((tariff) => ({
    ...tariff,
    slug: makeUniqueSlug(
      normalizeSlug(tariff.slug ?? "") || normalizeSlug(tariff.title ?? ""),
      usedSlugs,
    ),
  }));

  const errors = validateTariffSlugs(withSlugs);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return withSlugs.map((tariff, tariffIndex) => ({
    ...tariff,
    sortOrder: tariffIndex,
    packages: tariff.packages.map((pkg, packageIndex) => ({
      ...pkg,
      sortOrder: packageIndex,
    })),
  }));
}

export function createPackage(index: number): TariffPackage {
  return {
    id: `tmp-pkg-${crypto.randomUUID()}`,
    title: `Пакет ${index + 1}`,
    regularAmount: 5000,
    discountedAmount: null,
    currency: "₽",
    sortOrder: index,
  };
}

export function createTariff(index: number): Tariff {
  return {
    id: `tmp-tariff-${crypto.randomUUID()}`,
    slug: "",
    title: `Новый тариф ${index + 1}`,
    descriptionMarkdown: "",
    isActive: true,
    sortOrder: index,
    packages: [createPackage(0)],
  };
}
