# AI Context: YMP Source of Truth

## Project Stack
- Next.js `16.2.1` (App Router + Turbopack)
- React `19`
- Supabase (Auth, Storage, Postgres)
- FFmpeg `v0.12` (`@ffmpeg/ffmpeg` + `@ffmpeg/util`)

## Architecture
- Primary frontend organization follows a **Feature-Sliced** approach under `src/features/`.
- Current feature modules include:
  - `src/features/dashboard`
  - `src/features/library`
  - `src/features/player`
  - `src/features/settings`
  - `src/features/upload`
- Rule: **No Wide Barrels** in hot paths.
  - Avoid broad `index.ts` files that re-export entire feature trees.
  - Prefer direct imports to concrete files (e.g. `@/features/player/hooks/use-player`).
  - Reason: reduce Turbopack graph crawl and keep startup/HMR lean.

## PWA & Static Asset Caching
- Service worker cache version is centralized in `src/lib/constants.ts` via `CACHE_VERSION` (currently `ymp-static-v1`) and consumed by the generated `/sw.js` route (`src/app/sw.js/route.ts`).
- On `activate`, old caches must be deleted when cache key does not match current `CACHE_VERSION`.
- Static UI assets are warmed on first load from `src/components/pwa/pwa-register-service-worker.tsx` to reduce empty/missing visual states.

## Critical FFmpeg Fix
- FFmpeg must be loaded with **dynamic import only** inside the upload execution path.
  - Do **not** import `@ffmpeg/ffmpeg` at module top-level in client bundles.
- In `upload-form`, `readFile()` return value under FFmpeg v0.12 typing (`FileData`) must be normalized before blob creation.
  - Required pattern:
    - If `outData` is `Uint8Array`, use directly.
    - Otherwise, convert to bytes (`TextEncoder().encode(String(outData))`) to satisfy TS and avoid invalid `Uint8Array#set` assumptions.
- Keep FFmpeg instance cached in a ref after first dynamic load.

## State Management
- React 19 state flow is used for library mutations and reconciliation:
  - `useOptimistic` for instant UI updates (e.g. optimistic track deletion)
  - `useActionState` for server action reconciliation
- Library server mutations are routed through feature actions (`src/features/library/actions`) rather than direct Supabase calls in presentational components.
- Library action payloads are constraint-locked to functional operations only (`refresh`, `delete`) via validation in `src/features/library/actions/library-actions.ts`.
- Do not introduce social state (like/favorite/follow) into library interactions until social rollout is explicitly approved.

## Library Cover Resilience
- Use `src/features/library/components/track-cover-image.tsx` for track artwork rendering in library lists/grids.
- If cover source is unavailable or image load fails, render gradient + first-letter fallback to prevent empty cover boxes.
- Cover fallback visuals are now driven by dashboard semantic tokens via CSS variables (`--ymp-cover-fallback-from`, `--ymp-cover-fallback-to`, `--ymp-cover-fallback-text`) set in `dashboard-workspace`.

## Universal Theming Status
- Dashboard theming is centralized in `src/features/settings/lib/dashboard-theme.ts` with semantic tokens for surfaces, icons, menu borders, success/danger states, overlay, and cover fallback.
- `src/features/library/components/all-tracks-tab-panel.tsx` and `src/features/settings/components/settings-modal.tsx` consume semantic palette values instead of hardcoded colors.
- `src/components/ui/ui-controls.tsx` `UiToggle` no longer enforces hardcoded light-mode surface/text colors; consumers now own surface styling for proper dark/custom contrast.

## Social Roadmap
- Next planned scalability module: `src/features/profile`.
- Purpose:
  - Keep future social capabilities (profile pages, social graph, follow states, activity feeds) isolated from dashboard/player domains.
  - Preserve modular growth by extending feature-sliced boundaries rather than adding cross-cutting logic to existing modules.
