import { PUBLIC_API_CACHE_CONTROL } from "@/lib/cache";
import { getPublicTariffBundle } from "@/lib/tariffStore";
import { NextResponse } from "next/server";

export async function GET() {
  const bundle = await getPublicTariffBundle();
  return NextResponse.json(bundle, {
    headers: { "Cache-Control": PUBLIC_API_CACHE_CONTROL },
  });
}
