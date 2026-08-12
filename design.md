# Design conventions

Living reference for UI patterns in this prototype. For build commands and file layout, see [CLAUDE.md](./CLAUDE.md).

## Icons

### Lucide (`lucide-react`)

Use Lucide for **UI chrome and actions**: search, chevrons, close/clear, download, external link, info, etc.

```tsx
import { Search } from "lucide-react";

<Search size={14} strokeWidth={1.5} className="size-3.5 shrink-0 text-current" aria-hidden />
```

Common sizes:

| Context | `size` | Notes |
|---------|--------|-------|
| Inline action (table cell, attribute row) | `14` | `strokeWidth={1.5}`, often `size-3.5` |
| Toolbar / button icon | `14`–`16` | Inherit color via `text-current` on the control |
| Search inputs | `14` | Used in `Input` search variant |

Prefer `strokeWidth={1.5}` to match existing controls.

### Custom `Icon` component

Use `<Icon name="..." />` from the design-system barrel for **product assets**:

- OCSF event-class glyphs
- Connector logos
- Severity / status shapes
- Nav and marketing illustrations from Figma exports

Do not replace these with Lucide equivalents.

## Spacing

- Attribute value → inline search icon: **16px** (`ml-4` on the icon button).
- Results detail panel horizontal padding: **24px** (`px-6`) for header, meta, and tab content.
- OCSF attribute nesting indent: **16px** per depth level.

## Theme & tokens

- Default theme is **dark**; light mode via `data-theme="light"` on `<html>`.
- Prefer Tailwind token utilities (`text-text-primary`, `bg-surface-container`, `border-border-rule`, etc.) over raw hex.
- Source of truth: `src/styles/tokens.css` + `@theme` in `src/index.css`.

## Data grids

- **Detail panel row highlight** (row open behind scrim): 3px vertical accent on the **first column only** — no full-row background fill. Class: `data-grid-detail-highlight-row`.
- **Clear all filters**: show only when chart/panel filters are active, not for search-query-only state.

## Results detail panel

- Tabs: **Attributes** and **QDM JSON**. **Investigate** (sparkle + label) sits next to the tab row, separated by a vertical rule — not a tab; toggles the Copilot side panel without changing the active detail view.
- Attributes toolbar: search field left; **Expand all** and **Show only fields with data** right.
- Attribute values: truncated text with Lucide search inline after the value (16px gap); launches FSQL via `setPendingFsqlSearch({ autoExecute: true })`.
- Custom mapped fields: teal label + asterisk tooltip (“Data Model (QDM)”).

## Typography

- Font: **Lato** (set on `body` in `src/index.css`).
- Page titles: `text-page-title`. Table headers: uppercase `text-xs font-bold text-text-tertiary`.

## Focus

The distinction is **interactive vs. not** — not form-field vs. button.

| Gets focus | Doesn't |
|---|---|
| Buttons (with label), links | Decorative icons |
| Form fields, selects | Static text, headings |
| Tabs, menu items, disclosure toggles | Layout containers |
| Drag handles | Non-interactive list rows |
| | Icons that are purely informational |
| | Icon buttons (icon-only chrome) |
| | Switches |

### Implementation

- Token: `--focus-ring-color` (must keep ≥3:1 contrast vs the control and page background).
- Focus **recolors** the existing border to `--focus-ring-color` — same width as the resting gray border. Do **not** thicken the border, and do **not** use `outline` / `outline-offset` (those draw a second floating ring).
- Global rules live in `src/index.css` (unlayered + `!important`). Composite inputs use `.focus-ring-within`; nested field focus is suppressed.
- **No focus border** on switches, icon buttons, or `.focus-ring-none` (text-style menu triggers like Attributes / Copilot).
- Non-interactive elements must not be focusable (`tabIndex={-1}` only when needed; decorative icons `aria-hidden`).
