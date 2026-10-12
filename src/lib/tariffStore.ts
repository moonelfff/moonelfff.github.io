import { getContentBundle, markdownKey } from "@/lib/contentStore";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TARIFFS_TABLE = "tariffs";
const PACKAGES_TABLE = "tariff_packages";

export type TariffPackage = {
  id: string;
  title: string;
  regularAmount: number;
  discountedAmount: number | null;
  currency: string;
  sortOrder: number;
};

export type Tariff = {
  id: string;
  slug: string;
  title: string;
  descriptionMarkdown: string;
  isActive: boolean;
  sortOrder: number;
  packages: TariffPackage[];
};

export type TariffBundle = {
  tariffs: Tariff[];
  source: "local" | "supabase";
};

type TariffRow = {
  id: string;
  slug: string;
  title: string;
  description_md: string;
  is_active: boolean;
  sort_order: number;
};

type PackageRow = {
  id: string;
  tariff_id: string;
  title: string;
  price_regular: number;
  price_discounted: number | null;
  currency: string;
  sort_order: number;
};

function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-я0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getLegacyTariffs(): Promise<Tariff[]> {
  const bundle = await getContentBundle();

  return bundle.content.pricelist.map((item, tariffIndex) => {
    const descriptionKey = markdownKey(item.descriptionPath);
    const descriptionMarkdown = bundle.markdown[descriptionKey] ?? "";
    const slug = slugify(item.title) || `tariff-${tariffIndex + 1}`;

    return {
      id: `legacy-${slug}`,
      slug,
      title: item.title,
      descriptionMarkdown,
      isActive: true,
      sortOrder: tariffIndex,
      packages: item.packages.map((pkg, pkgIndex) => ({
        id: `legacy-${slug}-pkg-${pkgIndex + 1}`,
        title: pkg.name,
        regularAmount: pkg.price.regular.amount,
        discountedAmount: pkg.price.discounted?.amount ?? null,
        currency: pkg.price.regular.currency,
        sortOrder: pkgIndex,
      })),
    };
  });
}

function mapRowsToTariffs(
  tariffRows: TariffRow[],
  packageRows: PackageRow[],
): Tariff[] {
  const grouped = new Map<string, TariffPackage[]>();

  for (const row of packageRows) {
    const list = grouped.get(row.tariff_id) ?? [];
    list.push({
      id: row.id,
      title: row.title,
      regularAmount: row.price_regular,
      discountedAmount: row.price_discounted,
      currency: row.currency,
      sortOrder: row.sort_order,
    });
    grouped.set(row.tariff_id, list);
  }

  return tariffRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    descriptionMarkdown: row.description_md,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    packages: (grouped.get(row.id) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    ),
  }));
}

async function readSupabaseTariffs(
  supabase: SupabaseClient,
): Promise<Tariff[] | null> {
  const { data: tariffRowsRaw, error: tariffsError } = await supabase
    .from(TARIFFS_TABLE)
    .select("id,slug,title,description_md,is_active,sort_order")
    .order("sort_order", { ascending: true });

  if (tariffsError || !tariffRowsRaw) {
    return null;
  }

  const tariffRows = tariffRowsRaw as TariffRow[];
  if (tariffRows.length === 0) {
    return [];
  }

  const tariffIds = tariffRows.map((row) => row.id);
  const { data: packageRowsRaw, error: packagesError } = await supabase
    .from(PACKAGES_TABLE)
    .select(
      "id,tariff_id,title,price_regular,price_discounted,currency,sort_order",
    )
    .in("tariff_id", tariffIds)
    .order("sort_order", { ascending: true });

  if (packagesError || !packageRowsRaw) {
    return null;
  }

  return mapRowsToTariffs(tariffRows, packageRowsRaw as PackageRow[]);
}

async function seedSupabaseTariffsFromLegacy(
  supabase: SupabaseClient,
): Promise<void> {
  const legacy = await getLegacyTariffs();

  const tariffRows = legacy.map((tariff, index) => ({
    slug: tariff.slug || `tariff-${index + 1}`,
    title: tariff.title,
    description_md: tariff.descriptionMarkdown,
    is_active: tariff.isActive,
    sort_order: index,
  }));

  const upsertResult = await supabase.from(TARIFFS_TABLE).upsert(tariffRows, {
    onConflict: "slug",
  });

  if (upsertResult.error) {
    throw upsertResult.error;
  }

  const slugs = tariffRows.map((row) => row.slug);
  const { data: persistedTariffsRaw, error: persistedError } = await supabase
    .from(TARIFFS_TABLE)
    .select("id,slug")
    .in("slug", slugs);

  if (persistedError || !persistedTariffsRaw) {
    throw persistedError ?? new Error("Failed to read seeded tariffs");
  }

  const persistedTariffs = persistedTariffsRaw as Array<{
    id: string;
    slug: string;
  }>;
  const persistedMap = new Map<string, string>(
    persistedTariffs.map((row) => [row.slug, row.id]),
  );
  const tariffIds = [...persistedMap.values()];

  if (tariffIds.length > 0) {
    const deletePackagesResult = await supabase
      .from(PACKAGES_TABLE)
      .delete()
      .in("tariff_id", tariffIds);

    if (deletePackagesResult.error) {
      throw deletePackagesResult.error;
    }
  }

  const packageRows = legacy.flatMap((tariff) => {
    const tariffId = persistedMap.get(tariff.slug);
    if (!tariffId) {
      return [];
    }

    return tariff.packages.map((pkg, index) => ({
      id: crypto.randomUUID(),
      tariff_id: tariffId,
      title: pkg.title,
      price_regular: pkg.regularAmount,
      price_discounted: pkg.discountedAmount,
      currency: pkg.currency,
      sort_order: index,
    }));
  });

  if (packageRows.length === 0) {
    return;
  }

  const insertPackagesResult = await supabase
    .from(PACKAGES_TABLE)
    .insert(packageRows);
  if (insertPackagesResult.error) {
    throw insertPackagesResult.error;
  }
}

