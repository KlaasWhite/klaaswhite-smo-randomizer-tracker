# GitHub Copilot Instructions — SMO Randomizer Tracker

This is a **Super Mario Odyssey (SMO) randomizer loading-zone tracker**: a web app where
kingdoms, sub-areas, and doors are drawn as a graph, and the user connects doors with arrows
to represent randomized loading zones. Moons are tracked per sub-area.

## Tech Stack
- **Vite 8** + **React 19** + **TypeScript** (strict, `tsc -b` for build).
- **React Flow (`@xyflow/react` v12)** for the tracker graph.
- **React Router v7** — two routes: `/` (tracker) and `/editor` (config editor).
- **Zustand v5** for state (tracker store + UI store).
- **nanoid** for generating IDs.
- React Compiler is enabled (via `@vitejs/plugin-react` + babel `reactCompilerPreset`).

## Project Layout
- `src/App.tsx` — Router: `/` → `TrackerCanvas`, `/editor` → `EditorCanvas`.
- `src/data/types.ts` — Static config types (`TrackerConfig`, `KingdomConfig`, `SubAreaConfig`,
  `DoorConfig`) and per-session progress types (`Progress`, `MoonProgress`).
- `src/store/useTrackerStore.ts` — Main state: nodes, edges, progress, selection, kingdom colors,
  config loading, moon/door mutations, `onConnect`.
- `src/store/useUiStore.ts` — UI-only state: context menus (moon/door), `editorMode` flag.
- `src/tracker/` — Tracker canvas, custom `KingdomNode`, `DetailPanel`, context menus, `selection.ts`.
- `src/editor/EditorCanvas.tsx` — **Structure-only** config editor (no flow canvas). Reads
  `/config/smo-config.json` on mount; writes via the save endpoint.
- `src/editor/exportConfig.ts` — `serializeConfig`, `downloadConfig`, `copyConfig`.
- `public/config/smo-config.json` — The committed config the app loads. **This is the source of
  truth for the tracker structure.**
- `vite.config.ts` — Adds a dev-only `POST /api/save-config` middleware that writes the posted
  JSON back to `public/config/smo-config.json`.

## Key Conventions
- **Kingdom node renders everything as natural HTML** (doors + sub-areas) inside one React Flow
  node — there are no separate child nodes for doors/sub-areas. Do not reintroduce pre-computed
  height math for sub-areas.
- **Handle IDs**: `doorHandle(id) = 'door::' + id` (one source+target handle per door),
  `kingdomItselfHandle(id) = 'ki::' + id` (the kingdom "Root"). See `useTrackerStore.ts`.
- **Edges** are `smoothstep` with arrow markers; bidirectional connections get a double arrow and
  the `edge-bidirectional` class. `isEdgeRelated` (`src/tracker/selection.ts`) drives highlight/dim
  styling when a node is selected.
- **Per-kingdom color**: assigned randomly in `loadConfig` and exposed as the `--kingdom-color`
  CSS variable on the kingdom node; used for borders/accents in `App.css`.
- **Moon progress model** (`MoonProgress`): `collected: boolean`, `typeNote: string`
  (free text — there is intentionally NO dropdown/enum), `note: string` (why not collected).
  Edited in `DetailPanel` and the moon right-click context menu.
- **Editor is structure-only**: it shows the config as an editable tree (kingdom → doors →
  sub-areas → doors) with Save/Download/Copy buttons. It does NOT render a flow graph.
- **Dark theme** is forced in `src/index.css` (no `prefers-color-scheme` gating).

## State Persistence
- Progress (collected moons, moon notes, door notes) is persisted to `localStorage`, keyed by
  `smo-progress::${config.id}`. Reset clears both moons and drawn edges.
- The **config JSON itself** is only written when running `npm run dev` (via the Vite
  `/api/save-config` middleware). In a production build there is no write endpoint — the JSON must
  be edited/deployed by other means.

## Common Tasks
- **Add/edit tracker structure**: edit `public/config/smo-config.json` (or use the `/editor` UI
  while `npm run dev` is running, then click "Save JSON").
- **Run**: `npm run dev` (Vite, default port 5173; may pick another if busy).
- **Type-check**: `npx tsc -p tsconfig.app.json --noEmit`.
- **Lint**: `npm run lint`. **Build**: `npm run build`.

## Gotchas
- The tracker canvas container relies on the `.canvas-wrap` CSS class for width/height (React Flow
  requires a sized parent). Do not remove or rename it.
- `editorMode` (from `useUiStore`) gates click-to-select behavior in `KingdomNode`; the editor no
  longer uses React Flow, so it is effectively unused by the editor but still read by the node.
- Keep `MoonProgress.typeNote` a free-text string; do not convert it back to an enum/dropdown.
