import { getTariffBundle } from "@/lib/tariffStore";
import { NextResponse } from "next/server";

export async function GET() {
  const bundle = await getTariffBundle();
  return NextResponse.json(bundle);
}
