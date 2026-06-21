import { useMemo, useState } from "react";
import { DATA_GRID_ABOVE_SECTION_CLASS, DATA_GRID_HEADER_ROW_CLASS, DATA_GRID_RESULTS_SEARCH_PLACEHOLDER, DATA_GRID_TABLE_CLASS, DATA_GRID_TABLE_SCROLL_CLASS, DATA_GRID_THEAD_CLASS } from "../ui/dataGridTableStyles";
import { Checkbox, Icon, type SeverityShapeIconName } from "../../design-system";
import type { TimeframeRange } from "../../context/TimeframeContext";
import { Button } from "@/components/shadcn/button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { DonutChartPanel } from "../ui/DonutChartPanel";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { compareStrings } from "../ui/useColumnSort";
import { useSortedDataGridPagination } from "../ui/useSortedDataGridPagination";
import { DataGridSection } from "../ui/DataGridSection";
import { DataGridPaginationFooter } from "../ui/DataGridTableLayout";
import { useResizableColumns } from "../ui/useResizableColumns";
import { TruncatedText } from "../ui/TruncatedText";
import { demoTableConnector } from "../connectors/demoTableConnectors";
import { ConnectorTableCell } from "../ui/ConnectorTableCell";
import {
  buildDailyEventRows,
  ChartZoomHint,
  countByLabel,
  formatAnalyticsRowTime,
  horizontalBarScale,
  rowTimeInTimeframe,
  useFederatedAnalyticsTimeframeZoom,
} from "./federatedAnalyticsZoom";
import { CHART_CATEGORY_FILL, HorizontalBarPanel } from "./horizontalBarPanel";
import { cx, InsightCard } from "./datavisCard";
import { TimeSeriesBarChart } from "./timeSeriesBarChart";
import { buildDailyBuckets, type HourBucket } from "./timeframeChartUtils";

type DiscoverySeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const SEV_BAR: Record<DiscoverySeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const SEV_ICONS: Record<DiscoverySeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  Informational: "severity-info",
};

const SEVERITY_ORDER: Record<DiscoverySeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};

const PLATFORM_UNKNOWN_FILL = "#717882";
const NEW_ASSETS_LINE = "#4a9eff";

type DevicePlatform = "Windows" | "macOS" | "Linux" | "Cloud / SaaS" | "Unknown";

type PatchStatus = "Up to date" | "Missing non-crit" | "Missing critical" | "Unknown";

type DiscoveryEventClass =
  | "Device Inventory Info"
  | "Software Inventory Info"
  | "Cloud Resources Inventory Info"
  | "User Inventory Info";

type DiscoveryRow = {
  id: string;
  severity: DiscoverySeverity;
  title: string;
  time: string;
  activity: string;
  eventClass: DiscoveryEventClass;
  asset: string;
  owner: string;
  platform: DevicePlatform;
  patchStatus: PatchStatus;
  connector: string;
};

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type DailyDiscoveryChart = {
  xLabels: string[];
  values: number[];
  spikeIndex: number | null;
  spikeLabel: string;
  yMax: number;
  yTicks: number[];
  buckets: HourBucket[];
};

function buildDailyDiscoveryChart(range: TimeframeRange): DailyDiscoveryChart {
  const buckets = buildDailyBuckets(range);
  const useDate = buckets.length > 7;
  const endDayMs = new Date(range.to);
  endDayMs.setHours(0, 0, 0, 0);

  const xLabels: string[] = [];
  const values: number[] = [];
  let spikeIndex: number | null = null;

  buckets.forEach((bucket, i) => {
    const day = bucket.start;
    if (useDate) {
      xLabels.push(new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(day));
    } else {
      xLabels.push(WEEKDAY_SHORT[day.getDay()]);
    }

    const isSpike = day.getTime() === endDayMs.getTime();
    if (isSpike) spikeIndex = i;
    const base = 12;
    const dow = day.getDay();
    const weekdayMultiplier = dow === 0 || dow === 6 ? 0.7 : 1.0 + (dow === 4 ? 0.2 : 0);
    const value = isSpike ? 38 : Math.max(8, Math.round(base * weekdayMultiplier * (0.9 + (i % 3) * 0.1)));
    values.push(value);
  });

  const peak = Math.max(...values, 10);
  const yMax = Math.ceil(peak / 10) * 10;
  const step = yMax / 4;
  const yTicks = [0, step, step * 2, step * 3, yMax];

  const spikeDayOfWeek = spikeIndex != null ? WEEKDAY_SHORT[endDayMs.getDay()] : "Thu";
  const spikeLabel = `${spikeDayOfWeek} spike: ${values[spikeIndex ?? 0] ?? 38} new cloud resources in us-east-2, no IaC tag`;

  return { xLabels, values, spikeIndex, spikeLabel, yMax, yTicks, buckets };
}

