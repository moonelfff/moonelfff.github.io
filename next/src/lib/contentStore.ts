import defaultContent from "@/assets/data/content.json";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";

const CONTENT_TABLE = "site_content";
const CONTENT_JSON_KEY = "content_json";

export type SiteContent = typeof defaultContent;
export type MarkdownMap = Record<string, string>;

export type ContentBundle = {
  content: SiteContent;
  markdown: MarkdownMap;
  source: "local" | "supabase";
};

function normalizeMarkdownPath(markdownPath: string): string {
  return markdownPath.replace(/^\/+/, "");
}

export function markdownKey(markdownPath: string): string {
  return normalizeMarkdownPath(markdownPath);
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

async function readLocalContentJson(): Promise<SiteContent> {
  const jsonPath = path.join(process.cwd(), "src", "assets", "data", "content.json");

  try {
    const content = await fs.readFile(jsonPath, "utf-8");
    return JSON.parse(content) as SiteContent;
  } catch {
    return defaultContent as SiteContent;
  }
}

async function readLocalMarkdown(pathKey: string): Promise<string> {
  const absolutePath = path.join(process.cwd(), "public", pathKey);
  return fs.readFile(absolutePath, "utf-8");
}

async function readLocalBundle(): Promise<ContentBundle> {
  const content = await readLocalContentJson();
  const markdown: MarkdownMap = {};

  await Promise.all(
    getMarkdownPaths(content).map(async (pathKey) => {
      try {
        markdown[pathKey] = await readLocalMarkdown(pathKey);
      } catch {
        markdown[pathKey] = "";
      }
    }),
  );

  return {
    content,
    markdown,
    source: "local",
  };
}

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

async function readSupabaseMap(keys: string[]): Promise<Map<string, string> | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(CONTENT_TABLE)
    .select("key,value")
    .in("key", keys);

  if (error || !data) {
    return null;
  }

  const result = new Map<string, string>();
  for (const row of data as Array<{ key: string; value: string }>) {
    result.set(row.key, row.value);
  }

  return result;
}

export async function getContentBundle(): Promise<ContentBundle> {
  const localBundle = await readLocalBundle();
  const initialKeys = [CONTENT_JSON_KEY, ...getMarkdownPaths(localBundle.content)];
  const supabaseMap = await readSupabaseMap(initialKeys);

  if (!supabaseMap || !supabaseMap.has(CONTENT_JSON_KEY)) {
    return localBundle;
  }

  let content: SiteContent;
  try {
    content = JSON.parse(supabaseMap.get(CONTENT_JSON_KEY) as string) as SiteContent;
  } catch {
    return localBundle;
  }

  const markdownPaths = getMarkdownPaths(content);
  const markdownKeys = [CONTENT_JSON_KEY, ...markdownPaths];
  const upToDateMap = await readSupabaseMap(markdownKeys);
  const sourceMap = upToDateMap ?? supabaseMap;

  const markdown: MarkdownMap = {};
  for (const pathKey of markdownPaths) {
    markdown[pathKey] = sourceMap.get(pathKey) ?? localBundle.markdown[pathKey] ?? "";
  }

  return {
    content,
    markdown,
    source: "supabase",
  };
}

type SaveInput = {
  content: SiteContent;
  markdown: MarkdownMap;
};

function validateSaveInput(input: SaveInput) {
  if (!input.content?.info?.contentPath || !Array.isArray(input.content.pricelist)) {
    throw new Error("Invalid content schema");
  }
}

async function saveToLocal(input: SaveInput) {
  const jsonPath = path.join(process.cwd(), "src", "assets", "data", "content.json");
  await fs.writeFile(jsonPath, `${JSON.stringify(input.content, null, 2)}\n`, "utf-8");

  const markdownPaths = getMarkdownPaths(input.content);
  await Promise.all(
    markdownPaths.map(async (pathKey) => {
      const absolutePath = path.join(process.cwd(), "public", pathKey);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, input.markdown[pathKey] ?? "", "utf-8");
    }),
  );
}

async function saveToSupabase(input: SaveInput): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const markdownPaths = getMarkdownPaths(input.content);
  const rows = [
    { key: CONTENT_JSON_KEY, value: JSON.stringify(input.content, null, 2) },
    ...markdownPaths.map((pathKey) => ({
      key: pathKey,
      value: input.markdown[pathKey] ?? "",
    })),
  ];

  const { error } = await supabase.from(CONTENT_TABLE).upsert(rows, {
    onConflict: "key",
  });

  return !error;
}

export async function saveContentBundle(input: SaveInput): Promise<ContentBundle> {
  validateSaveInput(input);

  const savedToSupabase = await saveToSupabase(input);
  if (!savedToSupabase) {
    await saveToLocal(input);
  }

  return getContentBundle();
}

export async function getMarkdownByPath(markdownPath: string): Promise<string | null> {
  const key = markdownKey(markdownPath);
  const bundle = await getContentBundle();
  return bundle.markdown[key] ?? null;
}
