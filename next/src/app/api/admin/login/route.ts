import {
  isAdminConfigured,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/adminAuth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin is not configured. Set ADMIN_PASSWORD in env." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { password?: string };
  const password = body.password?.trim() ?? "";

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await setAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
