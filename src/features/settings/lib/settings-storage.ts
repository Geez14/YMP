import type {
  DashboardAllTracksView,
  DashboardCustomPalette,
  PlayerSettings,
  RepeatMode,
  ThemeMode,
} from "@/features/settings/types/settings-ui.types";

export const SETTINGS_KEY = "ymp:player-settings";

export const DEFAULT_CUSTOM_PALETTE: DashboardCustomPalette = {
  primary: "#3652be",
  text: "#2c2f33",
  textSecondary: "#4a5165",
  surface: "#eef1f6",
  background: "#f4f6fb",
  success: "#2bbd66",
  danger: "#c43d3d",
  overlay: "#000000",
};

const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  volume: 0.8,
  shuffle: false,
  repeatMode: "off",
  theme: "light",
  currentIndex: 0,
  customPalette: DEFAULT_CUSTOM_PALETTE,
  allTracksView: "grid",
  lastSongId: null,
};

function normalizeRepeatMode(next: unknown): RepeatMode {
  return next === "all" || next === "one" ? next : "off";
}

function normalizeThemeMode(next: unknown): ThemeMode {
  return next === "dark" || next === "custom" ? next : "light";
}

function normalizeAllTracksView(next: unknown): DashboardAllTracksView {
  return next === "list" ? "list" : "grid";
}

function normalizeHexColor(next: unknown, fallback: string): string {
  if (typeof next !== "string") {
    return fallback;
  }

  const trimmed = next.trim();
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(trimmed);
  if (!match) {
    return fallback;
  }

  if (match[1].length === 3) {
    const expanded = match[1]
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }

  return trimmed.toLowerCase();
}

function normalizeCustomPalette(next: unknown): DashboardCustomPalette {
  if (!next || typeof next !== "object") {
    return { ...DEFAULT_CUSTOM_PALETTE };
  }

  const palette = next as Partial<DashboardCustomPalette>;
  return {
    primary: normalizeHexColor(palette.primary, DEFAULT_CUSTOM_PALETTE.primary),
    text: normalizeHexColor(palette.text, DEFAULT_CUSTOM_PALETTE.text),
    textSecondary: normalizeHexColor(palette.textSecondary, DEFAULT_CUSTOM_PALETTE.textSecondary),
    surface: normalizeHexColor(palette.surface, DEFAULT_CUSTOM_PALETTE.surface),
    background: normalizeHexColor(palette.background, DEFAULT_CUSTOM_PALETTE.background),
    success: normalizeHexColor(palette.success, DEFAULT_CUSTOM_PALETTE.success),
    danger: normalizeHexColor(palette.danger, DEFAULT_CUSTOM_PALETTE.danger),
    overlay: normalizeHexColor(palette.overlay, DEFAULT_CUSTOM_PALETTE.overlay),
  };
}

export function createDefaultPlayerSettings(): PlayerSettings {
  return {
    ...DEFAULT_PLAYER_SETTINGS,
    customPalette: { ...DEFAULT_CUSTOM_PALETTE },
  };
}

export function loadSettings(): PlayerSettings {
  if (typeof window === "undefined") {
    return createDefaultPlayerSettings();
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return createDefaultPlayerSettings();
    }

    const parsed = JSON.parse(raw) as Partial<PlayerSettings>;
    return {
      volume: typeof parsed.volume === "number" ? parsed.volume : DEFAULT_PLAYER_SETTINGS.volume,
      shuffle: typeof parsed.shuffle === "boolean" ? parsed.shuffle : DEFAULT_PLAYER_SETTINGS.shuffle,
      repeatMode: normalizeRepeatMode(parsed.repeatMode),
      theme: normalizeThemeMode(parsed.theme),
      currentIndex:
        typeof parsed.currentIndex === "number"
          ? parsed.currentIndex
          : DEFAULT_PLAYER_SETTINGS.currentIndex,
      lastSongId: typeof parsed.lastSongId === "string" ? parsed.lastSongId : null,
      allTracksView: normalizeAllTracksView(parsed.allTracksView),
      customPalette: normalizeCustomPalette(parsed.customPalette),
    };
  } catch {
    return createDefaultPlayerSettings();
  }
}

export function persistSettings(settings: PlayerSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
