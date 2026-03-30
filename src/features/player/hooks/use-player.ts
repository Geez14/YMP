"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { SongRow } from "@/lib/db/types";
import { API_ROUTES } from "@/lib/routes";
import type { RepeatMode } from "@/features/settings/types/settings-ui.types";

type UsePlayerArgs = {
  songs: SongRow[];
  selectedSongId: string | null;
  setSelectedSongId: (songId: string | null) => void;
  restoredSongId: string | null;
  restoredCurrentIndex: number;
  hasRestored: boolean;
  volume: number;
  isShuffle: boolean;
  setIsShuffle: Dispatch<SetStateAction<boolean>>;
  repeatMode: RepeatMode;
  setRepeatMode: Dispatch<SetStateAction<RepeatMode>>;
  isAutoplay: boolean;
};

export function usePlayer({
  songs,
  selectedSongId,
  setSelectedSongId,
  restoredSongId,
  restoredCurrentIndex,
  hasRestored,
  volume,
  isShuffle,
  setIsShuffle,
  repeatMode,
  setRepeatMode,
  isAutoplay,
}: UsePlayerArgs) {

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSongIdRef = useRef<string | null>(null);
  const restoringSelectionRef = useRef(false);
  const didRestoreSelectionRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const currentSong = songs.find((song) => song.id === selectedSongId) ?? null;
  const currentIndex = selectedSongId ? songs.findIndex((song) => song.id === selectedSongId) : -1;

  useEffect(() => {
    if (!hasRestored || didRestoreSelectionRef.current || songs.length === 0) {
      return;
    }

    const hasStored = restoredSongId ? songs.some((song) => song.id === restoredSongId) : false;
    const nextIndex = Math.min(Math.max(restoredCurrentIndex, 0), songs.length - 1);
    restoringSelectionRef.current = true;
    setSelectedSongId(
      hasStored
        ? restoredSongId
        : songs[nextIndex]?.id ?? songs[0]?.id ?? null,
    );
    didRestoreSelectionRef.current = true;
  }, [hasRestored, songs, restoredSongId, restoredCurrentIndex, setSelectedSongId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!selectedSongId) {
      audio.pause();
      setIsPlaying(false);
      setPlaybackError(null);
      lastSongIdRef.current = null;
      return;
    }

    if (lastSongIdRef.current === selectedSongId) {
      return;
    }

    lastSongIdRef.current = selectedSongId;
    setPlaybackError(null);
    audio.src = API_ROUTES.streamBySongId(selectedSongId);
    const shouldAutoplay = restoringSelectionRef.current ? isAutoplay : true;
    restoringSelectionRef.current = false;

    if (shouldAutoplay) {
      void audio.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false),
      );
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [selectedSongId, isAutoplay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function handleTime() {
      if (!audioRef.current) return;
      setCurrentTime(audioRef.current.currentTime || 0);
    }

    function handleDuration() {
      if (!audioRef.current) return;
      setDuration(Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0);
    }

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("durationchange", handleDuration);

    return () => {
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("durationchange", handleDuration);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    async function handleError() {
      if (!selectedSongId) {
        setPlaybackError("Playback Failed: Please select another track.");
        return;
      }

      try {
        const response = await fetch(API_ROUTES.streamBySongId(selectedSongId), {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 403) {
          setPlaybackError("Playback Failed: You do not have access to stream this track.");
          return;
        }

        if (response.status === 404) {
          setPlaybackError("Playback Failed: This track is no longer available.");
          return;
        }

        if (!response.ok) {
          setPlaybackError("Playback Failed: Streaming error.");
          return;
        }

        setPlaybackError("Playback Failed: Please try again.");
      } catch {
        setPlaybackError("Playback Failed: Check your connection and try again.");
      }
    }

    const onAudioError = () => {
      void handleError();
    };

    audio.addEventListener("error", onAudioError);

    return () => {
      audio.removeEventListener("error", onAudioError);
    };
  }, [selectedSongId]);

  function formatTime(value: number) {
    if (!Number.isFinite(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function goNext() {
    if (songs.length === 0) return;

    if (isShuffle && songs.length > 1) {
      let nextIndex = currentIndex >= 0 ? currentIndex : 0;
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * songs.length);
      }
      setSelectedSongId(songs[nextIndex].id);
      return;
    }

    if (currentIndex >= 0 && currentIndex < songs.length - 1) {
      setSelectedSongId(songs[currentIndex + 1].id);
      return;
    }

    if (repeatMode === "all") {
      setSelectedSongId(songs[0].id);
    }
  }

  function goPrevious() {
    if (songs.length === 0) return;

    if (currentIndex > 0) {
      setSelectedSongId(songs[currentIndex - 1].id);
      return;
    }

    if (repeatMode === "all") {
      setSelectedSongId(songs[songs.length - 1].id);
    }
  }

  function toggleRepeatMode() {
    setRepeatMode((mode) => {
      if (mode === "off") return "all";
      if (mode === "all") return "one";
      return "off";
    });
  }

  function seekTo(nextTime: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    void audio.play().then(() => setIsPlaying(true));
  }

  const waveformState = isPlaying && currentSong ? "active" : "idle";
  const preferredBitrateKbps = 128;
  const isPreferredMp3Track = currentSong?.mime_type === "audio/mpeg";

  return useMemo(
    () => ({
      audioRef,
      currentSong,
      currentIndex,
      isPlaying,
      duration,
      currentTime,
      waveformState,
      preferredBitrateKbps,
      isPreferredMp3Track,
      playbackError,
      goNext,
      goPrevious,
      toggleRepeatMode,
      seekTo,
      togglePlayPause,
      formatTime,
      onToggleShuffle: () => setIsShuffle(!isShuffle),
      onEnded: () => {
        if (!isAutoplay) return;
        if (repeatMode === "one") {
          const audio = audioRef.current;
          if (audio) {
            audio.currentTime = 0;
            void audio.play();
          }
          return;
        }

        goNext();
      },
    }),
    [
      currentSong,
      currentIndex,
      isPlaying,
      duration,
      currentTime,
      waveformState,
      isPreferredMp3Track,
      playbackError,
      isShuffle,
      isAutoplay,
      repeatMode,
      setIsShuffle,
    ],
  );
}
