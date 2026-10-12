import { clearAdminSessionCookie } from "@/lib/adminAuth";
import { NextResponse } from "next/server";

export async function POST() {
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
