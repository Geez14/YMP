import type { ProfileRow, SongRow, UserRole } from "@/lib/db/types";
import { supabaseServiceClient } from "@/lib/supabase/service";

function isMissingTableError(message: string): boolean {
  return message.includes("Could not find the table 'public.");
}

export async function getProfileByUserId(
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabaseServiceClient
    .from("profiles")
    .select("user_id, role, created_at, updated_at")
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
    .from("songs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (isMissingTableError(error.message)) {
      return 0;
    }
    throw new Error(`Failed to count songs: ${error.message}`);
  }

  return count ?? 0;
}

export async function listSongsForUser(
  userId: string,
  role: UserRole,
): Promise<SongRow[]> {
  let query = supabaseServiceClient
    .from("songs")
    .select("id, user_id, title, file_path, file_size_bytes, mime_type, created_at")
    .order("created_at", { ascending: false });

  if (role !== "admin") {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }
    throw new Error(`Failed to list songs: ${error.message}`);
  }

  return (data ?? []) as SongRow[];
}

export async function getSongByIdForUser(
  id: string,
  userId: string,
  role: UserRole,
): Promise<SongRow | null> {
  let query = supabaseServiceClient
    .from("songs")
    .select("id, user_id, title, file_path, file_size_bytes, mime_type, created_at")
    .eq("id", id);

  if (role !== "admin") {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      return null;
    }
    throw new Error(`Failed to load song: ${error.message}`);
  }

  return data as SongRow | null;
}

export async function insertSong(input: {
  userId: string;
  title: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
}): Promise<SongRow> {
  const { data, error } = await supabaseServiceClient
    .from("songs")
    .insert({
      user_id: input.userId,
      title: input.title,
      file_path: input.filePath,
      file_size_bytes: input.fileSizeBytes,
      mime_type: input.mimeType,
    })
    .select("id, user_id, title, file_path, file_size_bytes, mime_type, created_at")
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
