import { getContentBundle } from "@/lib/contentStore";
import { NextResponse } from "next/server";

export async function GET() {
  const bundle = await getContentBundle();
  return NextResponse.json({
    content: bundle.content,
    source: bundle.source,
  });
}
