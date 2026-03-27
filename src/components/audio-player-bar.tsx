"use client";

import { useEffect, useRef, useState } from "react";

import type { SongRow } from "@/lib/db/types";

type AudioPlayerBarProps = {
  queue: SongRow[];
  currentSongId: string | null;
  onEnded?: () => void;
};

export function AudioPlayerBar({ queue, currentSongId, onEnded }: AudioPlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentSong = queue.find((song) => song.id === currentSongId) ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!currentSong) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.src = `/api/stream/${currentSong.id}`;
    void audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false),
    );
  }, [currentSong]);

  return (
    <footer
      style={{
        position: "sticky",
        bottom: 0,
        borderTop: "1px solid var(--border)",
        background: "rgba(255, 253, 247, 0.96)",
        backdropFilter: "blur(8px)",
        display: "flex",
        gap: "1rem",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem 1rem",
      }}
    >
      <div>
        <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>Now Playing</p>
        <strong>{currentSong ? currentSong.title : "Nothing selected"}</strong>
      </div>

      <button
        type="button"
        onClick={() => {
          const audio = audioRef.current;
          if (!audio || !currentSong) {
            return;
          }

          if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            return;
          }

          void audio.play().then(() => setIsPlaying(true));
        }}
        disabled={!currentSong}
        style={{
          border: "none",
          borderRadius: "999px",
          background: "var(--accent)",
          color: "white",
          padding: "0.6rem 1rem",
          cursor: "pointer",
        }}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      <audio ref={audioRef} onEnded={onEnded} preload="metadata" />
    </footer>
  );
}
