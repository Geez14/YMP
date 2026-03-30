# Project Context (Implementation / Codex)

## Implementation Scope
You are working on YMP (`/home/mxtylish/github/YMP`), a feature-sliced Next.js 16 + React 19 app with Supabase-backed auth/storage/database and client-side FFmpeg upload compression.

## Codebase Layout Priorities
- App routes/API: `src/app/*`
- Product features: `src/features/*`
- Shared runtime libs: `src/lib/*`
- Shared UI primitives only: `src/components/ui/*` and `src/components/pwa/*`

## Self-Documentation: Mandatory Rules
1. Use `Uint8Array` for FFmpeg data handling and normalization.
2. No `Wide Barrels` in `src/features`.
3. Always run `npm run build` via the NVM-bash command for verification:
   - `bash -lc 'source ~/.nvm/nvm.sh && cd /home/mxtylish/github/YMP && npm run build'`
4. Keep PWA static asset cache versioning centralized in `src/lib/constants.ts` (`CACHE_VERSION`) and consumed by `/sw.js` route generation.
5. Preserve library cover fallback behavior through `track-cover-image` to avoid empty image states.

## Existing Implementation Constraints
- Keep FFmpeg dynamically imported in upload execution path.
- Preserve optimistic delete flow in library (`use-library` + actions).
- Keep library action payloads locked to functional operations only (`refresh` and `delete`) via the action guard in `library-actions.ts`.
- Do not introduce social state (like/favorite/follow) into library interactions yet.
- Keep dashboard theming semantic and centralized in `src/features/settings/lib/dashboard-theme.ts`; add new UI colors as palette tokens rather than component-level literals.
- Keep shared UI primitives neutral: do not re-introduce hardcoded light-mode surface/text colors into `src/components/ui/ui-controls.tsx` base controls.
- Keep route usage centralized via `src/lib/routes.ts`.
- Keep `/sw.js` route cleanup strict: remove cache keys not matching the active `CACHE_VERSION`.
- Keep first-load static asset warmup in `src/components/pwa/pwa-register-service-worker.tsx` aligned with the SW cache version.
- Use `src/features/library/components/track-cover-image.tsx` for library artwork rendering where Supabase cover fetches can fail or lag.
- Avoid introducing unnecessary new abstractions.

## Verification Checklist
- Type-check/build passes.
- No stale imports to deleted legacy paths.
- Feature UI behavior remains stable after refactors.
