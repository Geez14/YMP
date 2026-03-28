import Image from "next/image";
import { Heart, PlusCircle, Share2 } from "lucide-react";

import type { SongRow } from "@/lib/db/types";

type NowPlayingPanelProps = {
  song: SongRow | null;
  textSecondary: string;
  textPrimary: string;
  accentText: string;
  hoverSurface: string;
};

export function NowPlayingPanel({ song, textSecondary, textPrimary, accentText, hoverSurface }: NowPlayingPanelProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-5 text-center lg:gap-7">
        <div className="relative w-full max-w-[320px] sm:max-w-[380px]">
          <div className="absolute -inset-2.5 rounded-full bg-[#3652be]/16 blur-lg" />
          <div className="relative aspect-square overflow-hidden rounded-[26px] shadow-[0_22px_48px_rgba(54,82,190,0.14)]">
            <Image
              src={song?.cover_path ? `/api/cover/${song.id}` : "/cd_np.svg"}
              alt="Album art"
              width={380}
              height={380}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="grid w-full max-w-[680px] gap-3" style={{ color: textPrimary }}>
          <p className={`text-xs uppercase tracking-[0.3em] ${textSecondary} text-slate-100`}>Now Playing</p>
          <div className="relative overflow-hidden">
            <div className="marquee-track" aria-live="polite">
              <span className="marquee-text">{song ? song.title : "Select a track"}</span>
              <span className="marquee-text" aria-hidden>
                {song ? song.title : "Select a track"}
              </span>
            </div>
          </div>
          {song ? null : <p className={`text-sm text-slate-100`} style={{ marginBottom: "0.15rem" }}></p>}
          <div className="flex items-center justify-center gap-4">
            <button type="button" className={`rounded-xl p-2.5 transition ${hoverSurface}`}>
              <Heart size={20} className={accentText} />
            </button>
            <button type="button" className={`rounded-xl p-2.5 transition ${hoverSurface}`}>
              <PlusCircle size={20} className={textSecondary} />
            </button>
            <button type="button" className={`rounded-xl p-2.5 transition ${hoverSurface}`}>
              <Share2 size={20} className={textSecondary} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Keep album/title stacked cleanly; text truncates to avoid overlap. */
        .marquee-track {
          display: inline-flex;
          gap: 2rem;
          width: max-content;
          animation: marquee 12s linear infinite;
          will-change: transform;
        }
        .marquee-text {
          font-family: "Manrope", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-size: clamp(1.7rem, 2.8vw, 2.6rem);
          font-weight: 600;
          white-space: nowrap;
          color: inherit;
        }
        .marquee-track {
          mask-image: linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%);
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}
