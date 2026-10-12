import type { Tariff, TariffPackage } from "@/lib/tariffStore";

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
