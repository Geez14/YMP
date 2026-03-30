import { memo } from "react";
import type { RefObject } from "react";
import Image from "next/image";
import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";

import { API_ROUTES } from "@/lib/routes";
import { UiIconButton, UiSlider } from "@/components/ui/ui-controls";
import type { SongRow } from "@/lib/db/types";
import type { RepeatMode } from "@/features/player/types/player-ui.types";

type PlayerFooterProps = {
  floatingSurface: string;
  textSecondary: string;
  ghostButton: string;
  accentHex: string;
  floatingSurfaceColor?: string;
  canPlay: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  currentSong: SongRow | null;
  isVolumeOpen: boolean;
  setIsVolumeOpen: (next: boolean) => void;
  onSeek: (value: number) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  isShuffle: boolean;
  onVolumeChange: (value: number) => void;
  formatTime: (value: number) => string;
  volumeWrapRef: RefObject<HTMLDivElement | null>;
  repeatMode: RepeatMode;
  playbackError: string | null;
};

function PlayerFooterComponent({
  floatingSurface,
  textSecondary,
  ghostButton,
  accentHex,
  floatingSurfaceColor,
  canPlay,
  isPlaying,
  duration,
  currentTime,
  volume,
  currentSong,
  isVolumeOpen,
  setIsVolumeOpen,
  onSeek,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  isShuffle,
  onVolumeChange,
  formatTime,
  volumeWrapRef,
  repeatMode,
  playbackError,
}: PlayerFooterProps) {
  return (
    <footer
      className={`fixed bottom-0 left-0 z-40 w-full rounded-t-[2.5rem] px-4 pb-6 pt-4 sm:px-6 sm:pb-8 shadow-[0_-10px_40px_rgba(54,82,190,0.08)] backdrop-blur-2xl ${floatingSurface}`}
      style={floatingSurfaceColor ? { backgroundColor: floatingSurfaceColor } : undefined}
    >
      <div className="mb-4 flex items-center gap-3 px-2 sm:gap-4 sm:px-4">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${textSecondary}`}>
          {formatTime(currentTime)}
        </span>
        <div className="relative flex-1">
          <UiSlider
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(event) => onSeek(Number(event.target.value))}
            aria-label="Seek"
          />
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${textSecondary}`}>
          {duration ? formatTime(duration) : "--:--"}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-4 xl:flex">
            <div className="h-12 w-12 overflow-hidden rounded-xl shadow-[0_20px_40px_rgba(54,82,190,0.1)]">
              <Image
                src={currentSong?.cover_path ? API_ROUTES.coverBySongId(currentSong.id) : "/cd_p.svg"}
                alt="Now playing"
                width={48}
                height={48}
                unoptimized={Boolean(currentSong?.cover_path)}
              />
            </div>
            <div className="min-w-0">
              <p className="max-w-[220px] truncate font-manrope text-sm font-semibold" title={currentSong?.title ?? "No track"}>
                {currentSong ? currentSong.title : "No track"}
              </p>
              <p className={`text-[10px] uppercase tracking-[0.2em] ${textSecondary}`}>
                {currentSong ? "Your library" : "Nothing playing"}
              </p>
            </div>
          </div>
          <UiIconButton
            type="button"
            aria-label="Shuffle"
            className={`${ghostButton} px-2.5 py-1.5 sm:px-3 sm:py-2`}
            style={isShuffle ? { color: accentHex } : undefined}
            onClick={onToggleShuffle}
          >
            <Shuffle size={14} />
          </UiIconButton>
          <UiIconButton
            type="button"
            aria-label="Repeat"
            className={`${ghostButton} px-2.5 py-1.5 sm:px-3 sm:py-2`}
            style={repeatMode !== "off" ? { color: accentHex } : undefined}
            onClick={onToggleRepeat}
          >
            {repeatMode === "one" ? <Repeat1 size={14} /> : <Repeat size={14} />}
          </UiIconButton>
        </div>

        <div className="flex flex-shrink-0 items-center justify-center gap-2 sm:gap-6">
          <UiIconButton
            type="button"
            aria-label="Previous"
            className={`${ghostButton} px-2.5 py-1.5 sm:px-3 sm:py-2`}
            onClick={onPrevious}
          >
            <SkipBack size={16} />
          </UiIconButton>
          <button
            type="button"
            aria-label="Play"
            onClick={onTogglePlay}
            disabled={!canPlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3652be,#839aff)] text-white shadow-[0_18px_32px_rgba(54,82,190,0.26)] transition hover:scale-[1.04] disabled:opacity-60 sm:h-16 sm:w-16"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <UiIconButton
            type="button"
            aria-label="Next"
            className={`${ghostButton} px-2.5 py-1.5 sm:px-3 sm:py-2`}
            onClick={onNext}
          >
            <SkipForward size={16} />
          </UiIconButton>
        </div>

        <div className="flex min-w-0 items-center justify-end">
          <div ref={volumeWrapRef} className="relative flex items-center">
            <UiIconButton
              type="button"
              aria-label="Toggle volume"
              className={`${ghostButton} px-2.5 py-1.5 sm:px-3 sm:py-2`}
              onClick={() => setIsVolumeOpen(!isVolumeOpen)}
            >
              <Volume2 size={16} />
            </UiIconButton>
            <div
              className={
                "absolute bottom-full right-0 mb-2 overflow-hidden rounded-xl border shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition-all duration-200 " +
                (isVolumeOpen ? "h-28 w-10 border p-2 opacity-100 sm:h-auto sm:w-28" : "pointer-events-none h-0 w-0 border-transparent p-0 opacity-0")
              }
              style={floatingSurfaceColor ? { backgroundColor: floatingSurfaceColor } : undefined}
            >
              <div className="flex h-full w-full items-center justify-center sm:hidden">
                <UiSlider
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => onVolumeChange(Number(event.target.value))}
                  aria-label="Volume"
                  className="w-24 -rotate-90"
                />
              </div>
              <div className="hidden sm:block">
                <UiSlider
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => onVolumeChange(Number(event.target.value))}
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {playbackError ? (
        <p className="mt-2 px-2 text-xs text-[#c43d3d] sm:px-4" role="status">
          {playbackError}
        </p>
      ) : null}
    </footer>
  );
}

export const PlayerFooter = memo(PlayerFooterComponent);
