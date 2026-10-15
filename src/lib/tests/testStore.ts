import { type SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS, invalidateCache } from "@/lib/cache";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { PublicTestDefinition, TestScoringConfig } from "./types";
import { countQuestions } from "./meta";

export type TestSummary = Pick<
  PublicTestDefinition,
  "id" | "slug" | "title" | "description"
> & {
  questionCount: number;
};

export type TestDetails = Omit<PublicTestDefinition, "scoring">;

const TESTS_TABLE = "psychological_tests";

export type TestBundle = {
  tests: PublicTestDefinition[];
  source: "supabase";
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
  const tests = await readSupabaseTests(getSupabaseAdminClient());

  if (tests === null) {
    throw new Error("Failed to read tests from Supabase");
  }

  return { tests, source: "supabase" };
}

// Cache compact summaries, keeping schemas out of the cached list.
export const getPublicTestSummaries = unstable_cache(
  async (): Promise<TestSummary[]> => {
    const { data, error } = await getSupabaseAdminClient()
      .from(TESTS_TABLE)
      .select("id,slug,title,description,schema_json")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      questionCount: countQuestions(row.schema_json),
    }));
  },
  ["test-summaries"],
  { tags: [CACHE_TAGS.tests], revalidate: CACHE_REVALIDATE_SECONDS },
);

export const getPublicTestBySlug = unstable_cache(
  async (slug: string): Promise<TestDetails | null> => {
    const { data, error } = await getSupabaseAdminClient()
      .from(TESTS_TABLE)
      .select("id,slug,title,description,version,schema_json")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      description: data.description,
      version: data.version,
      schema: data.schema_json,
    };
  },
  ["test-details"],
  { tags: [CACHE_TAGS.tests], revalidate: CACHE_REVALIDATE_SECONDS },
);

export const getTestBySlug = unstable_cache(
  async (slug: string): Promise<PublicTestDefinition | null> => {
    const { data, error } = await getSupabaseAdminClient()
      .from(TESTS_TABLE)
      .select("id,slug,title,description,version,schema_json,scoring_json,sort_order")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data ? mapRowToTest(data) : null;
  },
  ["test-scoring"],
  { tags: [CACHE_TAGS.tests], revalidate: CACHE_REVALIDATE_SECONDS },
);

export async function saveTests(
  tests: PublicTestDefinition[],
): Promise<TestBundle> {
  validateTests(tests);

  const supabase = getSupabaseAdminClient();

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
      test.id && !test.id.startsWith("tmp-")
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

  invalidateCache(CACHE_TAGS.tests);
  return getTestBundle();
}
