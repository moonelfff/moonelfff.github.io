import { getPublicTariffBundle } from "@/lib/tariffStore";
import { NextResponse } from "next/server";

export async function GET() {
  const bundle = await getPublicTariffBundle();
  return NextResponse.json(bundle);
}
