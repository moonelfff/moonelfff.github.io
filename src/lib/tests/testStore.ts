import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MOCK_TESTS } from "./mockTests";
import type { PublicTestDefinition, TestScoringConfig } from "./types";

const TESTS_TABLE = "psychological_tests";

export type TestBundle = {
  tests: PublicTestDefinition[];
  source: "local" | "supabase";
};

type TestRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  version: number;
  schema_json: Record<string, unknown>;
  scoring_json: TestScoringConfig;
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

function mapRowToTest(row: TestRow): PublicTestDefinition {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    version: row.version,
    schema: row.schema_json,
    scoring: row.scoring_json,
  };
}

async function readSupabaseTests(
  supabase: SupabaseClient,
): Promise<PublicTestDefinition[] | null> {
  const { data, error } = await supabase
    .from(TESTS_TABLE)
    .select(
      "id,slug,title,description,version,schema_json,scoring_json,sort_order",
    )
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return null;
  }

  return (data as TestRow[]).map(mapRowToTest);
}

async function seedSupabaseTestsFromMocks(
  supabase: SupabaseClient,
): Promise<void> {
  const rows = MOCK_TESTS.map((test, index) => ({
    slug: test.slug,
    title: test.title,
    description: test.description,
    version: test.version,
    schema_json: test.schema,
    scoring_json: test.scoring,
    sort_order: index,
  }));

  const { error } = await supabase.from(TESTS_TABLE).upsert(rows, {
    onConflict: "slug",
  });

  if (error) {
    throw error;
  }
}

function validateTests(tests: PublicTestDefinition[]) {
  if (!Array.isArray(tests)) {
    throw new Error("Tests payload must be an array");
  }

  const slugs = new Set<string>();

  for (const [index, test] of tests.entries()) {
    const row = index + 1;

    if (!test.title?.trim()) {
      throw new Error(`Test #${row}: title is required`);
    }

    if (!test.slug?.trim()) {
      throw new Error(`Test #${row}: slug is required`);
    }

    if (slugs.has(test.slug)) {
      throw new Error(`Test #${row}: slug must be unique`);
    }

    slugs.add(test.slug);

    if (!Number.isInteger(test.version) || test.version < 1) {
      throw new Error(`Test #${row}: version must be a positive integer`);
    }

    if (!test.schema || Array.isArray(test.schema)) {
      throw new Error(`Test #${row}: schema must be a JSON object`);
    }

    if (!test.scoring || Array.isArray(test.scoring)) {
      throw new Error(`Test #${row}: scoring must be a JSON object`);
    }
  }
}

export async function getTestBundle(): Promise<TestBundle> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      tests: MOCK_TESTS,
      source: "local",
    };
  }

  const loaded = await readSupabaseTests(supabase);
  if (loaded === null) {
    return {
      tests: MOCK_TESTS,
      source: "local",
    };
  }

  if (loaded.length > 0) {
    return {
      tests: loaded,
      source: "supabase",
    };
  }

  await seedSupabaseTestsFromMocks(supabase);
  const seeded = await readSupabaseTests(supabase);

  return {
    tests: seeded ?? MOCK_TESTS,
    source: seeded ? "supabase" : "local",
  };
}

export async function getTestBySlug(
  slug: string,
): Promise<PublicTestDefinition | null> {
  const bundle = await getTestBundle();
  return bundle.tests.find((test) => test.slug === slug) ?? null;
}

export async function saveTests(
  tests: PublicTestDefinition[],
): Promise<TestBundle> {
  validateTests(tests);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase is not configured for test editing");
  }

  const { data: existingRaw, error: existingError } = await supabase
    .from(TESTS_TABLE)
    .select("id");

  if (existingError || !existingRaw) {
    throw existingError ?? new Error("Failed to read existing tests");
  }

  const existingIds = new Set(
    (existingRaw as Array<{ id: string }>).map((row) => row.id),
  );

  const preparedTests = tests.map((test, index) => ({
    id:
      test.id && !test.id.startsWith("legacy-") && !test.id.startsWith("tmp-")
        ? test.id
        : crypto.randomUUID(),
    slug: test.slug.trim(),
    title: test.title.trim(),
    description: test.description?.trim() ?? "",
    version: test.version,
    schema_json: test.schema,
    scoring_json: test.scoring,
    sort_order: index,
  }));

  const { error: upsertError } = await supabase
    .from(TESTS_TABLE)
    .upsert(preparedTests, { onConflict: "id" });

  if (upsertError) {
    throw upsertError;
  }

  const keepIds = new Set(preparedTests.map((test) => test.id));
  const removeIds = [...existingIds].filter((id) => !keepIds.has(id));

  if (removeIds.length > 0) {
    const { error: deleteError } = await supabase
      .from(TESTS_TABLE)
      .delete()
      .in("id", removeIds);

    if (deleteError) {
      throw deleteError;
    }
  }

  return getTestBundle();
}
