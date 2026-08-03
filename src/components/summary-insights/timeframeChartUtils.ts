import { normalizeTimeframeRange, type TimeframeRange } from "../../context/TimeframeContext";

export type HourBucket = {
  start: Date;
};

export type TimelineGranularity = "hour" | "six-hour" | "day";

export const SPIKE_CLOCK_HOUR = 13;
/** Evening activity bump — hour bucket covering ~21:00–21:59 (clustered ~21:30). */
export const SECONDARY_SPIKE_CLOCK_HOUR = 21;
export const SECONDARY_SPIKE_CLUSTER_MINUTES = 30;

/** @deprecated Use {@link SECONDARY_SPIKE_CLOCK_HOUR}. */
export const FINDINGS_SECONDARY_SPIKE_CLOCK_HOUR = SECONDARY_SPIKE_CLOCK_HOUR;

const MS_PER_HOUR = 3_600_000;
const MS_PER_SIX_HOURS = 6 * MS_PER_HOUR;
const MS_PER_DAY = 86_400_000;

export function timelineGranularityForRange(range: TimeframeRange): TimelineGranularity {
  const spanMs = Math.max(0, range.to.getTime() - range.from.getTime());
  // Hourly only when zoomed into ~2 days — longer ranges need coarser buckets or every bar is 0–3.
  if (spanMs <= 48 * MS_PER_HOUR) return "hour";
  if (spanMs <= 7 * MS_PER_DAY) return "six-hour";
  return "day";
}

export function timelineBucketDurationMs(granularity: TimelineGranularity): number {
  switch (granularity) {
    case "hour":
      return MS_PER_HOUR;
    case "six-hour":
      return MS_PER_SIX_HOURS;
    case "day":
      return MS_PER_DAY;
  }
}

export function timelineZoomUnit(granularity: TimelineGranularity): "Hours" | "Days" {
  return granularity === "day" ? "Days" : "Hours";
}

export function timelineTitleCadence(granularity: TimelineGranularity): string {
  switch (granularity) {
    case "hour":
      return "Per Hour";
    case "six-hour":
      return "Over Time";
    case "day":
      return "Per Day";
  }
}

