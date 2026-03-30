"use client";

import { useEffect, useMemo, useState } from "react";

import type { SongRow } from "@/lib/db/types";
import type {
  DashboardAllTracksView,
  DashboardCustomPalette,
  PlayerSettings,
  RepeatMode,
  ThemeMode,
} from "@/features/settings/types/settings-ui.types";
import {
  DEFAULT_CUSTOM_PALETTE,
  loadSettings,
  persistSettings,
} from "@/features/settings/lib/settings-storage";

type UseSettingsArgs = {
  songs: SongRow[];
  selectedSongId: string | null;
};

export function useSettings({ songs, selectedSongId }: UseSettingsArgs) {
  const [volume, setVolume] = useState(1.0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [customPalette, setCustomPalette] = useState<DashboardCustomPalette>({ ...DEFAULT_CUSTOM_PALETTE });
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [allTracksView, setAllTracksView] = useState<DashboardAllTracksView>("grid");
  const [restoredSongId, setRestoredSongId] = useState<string | null>(null);
  const [restoredCurrentIndex, setRestoredCurrentIndex] = useState(0);
  const [hasRestored, setHasRestored] = useState(false);

  useEffect(() => {
    if (hasRestored) {
      return;
    }

    const settings = loadSettings();
    setVolume(settings.volume);
    setIsShuffle(settings.shuffle);
    setRepeatMode(settings.repeatMode);
    setTheme(settings.theme);
    setCustomPalette(settings.customPalette);
    setAllTracksView(settings.allTracksView);
    setRestoredSongId(settings.lastSongId);
    setRestoredCurrentIndex(settings.currentIndex);
    setHasRestored(true);
  }, [hasRestored]);

  useEffect(() => {
    if (!hasRestored) {
      return;
    }

    const currentIndex = selectedSongId ? songs.findIndex((song) => song.id === selectedSongId) : -1;

    const timer = window.setTimeout(() => {
      const nextSettings: PlayerSettings = {
        volume,
        shuffle: isShuffle,
        repeatMode,
        theme,
        currentIndex: Math.max(currentIndex, 0),
        lastSongId: selectedSongId,
        customPalette,
        allTracksView,
      };
      persistSettings(nextSettings);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [
    volume,
    isShuffle,
    repeatMode,
    theme,
    customPalette,
    allTracksView,
    selectedSongId,
    songs,
    hasRestored,
  ]);

  return useMemo(
    () => ({
      volume,
      setVolume,
      isShuffle,
      setIsShuffle,
      repeatMode,
      setRepeatMode,
      theme,
      setTheme,
      customPalette,
      setCustomPalette,
      isAutoplay,
      setIsAutoplay,
      allTracksView,
      setAllTracksView,
      restoredSongId,
      restoredCurrentIndex,
      hasRestored,
    }),
    [
      volume,
      isShuffle,
      repeatMode,
      theme,
      customPalette,
      isAutoplay,
      allTracksView,
      restoredSongId,
      restoredCurrentIndex,
      hasRestored,
    ],
  );
}
