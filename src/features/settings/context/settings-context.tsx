"use client";

import { createContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  DashboardAllTracksView,
  DashboardCustomPalette,
  RepeatMode,
  ThemeMode,
} from "@/features/settings/types/settings-ui.types";

export type SettingsContextValue = {
  volume: number;
  setVolume: Dispatch<SetStateAction<number>>;
  isShuffle: boolean;
  setIsShuffle: Dispatch<SetStateAction<boolean>>;
  repeatMode: RepeatMode;
  setRepeatMode: Dispatch<SetStateAction<RepeatMode>>;
  theme: ThemeMode;
  setTheme: Dispatch<SetStateAction<ThemeMode>>;
  customPalette: DashboardCustomPalette;
  setCustomPalette: Dispatch<SetStateAction<DashboardCustomPalette>>;
  isAutoplay: boolean;
  setIsAutoplay: Dispatch<SetStateAction<boolean>>;
  allTracksView: DashboardAllTracksView;
  setAllTracksView: Dispatch<SetStateAction<DashboardAllTracksView>>;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);
