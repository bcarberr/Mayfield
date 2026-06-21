import type { ReactNode } from "react";
import { formatBucketTimeLabel } from "./timeframeChartUtils";

export type TimeSeriesHoverIndexMode = "bar" | "area";

export function nearestTimeSeriesIndex(
  clientX: number,
  rect: DOMRect,
  bucketCount: number,
  mode: TimeSeriesHoverIndexMode,
): { index: number; plotX: number } | null {
  if (rect.width <= 0 || bucketCount === 0) return null;

  const plotX = Math.max(0, Math.min(rect.width, clientX - rect.left));
  const ratio = plotX / rect.width;

  let index: number;
  if (mode === "area") {
    index =
      bucketCount === 1
        ? 0
        : Math.min(bucketCount - 1, Math.max(0, Math.round(ratio * (bucketCount - 1))));
  } else {
    index =
      ratio >= 1
        ? bucketCount - 1
        : Math.min(bucketCount - 1, Math.max(0, Math.floor(ratio * bucketCount)));
  }

  return { index, plotX };
}

export function timeSeriesCrosshairPercent(
  index: number,
  bucketCount: number,
  mode: TimeSeriesHoverIndexMode,
): number {
  if (bucketCount <= 0) return 0;
  if (mode === "area") {
    return (index / Math.max(bucketCount - 1, 1)) * 100;
  }
  return ((index + 0.5) / bucketCount) * 100;
}

export function formatTimeSeriesHoverLabel(
  index: number,
  xLabels: readonly string[],
  bucketStarts?: readonly Date[],
): string {
  const bucketStart = bucketStarts?.[index];
  if (bucketStart) {
    return formatBucketTimeLabel(bucketStart, true);
  }
  return xLabels[index] ?? "";
}

type TimeSeriesHoverTooltipProps = {
  plotX: number;
  timeLabel: string;
  children: ReactNode;
};

/** Floating readout anchored to the hovered time marker. */
export function TimeSeriesHoverTooltip({ plotX, timeLabel, children }: TimeSeriesHoverTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute top-1 z-20 min-w-[7rem] max-w-[14rem] -translate-x-1/2 rounded border border-border-container bg-surface-container px-2.5 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
      style={{ left: plotX }}
      aria-hidden
    >
      <p className="mb-1.5 truncate text-base-small font-semibold text-text-primary tabular-nums">
        {timeLabel}
      </p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

type TimeSeriesHoverRowProps = {
  label: string;
  value: number;
  color?: string;
};

/** Top-to-bottom hover legend order — matches stacked area layers (Critical on top). */
const HOVER_LEGEND_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
  Info: 4,
};

export function seriesForHoverLegend<T extends { id: string; label: string }>(
  series: readonly T[],
): T[] {
  return [...series].sort((a, b) => {
    const order = (item: { id: string; label: string }) =>
      HOVER_LEGEND_ORDER[item.id] ?? HOVER_LEGEND_ORDER[item.label] ?? 50;
    return order(a) - order(b);
  });
}

export function TimeSeriesHoverRow({ label, value, color }: TimeSeriesHoverRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-base-small">
      <span className="flex min-w-0 items-center gap-1.5 text-text-tertiary">
        {color ? (
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        ) : null}
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-semibold tabular-nums text-text-primary">{value}</span>
    </div>
  );
}
