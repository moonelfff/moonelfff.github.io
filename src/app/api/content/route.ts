import { getPublicContentBundle } from "@/lib/contentStore";
import { NextResponse } from "next/server";

export async function GET() {
  const bundle = await getPublicContentBundle();
  return NextResponse.json({
    content: bundle.content,
    source: bundle.source,
  });
}
