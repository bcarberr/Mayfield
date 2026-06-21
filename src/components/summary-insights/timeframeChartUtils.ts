import { normalizeTimeframeRange, type TimeframeRange } from "../../context/TimeframeContext";

export type HourBucket = {
  start: Date;
};

export const SPIKE_CLOCK_HOUR = 13;
/** Evening activity bump — hour bucket covering ~21:00–21:59 (clustered ~21:30). */
export const SECONDARY_SPIKE_CLOCK_HOUR = 21;
export const SECONDARY_SPIKE_CLUSTER_MINUTES = 30;

/** @deprecated Use {@link SECONDARY_SPIKE_CLOCK_HOUR}. */
export const FINDINGS_SECONDARY_SPIKE_CLOCK_HOUR = SECONDARY_SPIKE_CLOCK_HOUR;

export function resolveAnalyticsSpikeIndices(
  buckets: readonly HourBucket[],
  to: Date,
  primarySpikeHour: number = SPIKE_CLOCK_HOUR,
): { spikeIndex: number | null; secondarySpikeIndex: number | null } {
  return {
    spikeIndex: findSpikeBucketIndex(buckets, to, primarySpikeHour),
    secondarySpikeIndex: findSpikeBucketIndexByClockHour(buckets, SECONDARY_SPIKE_CLOCK_HOUR),
  };
}

export function eventTimeForAnalyticsBucket(
  bucket: HourBucket,
  eventIndex: number,
  eventCount: number,
  fromMs: number,
  toMs: number,
  clusterAtMinutes?: number,
): Date {
  const bucketStart = Math.max(bucket.start.getTime(), fromMs);
  const bucketEnd = Math.min(bucket.start.getTime() + 3_600_000, toMs);
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
    timeframeSpansMultipleDays(range) || range.to.getTime() - range.from.getTime() > 36 * 3_600_000
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
    const segmentEnd = markerIdx < markers.length - 1 ? markers[markerIdx + 1].index : bucketCount;
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
    const { start } = buckets[index];
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
    const bucketEnd = new Date(cursor.getTime() + 3_600_000);
    if (bucketEnd.getTime() > from.getTime()) {
      buckets.push({ start: new Date(cursor) });
    }
    cursor.setTime(cursor.getTime() + 3_600_000);
  }

  if (buckets.length === 0) {
    buckets.push({ start: new Date(from) });
  }

  return buckets;
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

export function buildHourlyAxisTicks(
  buckets: readonly HourBucket[],
  range: TimeframeRange,
): { indices: number[]; labels: string[] } {
  const count = buckets.length;
  const spansDays = timeframeSpansMultipleDays(range);
  const includeDateOnMiddle =
    spansDays || range.to.getTime() - range.from.getTime() > 36 * 3_600_000;

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
    // Multi-day charts show dates on a separate day-label row — keep this row time-only.
    const includeDate = spansDays ? false : tickIdx === 0 || tickIdx === indices.length - 1 ? false : includeDateOnMiddle;

    if (tickIdx === 0) return formatBucketTimeLabel(range.from, includeDate);
    if (tickIdx === indices.length - 1) return formatBucketTimeLabel(range.to, includeDate);
    return formatBucketTimeLabel(buckets[index].start, includeDate);
  });

  return { indices, labels };
}

/** Baseline ramp with primary and optional secondary spike buckets. */
export function hourlyEventMultiplier(
  clockHour: number,
  isSpikeBucket: boolean,
  isSecondarySpikeBucket = false,
) {
  if (isSpikeBucket) return 3.8;
  if (isSecondarySpikeBucket) return 2.5;
  if (clockHour < 6) return 0.25;
  if (clockHour < 12) return 0.35 + (clockHour - 6) * 0.08;
  if (clockHour === 12 || clockHour === 14) return 2;
  if (clockHour === 15) return 1.2;
  if (clockHour < 20) return 0.7;
  return 0.4;
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
    const multiplier = hourlyEventMultiplier(bucket.start.getHours(), isSpike, isSecondarySpike);
    return Math.max(1, Math.round(base * multiplier * (0.92 + (index % 3) * 0.04)));
  });
}

/** Map a timeline brush selection to a narrower timeframe range. */
export function timeframeFromBucketSelection(
  timeframe: TimeframeRange,
  buckets: readonly HourBucket[],
  startIndex: number,
  endIndex: number,
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
  const brushTo = new Date(Math.min(endBucket.start.getTime() + 3_600_000, toMs));

  if (brushFrom.getTime() >= brushTo.getTime()) return null;
  return normalizeTimeframeRange(brushFrom, brushTo);
}

/** One bucket per calendar day that overlaps the committed timeframe. */
export function buildDailyBuckets({ from, to }: TimeframeRange): HourBucket[] {
  const msPerDay = 86_400_000;
  const startDay = new Date(from);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(to);
  endDay.setHours(0, 0, 0, 0);
  const buckets: HourBucket[] = [];

  for (let cursor = startDay.getTime(); cursor <= endDay.getTime(); cursor += msPerDay) {
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
  if (buckets.length === 0) return null;

  const msPerDay = 86_400_000;
  const lo = Math.min(startIndex, endIndex);
  const hi = Math.max(startIndex, endIndex);
  const startBucket = buckets[lo];
  const endBucket = buckets[hi];
  if (!startBucket || !endBucket) return null;

  const fromMs = timeframe.from.getTime();
  const toMs = timeframe.to.getTime();
  const brushFrom = new Date(Math.max(startBucket.start.getTime(), fromMs));
  const brushTo = new Date(Math.min(endBucket.start.getTime() + msPerDay, toMs));

  if (brushFrom.getTime() >= brushTo.getTime()) return null;
  return normalizeTimeframeRange(brushFrom, brushTo);
}
