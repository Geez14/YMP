export type DashboardTab = "playing" | "all-tracks" | "upload";

export type RepeatMode = "off" | "all" | "one";

export type ThemeMode = "light" | "dark" | "custom";

export type DashboardAllTracksView = "grid" | "list";

export type DashboardCustomPalette = {
  primary: string;
  text: string;
  textSecondary: string;
  surface: string;
  background: string;
  success: string;
  danger: string;
  overlay: string;
};

export type PlayerSettings = {
  volume: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  theme: ThemeMode;
  currentIndex: number;
  customPalette: DashboardCustomPalette;
  allTracksView: DashboardAllTracksView;
  lastSongId: string | null;
};
