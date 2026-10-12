import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  content: "site-content",
  tariffs: "tariffs",
  tests: "tests",
} as const;

// Safety net: cached data is also refreshed hourly even if invalidation is missed.
export const CACHE_REVALIDATE_SECONDS = 60 * 60;

// Called after admin saves; `expire: 0` makes the next public request read fresh data.
export function invalidateCache(tag: (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]) {
  revalidateTag(tag, { expire: 0 });
}
