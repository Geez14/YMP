import { NextResponse } from "next/server";

import { getProfileByUserId, getSongByIdForUser } from "@/lib/db/queries";
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
  return new NextResponse(PLACEHOLDER_PNG, {
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfileByUserId(user.id);
  const role = profile?.role ?? "standard";
  const song = await getSongByIdForUser(id, user.id, role);

  if (!song) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!song.cover_path) {
    return placeholderResponse();
  }

  const downloadResult = await supabaseServiceClient.storage
    .from(MUSIC_BUCKET)
    .download(song.cover_path);

  if (downloadResult.error || !downloadResult.data) {
    return placeholderResponse();
  }

  const blob = downloadResult.data;

  // Probe a few bytes to ensure the stored object is actually an image; fall back to a safe placeholder if not.
  const probeBuffer = Buffer.from(await blob.slice(0, 16).arrayBuffer());
  const detectedMime = detectImageMimeType(probeBuffer);
  if (!detectedMime) {
    return placeholderResponse();
  }

  const contentType =
    (song.cover_mime_type && song.cover_mime_type.startsWith("image/"))
      ? song.cover_mime_type
      : detectedMime;

  return new NextResponse(blob.stream(), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(blob.size),
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="cover-${song.id}"`,
    },
  });
}
