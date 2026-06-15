import type { TimeframeRange } from "../../context/TimeframeContext";
import {
  buildHourlyAxisTicks,
  buildHourlyBuckets,
  findSpikeBucketIndex,
  hourlyEventMultiplier,
} from "../summary-insights/timeframeChartUtils";
import { TIME_SERIES_BAR_FILL } from "../summary-insights/horizontalBarPanel";

export type FsqlSearchEventType = "OSINT Inventory" | "Vulnerability";

export type FsqlSearchResultRow = {
  id: string;
  severity: "Critical";
  title: string;
  time: string;
  activity: string;
  status: "New" | "In Progress";
  eventType: FsqlSearchEventType;
  connector: string;
};

const CONNECTORS = [
  "Prod-SentinelOne",
  "AWS-Crowdstrike Falcon",
  "GCP-Carbon Black Cloud",
  "Corp-Amazon Athena",
  "Dev-Microsoft Defender",
] as const;

const TITLES = [
  "Port scan was detected from 10.0.4.12 targeting internal subnet",
  "Suspicious outbound connection to newly registered domain",
  "Repeated authentication failures from unusual geography",
  "Privileged container launch detected in production namespace",
  "Anomalous DNS tunneling pattern observed from analytics host",
  "Sensitive table bulk export exceeded baseline threshold",
  "Service principal credential rotation outside change window",
  "Unusual API call volume from staging service account",
  "Malware signature match on endpoint during scheduled scan",
  "Policy violation: unsigned binary execution blocked",
  "Lateral movement indicators across three workstation hosts",
  "Data exfiltration attempt via encrypted cloud storage sync",
  "Brute-force login pattern against VPN gateway",
  "Shadow IT application detected with excessive permissions",
  "Critical vulnerability scan finding on edge gateway cluster",
  "Suspicious PowerShell execution chain on finance workstation",
  "Network beaconing to known command-and-control infrastructure",
] as const;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatFsqlRowTime(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/** Result count per hourly bucket — spike hours yield more rows even in a short window. */
function buildHourlyResultCounts(timeframe: TimeframeRange): { buckets: ReturnType<typeof buildHourlyBuckets>; counts: number[] } {
  const buckets = buildHourlyBuckets(timeframe);
  const spikeIndex = findSpikeBucketIndex(buckets, timeframe.to);

  const counts = buckets.map((bucket, index) => {
    const isSpike = spikeIndex === index;
    const multiplier = hourlyEventMultiplier(bucket.start.getHours(), isSpike);
    return Math.max(1, Math.round(2 * multiplier + ((index * 3) % 3)));
  });

  return { buckets, counts };
}

/** Mock result rows distributed across the timeframe; count scales with duration and spikes. */
export function buildFsqlSearchResults(timeframe: TimeframeRange): FsqlSearchResultRow[] {
  const { buckets, counts } = buildHourlyResultCounts(timeframe);
  const fromMs = timeframe.from.getTime();
  const toMs = timeframe.to.getTime();

  const rows: FsqlSearchResultRow[] = [];
  let titleIndex = 0;

  buckets.forEach((bucket, bucketIndex) => {
    const count = counts[bucketIndex];
    const bucketStart = Math.max(bucket.start.getTime(), fromMs);
    const bucketEnd = Math.min(bucket.start.getTime() + 3_600_000, toMs);
    const bucketSpan = Math.max(bucketEnd - bucketStart, 60_000);

    for (let i = 0; i < count; i++) {
      const eventMs = bucketStart + (bucketSpan * (i + 0.5)) / count;
      const eventTime = new Date(Math.min(eventMs, toMs));
      const title = TITLES[titleIndex % TITLES.length];
      titleIndex += 1;

      rows.push({
        id: String(rows.length + 1),
        severity: "Critical",
        title,
        time: formatFsqlRowTime(eventTime),
        activity: "Create",
        status: rows.length % 3 === 0 ? "In Progress" : "New",
        eventType: rows.length % 2 === 0 ? "OSINT Inventory" : "Vulnerability",
        connector: CONNECTORS[rows.length % CONNECTORS.length],
      });
    }
  });

  return rows;
}

/** Hourly result counts for the search timeline chart. Bar height tracks row volume per bucket. */
export function buildFsqlResultsTimeline(timeframe: TimeframeRange) {
  const { buckets, counts } = buildHourlyResultCounts(timeframe);
  const spikeIndex = findSpikeBucketIndex(buckets, timeframe.to);

  const values = counts.map((count, index) => {
    const isSpike = spikeIndex === index;
    const multiplier = hourlyEventMultiplier(buckets[index].start.getHours(), isSpike);
    return Math.max(5, Math.round(count * 14 * (0.9 + multiplier * 0.08)));
  });

  const { labels: xLabels } = buildHourlyAxisTicks(buckets, timeframe);
  const peak = Math.max(...values, 1);
  const yMax = Math.max(100, Math.ceil(peak / 100) * 100);
  const yTicks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax] as const;

  return {
    values,
    xLabels,
    yMax,
    yTicks,
    barColor: TIME_SERIES_BAR_FILL,
    totalResults: counts.reduce((sum, count) => sum + count, 0),
    buckets,
  };
}

export function fsqlResultMatchesSearch(row: FsqlSearchResultRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    row.title,
    row.severity,
    row.time,
    row.activity,
    row.status,
    row.eventType,
    row.connector,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}