const PLATFORM_ORDER = ["Windows", "macOS", "Linux", "Cloud / SaaS", "Unknown"] as const;
const SEVERITY_CHART_ORDER = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Informational",
] as const satisfies readonly DiscoverySeverity[];
const PATCH_STATUS_ORDER = [
  "Up to date",
  "Missing non-crit",
  "Missing critical",
  "Unknown",
] as const satisfies readonly PatchStatus[];

const PATCH_COLORS: Record<PatchStatus, string> = {
  "Up to date": CHART_CATEGORY_FILL,
  "Missing non-crit": "#f28830",
  "Missing critical": "#ff604a",
  Unknown: PLATFORM_UNKNOWN_FILL,
};

const DISCOVERY_ROWS: DiscoveryRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "Internet-facing host running EOL OS detected",
    time: "14:22:08",
    activity: "Update",
    eventClass: "Device Inventory Info",
    asset: "edge-vm-19",
    owner: "unassigned",
    platform: "Linux",
    patchStatus: "Missing critical",
    connector: demoTableConnector(0),
  },
  {
    id: "2",
    severity: "High",
    title: "Vulnerable OpenSSL version found on production API host",
    time: "13:05:41",
    activity: "Update",
    eventClass: "Software Inventory Info",
    asset: "api-prod-04",
    owner: "platform-team",
    platform: "Linux",
    patchStatus: "Missing non-crit",
    connector: demoTableConnector(1),
  },
  {
    id: "3",
    severity: "High",
    title: "Unmanaged S3 bucket exposed with public read ACL",
    time: "11:40:12",
    activity: "Create",
    eventClass: "Cloud Resources Inventory Info",
    asset: "s3-bucket-7f2a",
    owner: "j.alvarez",
    platform: "Cloud / SaaS",
    patchStatus: "Unknown",
    connector: demoTableConnector(2),
  },
  {
    id: "4",
    severity: "Medium",
    title: "Stale service account discovered without MFA enrollment",
    time: "09:12:00",
    activity: "Update",
    eventClass: "User Inventory Info",
    asset: "svc-analytics",
    owner: "it-ops",
    platform: "Cloud / SaaS",
    patchStatus: "Up to date",
    connector: demoTableConnector(3),
  },
  {
    id: "5",
    severity: "Medium",
    title: "Workstation missing endpoint protection agent",
    time: "22:18:55",
    activity: "Create",
    eventClass: "Device Inventory Info",
    asset: "ws-finance-12",
    owner: "unassigned",
    platform: "Windows",
    patchStatus: "Missing non-crit",
    connector: demoTableConnector(4),
  },
  {
    id: "6",
    severity: "Low",
    title: "New macOS laptop enrolled outside standard build image",
    time: "18:00:03",
    activity: "Create",
    eventClass: "Device Inventory Info",
    asset: "mbp-design-03",
    owner: "design-team",
    platform: "macOS",
    patchStatus: "Up to date",
    connector: demoTableConnector(5),
  },
  {
    id: "7",
    severity: "Informational",
    title: "Cloud VM tagged with owner and environment metadata",
    time: "16:44:19",
    activity: "Update",
    eventClass: "Cloud Resources Inventory Info",
    asset: "ec2-web-09",
    owner: "platform-team",
    platform: "Cloud / SaaS",
    patchStatus: "Up to date",
    connector: demoTableConnector(6),
  },
  {
    id: "8",
    severity: "Informational",
    title: "Installed package inventory refreshed for jump host",
    time: "12:01:47",
    activity: "Update",
    eventClass: "Software Inventory Info",
    asset: "jump-host-01",
    owner: "it-ops",
    platform: "Windows",
    patchStatus: "Up to date",
    connector: demoTableConnector(7),
  },
  {
    id: "9",
    severity: "High",
    title: "Unknown device observed on corporate VLAN segment",
    time: "09:33:22",
    activity: "Create",
    eventClass: "Device Inventory Info",
    asset: "unknown-iot-02",
    owner: "unassigned",
    platform: "Unknown",
    patchStatus: "Unknown",
    connector: demoTableConnector(8),
  },
  {
    id: "10",
    severity: "Medium",
    title: "Contractor account discovered in privileged AD group",
    time: "21:15:08",
    activity: "Update",
    eventClass: "User Inventory Info",
    asset: "c.morgan",
    owner: "security-team",
    platform: "Windows",
    patchStatus: "Missing critical",
    connector: demoTableConnector(9),
  },
];

