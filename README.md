# YMP (Your Music Player)

## Project Overview
YMP is a Next.js 16 + React 19 social music platform focused on authenticated upload, playback, and cross-device listening continuity.

## Architecture
YMP uses a Feature-Sliced Design approach.

- `src/app`: App Router pages, layouts, and API/auth route handlers.
- `src/features`: Domain-owned feature modules.
  - `dashboard`
  - `library`
  - `player`
  - `settings`
  - `upload`
- `src/components`: Shared cross-feature UI/PWA components.
- `src/lib`: Shared runtime integrations (env, routes, auth, DB, Supabase clients).
- `supabase/migrations`: Schema, policies, and data lifecycle migration history.

## AI Command Center
Multi-AI collaboration is coordinated from the `AI/` folder.

- `PROJECT_ROUTER.md` is the required entry point for routing an AI agent by role.
- `AI_CONTEXT.md` is the root canonical context for stack-level constraints and milestones.
- `AI/architecture-context.md`, `AI/project-context-coder.md`, `AI/designer-context.md`, and `AI/security-context.md` define role-specific operating guardrails.

## Technical Constraints
- FFmpeg v0.12 rule: normalize codec input to `Uint8Array` before FFmpeg write/transcode steps.
- No Wide Barrels policy: avoid broad re-export index files that blur domain boundaries; keep imports explicit and feature-local.

## Development
Install dependencies and run local development:

```bash
npm install
npm run dev
```

Mandatory verification command (for all AI agents and contributors):

```bash
bash -lc 'source ~/.nvm/nvm.sh && cd /home/mxtylish/github/YMP && npm run build'
```

## PWA & Caching
- Static UI assets are cached by the service worker using `CACHE_VERSION` in `public/sw.js`.
- When updating logo/static assets, bump `CACHE_VERSION` (for example, `ymp-static-v2`) so old caches are removed on activate and users receive fresh files.

## Goal
Enable any new developer or AI agent to understand YMP’s architecture, ownership boundaries, and implementation guardrails immediately.