export async function getTariffBundle(): Promise<TariffBundle> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      tariffs: await getLegacyTariffs(),
      source: "local",
    };
  }

  const loaded = await readSupabaseTariffs(supabase);
  if (loaded === null) {
    return {
      tariffs: await getLegacyTariffs(),
      source: "local",
    };
  }

  if (loaded.length > 0) {
    return {
      tariffs: loaded,
      source: "supabase",
    };
  }

  await seedSupabaseTariffsFromLegacy(supabase);
  const seeded = await readSupabaseTariffs(supabase);

  return {
    tariffs: seeded ?? [],
    source: seeded ? "supabase" : "local",
  };
}

function validateTariffs(tariffs: Tariff[]) {
  if (!Array.isArray(tariffs)) {
    throw new Error("Tariffs payload must be an array");
  }

  for (const tariff of tariffs) {
    if (!tariff.title.trim()) {
      throw new Error("Tariff title is required");
    }

    if (!Array.isArray(tariff.packages) || tariff.packages.length === 0) {
      throw new Error(`Tariff packages are required for ${tariff.title}`);
    }

    for (const pkg of tariff.packages) {
      if (!Number.isFinite(pkg.regularAmount) || pkg.regularAmount <= 0) {
        throw new Error(
          `Regular price must be greater than 0 for ${tariff.title}`,
        );
      }
    }
  }
}

export async function saveTariffs(tariffs: Tariff[]): Promise<TariffBundle> {
  validateTariffs(tariffs);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase is not configured for tariff editing");
  }

  const { data: existingRaw, error: existingError } = await supabase
    .from(TARIFFS_TABLE)
    .select("id");

  if (existingError || !existingRaw) {
    throw existingError ?? new Error("Failed to read existing tariffs");
  }

  const existingIds = new Set(
    (existingRaw as Array<{ id: string }>).map((row) => row.id),
  );

  const preparedTariffs = tariffs.map((tariff, index) => {
    const id =
      tariff.id && !tariff.id.startsWith("legacy-")
        ? tariff.id
        : crypto.randomUUID();
    const slug = slugify(tariff.slug || tariff.title) || `tariff-${index + 1}`;

    return {
      id,
      slug,
      title: tariff.title.trim(),
      description_md: tariff.descriptionMarkdown,
      is_active: tariff.isActive,
      sort_order: index,
      packages: tariff.packages,
    };
  });

  const upsertResult = await supabase.from(TARIFFS_TABLE).upsert(
    preparedTariffs.map((tariff) => ({
      id: tariff.id,
      slug: tariff.slug,
      title: tariff.title,
      description_md: tariff.description_md,
      is_active: tariff.is_active,
      sort_order: tariff.sort_order,
    })),
    { onConflict: "id" },
  );

  if (upsertResult.error) {
    throw upsertResult.error;
  }

  const keepIds = new Set(preparedTariffs.map((tariff) => tariff.id));
  const removeIds = [...existingIds].filter((id) => !keepIds.has(id));

  if (removeIds.length > 0) {
    const deleteResult = await supabase
      .from(TARIFFS_TABLE)
      .delete()
      .in("id", removeIds);
    if (deleteResult.error) {
      throw deleteResult.error;
    }
  }

  const retainedIds = preparedTariffs.map((tariff) => tariff.id);
  if (retainedIds.length > 0) {
    const deletePackagesResult = await supabase
      .from(PACKAGES_TABLE)
      .delete()
      .in("tariff_id", retainedIds);

    if (deletePackagesResult.error) {
      throw deletePackagesResult.error;
    }
  }

  const packageRows = preparedTariffs.flatMap((tariff) =>
    tariff.packages.map((pkg, index) => ({
      id:
        pkg.id && !pkg.id.startsWith("legacy-") ? pkg.id : crypto.randomUUID(),
      tariff_id: tariff.id,
      title: (pkg.title ?? "").trim(),
      price_regular: Math.round(pkg.regularAmount),
      price_discounted:
        pkg.discountedAmount === null || pkg.discountedAmount === undefined
          ? null
          : Math.round(pkg.discountedAmount),
      currency: pkg.currency || "₽",
      sort_order: index,
    })),
  );

  if (packageRows.length > 0) {
    const insertPackagesResult = await supabase
      .from(PACKAGES_TABLE)
      .insert(packageRows);
    if (insertPackagesResult.error) {
      throw insertPackagesResult.error;
    }
  }

  return getTariffBundle();
}
