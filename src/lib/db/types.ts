export type UserRole = string;

export type RoleCatalogRow = {
  role: string;
  default_upload_limit: number | null;
  is_unlimited: boolean;
  can_manage_all_songs: boolean;
  created_at: string;
};

export type ProfileRow = {
  user_id: string;
  email: string | null;
  role: UserRole;
  upload_limit: number | null;
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
  cover_path?: string | null;
  cover_mime_type?: string | null;
  status: "queued" | "compressing" | "ready" | "failed";
  error_message: string | null;
  created_at: string;
  updated_at: string;
};
