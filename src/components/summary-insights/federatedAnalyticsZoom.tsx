import { useCallback, useState } from "react";
import { useTimeframe, type TimeframeRange } from "../../context/TimeframeContext";
import {
  buildDailyBuckets,
  buildHourlyBuckets,
  findSpikeBucketIndex,
  hourlyEventMultiplier,
  timeframeFromBucketSelection,
  timeframeFromDailyBucketSelection,
  type HourBucket,
} from "./timeframeChartUtils";
import type { TimeSeriesBrushSelection } from "./timeSeriesBarChart";

export function formatAnalyticsRowTime(date: Date): string {
  const pad2 = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function parseAnalyticsRowTime(time: string): Date | null {
  const match = time.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]);
}

export function rowTimeInTimeframe(time: string, range: TimeframeRange): boolean {
  const eventTime = parseAnalyticsRowTime(time);
  if (!eventTime) return true;
  return eventTime.getTime() >= range.from.getTime() && eventTime.getTime() <= range.to.getTime();
}

export function buildHourlyEventRows<T>(
  templates: readonly T[],
  range: TimeframeRange,
  applyRow: (template: T, id: string, eventTime: Date) => T,
): T[] {
  if (templates.length === 0) return [];

  const buckets = buildHourlyBuckets(range);
  const spikeIndex = findSpikeBucketIndex(buckets, range.to);
  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();
  const rows: T[] = [];
  let templateIndex = 0;

  buckets.forEach((bucket, bucketIndex) => {
    const isSpike = spikeIndex === bucketIndex;
    const multiplier = hourlyEventMultiplier(bucket.start.getHours(), isSpike);
    const count = Math.max(1, Math.round(multiplier * 1.2 + ((bucketIndex * 2) % 2)));
    const bucketStart = Math.max(bucket.start.getTime(), fromMs);
    const bucketEnd = Math.min(bucket.start.getTime() + 3_600_000, toMs);
    const bucketSpan = Math.max(bucketEnd - bucketStart, 60_000);

    for (let i = 0; i < count; i++) {
      const template = templates[templateIndex % templates.length];
      templateIndex += 1;
      const eventMs = bucketStart + (bucketSpan * (i + 0.5)) / count;
      rows.push(applyRow(template, String(rows.length + 1), new Date(Math.min(eventMs, toMs))));
    }
  });

  return rows;
}

export function buildDailyEventRows<T>(
  templates: readonly T[],
  range: TimeframeRange,
  applyRow: (template: T, id: string, eventTime: Date) => T,
): T[] {
  if (templates.length === 0) return [];

  const buckets = buildDailyBuckets(range);
  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();
  const endDayMs = new Date(range.to);
  endDayMs.setHours(0, 0, 0, 0);
  const rows: T[] = [];
  let templateIndex = 0;

  buckets.forEach((bucket) => {
    const isSpike = bucket.start.getTime() === endDayMs.getTime();
    const dow = bucket.start.getDay();
    const weekdayMultiplier = dow === 0 || dow === 6 ? 0.7 : 1 + (dow === 4 ? 0.2 : 0);
    const count = Math.max(1, Math.round((isSpike ? 4 : 2) * weekdayMultiplier));
    const bucketStart = Math.max(bucket.start.getTime(), fromMs);
    const bucketEnd = Math.min(bucket.start.getTime() + 86_400_000, toMs);
    const bucketSpan = Math.max(bucketEnd - bucketStart, 60_000);

    for (let i = 0; i < count; i++) {
      const template = templates[templateIndex % templates.length];
      templateIndex += 1;
      const eventMs = bucketStart + (bucketSpan * (i + 0.5)) / count;
      rows.push(applyRow(template, String(rows.length + 1), new Date(Math.min(eventMs, toMs))));
    }
  });

  return rows;
}

export function horizontalBarScale(values: readonly number[]) {
  const peak = Math.max(...values, 1);
  const xMax = Math.max(5, Math.ceil(peak / 5) * 5);
  const step = xMax / 5;
  const xTicks = [0, step, step * 2, step * 3, step * 4, xMax].map((tick) => Math.round(tick));
  return { xMax, xTicks };
}

export function countByLabel<T>(
  rows: readonly T[],
  order: readonly string[],
  getLabel: (row: T) => string,
): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = getLabel(row);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return order.map((label) => ({ label, value: counts.get(label) ?? 0 }));
}

export function topCountsByLabel<T>(
  rows: readonly T[],
  getLabel: (row: T) => string,
  limit: number,
  color: string,
) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = getLabel(row);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value, color }));
}

export function useFederatedAnalyticsTimeframeZoom(mode: "hourly" | "daily" = "hourly") {
  const { range: timeframe, setRange } = useTimeframe();
  const [initialTimeframe] = useState<TimeframeRange>(() => ({
    from: new Date(timeframe.from),
    to: new Date(timeframe.to),
  }));
  const [isChartZoomed, setIsChartZoomed] = useState(false);

  const handleTimelineBrush = useCallback(
    (selection: TimeSeriesBrushSelection, buckets: readonly HourBucket[]) => {
      const nextRange =
        mode === "daily"
          ? timeframeFromDailyBucketSelection(timeframe, buckets, selection.startIndex, selection.endIndex)
          : timeframeFromBucketSelection(timeframe, buckets, selection.startIndex, selection.endIndex);
      if (!nextRange) return;
      setIsChartZoomed(true);
      setRange(nextRange);
    },
    [mode, timeframe, setRange],
  );

  const handleChartZoomReset = useCallback(() => {
    setRange({
      from: new Date(initialTimeframe.from),
      to: new Date(initialTimeframe.to),
    });
    setIsChartZoomed(false);
  }, [initialTimeframe, setRange]);

  return {
    timeframe,
    initialTimeframe,
    isChartZoomed,
    handleTimelineBrush,
    handleChartZoomReset,
  };
}

export function ChartZoomHint({
  unit,
  isChartZoomed,
  onReset,
}: {
  unit: "Hours" | "Days";
  isChartZoomed: boolean;
  onReset: () => void;
}) {
  return (
    <p className="mb-2 pl-9 text-base-small text-text-tertiary">
      {unit} · drag to zoom
      {isChartZoomed ? (
        <>
          {" · "}
          <button
            type="button"
            className="font-semibold text-feedback-caution hover:underline"
            onClick={onReset}
          >
            Reset
          </button>
        </>
      ) : null}
    </p>
  );
}
