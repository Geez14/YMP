import { redirect } from "next/navigation";

import MusicDashboardClient from "@/components/music-dashboard-client";
import { getProfileByUserId, listSongsForUser } from "@/lib/db/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const profile = await getProfileByUserId(user.id);
  const role = profile?.role ?? "standard";
  const uploadLimit = profile?.upload_limit ?? null;
  const songs = await listSongsForUser(user.id, role);

  return <MusicDashboardClient initialSongs={songs} role={role} uploadLimit={uploadLimit} />;
}
