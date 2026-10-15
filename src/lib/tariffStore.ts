import { type SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS, invalidateCache } from "@/lib/cache";
import { normalizeSlug } from "@/lib/slug";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { getDataProvider, type DataProvider } from "@/lib/dataProvider";
import { mysqlRows, mysqlTransaction } from "@/lib/mysql";

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
  source: DataProvider;
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids created in the admin UI are temporary ("tmp-..."); replace them with real UUIDs. */
function persistentId(id: string | undefined): string {
  return id && UUID_PATTERN.test(id) ? id : crypto.randomUUID();
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

export async function getTariffBundle(): Promise<TariffBundle> {
  if (getDataProvider() === "mysql") {
    return mysqlTransaction(async (connection) => {
      const rows = await mysqlRows<Omit<TariffRow, "is_active"> & { is_active: number }>(
        "SELECT id,slug,title,description_md,is_active,sort_order FROM tariffs ORDER BY sort_order",
        [], connection,
      );
      const packages = await mysqlRows<PackageRow>(
        "SELECT id,tariff_id,title,price_regular,price_discounted,currency,sort_order FROM tariff_packages ORDER BY sort_order",
        [], connection,
      );
      return {
        tariffs: mapRowsToTariffs(rows.map((row) => ({ ...row, is_active: Boolean(row.is_active) })), packages),
        source: "mysql",
      };
    });
  }
  const supabase = getSupabaseAdminClient();
  const tariffs = await readSupabaseTariffs(supabase);

  if (tariffs === null) {
    throw new Error("Failed to read tariffs from Supabase");
  }

  return { tariffs, source: "supabase" };
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

  const preparedTariffs = tariffs.map((tariff, index) => ({
    id: persistentId(tariff.id),
    slug: normalizeSlug(tariff.slug || tariff.title) || `tariff-${index + 1}`,
    title: tariff.title.trim(),
    description_md: tariff.descriptionMarkdown,
    is_active: tariff.isActive,
    sort_order: index,
    packages: tariff.packages,
  }));
  const packageRows = preparedTariffs.flatMap((tariff) =>
    tariff.packages.map((pkg, index) => ({
      id: persistentId(pkg.id),
      tariff_id: tariff.id,
      title: (pkg.title ?? "").trim(),
      price_regular: Math.round(pkg.regularAmount),
      price_discounted:
        pkg.discountedAmount == null ? null : Math.round(pkg.discountedAmount),
      currency: pkg.currency || "₽",
      sort_order: index,
    })),
  );

  if (getDataProvider() === "mysql") {
    await mysqlTransaction(async (connection) => {
      await connection.execute("DELETE FROM tariff_packages");
      await connection.execute("DELETE FROM tariffs");
      for (const tariff of preparedTariffs) {
        await connection.execute(
          "INSERT INTO tariffs (id,slug,title,description_md,is_active,sort_order) VALUES (?,?,?,?,?,?)",
          [tariff.id, tariff.slug, tariff.title, tariff.description_md, tariff.is_active, tariff.sort_order],
        );
      }
      for (const pkg of packageRows) {
        await connection.execute(
          "INSERT INTO tariff_packages (id,tariff_id,title,price_regular,price_discounted,currency,sort_order) VALUES (?,?,?,?,?,?,?)",
          [pkg.id, pkg.tariff_id, pkg.title, pkg.price_regular, pkg.price_discounted, pkg.currency, pkg.sort_order],
        );
      }
    });
    invalidateCache(CACHE_TAGS.tariffs);
    return getTariffBundle();
  }

  const supabase = getSupabaseAdminClient();

  const { data: existingRaw, error: existingError } = await supabase
    .from(TARIFFS_TABLE)
    .select("id");

  if (existingError || !existingRaw) {
    throw existingError ?? new Error("Failed to read existing tariffs");
  }

  const existingIds = new Set(
    (existingRaw as Array<{ id: string }>).map((row) => row.id),
  );

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

  if (packageRows.length > 0) {
    const { error: upsertPackagesError } = await supabase
      .from(PACKAGES_TABLE)
      .upsert(packageRows, { onConflict: "id" });
    if (upsertPackagesError) {
      throw upsertPackagesError;
    }

    const { error: cleanupError } = await supabase
      .from(PACKAGES_TABLE)
      .delete()
      .in("tariff_id", [...keepIds])
      .not("id", "in", `(${packageRows.map((row) => row.id).join(",")})`);
    if (cleanupError) {
      throw cleanupError;
    }
  }
  invalidateCache(CACHE_TAGS.tariffs);
  return getTariffBundle();
}

// Public readers use this cached version; admin routes call getTariffBundle directly.
export const getPublicTariffBundle = unstable_cache(
  getTariffBundle,
  ["tariff-bundle", getDataProvider()],
  { tags: [CACHE_TAGS.tariffs], revalidate: CACHE_REVALIDATE_SECONDS },
);
