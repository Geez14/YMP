import type { RepeatMode } from "@/features/settings/types/settings-ui.types";

export type PlayerWaveformState = "idle" | "active";

export type PlayerRuntimeState = {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  volume: number;
  waveformState: PlayerWaveformState;
};

export type { RepeatMode };
