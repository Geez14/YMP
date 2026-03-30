import type { SongRow, UserRole } from "@/lib/db/types";

export type DashboardWorkspaceProps = {
  initialSongs: SongRow[];
  role: UserRole;
  uploadLimit: number | null;
};

export type DashboardWorkspaceClientProps = {
  initialDataPromise: Promise<DashboardWorkspaceProps>;
};
