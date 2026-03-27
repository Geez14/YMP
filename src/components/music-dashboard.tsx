"use client";

import { useMemo, useState } from "react";

import { AudioPlayerBar } from "@/components/audio-player-bar";
import { UploadForm } from "@/components/upload-form";
import type { SongRow, UserRole } from "@/lib/db/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import styles from "./music-dashboard.module.css";

type MusicDashboardProps = {
  initialSongs: SongRow[];
  role: UserRole;
};

export function MusicDashboard({ initialSongs, role }: MusicDashboardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [songs, setSongs] = useState(initialSongs);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(
    initialSongs[0]?.id ?? null,
  );

  const songLimitText = useMemo(() => {
    if (role === "admin") {
      return "Admin account: unlimited uploads";
    }

    return `Standard account: ${songs.length}/10 uploads used`;
  }, [role, songs.length]);

  async function refreshSongs() {
    const response = await fetch("/api/upload", { method: "GET" });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { songs: SongRow[] };
    setSongs(payload.songs);
    if (!selectedSongId && payload.songs.length > 0) {
      setSelectedSongId(payload.songs[0].id);
    }
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 style={{ fontSize: "clamp(1.3rem, 2.5vw, 2rem)" }}>Music Dashboard</h1>
          <p style={{ opacity: 0.85 }}>{songLimitText}</p>
        </div>
        <button
          className={styles.signOut}
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.assign("/login");
          }}
        >
          Sign out
        </button>
      </header>

      <main className={styles.main}>
        <UploadForm onUploaded={refreshSongs} />

        <section className={styles.trackPanel}>
          <div className={styles.trackHeader}>
            <strong>Tracks</strong>
            <span>{songs.length}</span>
          </div>

          <ul className={styles.trackList}>
            {songs.map((song) => {
              const active = song.id === selectedSongId;

              return (
                <li key={song.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedSongId(song.id)}
                    className={active ? styles.trackButtonActive : styles.trackButton}
                  >
                    <strong>{song.title}</strong>
                    <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                      {(song.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </button>
                </li>
              );
            })}
            {songs.length === 0 ? (
              <li className={styles.empty}>No songs uploaded yet.</li>
            ) : null}
          </ul>
        </section>
      </main>

      <AudioPlayerBar
        queue={songs}
        currentSongId={selectedSongId}
        onEnded={() => {
          if (!selectedSongId) {
            return;
          }

          const index = songs.findIndex((song) => song.id === selectedSongId);
          const next = songs[index + 1];
          if (next) {
            setSelectedSongId(next.id);
          }
        }}
      />
    </div>
  );
}
