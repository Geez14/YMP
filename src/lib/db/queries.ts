import type { ProfileRow, RoleCatalogRow, SongRow, UserRole } from "@/lib/db/types";
import { supabaseServiceClient } from "@/lib/supabase/service";

function isMissingTableError(message: string): boolean {
  return message.includes("Could not find the table 'public.");
}

export async function getProfileByUserId(
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabaseServiceClient
    .from("profiles")
    .select("user_id, email, role, upload_limit, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      return null;
    }
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return data as ProfileRow | null;
}

export async function getSongCountByUserId(userId: string): Promise<number> {
  const { count, error } = await supabaseServiceClient
    .from("song_access")
    .select("song_id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (isMissingTableError(error.message)) {
      return 0;
    }
    throw new Error(`Failed to count songs: ${error.message}`);
  }

  return count ?? 0;
}

export async function getRoleCatalogByRole(role: string): Promise<RoleCatalogRow | null> {
  const { data, error } = await supabaseServiceClient
    .from("role_catalog")
    .select("role, default_upload_limit, is_unlimited, can_manage_all_songs, created_at")
    .eq("role", role)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      return null;
    }
    throw new Error(`Failed to load role catalog: ${error.message}`);
  }

  return data as RoleCatalogRow | null;
}

export async function getRoleCatalogCount(): Promise<number> {
  const { count, error } = await supabaseServiceClient
    .from("role_catalog")
    .select("role", { count: "exact", head: true });

  if (error) {
    if (isMissingTableError(error.message)) {
      return 0;
    }
    throw new Error(`Failed to count roles: ${error.message}`);
  }

  return count ?? 0;
}

export async function getAllowedUploadMimeTypes(): Promise<string[]> {
  const { data, error } = await supabaseServiceClient
    .from("mime_type_catalog")
    .select("mime_type")
    .eq("media_family", "audio")
    .eq("is_streamable", true)
    .order("mime_type", { ascending: true });

  if (error) {
    if (isMissingTableError(error.message)) {
      return [
        "audio/mpeg",
        "audio/mp4",
        "audio/x-m4a",
        "audio/aac",
        "audio/ogg",
        "audio/wav",
        "audio/flac",
      ];
    }
    throw new Error(`Failed to load MIME catalog: ${error.message}`);
  }

  const mimeTypes = (data ?? []).map((row) => String(row.mime_type));
  if (mimeTypes.length > 0) {
    return mimeTypes;
  }

  return [
    "audio/mpeg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/ogg",
    "audio/wav",
    "audio/flac",
  ];
}

export async function listSongsForUser(
  userId: string,
  role: UserRole,
): Promise<SongRow[]> {
  const roleInfo = await getRoleCatalogByRole(role);
  const canManageAllSongs = roleInfo?.can_manage_all_songs ?? role === "admin";

  if (canManageAllSongs) {
    const { data: adminData, error: adminError } = await supabaseServiceClient
      .from("songs")
      .select("id, user_id, title, file_path, file_size_bytes, mime_type, cover_path, cover_mime_type, status, error_message, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (adminError) {
      if (isMissingTableError(adminError.message)) {
        return [];
      }
      throw new Error(`Failed to list songs: ${adminError.message}`);
    }

    const songs = (adminData ?? []) as SongRow[];
    if (songs.length === 0) {
      return songs;
    }

    const removableSongIds = await getRemovableSongIdSet(
      songs.map((song) => song.id),
    );

    return songs.filter((song) => !removableSongIds.has(song.id));
  }

  const { data: accessRows, error: accessError } = await supabaseServiceClient
    .from("song_access")
    .select("song_id")
    .eq("user_id", userId);

  if (accessError) {
    if (isMissingTableError(accessError.message)) {
      return [];
    }
    throw new Error(`Failed to list song access: ${accessError.message}`);
  }

  const songIds = (accessRows ?? []).map((row) => row.song_id as string);
  if (songIds.length === 0) {
    return [];
  }

  const { data, error } = await supabaseServiceClient
    .from("songs")
    .select("id, user_id, title, file_path, file_size_bytes, mime_type, cover_path, cover_mime_type, status, error_message, created_at, updated_at")
    .in("id", songIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }
    throw new Error(`Failed to list songs: ${error.message}`);
  }

  const songs = (data ?? []) as SongRow[];
  if (songs.length === 0) {
    return songs;
  }

  const removableSongIds = await getRemovableSongIdSet(
    songs.map((song) => song.id),
  );

  return songs.filter((song) => !removableSongIds.has(song.id));

}

