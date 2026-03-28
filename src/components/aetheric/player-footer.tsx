import type { RefObject } from "react";
import Image from "next/image";
import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";

import { NyxIconButton, NyxSlider } from "@/components/nyx-ui";
import type { SongRow } from "@/lib/db/types";

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
  repeatMode: "off" | "all" | "one";
};

export function PlayerFooter({
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
}: PlayerFooterProps) {
  return (
    <footer
      className={`fixed bottom-0 left-0 z-40 w-full rounded-t-[2.5rem] px-6 pb-8 pt-4 shadow-[0_-10px_40px_rgba(54,82,190,0.08)] backdrop-blur-2xl ${floatingSurface}`}
      style={floatingSurfaceColor ? { backgroundColor: floatingSurfaceColor } : undefined}
    >
      <div className="mb-4 flex items-center gap-4 px-4">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${textSecondary}`}>
          {formatTime(currentTime)}
        </span>
        <div className="relative flex-1">
          <NyxSlider
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
      <div className="flex items-center justify-between gap-6 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="hidden items-center gap-4 xl:flex">
            <div className="h-12 w-12 overflow-hidden rounded-xl shadow-[0_20px_40px_rgba(54,82,190,0.1)]">
              <Image
                src={currentSong?.cover_path ? `/api/cover/${currentSong.id}` : "/cd_p.svg"}
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
          <NyxIconButton
            type="button"
            aria-label="Shuffle"
            className={ghostButton}
            style={isShuffle ? { color: accentHex } : undefined}
            onClick={onToggleShuffle}
          >
            <Shuffle size={16} />
          </NyxIconButton>
          <NyxIconButton
            type="button"
            aria-label="Repeat"
            className={ghostButton}
            style={repeatMode !== "off" ? { color: accentHex } : undefined}
            onClick={onToggleRepeat}
          >
            {repeatMode === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </NyxIconButton>
        </div>

        <div className="flex flex-shrink-0 items-center justify-center gap-6">
          <NyxIconButton type="button" aria-label="Previous" className={ghostButton} onClick={onPrevious}>
            <SkipBack size={20} />
          </NyxIconButton>
          <button
            type="button"
            aria-label="Play"
            onClick={onTogglePlay}
            disabled={!canPlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3652be,#839aff)] text-white shadow-[0_18px_32px_rgba(54,82,190,0.26)] transition hover:scale-[1.04] disabled:opacity-60"
          >
            {isPlaying ? <Pause size={26} /> : <Play size={26} />}
          </button>
          <NyxIconButton type="button" aria-label="Next" className={ghostButton} onClick={onNext}>
            <SkipForward size={20} />
          </NyxIconButton>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          <div ref={volumeWrapRef} className="flex items-center gap-4">
            <NyxIconButton
              type="button"
              aria-label="Toggle volume"
              className={ghostButton}
              onClick={() => setIsVolumeOpen(!isVolumeOpen)}
            >
              <Volume2 size={18} />
            </NyxIconButton>
            <div
              className={
                "flex items-center gap-3 overflow-hidden transition-all duration-300 " +
                (isVolumeOpen ? "w-24 opacity-100" : "w-0 opacity-0")
              }
            >
              <NyxSlider
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
    </footer>
  );
}
