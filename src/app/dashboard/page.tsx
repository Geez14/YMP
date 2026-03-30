import { redirect } from "next/navigation";

import { APP_ROUTES, buildLoginRedirect } from "@/lib/routes";
import DashboardWorkspaceClient from "@/features/dashboard/workspace/dashboard-workspace-client";
import { getProfileByUserId, listSongsForUser } from "@/lib/db/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardWorkspaceProps } from "@/features/dashboard/workspace/dashboard-workspace.types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect(APP_ROUTES.DASHBOARD));
  }

  const initialDataPromise: Promise<DashboardWorkspaceProps> = (async () => {
    const profile = await getProfileByUserId(user.id);
    const role = profile?.role ?? "standard";
    const uploadLimit = profile?.upload_limit ?? null;
    const songs = await listSongsForUser(user.id, role);

    return {
      initialSongs: songs,
      role,
      uploadLimit,
    };
  })();

  return <DashboardWorkspaceClient initialDataPromise={initialDataPromise} />;
}
