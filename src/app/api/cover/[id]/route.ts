import { NextResponse } from "next/server";

import { clearSongCover, getProfileByUserId, getSongByIdForUser } from "@/lib/db/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MUSIC_BUCKET = process.env.NEXT_PUBLIC_MUSIC_BUCKET || "music";

const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAn8B9pRgxgAAAABJRU5ErkJggg==",
  "base64",
);

function detectImageMimeType(bytes: Uint8Array | Buffer): string | null {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF" && buffer[3] === 0x38) {
    return "image/gif";
  }

  return null;
}

function placeholderResponse() {
  const placeholderArrayBuffer = PLACEHOLDER_PNG.buffer.slice(
    PLACEHOLDER_PNG.byteOffset,
    PLACEHOLDER_PNG.byteOffset + PLACEHOLDER_PNG.byteLength,
  ) as ArrayBuffer;
  const placeholderBlob = new Blob([placeholderArrayBuffer], { type: "image/png" });
  return new NextResponse(placeholderBlob, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(PLACEHOLDER_PNG.length),
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
      "Content-Disposition": "inline; filename=cover-placeholder.png",
    },
  });
}

function imageResponse(imageBytes: Uint8Array, contentType: string, filename: string) {
  const imageArrayBuffer = imageBytes.buffer.slice(
    imageBytes.byteOffset,
    imageBytes.byteOffset + imageBytes.byteLength,
  ) as ArrayBuffer;
  const imageBlob = new Blob([imageArrayBuffer], { type: contentType });
  return new NextResponse(imageBlob, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(imageBytes.length),
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename=\"${filename}\"`,
    },
  });
}

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return placeholderResponse();
  }

  const profile = await getProfileByUserId(user.id);
  const role = profile?.role ?? "standard";
  const song = await getSongByIdForUser(id, user.id, role);

  if (!song) {
    return placeholderResponse();
  }

  if (!song.cover_path) {
    return placeholderResponse();
  }

  const downloadResult = await supabaseServiceClient.storage
    .from(MUSIC_BUCKET)
    .download(song.cover_path);

  if (downloadResult.error || !downloadResult.data) {
    try {
      await clearSongCover(song.id);
    } catch {
      // best effort cleanup only
    }
    return placeholderResponse();
  }

  const blob = downloadResult.data;

  const imageBuffer = Buffer.from(await blob.arrayBuffer());

  // Validate image bytes; if invalid, clear cover metadata so UI no longer flags this song as having cover art.
  const probeBuffer = imageBuffer.subarray(0, 16);
  const detectedMime = detectImageMimeType(probeBuffer);
  if (!detectedMime) {
    try {
      await clearSongCover(song.id);
    } catch {
      // best effort cleanup only
    }
    return placeholderResponse();
  }

  const contentType =
    (song.cover_mime_type && song.cover_mime_type.startsWith("image/"))
      ? song.cover_mime_type
      : detectedMime;

  return imageResponse(new Uint8Array(imageBuffer), contentType, `cover-${song.id}`);
}