export async function getSongByIdForUser(
  id: string,
  userId: string,
  role: UserRole,
): Promise<SongRow | null> {
  const roleInfo = await getRoleCatalogByRole(role);
  const canManageAllSongs = roleInfo?.can_manage_all_songs ?? role === "admin";

  if (!canManageAllSongs) {
    const { data: accessRow, error: accessError } = await supabaseServiceClient
      .from("song_access")
      .select("song_id")
      .eq("user_id", userId)
      .eq("song_id", id)
      .maybeSingle();

    if (accessError) {
      if (isMissingTableError(accessError.message)) {
        return null;
      }
      throw new Error(`Failed to verify song access: ${accessError.message}`);
    }

    if (!accessRow) {
      return null;
    }
  }

  const query = supabaseServiceClient
    .from("songs")
    .select("id, user_id, title, file_path, file_size_bytes, mime_type, cover_path, cover_mime_type, status, error_message, created_at, updated_at")
    .eq("id", id);

  const { data, error } = await query.maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      return null;
    }
    throw new Error(`Failed to load song: ${error.message}`);
  }

  const song = data as SongRow | null;
  if (!song) {
    return null;
  }

  const removableSongIds = await getRemovableSongIdSet([song.id]);
  if (removableSongIds.has(song.id)) {
    return null;
  }

  return song;
}

export async function insertSong(input: {
  userId: string;
  title: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  contentHash: string;
  coverPath?: string | null;
  coverMimeType?: string | null;
}): Promise<SongRow> {
  const { data, error } = await supabaseServiceClient
    .from("songs")
    .insert({
      user_id: input.userId,
      title: input.title,
      file_path: input.filePath,
      file_size_bytes: input.fileSizeBytes,
      mime_type: input.mimeType,
      content_hash: input.contentHash,
      cover_path: input.coverPath ?? null,
      cover_mime_type: input.coverMimeType ?? null,
      status: "ready",
    })
    .select("id, user_id, title, file_path, file_size_bytes, mime_type, cover_path, cover_mime_type, status, error_message, created_at, updated_at")
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error(
        "Database is not initialized. Run supabase/migrations/001_init_profiles_songs.sql in Supabase SQL Editor.",
      );
    }
    throw new Error(`Failed to insert song: ${error.message}`);
  }

  return data as SongRow;
}

export async function findSongByContentHash(contentHash: string): Promise<SongRow | null> {
  const { data, error } = await supabaseServiceClient
    .from("songs")
    .select("id, user_id, title, file_path, file_size_bytes, mime_type, cover_path, cover_mime_type, status, error_message, created_at, updated_at")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      return null;
    }
    throw new Error(`Failed to find song by hash: ${error.message}`);
  }

  return data as SongRow | null;
}

export async function ensureSongAccess(userId: string, songId: string): Promise<void> {
  const { error } = await supabaseServiceClient
    .from("song_access")
    .upsert({ user_id: userId, song_id: songId }, { onConflict: "user_id,song_id" });

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error(
        "Database is not initialized. Run the latest migrations in supabase/migrations.",
      );
    }
    throw new Error(`Failed to ensure song access: ${error.message}`);
  }
}

export async function countSongAccess(songId: string): Promise<number> {
  const { count, error } = await supabaseServiceClient
    .from("song_access")
    .select("user_id", { count: "exact", head: true })
    .eq("song_id", songId);

  if (error) {
    if (isMissingTableError(error.message)) {
      return 0;
    }
    throw new Error(`Failed to count song access: ${error.message}`);
  }

  return count ?? 0;
}

export async function removeSongAccess(userId: string, songId: string): Promise<void> {
  const { error } = await supabaseServiceClient
    .from("song_access")
    .delete()
    .eq("user_id", userId)
    .eq("song_id", songId);

  if (error) {
    if (isMissingTableError(error.message)) {
      return;
    }
    throw new Error(`Failed to remove song access: ${error.message}`);
  }
}

export async function removeAllSongAccess(songId: string): Promise<void> {
  const { error } = await supabaseServiceClient
    .from("song_access")
    .delete()
    .eq("song_id", songId);

  if (error) {
    if (isMissingTableError(error.message)) {
      return;
    }
    throw new Error(`Failed to remove all song access: ${error.message}`);
  }
}

export async function markSongRemovable(songId: string): Promise<void> {
  const { error } = await supabaseServiceClient.rpc("mark_song_removable", {
    p_song_id: songId,
    p_delay: "5 hours",
  });

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error(
        "Database is not initialized. Run the latest migrations in supabase/migrations.",
      );
    }
    throw new Error(`Failed to mark song removable: ${error.message}`);
  }
}

export async function clearSongRetention(songId: string): Promise<void> {
  const { error } = await supabaseServiceClient
    .from("song_retention")
    .delete()
    .eq("song_id", songId);

  if (error) {
    if (isMissingTableError(error.message)) {
      return;
    }
    throw new Error(`Failed to clear song retention: ${error.message}`);
  }
}

async function getRemovableSongIdSet(songIds: string[]): Promise<Set<string>> {
  if (songIds.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await supabaseServiceClient
    .from("song_retention")
    .select("song_id")
    .in("song_id", songIds)
    .eq("cleanup_state", "pending");

  if (error) {
    if (isMissingTableError(error.message)) {
      return new Set<string>();
    }
    throw new Error(`Failed to load removable songs: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.song_id as string));
}

export async function deleteSongById(songId: string): Promise<void> {
  const { error } = await supabaseServiceClient
    .from("songs")
    .delete()
    .eq("id", songId);

  if (error) {
    if (isMissingTableError(error.message)) {
      return;
    }
    throw new Error(`Failed to delete song: ${error.message}`);
  }
}
