# MyMusic (Private Supabase Music Player)

Next.js App Router application with:

- Google OAuth login via Supabase.
- MFA enforcement (AAL2 required in middleware before dashboard access).
- Private audio streaming through server route (`/api/stream/[id]`) so storage URLs are never exposed.
- Role-based upload limits via `profiles` table (`standard` max 10 songs, `admin` unlimited).
- Browser-side compression with ffmpeg.wasm when file size is over 4MB.

## 1) Supabase Setup

1. Run migration SQL from [supabase/migrations/001_init_profiles_songs.sql](supabase/migrations/001_init_profiles_songs.sql).
2. In Supabase Storage, create a private bucket named `music`.
3. Enable Google OAuth and MFA (TOTP) in Supabase Auth settings.

## 2) Environment Variables

Copy [.env.example](.env.example) to `.env.local` and fill values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://huphvwysfktdvnyiretj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.huphvwysfktdvnyiretj:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

`DATABASE_URL` should use Supabase Session Pooler port `5432`.

## 3) Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, then sign in through `/login`.

## 4) Core Routes

- `src/middleware.ts`: route guard + AAL2 requirement.
- `src/app/api/upload/route.ts`: upload endpoint with role limit checks.
- `src/app/api/stream/[id]/route.ts`: server-side streaming from private bucket.
- `src/app/dashboard/page.tsx`: authenticated dashboard.
- `src/components/upload-form.tsx`: ffmpeg.wasm conditional compression.

## 5) Vercel Deployment

1. Import this repo into Vercel.
2. Add all environment variables from `.env.local` into Vercel Project Settings.
3. Deploy.
4. Verify:
	- Google login works.
	- Non-AAL2 sessions are redirected to `/login?mfa=required`.
	- Standard user 11th upload returns HTTP 403.
	- Audio fetches go through `/api/stream/[id]` only.
