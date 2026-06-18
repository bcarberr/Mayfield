import type { CSSProperties } from "react";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

/** CSS variable set on grid sections — height of sticky title/toolbar block (incl. divider). */
export const DATA_GRID_TOOLBAR_HEIGHT_VAR = "--data-grid-toolbar-height";

/** Inline styles for coordinated sticky toolbar / filter rail / thead offsets. */
export function dataGridStickySectionStyle(toolbarHeightPx = 0): CSSProperties {
  return {
    [DATA_GRID_TOOLBAR_HEIGHT_VAR]: `${toolbarHeightPx}px`,
  } as CSSProperties;
}

/** Charts/widgets above a grid — paint above the section sticky toolbar during page scroll. */
export const DATA_GRID_ABOVE_SECTION_CLASS = cx(
  "relative z-10 flex shrink-0 flex-col gap-4",
);

/** Card shell for a full data grid section (title, table, pagination). */
export const DATA_GRID_SECTION_CLASS = cx(
  "relative z-0 isolate mx-0 mb-0 flex min-w-0 flex-col rounded-[4px] border border-border-container bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2)]",
);

/** Inner padding for the section title / search toolbar row. */
export const DATA_GRID_SECTION_HEADER_CLASS = "shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-6 pt-3 sm:pl-5";

/** Sticky section header (title + toolbar) — sticks at viewport top on page scroll. */
export const DATA_GRID_TOOLBAR_STICKY_CLASS = cx(
  "relative sticky top-0 z-[2] bg-datavis-card-bg",
);

/** Filter rail + table row; stretches with table body for full-height rail border. */
export const DATA_GRID_FILTER_ROW_CLASS = cx(
  "relative z-0 flex min-h-0 items-stretch overflow-clip bg-datavis-card-bg",
);

/** Hard clip boundary for page-level grid scrollports (prevents tbody painting above the scroll edge). */
export const DATA_GRID_PAGE_SCROLL_OUTER_CLASS = "relative min-h-0 flex-1 overflow-hidden";

/** Inner scroll surface — must sit inside {@link DATA_GRID_PAGE_SCROLL_OUTER_CLASS}. */
export const DATA_GRID_PAGE_SCROLL_INNER_CLASS = "absolute inset-0 overflow-x-auto overflow-y-auto";

/** Table scrollport sizing only — no overflow here; it breaks page-level sticky `th` (use page scroll for x). */
export const DATA_GRID_TABLE_SCROLL_CLASS = cx("relative z-0 min-h-0 w-full min-w-0 overflow-clip");

/** `border-separate` is required for reliable sticky table headers (not `border-collapse`). */
export const DATA_GRID_TABLE_CLASS = cx(
  "relative z-0 table-fixed border-separate border-spacing-0 text-left text-sm",
  "[&_tbody_tr]:relative [&_tbody_tr]:z-0 [&_tbody_tr]:h-10 [&_tbody_tr]:max-h-10",
  // Row borders must live on cells — `border-separate` ignores `<tr>` borders.
  "[&_tbody_td]:border-b [&_tbody_td]:border-datavis-gridlines",
  "[&_tbody_td]:h-10 [&_tbody_td]:max-h-10 [&_tbody_td]:py-0 [&_tbody_td]:align-middle",
  "[&_tbody_td]:bg-datavis-card-bg [&_tbody_tr:hover_td]:bg-overlay-subtle",
);

/** Marker on `<thead>` — sticky on `th` cells; top aligns with filter rail row (same band, not below rail height). */
export const DATA_GRID_THEAD_CLASS = cx(
  "[&_th]:sticky [&_th]:top-[var(--data-grid-toolbar-height,0px)] [&_th]:z-[3] [&_th]:bg-surface-table-row-header",
  "[&_th]:h-10 [&_th]:max-h-10 [&_th]:py-0 [&_th]:align-middle",
  "[&_th]:border-b [&_th]:border-datavis-gridlines",
);

export const DATA_GRID_HEADER_ROW_CLASS = cx(
  "h-10 max-h-10 bg-surface-table-row-header",
);

/** Default body data row — 40px. */
export const DATA_GRID_BODY_ROW_CLASS = "h-10 max-h-10";

/** Default body cell — 40px with vertical centering (add horizontal padding per column). */
export const DATA_GRID_BODY_CELL_CLASS = "h-10 max-h-10 py-0 align-middle";

/** Expandable detail row — clears the fixed 40px height from {@link DATA_GRID_TABLE_CLASS}. */
export const DATA_GRID_EXPANDED_ROW_CLASS = cx(
  "!h-auto !max-h-none border-b border-datavis-gridlines bg-surface-table-row-header [&_td]:!h-auto [&_td]:!max-h-none",
);

/** Sticky offset for filter rail controls — same top as thead (horizontal band below toolbar). */
export const DATA_GRID_FILTER_RAIL_STICKY_CLASS = cx(
  "sticky top-[var(--data-grid-toolbar-height,0px)] z-[3] bg-datavis-card-bg",
);
