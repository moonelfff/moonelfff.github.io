import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  content: "site-content",
  tariffs: "tariffs",
  tests: "tests",
} as const;

// Safety net: cached data is also refreshed hourly even if invalidation is missed.
export const CACHE_REVALIDATE_SECONDS = 60 * 60;

// CDN/browser caching of public JSON APIs: admin edits show up on these endpoints within ~1 minute.
export const PUBLIC_API_CACHE_CONTROL =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=300";

// Called after admin saves; `expire: 0` makes the next public request read fresh data.
export function invalidateCache(tag: (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]) {
  revalidateTag(tag, { expire: 0 });
}
