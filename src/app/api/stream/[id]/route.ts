import { NextResponse } from "next/server";

import { getProfileByUserId, getSongByIdForUser } from "@/lib/db/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const downloadResult = await supabaseServiceClient.storage
    .from("music")
    .download(song.file_path);

  if (downloadResult.error || !downloadResult.data) {
    return NextResponse.json({ error: "Unable to stream file" }, { status: 500 });
  }

  const blob = downloadResult.data;

  return new NextResponse(blob.stream(), {
    status: 200,
    headers: {
      "Content-Type": song.mime_type || blob.type || "audio/mpeg",
      "Content-Length": String(blob.size),
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename=\"${song.title}\"`,
    },
  });
}
