export type UserRole = "admin" | "standard";

export type ProfileRow = {
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type SongRow = {
  id: string;
  user_id: string;
  title: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
};
