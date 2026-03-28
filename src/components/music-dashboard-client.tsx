"use client";

import { MusicDashboard } from "./music-dashboard";
import type { SongRow, UserRole } from "@/lib/db/types";

type MusicDashboardClientProps = {
  initialSongs: SongRow[];
  role: UserRole;
  uploadLimit: number | null;
};

export default function MusicDashboardClient({ initialSongs, role, uploadLimit }: MusicDashboardClientProps) {
  return <MusicDashboard initialSongs={initialSongs} role={role} uploadLimit={uploadLimit} />;
}
