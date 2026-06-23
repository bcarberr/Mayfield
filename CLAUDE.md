# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check (tsc --noEmit) then Vite production build
npm run preview   # Preview the production build locally
```

There is no test runner configured in this project.

## Architecture

This is a React 19 + TypeScript SPA built with Vite and Tailwind CSS v4. It is a UI prototype/design system playground for a security product (connectors, detections, search, threat intel features).

### Routing

- `src/app/routes.ts` — `ROUTES` constant: single source of truth for all SPA paths
- `src/app/App.tsx` — `<Routes>` definitions; new pages must be registered here
- `src/app/navRailTargets.ts` — maps `V4NavActiveSection` keys to route paths for the nav rail

### Pages (`src/app/`)

- `ConfigSchemaMapPage` — 3-step schema mapping wizard (the primary fleshed-out page)
- `SearchLandingPage` — federated search landing
- `SummaryInsightsPage` — summary/insights dashboard
- `WorkspacePlaceholderPage` — stub for sections not yet implemented

### Design System (`src/design-system/`)

`src/design-system/index.ts` is the public barrel: import `Icon`, `useTheme`, `Switch`, `Checkbox`, and all token types from `"../design-system"` (not from the leaf files).

### Theme System

- Default theme is **dark**. Switch by setting `data-theme="light"` on `<html>`.
- `useTheme()` hook handles reading/writing `localStorage` and toggling.
- CSS custom properties in `src/styles/tokens.css` define:
  1. Raw palettes: `--dark-*` and `--light-*`
  2. Semantic aliases: `--color-*` (default dark, overridden under `[data-theme="light"]`)
- Tailwind `@theme` block in `src/index.css` hard-wires the dark defaults so utility classes (`bg-surface-container`, `text-text-primary`, `border-border-rule`, etc.) resolve correctly. When adding a new token, add it to **both** `tokens.css` and the `@theme` block in `index.css`.
- `src/design-system/tokens/colors.ts` is a TS mirror of the raw palettes — for inline styles, SVG fills, and charts only; the CSS file is the source of truth.

### Icon System (`src/components/Icon.tsx`)

- Single `<Icon name="..." size={18} />` component injects SVGs inline as HTML strings.
- Icons are split into named categories; each category has a `.ts` manifest file under `src/assets/icons/` (e.g. `action-icons.ts`, `connector-large-icons.ts`).
- `ICON_NAMES` (exported from `src/design-system`) is the full union of valid icon names.
- SVGs are imported with Vite's `?raw` suffix (inline) or `?url` (for `<img>` tags). Never import SVGs as React components except for `MISC_TECHNOLOGY_ICON_COMPONENTS` (which uses `icons.tsx`).
- To add new icons: add SVG files, update the category `.ts` manifest, then register the category in `Icon.tsx`.

### UI Primitives (`src/components/ui/`)

- `Button` — variants: `primary`, `secondary`, `tertiary`, `ghost`
- `DataTable<Row>` — generic typed table; columns defined with `{ id, header, cell, className }`
- `Input`, `Modal`, `Card`, `Switch`
- `Checkbox` is at `src/components/uiCheckbox.tsx` (exported via design-system index)

### Nav Rail (`src/components/V4NavThinner.tsx`)

- Accepts `variant` (`"federated-search"` | `"settings"`), `activeSection`, and `navTargets`.
- Inline SVGs from `src/assets/nav-v4/` are used for rail glyphs so `fill="currentColor"` follows the rail's `text-*` class.

### Tailwind v4 Conventions

- Custom utilities are declared with `@utility` in `src/index.css` (e.g. `text-base-semibold`, `text-page-title`).
- All color, surface, and feedback tokens are exposed as Tailwind utility classes via the `@theme` block — prefer these over inline styles.
- Font family is **Lato** (declared in `body` in `index.css`); Tailwind's default `font-sans` is not used.

### Dashboard / Data Grid Conventions

- **"Clear all filters" button**: only show when chart/bar/panel filters are active (e.g. `trafficFilter`, `severityFilter`, `pairFilter`). Do **not** include `searchQuery` in `hasActiveFilters` — the search field has its own inline clear icon, so showing the button for search-only state is redundant.

### Figma Integration

`@figma/code-connect` is installed. Python scripts in `tools/` are used for batch-importing icons and connector logos from Figma — these are one-off development utilities, not part of the build.
