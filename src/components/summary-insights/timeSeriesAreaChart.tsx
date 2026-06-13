import { useId, useMemo } from "react";
import type { SeverityShapeIconName } from "../../design-system";
import { cx } from "./datavisCard";

export type TimeSeriesSeries = {
  id: string;
  label: string;
  color: string;
  icon?: SeverityShapeIconName;
  values: readonly number[];
};

type TimeSeriesSpikeHighlight = {
  /** Hour index in `xLabels` where the spike occurs. */
  index: number;
  /** Defaults to `spike ~{xLabels[index]}`. */
  label?: string;
};

type TimeSeriesAreaChartProps = {
  series: readonly TimeSeriesSeries[];
  xLabels: readonly string[];
  /** Max Y-axis value; defaults to stacked peak across all points. */
  yMax?: number;
  yTicks?: readonly number[];
  /** Plot area height in px; axis labels and legend sit outside this. */
  height?: number;
  ariaLabel: string;
  selectedSeriesId?: string | null;
  onSeriesClick?: (seriesId: string) => void;
  /** Vertical band + x-axis callout for an anomalous peak. */
  spikeHighlight?: TimeSeriesSpikeHighlight;
  /** Override default x-axis tick indices (e.g. `[0, 6, 12, 18, 23]`). */
  xTickIndices?: readonly number[];
  /** Labels paired with `xTickIndices`; falls back to `xLabels[index]`. */
  xTickLabels?: readonly string[];
};

const PLOT_VIEW_WIDTH = 1000;

function buildAreaPath(
  topValues: readonly number[],
  bottomValues: readonly number[],
  plotWidth: number,
  plotHeight: number,
  yMax: number,
): string {
  if (topValues.length === 0) return "";

  const xStep = plotWidth / Math.max(topValues.length - 1, 1);
  const toY = (v: number) => plotHeight - (v / yMax) * plotHeight;

  const topPoints = topValues.map((v, i) => {
    const x = i * xStep;
    return `${x},${toY(v)}`;
  });
  const bottomPoints = bottomValues
    .map((v, i) => {
      const x = i * xStep;
      return `${x},${toY(v)}`;
    })
    .reverse();

  return `M ${topPoints.join(" L ")} L ${bottomPoints.join(" L ")} Z`;
}

/** Stacked area time-series — datavis gridlines and severity-friendly series. */
function plotX(index: number, pointCount: number, plotWidth = PLOT_VIEW_WIDTH) {
  return (index / Math.max(pointCount - 1, 1)) * plotWidth;
}

