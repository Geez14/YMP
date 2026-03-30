"use server";

import {
  getProfileByUserId,
  getSongByIdForUser,
  listSongsForUser,
  markSongRemovable,
  removeAllSongAccess,
  removeSongAccess,
} from "@/lib/db/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LibraryActionPayload, LibraryActionState } from "@/features/library/types/library.types";

function validateLibraryActionPayload(payload: LibraryActionPayload): LibraryActionPayload {
  if (payload.type === "refresh") {
    return payload;
  }

  if (payload.type === "delete" && payload.songId.trim().length > 0) {
    return payload;
  }

  throw new Error("Invalid library action payload.");
}

export async function libraryAction(
  _prevState: LibraryActionState,
  payload: LibraryActionPayload,
): Promise<LibraryActionState> {
  let validatedPayload: LibraryActionPayload;

  try {
    validatedPayload = validateLibraryActionPayload(payload);
  } catch {
    return { songs: _prevState.songs, error: "Invalid library operation." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { songs: [], error: "Unauthorized" };
  }

  const profile = await getProfileByUserId(user.id);
  const role = profile?.role ?? "standard";

  if (validatedPayload.type === "delete") {
    const song = await getSongByIdForUser(validatedPayload.songId, user.id, role);
    if (!song) {
      const songs = await listSongsForUser(user.id, role);
      return { songs, error: "Song not found." };
    }

    const isOwner = song.user_id === user.id;
    if (isOwner) {
      await removeAllSongAccess(song.id);
      await markSongRemovable(song.id);
    } else {
      await removeSongAccess(user.id, song.id);
    }
  }

  const songs = await listSongsForUser(user.id, role);
  return { songs, error: null };
}
