# YMP (Your Music Player)

Self-hosted, Supabase-backed music locker built with Next.js. Upload your tracks once, listen on any device, and keep playback state and settings synced to your account.

## Features
- Google OAuth sign-in (Supabase Auth)
- Personal library with All Tracks and Now Playing views
- Upload center with client-side compression to 128 kbps MP3
- Cover art retrieval via Supabase Storage
- Search, list/grid toggle, shuffle/repeat, waveform indicator
- Settings persisted in localStorage (volume, theme, last played track, etc.)

## Stack
- Next.js 15 (App Router, React 19)
- Supabase (Auth, Postgres, Storage)
- Tailwind CSS
- lucide-react icons

## Prerequisites
- Node.js **20.0.0 or newer** (required; some deps are unstable on older runtimes)
- npm (or pnpm/yarn if you prefer)
- Supabase project (URL, anon key, service role key, Postgres connection string)

## Environment Variables
Create a `.env.local` file at the repo root:

```
NEXT_PUBLIC_SUPABASE_URL=...          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # Supabase anon public key
SUPABASE_SERVICE_ROLE_KEY=...          # Supabase service role key (keep secret)
DATABASE_URL=...                       # Postgres connection string from Supabase
SONG_HASH_ALGORITHM=sha256             # Hash used to deduplicate uploads
NEXT_PUBLIC_MUSIC_BUCKET=music         # (optional) storage bucket name override
NEXT_PUBLIC_UPLOAD_BITRATE=128k        # (optional) client-side transcode target
```

## Supabase Setup
1) **Create project:** In Supabase, create a new project and note the URL, anon key, service role key, and Postgres connection string.
2) **Run migrations:** In the Supabase SQL editor, run the files under `supabase/migrations/` in order:
   - `001_init_profiles_songs.sql`
   - `20260328120000_fix_profiles_and_song_status.sql`
   - `20260328153000_normalize_profiles_songs_schema.sql`
   - `20260328170000_song_dedup_and_access.sql`
   - `20260328190000_song_soft_delete_scheduler.sql`
   - `20260328200000_retention_restore_and_cleanup_hardening.sql`
   - `20260328221000_add_song_cover.sql`
   - `20260328230000_fix_upload_limit_on_role_change.sql`
3) **Storage bucket:** Create a private bucket named `music` in Supabase Storage.
4) **Auth settings:** In Supabase Auth settings, set the redirect URL(s) to allow your domain and local dev:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

## Google OAuth (Supabase Auth)
1) In Google Cloud Console, create OAuth credentials (Web application).
2) Authorized redirect URIs should include your Supabase callback handler, e.g. `https://<your-supabase-project>.supabase.co/auth/v1/callback`.
3) Copy the Google Client ID/Secret into Supabase Auth > Providers > Google and enable the provider.
4) Ensure the site URLs you use (`http://localhost:3000` for dev, your production domain for prod) are allowed in Supabase Auth settings.

> Note: The app currently uses Google OAuth, but you can enable any other provider in Supabase Auth and reuse the same callback flow.

## Install & Run
```bash
npm install
npm run dev
# visit http://localhost:3000
```

For production:
```bash
npm run build
npm start
```

## How to Use
- Sign in with Google.
- Upload audio files (MP3, M4A/MP4, AAC, OGG, WAV, FLAC). Files are compressed to 128 kbps MP3 client-side before upload.
- Your library appears in All Tracks; pick a track to play and view Now Playing.
- Switch between list/grid, search your library, and manage playback (shuffle, repeat).
- Playback state and last played track are remembered across sessions, so you can pick up on another device without hunting for the song again.

## Future Improvements
- Resumable/chunked uploads with retry support for large files.
- Playlists and favorites with sorting/filters.
- Metadata editing (title/artist) and better cover management.
- Sharing/guest links with time-limited access.
- Offline-capable PWA with cached streams for mobile.
- Optional transcoding presets and waveform precomputation server-side.

## Why this exists
I wanted a lightweight locker to keep a handful of favorite tracks available on every device without depending on third-party streaming catalogs. This app lets me upload once, then sign in anywhere and keep listening where I left off.
