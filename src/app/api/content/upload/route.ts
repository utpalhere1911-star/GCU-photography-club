import { NextRequest, NextResponse } from "next/server";
import { requireContentManager } from "@/lib/auth";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";
import fs from "fs/promises";
import path from "path";

// Allowed storage buckets matching the canonical Supabase schema
export const ALLOWED_STORAGE_BUCKETS = [
  "shutterscape-media",
  "gallery-photos",
  "event-posters",
  "team-portraits",
  "site-banners",
] as const;

export type StorageBucket = (typeof ALLOWED_STORAGE_BUCKETS)[number];

// Security constraints
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per image
const MAX_BATCH_FILES = 10;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

/**
 * Validates file buffer signatures (magic bytes) to ensure the uploaded payload
 * matches its declared MIME type, preventing MIME-spoofing and active payload execution.
 */
function validateImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // GIF: GIF87a or GIF89a
  if (mimeType === "image/gif") {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    );
  }

  // WebP: RIFF .... WEBP
  if (mimeType === "image/webp") {
    const isRiff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 &&
      buffer[9] === 0x42 &&
      buffer[10] === 0x43 &&
      buffer[11] === 0x50; // WebP ASCII check: WEBP = 0x57, 0x45, 0x42, 0x50
    return isRiff && (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50);
  }

  // AVIF: ftyp box containing avif/mif1
  if (mimeType === "image/avif") {
    const boxType = buffer.toString("ascii", 4, 8);
    if (boxType === "ftyp") {
      const majorBrand = buffer.toString("ascii", 8, 12);
      return (
        majorBrand.includes("avif") ||
        majorBrand.includes("mif1") ||
        majorBrand.includes("miaf")
      );
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  // Strict backend authorization guard: both Admin & Executive have equal access
  const auth = await requireContentManager();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    const supabase = getSupabaseAdminClient() || getSupabaseServerClient();

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("files");
      const singleFile = formData.get("file");

      // Optional bucket and folder specified by caller
      const requestedBucket =
        (formData.get("bucket") as string)?.trim() || "shutterscape-media";
      const targetBucket: StorageBucket = (
        ALLOWED_STORAGE_BUCKETS as readonly string[]
      ).includes(requestedBucket)
        ? (requestedBucket as StorageBucket)
        : "shutterscape-media";

      const folder = ((formData.get("folder") as string)?.trim() || "uploads")
        .replace(/[^a-zA-Z0-9_-]/g, "");

      const fileList =
        files.length > 0
          ? (files as File[])
          : singleFile
          ? [singleFile as File]
          : [];

      if (fileList.length === 0) {
        return NextResponse.json(
          { success: false, error: "No image file provided." },
          { status: 400 }
        );
      }

      if (fileList.length > MAX_BATCH_FILES) {
        return NextResponse.json(
          {
            success: false,
            error: `Maximum batch limit exceeded. You can upload up to ${MAX_BATCH_FILES} images at a time.`,
          },
          { status: 400 }
        );
      }

      const results: string[] = [];
      let lastUploadError: string | null = null;

      for (const file of fileList) {
        // 1. Strict MIME type check (Explicitly disallow SVG and active formats)
        const mimeType = (file.type || "image/jpeg").toLowerCase().trim();
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Invalid file type. Only JPEG, PNG, WebP, AVIF, and GIF images are allowed. SVG and executable formats are prohibited.",
            },
            { status: 400 }
          );
        }

        // 2. File size ceiling check
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            {
              success: false,
              error: `File "${file.name}" exceeds the maximum allowed size limit of 10MB.`,
            },
            { status: 400 }
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 3. Magic byte signature verification
        if (!validateImageMagicBytes(buffer, mimeType)) {
          return NextResponse.json(
            {
              success: false,
              error: `Corrupted image or file signature mismatch for "${file.name}".`,
            },
            { status: 400 }
          );
        }

        // 4. Safe filename construction with strict extension matching
        const verifiedExt = MIME_TO_EXTENSION[mimeType] || ".jpg";
        const cleanName = path
          .basename(file.name, path.extname(file.name))
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .toLowerCase()
          .slice(0, 50);
        const filename = `${cleanName}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}${verifiedExt}`;
        const storagePath = `${folder}/${filename}`;

        let uploadedUrl: string | null = null;

        // 5. Supabase Storage Upload
        if (supabase) {
          try {
            let bucketToUse: string = targetBucket;
            let { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucketToUse)
              .upload(storagePath, buffer, {
                contentType: mimeType,
                upsert: true,
              });

            // Resilient fallback: retry in universal 'shutterscape-media' bucket if target bucket has different policy
            if (uploadError && bucketToUse !== "shutterscape-media") {
              console.warn(
                `Upload to ${bucketToUse} failed (${uploadError.message}). Retrying in 'shutterscape-media'...`
              );
              bucketToUse = "shutterscape-media";
              const retry = await supabase.storage
                .from(bucketToUse)
                .upload(storagePath, buffer, {
                  contentType: mimeType,
                  upsert: true,
                });
              uploadData = retry.data;
              uploadError = retry.error;
            }

            if (!uploadError && uploadData) {
              const { data: publicUrlData } = supabase.storage
                .from(bucketToUse)
                .getPublicUrl(storagePath);

              if (publicUrlData?.publicUrl) {
                uploadedUrl = publicUrlData.publicUrl;
              }
            } else if (uploadError) {
              lastUploadError = uploadError.message;
              console.warn(
                `Supabase Storage upload to ${bucketToUse}/${storagePath} failed:`,
                uploadError.message
              );
            }
          } catch (storageErr) {
            const msg =
              storageErr instanceof Error
                ? storageErr.message
                : String(storageErr);
            lastUploadError = msg;
            console.warn("Supabase Storage call exception:", storageErr);
          }
        }

        // 6. Local File System Fallback (ONLY in non-production local development without Supabase)
        if (
          !uploadedUrl &&
          !supabase &&
          process.env.NODE_ENV !== "production" &&
          !process.env.VERCEL
        ) {
          try {
            const uploadsDir = path.join(process.cwd(), "public", "uploads");
            await fs.mkdir(uploadsDir, { recursive: true });
            const filePath = path.join(uploadsDir, filename);
            await fs.writeFile(filePath, buffer);
            uploadedUrl = `/uploads/${filename}`;
          } catch (fsErr) {
            console.warn("Local filesystem fallback write failed:", fsErr);
          }
        }

        if (uploadedUrl) {
          results.push(uploadedUrl);
        }
      }

      if (results.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: lastUploadError
              ? `Storage upload failed: ${lastUploadError}`
              : "Failed to upload image. Please verify Supabase storage configuration.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${results.length} image(s) uploaded successfully.`,
        urls: results,
        url: results[0],
        bucket: targetBucket,
      });
    }

    // JSON payload with base64 dataUrl
    const body = await req.json().catch(() => null);
    if (body?.dataUrl && typeof body.dataUrl === "string") {
      const match = body.dataUrl.match(
        /^data:(image\/[a-zA-Z0-9+]+);base64,(.+)$/
      );
      if (!match) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid image format. Expected data:image/* base64 data URL.",
          },
          { status: 400 }
        );
      }

      const rawMime = match[1].toLowerCase().trim();
      const mimeType = rawMime === "image/jpg" ? "image/jpeg" : rawMime;

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Disallowed image format. Only JPEG, PNG, WebP, AVIF, and GIF are permitted.",
          },
          { status: 400 }
        );
      }

      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");

      if (buffer.length > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: "Image exceeds the maximum allowed size of 10MB.",
          },
          { status: 400 }
        );
      }

      if (!validateImageMagicBytes(buffer, mimeType)) {
        return NextResponse.json(
          {
            success: false,
            error: "Corrupted image or file signature mismatch.",
          },
          { status: 400 }
        );
      }

      const requestedBucket =
        (body.bucket as string)?.trim() || "shutterscape-media";
      const targetBucket: StorageBucket = (
        ALLOWED_STORAGE_BUCKETS as readonly string[]
      ).includes(requestedBucket)
        ? (requestedBucket as StorageBucket)
        : "shutterscape-media";

      const folder = ((body.folder as string)?.trim() || "uploads").replace(
        /[^a-zA-Z0-9_-]/g,
        ""
      );

      const ext = MIME_TO_EXTENSION[mimeType] || ".jpg";
      const filename = `img-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}${ext}`;
      const storagePath = `${folder}/${filename}`;

      let uploadedUrl: string | null = null;
      let lastUploadError: string | null = null;

      if (supabase) {
        try {
          let bucketToUse: string = targetBucket;
          let { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketToUse)
            .upload(storagePath, buffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (uploadError && bucketToUse !== "shutterscape-media") {
            console.warn(
              `Base64 upload to ${bucketToUse} failed (${uploadError.message}). Retrying in 'shutterscape-media'...`
            );
            bucketToUse = "shutterscape-media";
            const retry = await supabase.storage
              .from(bucketToUse)
              .upload(storagePath, buffer, {
                contentType: mimeType,
                upsert: true,
              });
            uploadData = retry.data;
            uploadError = retry.error;
          }

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from(bucketToUse)
              .getPublicUrl(storagePath);

            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          } else if (uploadError) {
            lastUploadError = uploadError.message;
            console.warn(
              `Supabase Storage upload to ${bucketToUse}/${storagePath} failed:`,
              uploadError.message
            );
          }
        } catch (storageErr) {
          const msg =
            storageErr instanceof Error ? storageErr.message : String(storageErr);
          lastUploadError = msg;
          console.warn("Supabase Storage call failed:", storageErr);
        }
      }

      if (
        !uploadedUrl &&
        !supabase &&
        process.env.NODE_ENV !== "production" &&
        !process.env.VERCEL
      ) {
        try {
          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          await fs.mkdir(uploadsDir, { recursive: true });
          const filePath = path.join(uploadsDir, filename);
          await fs.writeFile(filePath, buffer);
          uploadedUrl = `/uploads/${filename}`;
        } catch (fsErr) {
          console.warn("Local filesystem fallback write failed:", fsErr);
        }
      }

      if (uploadedUrl) {
        return NextResponse.json({
          success: true,
          url: uploadedUrl,
          bucket: targetBucket,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: lastUploadError
            ? `Storage upload failed: ${lastUploadError}`
            : "Failed to upload image. Please verify Supabase storage configuration.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "No image file or dataUrl provided." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process image upload." },
      { status: 500 }
    );
  }
}
