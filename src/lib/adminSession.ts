import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "admin_session";

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

/** Cookie value that proves a valid login; "" when the admin is not configured. */
export function getAdminSessionToken(): string {
  const secret =
    process.env.ADMIN_SESSION_TOKEN || process.env.ADMIN_PASSWORD || "";
  if (!secret) {
    return "";
  }

  return sha256(`admin-session:${secret}`).toString("hex");
}

export function isValidSessionToken(token: string | undefined): boolean {
  const expected = getAdminSessionToken();
  return Boolean(expected) && Boolean(token) && safeEqual(token!, expected);
}

export function isValidAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return Boolean(expected) && safeEqual(candidate, expected);
}
