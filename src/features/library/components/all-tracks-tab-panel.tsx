import { memo, useState } from "react";
import { LayoutGrid, List, MoreVertical, Search, Trash2 } from "lucide-react";

import { API_ROUTES } from "@/lib/routes";
import { PlaybackWaveformIndicator } from "@/features/player/components/playback-waveform-indicator";
import { TrackCoverImage } from "@/features/library/components/track-cover-image";
import type { SongRow } from "@/lib/db/types";
import type { DashboardAllTracksView } from "@/features/settings/types/settings-ui.types";

type AllTracksTabPanelProps = {
  songs: SongRow[];
  filteredSongs: SongRow[];
  selectedSongId: string | null;
  allTracksView: DashboardAllTracksView;
  textSecondary: string;
  hoverSurface: string;
  searchSurface: string;
  menuSurface: string;
  menuHover: string;
  trackBase: string;
  shadowSoft: string;
  accentHex: string;
  searchIconColor: string;
  iconMutedColor: string;
  menuBorderColor: string;
  dangerTextColor: string;
  dangerSurfaceColor: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchEnter: () => void;
  onViewChange: (view: DashboardAllTracksView) => void;
  onSelectSong: (songId: string) => void;
  onDeleteSong: (songId: string) => void;
};

function AllTracksTabPanelComponent({
  songs,
  filteredSongs,
  selectedSongId,
  allTracksView,
  textSecondary,
  hoverSurface,
  searchSurface,
  menuSurface,
  menuHover,
  trackBase,
  shadowSoft,
  accentHex,
  searchIconColor,
  iconMutedColor,
  menuBorderColor,
  dangerTextColor,
  dangerSurfaceColor,
  searchQuery,
  onSearchChange,
  onSearchEnter,
  onViewChange,
  onSelectSong,
  onDeleteSong,
}: AllTracksTabPanelProps) {
  const [openActionMenuSongId, setOpenActionMenuSongId] = useState<string | null>(null);

  function toggleSongMenu(songId: string) {
    setOpenActionMenuSongId((current) => (current === songId ? null : songId));
  }

  function handleDeleteSong(songId: string) {
    setOpenActionMenuSongId(null);
    onDeleteSong(songId);
  }

  return (
    <div className="px-6 pb-32 pt-28 md:px-12 md:pt-32">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm ${textSecondary}`}>Your library</p>
          <h1 className="font-manrope text-[clamp(1.8rem,3vw,2.6rem)] font-semibold">All Tracks</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${hoverSurface}`}
            style={allTracksView === "grid" ? { boxShadow: shadowSoft, color: accentHex, borderColor: `${accentHex}33` } : undefined}
            onClick={() => onViewChange("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${hoverSurface}`}
            style={allTracksView === "list" ? { boxShadow: shadowSoft, color: accentHex, borderColor: `${accentHex}33` } : undefined}
            onClick={() => onViewChange("list")}
            aria-label="List view"
          >
            <List size={16} />
          </button>
          <span className={`ml-2 text-sm ${textSecondary}`}>{filteredSongs.length} tracks</span>
        </div>
      </div>

      <div className="mb-6 w-full max-w-md">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: searchIconColor }}
          />
          <input
            type="search"
            placeholder="Search your library"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSearchEnter();
              }
            }}
            className={`w-full rounded-full py-2 pl-10 pr-4 text-sm outline-none transition ${searchSurface}`}
          />
        </div>
      </div>

      {songs.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-6 text-sm ${textSecondary}`}>No tracks yet</div>
      ) : allTracksView === "grid" ? (
        <div className="scroll-hide grid max-h-[calc(100vh-320px)] grid-cols-1 gap-4 overflow-y-auto pr-1 pb-24 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredSongs.map((song) => {
            const cover = song.cover_path ? API_ROUTES.coverBySongId(song.id) : null;
            const isActive = song.id === selectedSongId;

            return (
              <div key={song.id} className={`group relative rounded-2xl border border-transparent p-3 text-left transition ${trackBase} ${hoverSurface}`} style={isActive ? { boxShadow: shadowSoft, color: accentHex, borderColor: `${accentHex}55` } : undefined}>
                <button type="button" className="flex w-full flex-col gap-3 text-left" onClick={() => onSelectSong(song.id)}>
                  <div className="relative overflow-hidden rounded-xl" style={{ boxShadow: shadowSoft }}>
                    <div className="relative aspect-square w-full">
                      <TrackCoverImage src={cover} alt={song.title} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold" title={song.title}>
                      {song.title}
                    </p>
                    <p className={`text-xs ${textSecondary}`}>Tap to play</p>
                  </div>
                </button>
                <div className="absolute right-3 top-3">
                  <button
                    type="button"
                    aria-label="Track actions"
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${menuHover}`}
                    style={{ color: iconMutedColor }}
                    onClick={() => toggleSongMenu(song.id)}
                  >
                    <MoreVertical size={14} />
                  </button>
                  {openActionMenuSongId === song.id ? (
                    <div
                      className={`absolute right-0 top-9 z-20 min-w-[120px] rounded-lg border p-1 ${menuSurface}`}
                      style={{ boxShadow: shadowSoft, borderColor: menuBorderColor }}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs"
                        style={{ color: dangerTextColor, backgroundColor: dangerSurfaceColor }}
                        onClick={() => handleDeleteSong(song.id)}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="scroll-hide flex max-h-[calc(100vh-320px)] flex-col gap-3 overflow-y-auto pr-1 pb-24">
          {filteredSongs.map((song) => {
            const cover = song.cover_path ? API_ROUTES.coverBySongId(song.id) : null;
            const isActive = song.id === selectedSongId;

            return (
              <div key={song.id} className={`group rounded-2xl border border-transparent px-3 py-2 transition ${trackBase} ${hoverSurface}`} style={isActive ? { boxShadow: shadowSoft, color: accentHex, borderColor: `${accentHex}55` } : undefined}>
                <div className="flex items-center gap-4">
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-4 text-left" onClick={() => onSelectSong(song.id)}>
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl" style={{ boxShadow: shadowSoft }}>
                      <TrackCoverImage src={cover} alt={song.title} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold" title={song.title}>
                        {song.title}
                      </p>
                      <p className={`truncate text-xs ${textSecondary}`}>Tap to play</p>
                    </div>
                    <div className="flex h-5 w-5 items-center justify-center" aria-label={isActive ? "Now playing" : undefined}>
                      {isActive ? <PlaybackWaveformIndicator color={accentHex} /> : null}
                    </div>
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Track actions"
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${menuHover}`}
                      style={{ color: iconMutedColor }}
                      onClick={() => toggleSongMenu(song.id)}
                    >
                      <MoreVertical size={14} />
                    </button>
                    {openActionMenuSongId === song.id ? (
                      <div
                        className={`absolute right-0 top-9 z-20 min-w-[120px] rounded-lg border p-1 ${menuSurface}`}
                        style={{ boxShadow: shadowSoft, borderColor: menuBorderColor }}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs"
                          style={{ color: dangerTextColor, backgroundColor: dangerSurfaceColor }}
                          onClick={() => handleDeleteSong(song.id)}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const AllTracksTabPanel = memo(AllTracksTabPanelComponent);
