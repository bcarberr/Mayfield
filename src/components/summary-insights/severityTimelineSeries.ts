import type { SeverityShapeIconName } from "../../design-system";
import type { TimeframeRange } from "../../context/TimeframeContext";
import { hourlySeverityValuesFromRows } from "./federatedAnalyticsZoom";
import {
  buildAnalyticsTimelineBuckets,
  buildTimelineAxisTicks,
  formatBucketDateLabel,
  formatBucketTimeLabel,
  niceIntegerYTicks,
  resolveAnalyticsSpikeIndices,
  SPIKE_CLOCK_HOUR,
  timelineTitleCadence,
  timelineZoomUnit,
  type HourBucket,
  type TimelineGranularity,
} from "./timeframeChartUtils";

/** Bottom → top stack order for severity timelines (MHC only — Low/Info stay in the severity widget). */
export const SEVERITY_TIMELINE_STACK_ORDER = [
  "Medium",
  "High",
  "Critical",
] as const;

export type SeverityTimelineSeriesStyle = {
  color: string;
  icon: SeverityShapeIconName;
  label?: string;
};

export type SeverityTimelineSeries = {
  id: string;
  label: string;
  color: string;
  icon: SeverityShapeIconName;
  values: number[];
};

/** Build stacked severity series from filtered event rows. */
export function buildSeverityTimelineSeries<T>(
  rows: readonly T[],
  buckets: readonly HourBucket[],
  styles: Record<string, SeverityTimelineSeriesStyle>,
  getSeverity: (row: T) => string,
  getTime: (row: T) => Date | null,
  order: readonly string[] = SEVERITY_TIMELINE_STACK_ORDER,
  durationMs = 3_600_000,
): SeverityTimelineSeries[] {
  return order.map((id) => {
    const style = styles[id];
    return {
      id,
      label: style?.label ?? id,
      color: style?.color ?? "#9e9e9e",
      icon: style?.icon ?? "severity-info",
      values: hourlySeverityValuesFromRows(rows, buckets, id, getSeverity, getTime, durationMs),
    };
  });
}

/** Map widget "Info" labels to row/timeline "Informational" ids for legend selection. */
export function normalizeSeverityFilterIds(filters: Iterable<string>): string[] {
  return [...filters].map((id) => (id === "Info" ? "Informational" : id));
}

export type SeverityTimelineChartModel = {
  series: SeverityTimelineSeries[];
  xLabels: string[];
  xTickIndices: number[];
  xTickLabels: string[];
  spikeHighlight: { index: number; label: string } | undefined;
  buckets: HourBucket[];
  granularity: TimelineGranularity;
  durationMs: number;
  zoomUnit: "Hours" | "Days";
  titleCadence: string;
  yMax: number;
  yTicks: number[];
};

function bucketXLabel(bucket: HourBucket, granularity: TimelineGranularity, includeDate: boolean): string {
  if (granularity === "day") return formatBucketDateLabel(bucket.start);
  return formatBucketTimeLabel(bucket.start, includeDate || granularity === "six-hour");
}

/** Adaptive-bucket severity timeline derived from filtered rows. */
export function buildSeverityTimelineChart<T>(
  timeframe: TimeframeRange,
  rows: readonly T[],
  styles: Record<string, SeverityTimelineSeriesStyle>,
  getSeverity: (row: T) => string,
  getTime: (row: T) => Date | null,
  options?: {
    primarySpikeHour?: number;
    spikeLabel?: string;
  },
): SeverityTimelineChartModel {
  const { buckets, granularity, durationMs } = buildAnalyticsTimelineBuckets(timeframe);
  const { spikeIndex } = resolveAnalyticsSpikeIndices(
    buckets,
    timeframe.to,
    options?.primarySpikeHour ?? SPIKE_CLOCK_HOUR,
    durationMs,
  );
  const includeDate = granularity !== "hour";
  const xLabels = buckets.map((bucket) => bucketXLabel(bucket, granularity, includeDate));
  const { indices: xTickIndices, labels: xTickLabels } = buildTimelineAxisTicks(
    buckets,
    timeframe,
    granularity,
  );

  const series = buildSeverityTimelineSeries(rows, buckets, styles, getSeverity, getTime, undefined, durationMs);
  const stackedPeak = Math.max(
    1,
    ...buckets.map((_, index) => series.reduce((sum, item) => sum + (item.values[index] ?? 0), 0)),
  );
  const { yMax, yTicks } = niceIntegerYTicks(stackedPeak);

  const spikeHighlight =
    spikeIndex != null
      ? {
          index: spikeIndex,
          label:
            options?.spikeLabel ??
            (granularity === "day"
              ? `spike ${formatBucketDateLabel(buckets[spikeIndex]!.start)}`
              : `spike ~${options?.primarySpikeHour ?? SPIKE_CLOCK_HOUR}:00`),
        }
      : undefined;

  return {
    series,
    xLabels,
    xTickIndices,
    xTickLabels,
    spikeHighlight,
    buckets,
    granularity,
    durationMs,
    zoomUnit: timelineZoomUnit(granularity),
    titleCadence: timelineTitleCadence(granularity),
    yMax,
    yTicks,
  };
}
