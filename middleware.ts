import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "admin_session";

function getAdminSessionToken(): string {
  const configured = process.env.ADMIN_SESSION_TOKEN;
  if (configured) {
    return configured;
  }

  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    return "";
  }

  return `token:${password}`;
}

function isAuthorized(request: NextRequest): boolean {
  const expectedToken = getAdminSessionToken();
  if (!expectedToken) {
    return false;
  }

  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return cookieToken === expectedToken;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminApi = pathname.startsWith("/api/admin");
  const isLoginApi = pathname === "/api/admin/login";
  const isAdminPage = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isLoginApi || isLoginPage) {
    return NextResponse.next();
  }

  if (!isAdminApi && !isAdminPage) {
    return NextResponse.next();
  }

  if (isAuthorized(request)) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
