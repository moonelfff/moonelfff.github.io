import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

function normalizeMarkdownPath(input: string): string | null {
  const normalized = input.replace(/^\/+/, "");
  if (!normalized.endsWith(".md")) {
    return null;
  }
  if (normalized.includes("..") || path.isAbsolute(normalized)) {
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

  const publicDir = path.join(process.cwd(), "public");
  const absolutePath = path.resolve(publicDir, normalizedPath);

  if (!absolutePath.startsWith(publicDir)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const fileContent = await fs.readFile(absolutePath, "utf-8");
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  } catch {
    return new NextResponse("Markdown file not found", { status: 404 });
  }
}
