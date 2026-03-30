"use client";

import { useActionState, useMemo, useOptimistic, useTransition } from "react";

import type { SongRow } from "@/lib/db/types";
import type { DashboardAllTracksView } from "@/features/settings/types/settings-ui.types";
import { libraryAction } from "@/features/library/actions/library-actions";
import type {
  LibraryActionState,
  LibraryOptimisticMutation,
} from "@/features/library/types/library.types";

type UseLibraryArgs = {
  initialSongs: SongRow[];
  allTracksView: DashboardAllTracksView;
  setAllTracksView: (value: DashboardAllTracksView) => void;
};

function applyOptimisticMutation(state: SongRow[], mutation: LibraryOptimisticMutation): SongRow[] {
  if (mutation.type === "remove") {
    return state.filter((song) => song.id !== mutation.songId);
  }

  return mutation.songs;
}

function filterSongs(state: SongRow[], query: string): SongRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return state;
  }

  return state.filter((song) => song.title.toLowerCase().includes(normalizedQuery));
}

export function useLibrary({ initialSongs, allTracksView, setAllTracksView }: UseLibraryArgs) {
  const initialActionState: LibraryActionState = {
    songs: initialSongs,
    error: null,
  };

  const [serverState, runLibraryAction, isActionPending] = useActionState(libraryAction, initialActionState);
  const [optimisticSongs, setOptimisticSongs] = useOptimistic(serverState.songs, applyOptimisticMutation);

  const [searchQuery, setSearchQuery] = useActionState((_prev: string, value: string) => value, "");
  const [isFilteringPending, startFilteringTransition] = useTransition();

  const filteredSongs = useMemo(() => filterSongs(optimisticSongs, searchQuery), [optimisticSongs, searchQuery]);

  const preferredUploadBitrate = process.env.NEXT_PUBLIC_UPLOAD_BITRATE ?? "128k";

  function onSearchChange(value: string) {
    startFilteringTransition(() => {
      setSearchQuery(value);
    });
  }

  function onViewChange(view: DashboardAllTracksView) {
    startFilteringTransition(() => {
      setAllTracksView(view);
    });
  }

  async function refreshSongs() {
    void runLibraryAction({ type: "refresh" });
  }

  function deleteSong(songId: string) {
    setOptimisticSongs({ type: "remove", songId });
    void runLibraryAction({ type: "delete", songId });
  }

  return {
    songs: optimisticSongs,
    filteredSongs,
    allTracksView,
    searchQuery,
    onSearchChange,
    onViewChange,
    refreshSongs,
    deleteSong,
    error: serverState.error,
    isActionPending,
    isFilteringPending,
    preferredUploadBitrate,
  };
}
