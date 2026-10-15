import { getDataProvider } from "@/lib/dataProvider";
import { mediaContentType, readMedia } from "@/lib/mediaStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const contentType = mediaContentType(path);
  if (getDataProvider() !== "mysql" || !contentType) {
    return new Response(null, { status: 404 });
  }
  try {
    const buffer = await readMedia(path);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return new Response(null, { status: 404 });
    }
    console.error("Failed to read media", error);
    return new Response(null, { status: 500 });
  }
}
