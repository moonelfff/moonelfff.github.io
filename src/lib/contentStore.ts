import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS, invalidateCache } from "@/lib/cache";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { MarkdownMap, SiteContent } from "@/lib/contentTypes";

export type { MarkdownMap, SiteContent };

const CONTENT_TABLE = "site_content";
const CONTENT_JSON_KEY = "content_json";

export type ContentBundle = {
  content: SiteContent;
  markdown: MarkdownMap;
  source: "supabase";
};

export function markdownKey(markdownPath: string): string {
  return markdownPath.replace(/^\/+/, "");
}

function getMarkdownPaths(content: SiteContent): string[] {
  const paths = new Set<string>();
  paths.add(markdownKey(content.info.contentPath));
  paths.add(markdownKey(content.blogDescriptionPath));

  for (const item of content.pricelist) {
    paths.add(markdownKey(item.descriptionPath));
  }

  return [...paths];
}

async function readRows(keys: string[]): Promise<Map<string, string>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(CONTENT_TABLE)
    .select("key,value")
    .in("key", keys);

  if (error) {
    throw new Error(`Failed to read content from Supabase: ${error.message}`);
  }

  return new Map(
    (data as Array<{ key: string; value: string }>).map((row) => [
      row.key,
      row.value,
    ]),
  );
}

export async function getContentBundle(): Promise<ContentBundle> {
  const jsonRows = await readRows([CONTENT_JSON_KEY]);
  const rawContent = jsonRows.get(CONTENT_JSON_KEY);

  if (!rawContent) {
    throw new Error(
      "Site content is missing in Supabase. Run `npm run seed` to load initial data.",
    );
  }

  const content = JSON.parse(rawContent) as SiteContent;
  const markdownPaths = getMarkdownPaths(content);
  const markdownRows = await readRows(markdownPaths);

  const markdown: MarkdownMap = {};
  for (const pathKey of markdownPaths) {
    markdown[pathKey] = markdownRows.get(pathKey) ?? "";
  }

  return { content, markdown, source: "supabase" };
}

type SaveInput = {
  content: SiteContent;
  markdown: MarkdownMap;
};

function validateSaveInput(input: SaveInput) {
  if (
    !input.content?.info?.contentPath ||
    !Array.isArray(input.content.pricelist)
  ) {
    throw new Error("Invalid content schema");
  }
}

export async function saveContentBundle(
  input: SaveInput,
): Promise<ContentBundle> {
  validateSaveInput(input);

  const supabase = getSupabaseAdminClient();
  const rows = [
    { key: CONTENT_JSON_KEY, value: JSON.stringify(input.content, null, 2) },
    ...getMarkdownPaths(input.content).map((pathKey) => ({
      key: pathKey,
      value: input.markdown[pathKey] ?? "",
    })),
  ];

  const { error } = await supabase.from(CONTENT_TABLE).upsert(rows, {
    onConflict: "key",
  });

  if (error) {
    throw new Error(`Failed to save content to Supabase: ${error.message}`);
  }

  invalidateCache(CACHE_TAGS.content);
  return getContentBundle();
}

// Public readers use this cached version; admin routes call getContentBundle directly.
export const getPublicContentBundle = unstable_cache(
  getContentBundle,
  ["content-bundle"],
  { tags: [CACHE_TAGS.content], revalidate: CACHE_REVALIDATE_SECONDS },
);

const getPublicMarkdown = unstable_cache(
  async (key: string) => {
    const rows = await readRows([key]);
    return rows.get(key) ?? null;
  },
  ["markdown"],
  { tags: [CACHE_TAGS.content], revalidate: CACHE_REVALIDATE_SECONDS },
);

export async function getMarkdownByPath(
  markdownPath: string,
): Promise<string | null> {
  return getPublicMarkdown(markdownKey(markdownPath));
}