export function TimeSeriesAreaChart({
  series,
  xLabels,
  yMax: yMaxProp,
  yTicks: yTicksProp,
  height = 140,
  ariaLabel,
  selectedSeriesId = null,
  onSeriesClick,
  spikeHighlight,
  xTickIndices: xTickIndicesProp,
  xTickLabels,
}: TimeSeriesAreaChartProps) {
  const gradientId = useId();

  const stackedTotals = useMemo(() => {
    const len = xLabels.length;
    return Array.from({ length: len }, (_, i) =>
      series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0),
    );
  }, [series, xLabels.length]);

  const yMax = yMaxProp ?? Math.max(...stackedTotals, 1);
  const yTicks = yTicksProp ?? [0, Math.round(yMax / 4), Math.round(yMax / 2), Math.round((yMax * 3) / 4), yMax];

  const layers = useMemo(() => {
    const cumulative: number[] = new Array(xLabels.length).fill(0);

    return series.map((s) => {
      const bottom = [...cumulative];
      const top = s.values.map((v, i) => {
        cumulative[i] += v;
        return cumulative[i];
      });
      return { ...s, bottom, top };
    });
  }, [series, xLabels.length]);

  const xTickIndices = useMemo(() => {
    if (xTickIndicesProp) return xTickIndicesProp;
    if (xLabels.length <= 7) return xLabels.map((_, i) => i);
    const step = Math.floor((xLabels.length - 1) / 6);
    return Array.from({ length: 7 }, (_, i) => Math.min(i * step, xLabels.length - 1));
  }, [xLabels.length, xTickIndicesProp]);

  const spikeX = spikeHighlight ? plotX(spikeHighlight.index, xLabels.length) : null;
  const spikeLabel =
    spikeHighlight != null
      ? (spikeHighlight.label ?? `spike ~${xLabels[spikeHighlight.index] ?? ""}`)
      : null;

  const interactive = Boolean(onSeriesClick);
  const filterActive = selectedSeriesId != null;

  const legendItemClass = (seriesId: string) => {
    const selected = selectedSeriesId === seriesId;
    const dimmed = filterActive && !selected;

    return cx(
      "inline-flex items-center gap-1.5 rounded-sm text-base-small transition-colors",
      interactive && "group",
      selected
        ? "font-semibold text-text-primary"
        : dimmed
          ? "text-text-disabled group-hover:font-semibold group-hover:text-text-primary"
          : "text-text-tertiary group-hover:font-semibold group-hover:text-text-primary",
    );
  };

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col">
      <div className="flex min-h-0 w-full min-w-0 gap-2">
        <div
          className="flex w-7 shrink-0 flex-col justify-between text-right text-base-small text-text-tertiary tabular-nums"
          style={{ height }}
          aria-hidden
        >
          {[...yTicks].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden" style={{ height }}>
          <svg
            viewBox={`0 0 ${PLOT_VIEW_WIDTH} ${height}`}
            preserveAspectRatio="none"
            className="block h-full w-full"
            role="img"
            aria-label={ariaLabel}
          >
            <defs>
              {layers.map((layer) => (
                <linearGradient key={layer.id} id={`${gradientId}-${layer.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={layer.color} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={layer.color} stopOpacity={0.12} />
                </linearGradient>
              ))}
            </defs>

            {yTicks.map((tick) => {
              const y = height - (tick / yMax) * height;
              return (
                <line
                  key={tick}
                  x1={0}
                  y1={y}
                  x2={PLOT_VIEW_WIDTH}
                  y2={y}
                  stroke="var(--color-datavis-gridlines)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {spikeX != null ? (
              <rect
                x={spikeX - 18}
                y={0}
                width={36}
                height={height}
                fill="var(--color-feedback-negative)"
                opacity={0.14}
                aria-hidden
              />
            ) : null}

            {layers.map((layer) => {
              const dimmed = filterActive && selectedSeriesId !== layer.id;

              return (
                <path
                  key={layer.id}
                  d={buildAreaPath(layer.top, layer.bottom, PLOT_VIEW_WIDTH, height, yMax)}
                  fill={`url(#${gradientId}-${layer.id})`}
                  stroke={layer.color}
                  strokeWidth={interactive ? 1.5 : 1}
                  vectorEffect="non-scaling-stroke"
                  className={cx(
                    "transition-opacity duration-150",
                    dimmed ? "opacity-35" : "opacity-100",
                    interactive && "cursor-pointer",
                  )}
                  onClick={interactive ? () => onSeriesClick!(layer.id) : undefined}
                />
              );
            })}

            {spikeX != null ? (
              <line
                x1={spikeX}
                y1={0}
                x2={spikeX}
                y2={height}
                stroke="var(--color-feedback-negative)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                aria-hidden
              />
            ) : null}
          </svg>
        </div>
      </div>

      <div className="mt-3 shrink-0 pl-9">
        <div className="h-px shrink-0 bg-datavis-gridlines" aria-hidden />
      </div>

      <div className="flex shrink-0 gap-2">
        <div className="w-7 shrink-0" aria-hidden />
        <div className="relative min-w-0 flex-1 pt-2">
          <div className="flex justify-between text-base-small text-text-tertiary">
            {xTickIndices.map((i, tickIdx) => (
              <span key={i} className="shrink-0 tabular-nums first:text-left last:text-right">
                {xTickLabels?.[tickIdx] ?? xLabels[i]}
              </span>
            ))}
          </div>
          {spikeX != null && spikeLabel ? (
            <p
              className="pointer-events-none absolute top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-base-small font-semibold text-feedback-negative"
              style={{ left: `${(spikeHighlight!.index / Math.max(xLabels.length - 1, 1)) * 100}%` }}
            >
              {spikeLabel}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="mt-5 flex shrink-0 flex-wrap gap-x-3 gap-y-1 pl-9">
        {series.map((s) => {
          const marker = (
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
          );

          return (
            <li key={s.id}>
              {interactive ? (
                <button
                  type="button"
                  aria-pressed={selectedSeriesId === s.id}
                  className={legendItemClass(s.id)}
                  onClick={() => onSeriesClick!(s.id)}
                >
                  {marker}
                  {s.label}
                </button>
              ) : (
                <span className={legendItemClass(s.id)}>
                  {marker}
                  {s.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
