import {
  getContentBundle,
  saveContentBundle,
  type SiteContent,
} from "@/lib/contentStore";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import sharp from "sharp";

type UploadKind = "profile" | "og";

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DEFAULT_BUCKET = "site-images";

function isUploadKind(value: string): value is UploadKind {
  return value === "profile" || value === "og";
}

async function processImage(fileBuffer: Buffer, kind: UploadKind) {
  if (kind === "profile") {
    const outputBuffer = await sharp(fileBuffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    return {
      outputBuffer,
      extension: "webp",
      contentType: "image/webp",
      contentField: "profileImageUrl" as const,
    };
  }

  const outputBuffer = await sharp(fileBuffer)
    .rotate()
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();

  return {
    outputBuffer,
    extension: "jpg",
    contentType: "image/jpeg",
    contentField: "ogImageUrl" as const,
  };
}

function buildStoragePath(kind: UploadKind, extension: string): string {
  const random = crypto.randomUUID();
  return `${kind}/${Date.now()}-${random}.${extension}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawKind = formData.get("kind");
  const rawFile = formData.get("file");

  if (typeof rawKind !== "string" || !isUploadKind(rawKind)) {
    return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 });
  }

  if (!(rawFile instanceof File)) {
    return NextResponse.json(
      { error: "Image file is required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_TYPES.has(rawFile.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and WEBP images are supported" },
      { status: 400 },
    );
  }

  if (rawFile.size <= 0 || rawFile.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image size must be between 1 byte and 8 MB" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();

  const sourceBuffer = Buffer.from(await rawFile.arrayBuffer());
  const processed = await processImage(sourceBuffer, rawKind);
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
  const storagePath = buildStoragePath(rawKind, processed.extension);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, processed.outputBuffer, {
      contentType: processed.contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Failed to upload image: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const publicUrl = data.publicUrl;

  const currentBundle = await getContentBundle();
  const nextContent: SiteContent = {
    ...currentBundle.content,
    [processed.contentField]: publicUrl,
  };

  const savedBundle = await saveContentBundle({
    content: nextContent,
    markdown: currentBundle.markdown,
  });

  return NextResponse.json({
    ...savedBundle,
    uploadedUrl: publicUrl,
    kind: rawKind,
  });
}
