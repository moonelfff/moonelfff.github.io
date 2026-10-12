import { PUBLIC_API_CACHE_CONTROL } from "@/lib/cache";
import { getMarkdownByPath } from "@/lib/contentStore";
import { NextResponse } from "next/server";

function normalizeMarkdownPath(input: string): string | null {
  const normalized = input.replace(/^\/+/, "");
  if (!normalized.endsWith(".md")) {
    return null;
  }
  if (normalized.includes("..")) {
    return null;
  }
  return normalized;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedPath = searchParams.get("path");

  if (!requestedPath) {
    return new NextResponse("Missing path", { status: 400 });
  }

  const normalizedPath = normalizeMarkdownPath(requestedPath);
  if (!normalizedPath) {
    return new NextResponse("Invalid markdown path", { status: 400 });
  }

  const fileContent = await getMarkdownByPath(normalizedPath);
  if (fileContent === null) {
    return new NextResponse("Markdown file not found", { status: 404 });
  }

  return new NextResponse(fileContent, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": PUBLIC_API_CACHE_CONTROL,
    },
  });
}
