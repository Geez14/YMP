-- Add cover artwork fields to songs
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS cover_path text,
  ADD COLUMN IF NOT EXISTS cover_mime_type text;
