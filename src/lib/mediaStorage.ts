import "server-only";
import { mkdir, open, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { getDataProvider } from "@/lib/dataProvider";
import { getSupabaseAdminClient } from "@/lib/supabase";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export function mediaContentType(segments: string[]): string | null {
  if (segments.length === 0 || segments.some((segment) => !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segment))) {
    return null;
  }
  return CONTENT_TYPES[path.extname(segments.at(-1)!).toLowerCase()] ?? null;
}

function getMediaRoot(): string {
  const root = process.env.MEDIA_ROOT;
  if (!root || !path.isAbsolute(root)) {
    throw new Error("MEDIA_ROOT must be an absolute path outside the public document root");
  }
  const resolved = path.resolve(root);
  const project = process.cwd();
  const publicRoot = path.join(project, "public");
  if (resolved === path.parse(resolved).root || resolved === project ||
      isInside(resolved, project) || resolved === publicRoot || isInside(publicRoot, resolved)) {
    throw new Error("MEDIA_ROOT must not contain the project or be inside its public root");
  }
  return resolved;
}

function isInside(root: string, filename: string): boolean {
  const relative = path.relative(root, filename);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

export async function storeImage(storagePath: string, buffer: Buffer, contentType: string): Promise<string> {
  if (getDataProvider() === "supabase") {
    const client = getSupabaseAdminClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "site-images";
    const { error } = await client.storage.from(bucket).upload(storagePath, buffer, {
      contentType, cacheControl: "31536000", upsert: false,
    });
    if (error) throw new Error(`Failed to upload image: ${error.message}`);
    return client.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
  }

  const segments = storagePath.split("/");
  if (mediaContentType(segments) !== contentType) throw new Error("Invalid image storage path or content type");
  const root = getMediaRoot();
  const filename = path.join(root, ...segments);
  await mkdir(path.dirname(filename), { recursive: true });
  const resolvedRoot = await realpath(root);
  const resolvedParent = await realpath(path.dirname(filename));
  if (resolvedParent !== resolvedRoot && !isInside(resolvedRoot, resolvedParent)) {
    throw new Error("Image directory escapes MEDIA_ROOT");
  }
  const file = await open(filename, "wx", 0o600);
  try {
    await file.writeFile(buffer);
  } finally {
    await file.close();
  }
  return `/media/${storagePath}`;
}

export async function readMedia(segments: string[]): Promise<Buffer> {
  if (!mediaContentType(segments)) throw new Error("Invalid image storage path");
  let root: string;
  try {
    root = await realpath(getMediaRoot());
  } catch (error) {
    throw new Error("MEDIA_ROOT is not available", { cause: error });
  }
  const filename = await realpath(path.join(root, ...segments));
  if (!isInside(root, filename)) throw new Error("Image path escapes MEDIA_ROOT");
  return readFile(filename);
}
