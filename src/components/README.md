# Frontend Component Hierarchy

This folder is organized by domain so files stay trackable as the product grows.

## High-level ownership

- `dashboard/dashboard-workspace.tsx`
  - Orchestrates app state: active tab, current song, playback controls, theme settings, and persistence.
  - Wires data + handlers into presentational panel components.
- `dashboard/*`
  - Dashboard-specific panels, shells, and tab components.
- `upload/*`
  - Upload feature components and upload page client wrapper.
- `ui/*`
  - Reusable UI primitives shared across features.
- `pwa/*`
  - Progressive web app registration/integration components.

## Current panel boundaries

- `dashboard/dashboard-playing-tab-panel.tsx`
  - Playing tab container.
  - Wraps `PageShell` + `NowPlayingPanel`.
- `dashboard/dashboard-all-tracks-tab-panel.tsx`
  - All Tracks tab UI.
  - Owns search input, list/grid switch, and song item rendering.
- `dashboard/dashboard-upload-tab-panel.tsx`
  - Upload tab UI.
  - Hosts upload form and limit context.
- `dashboard/dashboard-top-navigation.tsx`
  - Global navigation and profile/settings controls.
  - Does **not** own search.
- `dashboard/dashboard-player-footer.tsx`
  - Persistent playback controls and seek/volume transport.

## Scalability rule of thumb

When adding a major feature area, prefer:

1. Keep cross-panel state in `dashboard/dashboard-workspace.tsx` (or lift to a dedicated state module later).
2. Add/replace one focused panel component under `dashboard/`.
3. Pass only required props to keep panel contracts narrow and reusable.
