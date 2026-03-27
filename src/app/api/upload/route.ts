import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  getProfileByUserId,
  getSongCountByUserId,
  insertSong,
  listSongsForUser,
} from "@/lib/db/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const role = profile?.role ?? "standard";
  const songCount = await getSongCountByUserId(user.id);

  if (role === "standard" && songCount >= 10) {
    return NextResponse.json(
      {
        error:
          "Upload limit reached. Standard users can upload up to 10 songs.",
      },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const title = String(formData.get("title") || "Untitled").slice(0, 200);
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const fileExtension = getSafeExtension(file.type, file.name);
  const objectPath = `${user.id}/${randomUUID()}.${fileExtension}`;

  const arrayBuffer = await file.arrayBuffer();
  const uploadResult = await supabaseServiceClient.storage
    .from("music")
    .upload(objectPath, arrayBuffer, {
      contentType: file.type || "audio/mpeg",
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
      mimeType: file.type || "audio/mpeg",
    });

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    await supabaseServiceClient.storage.from("music").remove([objectPath]);

    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
