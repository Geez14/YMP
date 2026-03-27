import { redirect } from "next/navigation";

import { MusicDashboard } from "@/components/music-dashboard";
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
  const songs = await listSongsForUser(user.id, role);

  return <MusicDashboard initialSongs={songs} role={role} />;
}
