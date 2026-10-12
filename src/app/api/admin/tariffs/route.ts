import { getTariffBundle, saveTariffs, type Tariff } from "@/lib/tariffStore";
import { NextResponse } from "next/server";

export async function GET() {
  const bundle = await getTariffBundle();
  return NextResponse.json(bundle);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { tariffs?: Tariff[] };

  if (!body.tariffs) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const bundle = await saveTariffs(body.tariffs);
    return NextResponse.json(bundle);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save tariffs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