function isDevicePlatform(label: string): label is DevicePlatform {
  return (
    label === "Windows" ||
    label === "macOS" ||
    label === "Linux" ||
    label === "Cloud / SaaS" ||
    label === "Unknown"
  );
}

function isDiscoverySeverity(label: string): label is DiscoverySeverity {
  return label in SEV_BAR;
}

function isPatchStatus(label: string): label is PatchStatus {
  return (
    label === "Up to date" ||
    label === "Missing non-crit" ||
    label === "Missing critical" ||
    label === "Unknown"
  );
}

function discoveryMatchesSearch(row: DiscoveryRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.severity,
    row.title,
    row.time,
    row.activity,
    row.eventClass,
    row.asset,
    row.owner,
    row.platform,
    row.patchStatus,
    row.connector,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

type DiscoverySortColumn =
  | "severity"
  | "title"
  | "time"
  | "activity"
  | "eventClass"
  | "asset"
  | "owner"
  | "connector";

const SELECT_COL_WIDTH = 40;
const COL_DEFAULTS: readonly number[] = [SELECT_COL_WIDTH, 108, 280, 96, 88, 168, 120, 112, 120];
const COL_MINS: readonly number[] = [SELECT_COL_WIDTH, 72, 120, 72, 56, 120, 80, 80, 80];

export function useDiscoveryEventsTableGrid(rows: readonly Parameters<typeof DiscoveryEventsTable>[0]["displayRows"][number][]) {
  const sortComparators = useMemo(
    (): Record<DiscoverySortColumn, (a: DiscoveryRow, b: DiscoveryRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      eventClass: (a, b) => compareStrings(a.eventClass, b.eventClass),
      asset: (a, b) => compareStrings(a.asset, b.asset),
      owner: (a, b) => compareStrings(a.owner, b.owner),
      connector: (a, b) => compareStrings(a.connector, b.connector),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators);
}

function DiscoveryEventsTable({ displayRows, getSortProps }: { displayRows: DiscoveryRow[]; getSortProps: ReturnType<typeof useDiscoveryEventsTableGrid>["getSortProps"] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const {
    containerRef,
    colStyle,
    baseTotal,
    tableFillsContainer,
    isResizing,
    resizeHandle,
    displayWidths,
    minTableWidth,
  } = useResizableColumns({
    selectColWidth: SELECT_COL_WIDTH,
    colDefaults: COL_DEFAULTS,
    colMins: COL_MINS,
  });

  const allIds = useMemo(() => displayRows.map((r) => r.id), [displayRows]);
  const total = allIds.length;
  const selectedOnPage = useMemo(() => allIds.filter((id) => selected.has(id)).length, [allIds, selected]);
  const allSelected = total > 0 && selectedOnPage === total;
  const someSelected = selectedOnPage > 0 && !allSelected;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(allIds) : new Set());
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };



  return (
    <div ref={containerRef} className={cx(DATA_GRID_TABLE_SCROLL_CLASS, isResizing && "select-none")}>
      <table
        className={DATA_GRID_TABLE_CLASS}
        style={{
          width: tableFillsContainer ? "100%" : baseTotal,
          minWidth: Math.max(minTableWidth, baseTotal),
        }}
      >
        <caption className="sr-only">Discovery events</caption>
        <colgroup>
          {displayWidths.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead className={DATA_GRID_THEAD_CLASS}>
          <tr className={DATA_GRID_HEADER_ROW_CLASS}>
            <th scope="col" style={colStyle(0)} className="relative border-r border-datavis-gridlines px-0 py-0 align-middle">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all rows"
                />
              </div>
              {resizeHandle(0)}
            </th>
            <th
              scope="col"
              style={colStyle(1)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Severity" menuLabel="Severity column options" {...getSortProps("severity")} />
              {resizeHandle(1)}
            </th>
            <th
              scope="col"
              style={colStyle(2)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Title" menuLabel="Title column options" {...getSortProps("title")} />
              {resizeHandle(2)}
            </th>
            <th
              scope="col"
              style={colStyle(3)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Time" menuLabel="Time column options" {...getSortProps("time")} />
              {resizeHandle(3)}
            </th>
            <th
              scope="col"
              style={colStyle(4)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Activity" menuLabel="Activity column options" {...getSortProps("activity")} />
              {resizeHandle(4)}
            </th>
            <th
              scope="col"
              style={colStyle(5)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Class" menuLabel="Class column options" {...getSortProps("eventClass")} />
              {resizeHandle(5)}
            </th>
            <th
              scope="col"
              style={colStyle(6)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Asset" menuLabel="Asset column options" {...getSortProps("asset")} />
              {resizeHandle(6)}
            </th>
            <th
              scope="col"
              style={colStyle(7)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Owner" menuLabel="Owner column options" {...getSortProps("owner")} />
              {resizeHandle(7)}
            </th>
            <th
              scope="col"
              style={colStyle(8)}
              className="relative px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Connectors" menuLabel="Connectors column options" {...getSortProps("connector")} />
              {resizeHandle(8)}
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.id} className="border-b border-datavis-gridlines hover:bg-overlay-subtle">
              <td style={colStyle(0)} className="px-0 py-0 align-middle">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(c) => toggleRow(row.id, c)}
                    aria-label={`Select discovery event ${row.id}`}
                  />
                </div>
              </td>
              <td style={colStyle(1)} className="px-2 py-0 align-middle">
                <span className="inline-flex items-center gap-2">
                  <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_BAR[row.severity]} />
                  <span className="text-sm text-text-secondary">{row.severity}</span>
                </span>
              </td>
              <td style={colStyle(2)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText
                  as="button"
                  className="w-full text-left text-sm font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                >
                  {row.title}
                </TruncatedText>
              </td>
              <td style={colStyle(3)} className="min-w-0 px-2 py-0 align-middle tabular-nums">
                <TruncatedText className="text-sm text-text-secondary">{row.time}</TruncatedText>
              </td>
              <td style={colStyle(4)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.activity}</TruncatedText>
              </td>
              <td style={colStyle(5)} className="min-w-0 overflow-hidden px-2 py-0 align-middle">
                <span className="flex w-full min-w-0 items-center gap-2">
                  <Icon
                    name="ocsf-discovery"
                    size={16}
                    className="size-4 shrink-0 text-datavis-data-weak-red-30 [&_svg]:!size-4"
                    aria-hidden
                  />
                  <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                    {row.eventClass}
                  </TruncatedText>
                </span>
              </td>
              <td style={colStyle(6)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.asset}</TruncatedText>
              </td>
              <td style={colStyle(7)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.owner}</TruncatedText>
              </td>
              <td style={colStyle(8)} className="min-w-0 px-2 py-0 align-middle">
                <ConnectorTableCell name={row.connector} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Figma concept — Discovery body for Federated Analytics. */
export function DiscoveryContent() {
  const { timeframe, initialTimeframe, isChartZoomed, handleTimelineBrush, handleChartZoomReset } =
    useFederatedAnalyticsTimeframeZoom("daily");
  const [platformFilter, setPlatformFilter] = useState<DevicePlatform | null>(null);
  const [severityFilter, setSeverityFilter] = useState<DiscoverySeverity | null>(null);
  const [patchFilter, setPatchFilter] = useState<PatchStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const tableRows = useMemo(
    () =>
      buildDailyEventRows(DISCOVERY_ROWS, initialTimeframe, (template, id, eventTime) => ({
        ...template,
        id,
        time: formatAnalyticsRowTime(eventTime),
      })),
    [initialTimeframe],
  );

  const timeframeScopedRows = useMemo(
    () => tableRows.filter((row) => rowTimeInTimeframe(row.time, timeframe)),
    [tableRows, timeframe],
  );

  const platformRows = useMemo(
    () =>
      countByLabel(timeframeScopedRows, PLATFORM_ORDER, (row) => row.platform).map((row) => ({
        ...row,
        color: row.label === "Unknown" ? PLATFORM_UNKNOWN_FILL : CHART_CATEGORY_FILL,
      })),
    [timeframeScopedRows],
  );

  const platformBarScale = useMemo(
    () => horizontalBarScale(platformRows.map((row) => row.value)),
    [platformRows],
  );

  const severityChartRows = useMemo(
    () =>
      countByLabel(timeframeScopedRows, SEVERITY_CHART_ORDER, (row) => row.severity).map((row) => ({
        ...row,
        color: SEV_BAR[row.label as DiscoverySeverity],
      })),
    [timeframeScopedRows],
  );

  const severityBarScale = useMemo(
    () => horizontalBarScale(severityChartRows.map((row) => row.value)),
    [severityChartRows],
  );

  const patchSegments = useMemo(
    () =>
      countByLabel(timeframeScopedRows, PATCH_STATUS_ORDER, (row) => row.patchStatus).map((row) => ({
        label: row.label,
        value: row.value,
        color: PATCH_COLORS[row.label as PatchStatus],
      })),
    [timeframeScopedRows],
  );

  const patchDeviceTotal = useMemo(
    () => patchSegments.reduce((sum, segment) => sum + segment.value, 0),
    [patchSegments],
  );

    const filteredRows = useMemo(
    () =>
      timeframeScopedRows.filter((row) => {
        if (platformFilter && row.platform !== platformFilter) return false;
        if (severityFilter && row.severity !== severityFilter) return false;
        if (patchFilter && row.patchStatus !== patchFilter) return false;
        if (!discoveryMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [timeframeScopedRows, platformFilter, severityFilter, patchFilter, searchQuery],
  );
  const tableGrid = useDiscoveryEventsTableGrid(filteredRows);

  const hasActiveFilters =
    platformFilter != null ||
    severityFilter != null ||
    patchFilter != null ||
    searchQuery.trim().length > 0;

  const dailyChart = useMemo(() => buildDailyDiscoveryChart(timeframe), [timeframe]);

  const handlePlatformClick = (label: string) => {
    if (!isDevicePlatform(label)) return;
    setPlatformFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (label: string) => {
    if (!isDiscoverySeverity(label)) return;
    setSeverityFilter((current) => (current === label ? null : label));
  };

  const handlePatchClick = (label: string) => {
    if (!isPatchStatus(label)) return;
    setPatchFilter((current) => (current === label ? null : label));
  };

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
      <InsightCard title="New Assets Discovered Over Time">
        <ChartZoomHint unit="Days" isChartZoomed={isChartZoomed} onReset={handleChartZoomReset} />
        <TimeSeriesBarChart
          values={dailyChart.values}
          xLabels={dailyChart.xLabels}
          barColor={NEW_ASSETS_LINE}
          spikeHighlight={
            dailyChart.spikeIndex != null
              ? { index: dailyChart.spikeIndex, label: `spike ${dailyChart.xLabels[dailyChart.spikeIndex]}` }
              : undefined
          }
          yMax={dailyChart.yMax}
          yTicks={dailyChart.yTicks}
          ariaLabel="New assets discovered over time by day"
          onBrushCommit={(selection) => handleTimelineBrush(selection, dailyChart.buckets)}
        />
        <p className="mt-1 pl-9 text-base-small text-text-tertiary">
          {dailyChart.spikeLabel}
        </p>
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Devices By Platform" fillHeight>
          <HorizontalBarPanel
            rows={platformRows}
            selectedLabel={platformFilter}
            onBarClick={handlePlatformClick}
            filterAriaLabel={(label) => `Filter discovery events by platform ${label}`}
            xMax={platformBarScale.xMax}
            xTicks={platformBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Severity ID" fillHeight>
          <HorizontalBarPanel
            rows={severityChartRows}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityClick}
            filterAriaLabel={(label) => `Filter discovery events by ${label} severity`}
            xMax={severityBarScale.xMax}
            xTicks={severityBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Patch Compliance" fillHeight>
          <DonutChartPanel
            segments={patchSegments}
            total={patchDeviceTotal}
            centerLabel="devices"
            selectedLabel={patchFilter}
            onSegmentClick={handlePatchClick}
            ariaLabel="Patch compliance by status"
          />
        </InsightCard>
      </div>
      </div>

      <DataGridSection
        header={
          <>
            <h2 className="text-base-semibold text-text-primary">Discovery Events</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="shrink-0 text-base-small text-text-secondary">
                {filteredRows.length} of {timeframeScopedRows.length} Results
                {platformFilter ? ` · ${platformFilter}` : ""}
                {severityFilter ? ` · ${severityFilter}` : ""}
                {patchFilter ? ` · ${patchFilter}` : ""}
                {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
              </p>
              <div className="w-[300px] shrink-0">
                <Input
                  variant="search"
                  placeholder={DATA_GRID_RESULTS_SEARCH_PLACEHOLDER}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onClear={() => setSearchQuery("")}
                  className="!bg-datavis-card-bg"
                  aria-label="Search discovery events"
                />
              </div>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
                  onClick={() => {
                    setPlatformFilter(null);
                    setSeverityFilter(null);
                    setPatchFilter(null);
                    setSearchQuery("");
                  }}
                >
                  <Icon name="action-filter-list" size={14} aria-hidden />
                  Clear all filters
                </Button>
              ) : null}
              <DataGridExportButton />
            </div>
          </>
        }
        filterPanel={
          <FilterColumnPanel
            active={tableTool}
            onFilterClick={() => setTableTool(tableTool === "filter" ? null : "filter")}
            onColumnsClick={() => setTableTool(tableTool === "columns" ? null : "columns")}
          />
        }
        table={<DiscoveryEventsTable displayRows={tableGrid.displayRows} getSortProps={tableGrid.getSortProps} />}
        footer={<DataGridPaginationFooter grid={tableGrid} />}
      />
    </div>
  );
}
