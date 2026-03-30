import type { SongRow } from "@/lib/db/types";

export type LibraryActionPayload =
  | { type: "refresh" }
  | { type: "delete"; songId: string };

export type LibraryActionState = {
  songs: SongRow[];
  error: string | null;
};

export type LibraryOptimisticMutation =
  | { type: "remove"; songId: string }
  | { type: "replace"; songs: SongRow[] };
