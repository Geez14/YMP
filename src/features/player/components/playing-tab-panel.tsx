import { memo } from "react";
import type { SongRow } from "@/lib/db/types";
import { NowPlayingPanel } from "@/features/player/components/now-playing-panel";
import { DashboardPageShell } from "@/features/dashboard/layout/components/dashboard-page-shell";

type PlayingTabPanelProps = {
  song: SongRow | null;
  textSecondary: string;
  textPrimary: string;
  accentText: string;
  hoverSurface: string;
  contentSurface: string;
  contentSurfaceColor: string;
};

function PlayingTabPanelComponent({
  song,
  textSecondary,
  textPrimary,
  accentText,
  hoverSurface,
  contentSurface,
  contentSurfaceColor,
}: PlayingTabPanelProps) {
  return (
    <DashboardPageShell
      textSecondary={textSecondary}
      contentSurface={contentSurface}
      contentSurfaceColor={contentSurfaceColor}
    >
      <NowPlayingPanel
        song={song}
        textSecondary={textSecondary}
        textPrimary={textPrimary}
        accentText={accentText}
        hoverSurface={hoverSurface}
      />
    </DashboardPageShell>
  );
}

export const PlayingTabPanel = memo(PlayingTabPanelComponent);
