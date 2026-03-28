import { createHash, randomUUID } from "node:crypto";
import { parseBuffer } from "music-metadata";

import { NextResponse } from "next/server";

import {
  clearSongRetention,
  countSongAccess,
  deleteSongById,
  ensureSongAccess,
  findSongByContentHash,
  getAllowedUploadMimeTypes,
  getProfileByUserId,
  getSongCountByUserId,
  getSongByIdForUser,
  insertSong,
  listSongsForUser,
  markSongRemovable,
  removeAllSongAccess,
  removeSongAccess,
} from "@/lib/db/queries";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MUSIC_BUCKET = process.env.NEXT_PUBLIC_MUSIC_BUCKET || "music";

function getSafeExtension(mimeType: string, originalName: string): string {
  if (mimeType === "audio/mpeg") {
    return "mp3";
  }

  const ext = originalName.split(".").pop()?.toLowerCase();
  if (!ext || ext.length > 6) {
    return "bin";
  }

  return ext;
}

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

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfileByUserId(user.id);
  const role = profile?.role ?? "standard";
  const songs = await listSongsForUser(user.id, role);

  return NextResponse.json({ songs });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfileByUserId(user.id);
  const songCount = await getSongCountByUserId(user.id);

  const effectiveLimit = profile?.upload_limit ?? null;

  if (effectiveLimit !== null && songCount >= effectiveLimit) {
    return NextResponse.json(
      { error: `Upload limit reached. You may upload up to ${effectiveLimit} songs.` },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const title = String(formData.get("title") || "Untitled").slice(0, 200);
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const allowedMimeTypes = await getAllowedUploadMimeTypes();
  const effectiveMimeType = file.type || "audio/mpeg";

  if (!allowedMimeTypes.includes(effectiveMimeType)) {
    return NextResponse.json(
      {
        error: `Unsupported file type: ${effectiveMimeType}. Allowed types: ${allowedMimeTypes.join(", ")}.`,
      },
      { status: 415 },
    );
  }

  const fileExtension = getSafeExtension(effectiveMimeType, file.name);

  const buffer = Buffer.from(await file.arrayBuffer());

  let coverPath: string | null = null;
  let coverMimeType: string | null = null;
  try {
    const metadata = await parseBuffer(buffer, effectiveMimeType, { duration: false, skipCovers: false });
    const cover = metadata.common.picture?.[0];
    if (cover?.data && cover.data.length > 0) {
      const coverBuffer = Buffer.isBuffer(cover.data) ? cover.data : Buffer.from(cover.data);
      const detectedCoverMime = detectImageMimeType(coverBuffer);

      if (detectedCoverMime) {
        coverMimeType = detectedCoverMime;
        const coverExt = coverMimeType.split("/")[1] || "jpg";
        coverPath = `${user.id}/${randomUUID()}-cover.${coverExt}`;
        const { error: coverErr } = await supabaseServiceClient.storage
          .from(MUSIC_BUCKET)
          .upload(coverPath, coverBuffer, {
            contentType: coverMimeType,
            upsert: false,
          });
        if (coverErr) {
          coverPath = null;
          coverMimeType = null;
        }
      }
    }
  } catch {
    coverPath = null;
    coverMimeType = null;
  }

  let contentHash: string;
  try {
    contentHash = createHash(env.SONG_HASH_ALGORITHM).update(buffer).digest("hex");
  } catch {
    return NextResponse.json(
      { error: `Invalid SONG_HASH_ALGORITHM configuration: ${env.SONG_HASH_ALGORITHM}` },
      { status: 500 },
    );
  }

  const existingSong = await findSongByContentHash(contentHash);
  if (existingSong) {
    await ensureSongAccess(user.id, existingSong.id);
    await clearSongRetention(existingSong.id);
    return NextResponse.json({ song: existingSong, deduplicated: true }, { status: 200 });
  }

  const objectPath = `${user.id}/${randomUUID()}.${fileExtension}`;

  // Ensure bucket exists (service role key required)
  try {
    const { data: bucket } = await supabaseServiceClient.storage.getBucket(MUSIC_BUCKET);
    if (!bucket) {
      // Attempt to create bucket if it does not exist
      const { error: createErr } = await supabaseServiceClient.storage.createBucket(MUSIC_BUCKET, { public: false });
      if (createErr) {
        return NextResponse.json({ error: `Storage bucket missing and creation failed: ${createErr.message}` }, { status: 500 });
      }
    }
  } catch (err) {
    return NextResponse.json({ error: `Storage check failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  // Convert to Node Buffer for reliable uploads in server runtime
  const uploadResult = await supabaseServiceClient.storage.from(MUSIC_BUCKET).upload(objectPath, buffer, {
    contentType: effectiveMimeType,
    upsert: false,
  });

  if (uploadResult.error) {
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadResult.error.message}` },
      { status: 500 },
    );
  }

  try {
    const song = await insertSong({
      userId: user.id,
      title,
      filePath: objectPath,
      fileSizeBytes: file.size,
      mimeType: effectiveMimeType,
      contentHash,
      coverPath,
      coverMimeType,
    });

    try {
      await ensureSongAccess(user.id, song.id);
      await clearSongRetention(song.id);
    } catch (accessError) {
      await deleteSongById(song.id);
      await supabaseServiceClient.storage.from(MUSIC_BUCKET).remove([objectPath]);
      const accessMessage = accessError instanceof Error ? accessError.message : "Failed to grant song access";
      return NextResponse.json({ error: accessMessage }, { status: 500 });
    }

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";

    if (message.includes("songs_content_hash_key") || message.includes("content_hash")) {
      const song = await findSongByContentHash(contentHash);
      if (song) {
        await ensureSongAccess(user.id, song.id);
        await clearSongRetention(song.id);
        await supabaseServiceClient.storage.from("music").remove([objectPath]);
        return NextResponse.json({ song, deduplicated: true }, { status: 200 });
      }
    }

    await supabaseServiceClient.storage.from(MUSIC_BUCKET).remove([objectPath]);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const songId = searchParams.get("id");

  if (!songId) {
    return NextResponse.json({ error: "Song id is required." }, { status: 400 });
  }

  const profile = await getProfileByUserId(user.id);
  const role = profile?.role ?? "standard";
  const song = await getSongByIdForUser(songId, user.id, role);

  if (!song) {
    return NextResponse.json({ error: "Song not found." }, { status: 404 });
  }

  const isOwner = song.user_id === user.id;

  if (isOwner) {
    await removeAllSongAccess(song.id);
    await markSongRemovable(song.id);
    return NextResponse.json({ success: true, scheduledForCleanup: true, removedForAll: true });
  }

  await removeSongAccess(user.id, song.id);

  const remainingAccess = await countSongAccess(song.id);
  return NextResponse.json({ success: true, remainingAccess });
}
