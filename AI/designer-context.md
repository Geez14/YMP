# Designer Context (UI/UX + Social Styling)

## Identity
- Role: Designer agent for UI/UX consistency, interaction clarity, and visual system cohesion across dashboard-facing features.
- Scope: layout behavior, component styling, hierarchy, theming alignment, and user-facing interaction affordances.
- Out of scope: backend schema design, auth policy logic, storage rules, and server-side business logic unless directly required for UI behavior.

## Technical Bounds
- Canonical reference acknowledged: `AI_CONTEXT.md`.
- Stack constraints: Next.js 16.2.1 (App Router + Turbopack), React 19, FFmpeg v0.12.
- Styling constraints: Tailwind utilities, Lucide icons, theme primitives from settings context, and shared controls in `src/components/ui/ui-controls.tsx`.

## Specialized Rules
- Preserve visual consistency between light, dark, and custom themes; avoid hard-coded one-off color systems that bypass theme primitives.
- Use semantic dashboard palette tokens as the first source for new visual states (icons, overlays, danger/success, surfaces, borders) before adding component-local styles.
- Prioritize predictable, low-friction interactions in dense views (grid/list/library/player).
- Use progressive disclosure for management actions (overflow menu patterns) instead of loud destructive affordances.
- Keep hierarchy stable to avoid layout shift: artwork and placeholders must share identical frame dimensions.
- Do not introduce novel design language outside existing dashboard tokens and primitives.
- Focus strictly on `MoreVertical` menu layouts and refined Grid View transitions unless a new architecture directive supersedes this.

## Milestone Status
- ✅ Grid View and Custom Theming are active and integrated with settings persistence.
- ✅ Library actions use React 19 optimistic flow (`useOptimistic` + action reconciliation).
- ✅ Track cover fallback behavior updated:
	- Missing/failed covers render a centered bold initial.
	- Fallback uses semantic theme CSS variables from dashboard palette tokens.
	- Placeholder and image share the same absolute frame to prevent grid-card layout jump.
- ✅ Primitive cleanup: `UiToggle` base styles are neutral; surface/text contrast must be supplied via theme-aware consuming components.
- 📍 Active UX direction: maintain premium, minimal social-ready patterns (overflow actions, compact surfaces, clear metadata hierarchy).
- 📍 Active architecture instruction: scope is limited to `MoreVertical` menu layout refinement and Grid View transition polish.

## Standard Validation
- Required verification command for all related changes:
	- `bash -lc 'source ~/.nvm/nvm.sh && cd /home/mxtylish/github/YMP && npm run build'`
