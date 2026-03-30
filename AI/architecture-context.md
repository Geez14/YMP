# Architecture Context (Strategic / Gemini)

## Mission
Evolve YMP into a scalable, feature-sliced music platform while preserving a 113ms-200ms boot target, React 19 state integrity, and clear domain boundaries.

## Current Project Stack
- **Framework:** Next.js 16.2.1 (App Router + Turbopack).
- **Runtime:** React 19 (using useActionState, useOptimistic).
- **Backend:** Supabase (Auth, Postgres, Storage).
- **Processing:** FFmpeg v0.12 (Client-side WASM).

## Strategic Principles
1. **Feature-Sliced Isolation:** All logic resides in `src/features/*`. Shared UI is strictly limited to `src/components/ui/*`.
2. **Performance First:** No "Wide Barrels" (index.ts) in hot paths. Use direct-file imports to keep Turbopack graphs lean.
3. **Client Resilience:** Core assets are cached via a generated Service Worker route. Dynamic assets must use `TrackCoverImage` fallbacks to prevent layout shift.
4. **Constraint Locking:** Library actions are strictly guarded to allow only `refresh` and `delete` operations to prevent side-effect creep.

## Active Feature Domains
- `dashboard`: Layout and workspace orchestration.
- `library`: Track management and optimistic data flows.
- `player`: HTML5 Audio with 403/404 error surfacing.
- `settings`: Theme persistence and custom CSS variable injection.
- `upload`: Transcoding-aware music ingestion.

## Milestone Status & Roadmap
- ✅ **Infrastructure:** Feature-Sliced refactor complete. Build is green.
- ✅ **Hardening:** `CACHE_VERSION` centralized in `src/lib/constants.ts`. Action guards implemented in `library-actions.ts`.
- 📍 **Current Focus:** UX refinement + constraint locking — library interactions remain purely functional/optimistic with no social state introduced yet.
- 🚀 **Next Milestone:** Social Expansion — implementation of the "Like/Favorite" system and `src/features/profile` rollout once explicitly approved.

## Architectural Directives
- **Zero Magic Strings:** All shared constants must live in `src/lib/constants.ts`.
- **Veto Power:** Reject any implementation violating the FFmpeg dynamic-import rule or the 200ms boot performance target.
- **Technical Debt:** Maintain a "Zero Technical Debt" policy for the `AI/` context folder.