import { cx } from "./datavisCard";

/** Default bar fill for non-severity category/count charts (Figma datavis blue). */
export const CHART_CATEGORY_FILL = "#4a9eff";

/** Alias for vertical `TimeSeriesBarChart` bar fill. */
export const TIME_SERIES_BAR_FILL = CHART_CATEGORY_FILL;

export type BarRow = { label: string; value: number; color?: string };

const DEFAULT_X_MAX = 500;
const DEFAULT_X_TICKS = [0, 100, 200, 300, 400, 500] as const;
function ChartGridLines({ xTicks }: { xTicks: readonly number[] }) {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-[20px] right-[20px] flex justify-between"
      aria-hidden
    >
      {xTicks.map((t) => (
        <div key={t} className="flex h-full w-0 justify-center">
          <div className="h-full w-px bg-datavis-gridlines" />
        </div>
      ))}
    </div>
  );
}

export function HorizontalBarPanel({
  rows,
  selectedLabel,
  onBarClick,
  filterAriaLabel = (label) => `Filter by ${label}`,
  xMax = DEFAULT_X_MAX,
  xTicks = DEFAULT_X_TICKS,
  chartHeight,
  dense = false,
  denseRowGap,
}: {
  rows: readonly BarRow[];
  selectedLabel?: string | null;
  onBarClick?: (label: string) => void;
  filterAriaLabel?: (label: string) => string;
  xMax?: number;
  xTicks?: readonly number[];
  /** Override plot height — use when fewer rows should match another chart's row density. */
  chartHeight?: number;
  /** Tighter row spacing and smaller bars — for compact dashboard widgets. */
  dense?: boolean;
  /** Gap between dense rows in pixels. Defaults to 16. */
  denseRowGap?: number;
}) {
  const resolvedDenseRowGap = dense ? (denseRowGap ?? 16) : undefined;

  return (
    <div className={cx("flex min-h-0 min-w-0 flex-col", chartHeight == null && !dense && "flex-1 lg:h-full")}>
      <div
        className={cx("relative flex flex-col", chartHeight == null && !dense && "min-h-[200px] flex-1")}
        style={chartHeight != null ? { height: chartHeight } : undefined}
      >
        <ChartGridLines xTicks={xTicks} />
        <div
          className={cx("relative flex min-h-0 flex-col", dense ? "justify-start" : "h-full justify-between")}
          style={resolvedDenseRowGap != null ? { gap: resolvedDenseRowGap } : undefined}
        >
          {rows.map((row) => {
            const pct = Math.min(100, Math.max((row.value / xMax) * 100, row.value > 0 ? 6 : 0));
            const fill = row.color ?? CHART_CATEGORY_FILL;
            const interactive = Boolean(onBarClick);
            const selected = interactive && selectedLabel === row.label;
            const filterActive = interactive && selectedLabel != null;
            const dimmed = filterActive && !selected;

            const rowBody = (
              <>
                <span
                  className={cx(
                    "w-[5.5rem] shrink-0 text-right text-base-small transition-colors sm:w-28",
                    "group-hover:font-semibold group-hover:text-text-primary",
                    selected
                      ? "font-semibold text-text-primary"
                      : dimmed
                        ? "text-text-disabled"
                        : "text-text-tertiary",
                  )}
                >
                  {row.label}
                </span>
                <div className={cx("flex min-w-0 flex-1 items-center gap-[8px]", dense ? "min-h-4" : "min-h-5")}>
                  <div
                    className={cx(
                      "shrink-0 rounded-sm transition-opacity duration-150",
                      dense ? "h-4" : "h-5",
                      dimmed ? "opacity-35 group-hover:opacity-55" : interactive && !selected && "opacity-90 group-hover:opacity-100",
                    )}
                    style={{
                      width: `min(${pct}%, calc(100% - 3.25rem))`,
                      backgroundColor: fill,
                    }}
                  />
                  <span
                    className={cx(
                      "shrink-0 text-xs font-bold tabular-nums transition-colors",
                      "group-hover:text-text-primary",
                      dimmed ? "text-text-disabled" : "text-text-primary",
                    )}
                  >
                    {row.value}
                  </span>
                </div>
              </>
            );

            if (interactive) {
              return (
                <button
                  key={row.label}
                  type="button"
                  aria-pressed={selected}
                  aria-label={filterAriaLabel(row.label)}
                  className={cx(
                    "group flex w-full shrink-0 items-center gap-2 rounded-sm text-left sm:gap-3",
                    dense ? "min-h-5" : "min-h-6",
                    "cursor-pointer transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-datavis-card-bg",
                  )}
                  onClick={() => onBarClick!(row.label)}
                >
                  {rowBody}
                </button>
              );
            }

            return (
              <div key={row.label} className={cx("flex shrink-0 items-center gap-2 sm:gap-3", dense ? "min-h-5" : "min-h-6")}>
                {rowBody}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