/** Unique monotonic integer ticks for a y-axis of height `yMax` (inclusive). */
export function niceIntegerYTicks(yMaxInput: number, maxTicks = 5): { yMax: number; yTicks: number[] } {
  const peak = Math.max(1, Math.ceil(yMaxInput));
  if (peak <= 4) {
    const yTicks = Array.from({ length: peak + 1 }, (_, i) => i);
    return { yMax: peak, yTicks };
  }

  const roughStep = peak / Math.max(2, maxTicks - 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = niceResidual * magnitude;
  const yMax = Math.ceil(peak / step) * step;
  const yTicks: number[] = [];
  for (let value = 0; value <= yMax + step / 2; value += step) {
    yTicks.push(Math.round(value));
  }
  if (yTicks[yTicks.length - 1] !== yMax) yTicks.push(yMax);
  return { yMax, yTicks: [...new Set(yTicks)] };
}

export function resolveAnalyticsSpikeIndices(
  buckets: readonly HourBucket[],
  to: Date,
  primarySpikeHour: number = SPIKE_CLOCK_HOUR,
  durationMs: number = MS_PER_HOUR,
): { spikeIndex: number | null; secondarySpikeIndex: number | null } {
  const primary = new Date(to);
  primary.setHours(primarySpikeHour, 0, 0, 0);
  const secondary = new Date(to);
  secondary.setHours(SECONDARY_SPIKE_CLOCK_HOUR, 0, 0, 0);

  return {
    spikeIndex: findBucketIndexContaining(buckets, primary, durationMs),
    secondarySpikeIndex:
      findBucketIndexContainingTimeOfDay(buckets, SECONDARY_SPIKE_CLOCK_HOUR, durationMs) ??
      findBucketIndexContaining(buckets, secondary, durationMs),
  };
}

export function findBucketIndexContaining(
  buckets: readonly HourBucket[],
  instant: Date,
  durationMs: number,
): number | null {
  const ms = instant.getTime();
  for (let i = 0; i < buckets.length; i++) {
    const start = buckets[i]!.start.getTime();
    if (ms >= start && ms < start + durationMs) return i;
  }
  if (buckets.length > 0) {
    const last = buckets[buckets.length - 1]!;
    const start = last.start.getTime();
    if (ms >= start && ms <= start + durationMs) return buckets.length - 1;
  }
  return null;
}

function findBucketIndexContainingTimeOfDay(
  buckets: readonly HourBucket[],
  clockHour: number,
  durationMs: number,
): number | null {
  let lastMatch: number | null = null;
  buckets.forEach((bucket, index) => {
    if (durationMs >= MS_PER_DAY) {
      lastMatch = index;
      return;
    }
    const probe = new Date(bucket.start);
    probe.setHours(clockHour, 0, 0, 0);
    if (probe.getTime() < bucket.start.getTime()) probe.setDate(probe.getDate() + 1);
    if (probe.getTime() >= bucket.start.getTime() && probe.getTime() < bucket.start.getTime() + durationMs) {
      lastMatch = index;
    }
  });
  return lastMatch;
}

export function eventTimeForAnalyticsBucket(
  bucket: HourBucket,
  eventIndex: number,
  eventCount: number,
  fromMs: number,
  toMs: number,
  clusterAtMinutes?: number,
  durationMs: number = MS_PER_HOUR,
): Date {
  const bucketStart = Math.max(bucket.start.getTime(), fromMs);
  const bucketEnd = Math.min(bucket.start.getTime() + durationMs, toMs);
  const bucketSpan = Math.max(bucketEnd - bucketStart, 60_000);

  if (clusterAtMinutes != null) {
    const clusterStart = bucket.start.getTime() + clusterAtMinutes * 60_000;
    const jitterSeconds = (eventIndex % 6) * 10;
    const eventMs = clusterStart + jitterSeconds * 1000;
    return new Date(Math.min(Math.max(eventMs, bucketStart), toMs));
  }

  const eventMs = bucketStart + (bucketSpan * (eventIndex + 0.5)) / eventCount;
  return new Date(Math.min(eventMs, toMs));
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatBucketDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function formatBucketTimeLabel(date: Date, includeDate = false): string {
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  if (!includeDate) return time;

  return `${formatBucketDateLabel(date)} ${time}`;
}

/** True when the committed range covers more than one local calendar day. */
export function timeframeSpansMultipleDays({ from, to }: TimeframeRange): boolean {
  const startDay = new Date(from);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(to);
  endDay.setHours(0, 0, 0, 0);
  return endDay.getTime() > startDay.getTime();
}

/** Per-bucket x-axis labels include the date when the range is long or multi-day. */
export function shouldIncludeDateInBucketLabels(range: TimeframeRange): boolean {
  return (
    timeframeSpansMultipleDays(range) || range.to.getTime() - range.from.getTime() > 36 * MS_PER_HOUR
  );
}

export type DayBoundaryMarker = {
  /** Bucket index where the new calendar day begins (local midnight). */
  index: number;
  label: string;
};

export type DayLabelPosition = {
  label: string;
  /** Horizontal center of the calendar day span, as a percentage of plot width. */
  centerPercent: number;
};

/** Center each day label under its bucket span (midnight to next midnight or chart end). */
export function buildDayLabelPositions(
  markers: readonly DayBoundaryMarker[],
  bucketCount: number,
): DayLabelPosition[] {
  if (bucketCount <= 0 || markers.length === 0) return [];

  return markers.map((marker, markerIdx) => {
    const segmentEnd = markerIdx < markers.length - 1 ? markers[markerIdx + 1]!.index : bucketCount;
    const centerIndex = (marker.index + segmentEnd) / 2;
    return {
      label: marker.label,
      centerPercent: (centerIndex / bucketCount) * 100,
    };
  });
}

/** Midnight bucket starts after the first bucket — one marker per day rollover. */
export function buildDayBoundaryMarkers(buckets: readonly HourBucket[]): DayBoundaryMarker[] {
  const markers: DayBoundaryMarker[] = [];

  for (let index = 1; index < buckets.length; index++) {
    const { start } = buckets[index]!;
    if (start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0) {
      markers.push({ index, label: formatBucketDateLabel(start) });
    }
  }

  return markers;
}

/** One bucket per clock hour that overlaps the committed timeframe. */
export function buildHourlyBuckets({ from, to }: TimeframeRange): HourBucket[] {
  const cursor = new Date(from);
  cursor.setMinutes(0, 0, 0);

  const buckets: HourBucket[] = [];

  while (cursor.getTime() <= to.getTime()) {
    const bucketEnd = new Date(cursor.getTime() + MS_PER_HOUR);
    if (bucketEnd.getTime() > from.getTime()) {
      buckets.push({ start: new Date(cursor) });
    }
    cursor.setTime(cursor.getTime() + MS_PER_HOUR);
  }

  if (buckets.length === 0) {
    buckets.push({ start: new Date(from) });
  }

  return buckets;
}

/** Six-hour buckets aligned to 00/06/12/18 local. */
export function buildSixHourBuckets({ from, to }: TimeframeRange): HourBucket[] {
  const cursor = new Date(from);
  cursor.setMinutes(0, 0, 0);
  cursor.setHours(Math.floor(cursor.getHours() / 6) * 6);

  const buckets: HourBucket[] = [];
  while (cursor.getTime() <= to.getTime()) {
    const bucketEnd = cursor.getTime() + MS_PER_SIX_HOURS;
    if (bucketEnd > from.getTime()) {
      buckets.push({ start: new Date(cursor) });
    }
    cursor.setTime(cursor.getTime() + MS_PER_SIX_HOURS);
  }

  if (buckets.length === 0) {
    buckets.push({ start: new Date(from) });
  }

  return buckets;
}

/** Pick hour / 6-hour / day buckets from the committed timeframe span. */
export function buildAnalyticsTimelineBuckets(range: TimeframeRange): {
  buckets: HourBucket[];
  granularity: TimelineGranularity;
  durationMs: number;
} {
  const granularity = timelineGranularityForRange(range);
  const durationMs = timelineBucketDurationMs(granularity);
  const buckets =
    granularity === "hour"
      ? buildHourlyBuckets(range)
      : granularity === "six-hour"
        ? buildSixHourBuckets(range)
        : buildDailyBuckets(range);
  return { buckets, granularity, durationMs };
}

export function findSpikeBucketIndex(
  buckets: readonly HourBucket[],
  to: Date,
  spikeClockHour: number = SPIKE_CLOCK_HOUR,
): number | null {
  const idx = buckets.findIndex(
    (bucket) =>
      bucket.start.getFullYear() === to.getFullYear() &&
      bucket.start.getMonth() === to.getMonth() &&
      bucket.start.getDate() === to.getDate() &&
      bucket.start.getHours() === spikeClockHour,
  );
  return idx >= 0 ? idx : null;
}

/** Last hourly bucket in range with the given clock hour (e.g. 21:00 for ~21:03 activity). */
export function findSpikeBucketIndexByClockHour(
  buckets: readonly HourBucket[],
  clockHour: number,
): number | null {
  let lastMatch: number | null = null;
  buckets.forEach((bucket, index) => {
    if (bucket.start.getHours() === clockHour) lastMatch = index;
  });
  return lastMatch;
}

export function buildTimelineAxisTicks(
  buckets: readonly HourBucket[],
  range: TimeframeRange,
  granularity: TimelineGranularity,
): { indices: number[]; labels: string[] } {
  const count = buckets.length;
  const spansDays = timeframeSpansMultipleDays(range);

  const indices =
    count <= 5
      ? Array.from({ length: count }, (_, index) => index)
      : [
          0,
          Math.floor(count * 0.25),
          Math.floor(count * 0.5),
          Math.floor(count * 0.75),
          count - 1,
        ];

  const labels = indices.map((index, tickIdx) => {
    const bucket = buckets[index]!;
    if (granularity === "day") {
      if (tickIdx === 0) return formatBucketDateLabel(range.from);
      if (tickIdx === indices.length - 1) return formatBucketDateLabel(range.to);
      return formatBucketDateLabel(bucket.start);
    }

    const includeDateOnMiddle = shouldIncludeDateInBucketLabels(range);
    const includeDate =
      spansDays ? false : tickIdx === 0 || tickIdx === indices.length - 1 ? false : includeDateOnMiddle;

    if (tickIdx === 0) return formatBucketTimeLabel(range.from, includeDate);
    if (tickIdx === indices.length - 1) return formatBucketTimeLabel(range.to, includeDate);
    return formatBucketTimeLabel(bucket.start, includeDate || (granularity === "six-hour" && spansDays));
  });

  return { indices, labels };
}

/** @deprecated Prefer {@link buildTimelineAxisTicks}. */
export function buildHourlyAxisTicks(
  buckets: readonly HourBucket[],
  range: TimeframeRange,
): { indices: number[]; labels: string[] } {
  return buildTimelineAxisTicks(buckets, range, "hour");
}

/**
 * Business-hours heavy diurnal curve for security telemetry demos.
 * Overnight and late evening stay near floor; midday peaks.
 */
export function hourlyEventMultiplier(
  clockHour: number,
  isSpikeBucket: boolean,
  isSecondarySpikeBucket = false,
) {
  if (isSpikeBucket) return 4.2;
  if (isSecondarySpikeBucket) return 2.4;
  if (clockHour < 5) return 0.06;
  if (clockHour < 7) return 0.18;
  if (clockHour < 9) return 0.55 + (clockHour - 7) * 0.35;
  if (clockHour < 12) return 1.15 + (clockHour - 9) * 0.12;
  if (clockHour === 12 || clockHour === 13) return 1.9;
  if (clockHour < 17) return 1.45;
  if (clockHour < 19) return 0.7;
  if (clockHour < 22) return 0.28;
  return 0.1;
}

/** Weekend dampening for identity/auth-like telemetry. */
export function weekendActivityFactor(day: Date): number {
  const dow = day.getDay();
  return dow === 0 || dow === 6 ? 0.32 : 1;
}

/** Deterministic 0..1 noise — stable across reloads for the same calendar inputs. */
export function demoNoise(...seeds: number[]): number {
  let hash = 2166136261;
  for (const seed of seeds) {
    hash ^= seed >>> 0;
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10_000) / 10_000;
}

/** Mon–Thu busy, Fri lighter, weekend handled via {@link weekendActivityFactor}. */
export function weekdayVolumeFactor(day: Date): number {
  // Sun..Sat
  const factors = [0.9, 1.08, 1.15, 1.12, 1.18, 0.82, 0.95] as const;
  return factors[day.getDay()]!;
}

/**
 * Day-level amplitude so 14d/30d/90d charts aren't a flat weekday copy.
 * Includes quiet days and occasional incident spikes.
 */
export function dailyAmplitudeFactor(day: Date): number {
  const n = demoNoise(day.getFullYear(), day.getMonth() + 1, day.getDate(), 41);
  // Wide base band (~0.35–1.55) so daily stacks read as real volume swings.
  let amp = 0.35 + n * 1.2;
  if (n > 0.86) amp *= 1.9 + (n - 0.86) * 3.5;
  if (n < 0.14) amp *= 0.35 + n * 1.5;
  // Mild week-of-month wave (early month quieter, mid-month busier).
  const dayOfMonth = day.getDate();
  amp *= 0.82 + Math.sin((dayOfMonth / 31) * Math.PI) * 0.32;
  return amp;
}

/** Per-hour jitter on top of the diurnal curve. */
export function hourlyJitterFactor(day: Date, clockHour: number, bucketIndex: number): number {
  const n = demoNoise(day.getFullYear(), day.getMonth() + 1, day.getDate(), clockHour, bucketIndex, 7);
  return 0.78 + n * 0.48;
}

/** True for a few mid-range "incident" days on longer timeframes. */
export function isDemoIncidentDay(day: Date): boolean {
  const n = demoNoise(day.getFullYear(), day.getMonth() + 1, day.getDate(), 99);
  return n > 0.88;
}

export function hourlySeverityValues(
  base: number,
  buckets: readonly HourBucket[],
  spikeIndex: number | null,
  secondarySpikeIndex: number | null = null,
): number[] {
  return buckets.map((bucket, index) => {
    const isSpike = spikeIndex === index;
    const isSecondarySpike = secondarySpikeIndex === index;
    const clockHour = bucket.start.getHours();
    const multiplier = hourlyEventMultiplier(clockHour, isSpike, isSecondarySpike);
    const weekend = weekendActivityFactor(bucket.start);
    const weekday = weekdayVolumeFactor(bucket.start);
    const dayAmp = dailyAmplitudeFactor(bucket.start);
    const jitter = hourlyJitterFactor(bucket.start, clockHour, index);
    const incidentBoost = isDemoIncidentDay(bucket.start) && clockHour >= 9 && clockHour <= 17 ? 1.55 : 1;
    return Math.max(
      0,
      Math.round(base * multiplier * weekend * weekday * dayAmp * jitter * incidentBoost),
    );
  });
}

/** Map a timeline brush selection to a narrower timeframe range. */
export function timeframeFromBucketSelection(
  timeframe: TimeframeRange,
  buckets: readonly HourBucket[],
  startIndex: number,
  endIndex: number,
  durationMs: number = MS_PER_HOUR,
): TimeframeRange | null {
  if (buckets.length === 0) return null;

  const lo = Math.min(startIndex, endIndex);
  const hi = Math.max(startIndex, endIndex);
  const startBucket = buckets[lo];
  const endBucket = buckets[hi];
  if (!startBucket || !endBucket) return null;

  const fromMs = timeframe.from.getTime();
  const toMs = timeframe.to.getTime();
  const brushFrom = new Date(Math.max(startBucket.start.getTime(), fromMs));
  const brushTo = new Date(Math.min(endBucket.start.getTime() + durationMs, toMs));

  if (brushFrom.getTime() >= brushTo.getTime()) return null;
  return normalizeTimeframeRange(brushFrom, brushTo);
}

/** One bucket per calendar day that overlaps the committed timeframe. */
export function buildDailyBuckets({ from, to }: TimeframeRange): HourBucket[] {
  const startDay = new Date(from);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(to);
  endDay.setHours(0, 0, 0, 0);
  const buckets: HourBucket[] = [];

  for (let cursor = startDay.getTime(); cursor <= endDay.getTime(); cursor += MS_PER_DAY) {
    buckets.push({ start: new Date(cursor) });
  }

  if (buckets.length === 0) {
    buckets.push({ start: new Date(from) });
  }

  return buckets;
}

/** Map a daily timeline brush selection to a narrower timeframe range. */
export function timeframeFromDailyBucketSelection(
  timeframe: TimeframeRange,
  buckets: readonly HourBucket[],
  startIndex: number,
  endIndex: number,
): TimeframeRange | null {
  return timeframeFromBucketSelection(timeframe, buckets, startIndex, endIndex, MS_PER_DAY);
}
