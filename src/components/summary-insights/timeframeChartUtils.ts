import { normalizeTimeframeRange, type TimeframeRange } from "../../context/TimeframeContext";

export type HourBucket = {
  start: Date;
};

export const SPIKE_CLOCK_HOUR = 13;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatBucketTimeLabel(date: Date, includeDate = false): string {
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  if (!includeDate) return time;

  const datePart = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  return `${datePart} ${time}`;
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

export function buildHourlyAxisTicks(
  buckets: readonly HourBucket[],
  range: TimeframeRange,
): { indices: number[]; labels: string[] } {
  const count = buckets.length;
  const includeDate = range.to.getTime() - range.from.getTime() > 36 * 3_600_000;

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
    if (tickIdx === 0) return formatBucketTimeLabel(range.from, includeDate);
    if (tickIdx === indices.length - 1) return formatBucketTimeLabel(range.to, includeDate);
    return formatBucketTimeLabel(buckets[index].start, includeDate);
  });

  return { indices, labels };
}

/** Baseline ramp with a pronounced spike bucket when present in the range. */
export function hourlyEventMultiplier(clockHour: number, isSpikeBucket: boolean) {
  if (isSpikeBucket) return 3.8;
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
): number[] {
  return buckets.map((bucket, index) => {
    const isSpike = spikeIndex === index;
    const multiplier = hourlyEventMultiplier(bucket.start.getHours(), isSpike);
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
