import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "admin_session";

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

function getAdminSessionToken(): string {
  const configured = process.env.ADMIN_SESSION_TOKEN;
  if (configured) {
    return configured;
  }

  const password = getAdminPassword();
  if (!password) {
    return "";
  }

  return `token:${password}`;
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminPassword());
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  return Boolean(expected) && password === expected;
}

export async function setAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: getAdminSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const token = getAdminSessionToken();

  return Boolean(token) && cookie === token;
}
