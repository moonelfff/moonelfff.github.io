import {
  getContentBundle,
  saveContentBundle,
  type MarkdownMap,
  type SiteContent,
} from "@/lib/contentStore";
import { NextResponse } from "next/server";

export async function GET() {
  const bundle = await getContentBundle();
  return NextResponse.json(bundle);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    content?: SiteContent;
    markdown?: MarkdownMap;
  };

  if (!body.content || !body.markdown) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const bundle = await saveContentBundle({
      content: body.content,
      markdown: body.markdown,
    });

    return NextResponse.json(bundle);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
