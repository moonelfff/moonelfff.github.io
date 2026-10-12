import { getTestBundle, saveTests } from "@/lib/tests/testStore";
import type { PublicTestDefinition } from "@/lib/tests/types";
import { NextResponse } from "next/server";

export async function GET() {
  const bundle = await getTestBundle();
  return NextResponse.json(bundle);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { tests?: PublicTestDefinition[] };

  if (!body.tests) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const bundle = await saveTests(body.tests);
    return NextResponse.json(bundle);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save tests";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
