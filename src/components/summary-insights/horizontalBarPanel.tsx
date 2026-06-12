import { cx } from "./datavisCard";

/** Figma Framework-Keyframes `4524:35393` — horizontal bar fills (dark datavis). */
export const CHART_CATEGORY_FILL = "#6dc6a1";

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
  axisLabel,
  chartHeight,
}: {
  rows: readonly BarRow[];
  selectedLabel?: string | null;
  onBarClick?: (label: string) => void;
  filterAriaLabel?: (label: string) => string;
  xMax?: number;
  xTicks?: readonly number[];
  axisLabel?: string;
  /** Override plot height — use when fewer rows should match another chart's row density. */
  chartHeight?: number;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-full">
      <div
        className={cx("relative flex flex-col", chartHeight == null && "min-h-[200px] flex-1")}
        style={chartHeight != null ? { height: chartHeight } : undefined}
      >
        <ChartGridLines xTicks={xTicks} />
        <div className="relative flex h-full min-h-0 flex-col justify-between">
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
                <div className="flex min-h-5 min-w-0 flex-1 items-center gap-[8px]">
                  <div
                    className={cx(
                      "h-5 shrink-0 rounded-sm transition-opacity duration-150",
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
                    "group flex min-h-6 w-full shrink-0 items-center gap-2 rounded-sm text-left sm:gap-3",
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
              <div key={row.label} className="flex min-h-6 shrink-0 items-center gap-2 sm:gap-3">
                {rowBody}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 shrink-0 px-[20px]">
        <div className="h-px shrink-0 bg-datavis-gridlines" aria-hidden />
      </div>
      <div className="flex shrink-0 justify-between px-[20px] pt-2 text-base-small text-text-tertiary">
        {xTicks.map((t) => (
          <span key={t} className="w-8 shrink-0 text-center tabular-nums first:w-6 first:text-left last:text-right">
            {t}
          </span>
        ))}
      </div>
      {axisLabel ? <p className="mt-1 shrink-0 text-center text-base-semibold text-text-primary">{axisLabel}</p> : null}
    </div>
  );
}
