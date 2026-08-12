import { useCallback } from "react";
import { Info } from "lucide-react";
import { useTimeframe, type TimeframeRange } from "../../context/TimeframeContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shadcn/tooltip";
import {
  buildDailyBuckets,
  buildHourlyBuckets,
  dailyAmplitudeFactor,
  demoNoise,
  eventTimeForAnalyticsBucket,
  hourlyEventMultiplier,
  hourlyJitterFactor,
  isDemoIncidentDay,
  niceIntegerYTicks,
  resolveAnalyticsSpikeIndices,
  SECONDARY_SPIKE_CLUSTER_MINUTES,
  timeframeFromBucketSelection,
  timeframeFromDailyBucketSelection,
  weekdayVolumeFactor,
  weekendActivityFactor,
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

/** Hourly bucket index for an event time, or -1 when outside the series. */
export function hourlyBucketIndexForTime(
  eventTime: Date,
  buckets: readonly HourBucket[],
  durationMs = 3_600_000,
): number {
  const ms = eventTime.getTime();
  for (let i = 0; i < buckets.length; i++) {
    const start = buckets[i]!.start.getTime();
    const end = start + durationMs;
    if (ms >= start && ms < end) return i;
  }
  if (buckets.length > 0) {
    const lastStart = buckets[buckets.length - 1]!.start.getTime();
    if (ms >= lastStart && ms <= lastStart + durationMs) return buckets.length - 1;
  }
  return -1;
}

/** Count rows into one severity series aligned to timeline buckets. */
export function hourlySeverityValuesFromRows<T>(
  rows: readonly T[],
  buckets: readonly HourBucket[],
  severityId: string,
  getSeverity: (row: T) => string,
  getTime: (row: T) => Date | null,
  durationMs = 3_600_000,
): number[] {
  const values = buckets.map(() => 0);
  for (const row of rows) {
    if (getSeverity(row) !== severityId) continue;
    const eventTime = getTime(row);
    if (!eventTime) continue;
    const index = hourlyBucketIndexForTime(eventTime, buckets, durationMs);
    if (index >= 0) values[index] += 1;
  }
  return values;
}

/** Count rows into daily buckets (start-of-day timestamps). */
export function dailyValuesFromRows<T>(
  rows: readonly T[],
  buckets: readonly HourBucket[],
  getTime: (row: T) => Date | null,
): number[] {
  const values = buckets.map(() => 0);
  const indexByDay = new Map(buckets.map((bucket, index) => [bucket.start.getTime(), index]));
  for (const row of rows) {
    const eventTime = getTime(row);
    if (!eventTime) continue;
    const day = new Date(eventTime);
    day.setHours(0, 0, 0, 0);
    const index = indexByDay.get(day.getTime());
    if (index != null) values[index] += 1;
  }
  return values;
}

export function niceChartYScale(values: readonly number[]): { yMax: number; yTicks: number[] } {
  return niceIntegerYTicks(Math.max(...values, 1));
}

/** Prefer Low/Info volume so severity charts match typical security telemetry. */
const DEMO_SEVERITY_WEIGHT: Record<string, number> = {
  Critical: 5,
  High: 12,
  Medium: 20,
  Low: 28,
  Informational: 35,
};

function templateSeverityWeight(template: unknown): number {
  if (template && typeof template === "object" && "severity" in template) {
    const severity = String((template as { severity: string }).severity);
    return DEMO_SEVERITY_WEIGHT[severity] ?? 10;
  }
  return 10;
}

/** Deterministic weighted pick so demos stay stable across reloads. */
function pickWeightedTemplate<T>(templates: readonly T[], salt: number): T {
  const weights = templates.map(templateSeverityWeight);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = ((salt * 17 + 23) % total + total) % total;
  for (let i = 0; i < templates.length; i++) {
    cursor -= weights[i]!;
    if (cursor < 0) return templates[i]!;
  }
  return templates[templates.length - 1]!;
}

export type BuildHourlyEventRowsOptions<T> = {
  primarySpikeHour?: number;
  secondarySpikeTemplates?: readonly T[];
};

export function buildHourlyEventRows<T>(
  templates: readonly T[],
  range: TimeframeRange,
  applyRow: (template: T, id: string, eventTime: Date) => T,
  options?: BuildHourlyEventRowsOptions<T>,
): T[] {
  if (templates.length === 0) return [];

  const buckets = buildHourlyBuckets(range);
  const { spikeIndex, secondarySpikeIndex } = resolveAnalyticsSpikeIndices(
    buckets,
    range.to,
    options?.primarySpikeHour,
  );
  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();
  const rows: T[] = [];
  let pickSalt = 0;

  buckets.forEach((bucket, bucketIndex) => {
    const isSpike = spikeIndex === bucketIndex;
    const isSecondarySpike = secondarySpikeIndex === bucketIndex;
    const clockHour = bucket.start.getHours();
    const multiplier = hourlyEventMultiplier(clockHour, isSpike, isSecondarySpike);
    const weekend = weekendActivityFactor(bucket.start);
    const weekday = weekdayVolumeFactor(bucket.start);
    const dayAmp = dailyAmplitudeFactor(bucket.start);
    const jitter = hourlyJitterFactor(bucket.start, clockHour, bucketIndex);
    const incidentBoost = isDemoIncidentDay(bucket.start) && clockHour >= 9 && clockHour <= 17 ? 1.55 : 1;
    // Day-to-day + hour jitter so longer ranges don't look copy-pasted.
    const count = Math.max(
      isSpike || isSecondarySpike ? 12 : 0,
      Math.round(multiplier * 13 * weekend * weekday * dayAmp * jitter * incidentBoost),
    );
    const secondaryTemplates = options?.secondarySpikeTemplates;

    for (let i = 0; i < count; i++) {
      let template: T;
      if (isSecondarySpike && secondaryTemplates?.length && i < secondaryTemplates.length) {
        template = secondaryTemplates[i]!;
      } else {
        template = pickWeightedTemplate(templates, pickSalt);
        pickSalt += 1;
      }

      const eventTime = eventTimeForAnalyticsBucket(
        bucket,
        i,
        count,
        fromMs,
        toMs,
        isSecondarySpike ? SECONDARY_SPIKE_CLUSTER_MINUTES : undefined,
      );
      rows.push(applyRow(template, String(rows.length + 1), eventTime));
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
  let pickSalt = 0;

  buckets.forEach((bucket, bucketIndex) => {
    const isSpike = bucket.start.getTime() === endDayMs.getTime();
    const weekend = weekendActivityFactor(bucket.start);
    const weekday = weekdayVolumeFactor(bucket.start);
    const dayAmp = dailyAmplitudeFactor(bucket.start);
    const incident = isDemoIncidentDay(bucket.start);
    const wave = 0.9 + Math.sin((bucketIndex / Math.max(buckets.length - 1, 1)) * Math.PI * 2.2) * 0.18;
    const base = isSpike ? 42 : incident ? 28 : 12;
    const count = Math.max(
      1,
      Math.round(base * weekend * weekday * dayAmp * wave * (0.85 + demoNoise(bucketIndex, 13) * 0.4)),
    );
    const bucketStart = Math.max(bucket.start.getTime(), fromMs);
    const bucketEnd = Math.min(bucket.start.getTime() + 86_400_000, toMs);
    const bucketSpan = Math.max(bucketEnd - bucketStart, 60_000);

    for (let i = 0; i < count; i++) {
      const template = pickWeightedTemplate(templates, pickSalt);
      pickSalt += 1;
      // Spread events through the day with business-hours bias via index mix.
      const hourBias = 0.2 + demoNoise(bucketIndex, i, 5) * 0.55;
      const eventMs = bucketStart + bucketSpan * hourBias;
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

export function useFederatedAnalyticsTimeframeZoom(mode: "hourly" | "daily" | "adaptive" = "adaptive") {
  const {
    range: timeframe,
    analyticsBaselineRange: initialTimeframe,
    isAnalyticsChartZoomed: isChartZoomed,
    applyAnalyticsChartZoom,
    resetAnalyticsChartZoom,
  } = useTimeframe();

  const handleTimelineBrush = useCallback(
    (selection: TimeSeriesBrushSelection, buckets: readonly HourBucket[], durationMs = 3_600_000) => {
      const nextRange =
        mode === "daily"
          ? timeframeFromDailyBucketSelection(timeframe, buckets, selection.startIndex, selection.endIndex)
          : timeframeFromBucketSelection(
              timeframe,
              buckets,
              selection.startIndex,
              selection.endIndex,
              mode === "hourly" ? 3_600_000 : durationMs,
            );
      if (!nextRange) return;
      applyAnalyticsChartZoom(nextRange);
    },
    [mode, timeframe, applyAnalyticsChartZoom],
  );

  return {
    timeframe,
    initialTimeframe,
    isChartZoomed,
    handleTimelineBrush,
    handleChartZoomReset: resetAnalyticsChartZoom,
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
    <p className="mb-2 flex items-center pl-9 text-base-small text-text-tertiary">
      <span>{unit} · drag to zoom</span>
      <Tooltip>
        <TooltipTrigger className="ml-1 inline-flex cursor-default items-center">
          <Info size={12} className="text-text-tertiary" aria-label="About zoom" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px]">
          Zoom stays with you. Drag to zoom on any chart and the selected time range persists across all tabs and search results, until you're ready to reset it.
        </TooltipContent>
      </Tooltip>
      {isChartZoomed ? (
        <span className="ml-2 inline-flex items-center gap-1">
          <span aria-hidden>·</span>
          <button
            type="button"
            className="font-semibold text-feedback-caution hover:underline"
            onClick={onReset}
          >
            Reset
          </button>
        </span>
      ) : null}
    </p>
  );
}
