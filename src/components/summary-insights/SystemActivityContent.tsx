import { useMemo, useState } from "react";
import { Icon, type SeverityShapeIconName } from "../../design-system";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { compareStrings, useColumnSort } from "../ui/useColumnSort";
import { useResizableColumns } from "../ui/useResizableColumns";
import { TruncatedText } from "../ui/TruncatedText";
import { Checkbox } from "../uiCheckbox";
import { cx, DatavisGridlineRule, InsightCard } from "./datavisCard";
import {
  buildHourlyEventRows,
  ChartZoomHint,
  countByLabel,
  formatAnalyticsRowTime,
  horizontalBarScale,
  rowTimeInTimeframe,
  topCountsByLabel,
  useFederatedAnalyticsTimeframeZoom,
} from "./federatedAnalyticsZoom";
import { HorizontalBarPanel } from "./horizontalBarPanel";
import { TimeSeriesAreaChart } from "./timeSeriesAreaChart";
import {
  buildHourlyAxisTicks,
  buildHourlyBuckets,
  findSpikeBucketIndex,
  formatBucketTimeLabel,
  hourlySeverityValues,
  SPIKE_CLOCK_HOUR,
} from "./timeframeChartUtils";

type SystemSeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const SEV_BAR: Record<SystemSeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const SEV_ICONS: Record<SystemSeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  Informational: "severity-info",
};

const SEVERITY_ORDER: Record<SystemSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};

const HOST_BAR_FILL = "#4a9eff";

type ActivityClass =
  | "Process"
  | "File system"
  | "Module"
  | "Scheduled job"
  | "Script"
  | "Kernel";

type SystemEventClass =
  | "Process Activity"
  | "File System Activity"
  | "Module Activity"
  | "Scheduled Job Activity"
  | "Script Activity"
  | "Kernel Activity";

type SystemActivityRow = {
  id: string;
  severity: SystemSeverity;
  title: string;
  time: string;
  activity: string;
  eventClass: SystemEventClass;
  activityClass: ActivityClass;
  connector: string;
  host: string;
  process: string;
};

function connectorSwatch(connector: string) {
  if (connector.startsWith("BCs")) return "bg-feedback-info";
  if (connector.includes("Athena")) return "bg-interactive-active";
  return "bg-feedback-negative";
}

function isActivityClass(label: string): label is ActivityClass {
  return (
    label === "Process" ||
    label === "File system" ||
    label === "Module" ||
    label === "Scheduled job" ||
    label === "Script" ||
    label === "Kernel"
  );
}

function isSystemSeverity(label: string): label is SystemSeverity {
  return label in SEV_BAR;
}

const ACTIVITY_CLASS_ROWS = [
  { label: "Process", value: 812 },
  { label: "File system", value: 664 },
  { label: "Module", value: 410 },
  { label: "Scheduled job", value: 255 },
  { label: "Script", value: 183 },
  { label: "Kernel", value: 78 },
] as const;

const SEVERITY_ROWS = [
  { label: "Critical", value: 52, color: SEV_BAR.Critical },
  { label: "High", value: 214, color: SEV_BAR.High },
  { label: "Medium", value: 498, color: SEV_BAR.Medium },
  { label: "Low", value: 390, color: SEV_BAR.Low },
  { label: "Informational", value: 540, color: SEV_BAR.Informational },
] as const;

const ACTIVITY_CLASS_ORDER = ACTIVITY_CLASS_ROWS.map((row) => row.label);
const SEVERITY_CHART_ORDER = SEVERITY_ROWS.map((row) => row.label);

const SYSTEM_ACTIVITY_ROWS: SystemActivityRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "Encoded PowerShell launched from spawned cmd.exe…",
    time: "04:12:08",
    activity: "Launch",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: "BCs1",
    host: "WIN-DC01",
    process: "powershell.exe",
  },
  {
    id: "2",
    severity: "High",
    title: "Suspicious scheduled job created under SYSTEM context…",
    time: "03:58:41",
    activity: "Create",
    eventClass: "Scheduled Job Activity",
    activityClass: "Scheduled job",
    connector: "BC-CS-Athena",
    host: "SQL-PROD-02",
    process: "schtasks.exe",
  },
  {
    id: "3",
    severity: "High",
    title: "Unsigned module loaded from user-writable directory…",
    time: "03:40:12",
    activity: "Load",
    eventClass: "Module Activity",
    activityClass: "Module",
    connector: "BC-CS",
    host: "JUMP-HOST-01",
    process: "unknown.dll",
  },
  {
    id: "4",
    severity: "Medium",
    title: "Kernel driver service registered with matching persist…",
    time: "02:12:00",
    activity: "Update",
    eventClass: "Kernel Activity",
    activityClass: "Kernel",
    connector: "BCs1",
    host: "WEB-EDGE-07",
    process: "services.exe",
  },
  {
    id: "5",
    severity: "Low",
    title: "Temporary script executed from AppData with outbound…",
    time: "22:18:55",
    activity: "Launch",
    eventClass: "Script Activity",
    activityClass: "Script",
    connector: "BC-CS-Athena",
    host: "WIN-DC01",
    process: "wscript.exe",
  },
  {
    id: "6",
    severity: "Informational",
    title: "Process creation auditing enabled on endpoint policy…",
    time: "18:00:03",
    activity: "Update",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: "BCs1",
    host: "WIN-DC01",
    process: "gpupdate.exe",
  },
  {
    id: "7",
    severity: "Critical",
    title: "LSASS memory access attempt from unexpected process…",
    time: "16:44:19",
    activity: "Inject",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: "BC-CS",
    host: "SQL-PROD-02",
    process: "mimikatz.exe",
  },
  {
    id: "8",
    severity: "High",
    title: "Executable renamed to resemble system binary in System32…",
    time: "12:01:47",
    activity: "Rename",
    eventClass: "File System Activity",
    activityClass: "File system",
    connector: "BC-CS-Athena",
    host: "JUMP-HOST-01",
    process: "svchost.exe",
  },
  {
    id: "9",
    severity: "Medium",
    title: "New service installed with auto-start and network bind…",
    time: "09:33:22",
    activity: "Create",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: "BCs1",
    host: "WEB-EDGE-07",
    process: "sc.exe",
  },
  {
    id: "10",
    severity: "Low",
    title: "Script block logging captured obfuscated batch content…",
    time: "21:15:08",
    activity: "Launch",
    eventClass: "Script Activity",
    activityClass: "Script",
    connector: "BC-CS",
    host: "WIN-DC01",
    process: "cmd.exe",
  },
];

function systemMatchesSearch(row: SystemActivityRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.severity,
    row.title,
    row.time,
    row.activity,
    row.eventClass,
    row.connector,
    row.host,
    row.process,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

type SystemSortColumn =
  | "severity"
  | "title"
  | "time"
  | "activity"
  | "eventClass"
  | "connector"
  | "host"
  | "process";

/** px widths: select, severity, title, time, activity, class, host, process, connector */
const SELECT_COL_WIDTH = 40;
const COL_DEFAULTS: readonly number[] = [SELECT_COL_WIDTH, 108, 280, 96, 88, 140, 120, 140, 120];
const COL_MINS: readonly number[] = [SELECT_COL_WIDTH, 72, 120, 72, 56, 96, 80, 96, 80];

function SystemActivityTable({ rows }: { rows: SystemActivityRow[] }) {
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

  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
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

  const sortComparators = useMemo(
    (): Record<SystemSortColumn, (a: SystemActivityRow, b: SystemActivityRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      eventClass: (a, b) => compareStrings(a.eventClass, b.eventClass),
      connector: (a, b) => compareStrings(a.connector, b.connector),
      host: (a, b) => compareStrings(a.host, b.host),
      process: (a, b) => compareStrings(a.process, b.process),
    }),
    [],
  );
  const { sortedRows, getSortProps } = useColumnSort(sortComparators);
  const displayRows = sortedRows(rows);

  return (
    <div ref={containerRef} className={cx("min-h-0 w-full min-w-0", isResizing && "select-none")}>
      <table
        className="table-fixed border-collapse text-left text-sm"
        style={{
          width: tableFillsContainer ? "100%" : baseTotal,
          minWidth: Math.max(minTableWidth, baseTotal),
        }}
      >
        <caption className="sr-only">System activity events</caption>
        <colgroup>
          {displayWidths.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr className="h-10 border-b border-datavis-gridlines bg-surface-table-row-header">
            <th scope="col" style={colStyle(0)} className="relative h-10 border-r border-datavis-gridlines px-0 py-0 align-middle">
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
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu
                label="Severity"
                menuLabel="Severity column options"
                {...getSortProps("severity")}
              />
              {resizeHandle(1)}
            </th>
            <th
              scope="col"
              style={colStyle(2)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Title" menuLabel="Title column options" {...getSortProps("title")} />
              {resizeHandle(2)}
            </th>
            <th
              scope="col"
              style={colStyle(3)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Time" menuLabel="Time column options" {...getSortProps("time")} />
              {resizeHandle(3)}
            </th>
            <th
              scope="col"
              style={colStyle(4)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Activity" menuLabel="Activity column options" {...getSortProps("activity")} />
              {resizeHandle(4)}
            </th>
            <th
              scope="col"
              style={colStyle(5)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Class" menuLabel="Class column options" {...getSortProps("eventClass")} />
              {resizeHandle(5)}
            </th>
            <th
              scope="col"
              style={colStyle(6)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Host" menuLabel="Host column options" {...getSortProps("host")} />
              {resizeHandle(6)}
            </th>
            <th
              scope="col"
              style={colStyle(7)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Process" menuLabel="Process column options" {...getSortProps("process")} />
              {resizeHandle(7)}
            </th>
            <th
              scope="col"
              style={colStyle(8)}
              className="relative h-10 px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Connectors" menuLabel="Connectors column options" {...getSortProps("connector")} />
              {resizeHandle(8)}
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.id} className="h-10 border-b border-datavis-gridlines hover:bg-overlay-subtle">
              <td style={colStyle(0)} className="h-10 px-0 py-0 align-middle">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(c) => toggleRow(row.id, c)}
                    aria-label={`Select system activity event ${row.id}`}
                  />
                </div>
              </td>
              <td style={colStyle(1)} className="h-10 px-2 py-0 align-middle">
                <span className="inline-flex items-center gap-2">
                  <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_BAR[row.severity]} />
                  <span className="text-sm text-text-secondary">{row.severity}</span>
                </span>
              </td>
              <td style={colStyle(2)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText
                  as="button"
                  className="w-full text-left text-sm font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                >
                  {row.title}
                </TruncatedText>
              </td>
              <td style={colStyle(3)} className="h-10 min-w-0 px-2 py-0 align-middle tabular-nums">
                <TruncatedText className="text-sm text-text-secondary">{row.time}</TruncatedText>
              </td>
              <td style={colStyle(4)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.activity}</TruncatedText>
              </td>
              <td style={colStyle(5)} className="h-10 min-w-0 overflow-hidden px-2 py-0 align-middle">
                <span className="flex w-full min-w-0 items-center gap-2">
                  <Icon
                    name="ocsf-system-activity"
                    size={16}
                    className="size-4 shrink-0 text-datavis-data-peanut-orange [&_svg]:!size-4"
                    aria-hidden
                  />
                  <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                    {row.eventClass}
                  </TruncatedText>
                </span>
              </td>
              <td style={colStyle(6)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.host}</TruncatedText>
              </td>
              <td style={colStyle(7)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.process}</TruncatedText>
              </td>
              <td style={colStyle(8)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span
                    className={cx("size-2.5 shrink-0 rounded-sm", connectorSwatch(row.connector))}
                    aria-hidden
                  />
                  <TruncatedText className="text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                    {row.connector}
                  </TruncatedText>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Figma concept — System Activity body for Federated Analytics. */
export function SystemActivityContent() {
  const { timeframe, initialTimeframe, isChartZoomed, handleTimelineBrush, handleChartZoomReset } =
    useFederatedAnalyticsTimeframeZoom("hourly");
  const [activityClassFilter, setActivityClassFilter] = useState<ActivityClass | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SystemSeverity | null>(null);
  const [hostFilter, setHostFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const tableRows = useMemo(
    () =>
      buildHourlyEventRows(SYSTEM_ACTIVITY_ROWS, initialTimeframe, (template, id, eventTime) => ({
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

  const activityClassRows = useMemo(
    () => countByLabel(timeframeScopedRows, ACTIVITY_CLASS_ORDER, (row) => row.activityClass),
    [timeframeScopedRows],
  );

  const activityClassBarScale = useMemo(
    () => horizontalBarScale(activityClassRows.map((row) => row.value)),
    [activityClassRows],
  );

  const severityChartRows = useMemo(
    () =>
      countByLabel(timeframeScopedRows, SEVERITY_CHART_ORDER, (row) => row.severity).map((row) => ({
        ...row,
        color: SEV_BAR[row.label as SystemSeverity],
      })),
    [timeframeScopedRows],
  );

  const severityBarScale = useMemo(
    () => horizontalBarScale(severityChartRows.map((row) => row.value)),
    [severityChartRows],
  );

  const hostChartRows = useMemo(
    () => topCountsByLabel(timeframeScopedRows, (row) => row.host, 4, HOST_BAR_FILL),
    [timeframeScopedRows],
  );

  const hostBarScale = useMemo(
    () => horizontalBarScale(hostChartRows.map((row) => row.value)),
    [hostChartRows],
  );

  const filteredRows = useMemo(
    () =>
      timeframeScopedRows.filter((row) => {
        if (activityClassFilter && row.activityClass !== activityClassFilter) return false;
        if (severityFilter && row.severity !== severityFilter) return false;
        if (hostFilter && row.host !== hostFilter) return false;
        if (!systemMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [timeframeScopedRows, activityClassFilter, severityFilter, hostFilter, searchQuery],
  );

  const hasActiveFilters =
    activityClassFilter != null || severityFilter != null || hostFilter != null || searchQuery.trim().length > 0;

  const handleActivityClassClick = (label: string) => {
    if (!isActivityClass(label)) return;
    setActivityClassFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (label: string) => {
    if (!isSystemSeverity(label)) return;
    setSeverityFilter((current) => (current === label ? null : label));
  };

  const handleHostClick = (label: string) => {
    setHostFilter((current) => (current === label ? null : label));
  };

  const eventsPerHourChart = useMemo(() => {
    const buckets = buildHourlyBuckets(timeframe);
    const spikeIndex = findSpikeBucketIndex(buckets, timeframe.to);
    const includeDate = timeframe.to.getTime() - timeframe.from.getTime() > 36 * 3_600_000;
    const xLabels = buckets.map((bucket) => formatBucketTimeLabel(bucket.start, includeDate));
    const { indices: xTickIndices, labels: xTickLabels } = buildHourlyAxisTicks(buckets, timeframe);

    const series = [
      {
        id: "Medium",
        label: "Medium",
        color: SEV_BAR.Medium,
        icon: SEV_ICONS.Medium,
        values: hourlySeverityValues(14, buckets, spikeIndex),
      },
      {
        id: "High",
        label: "High",
        color: SEV_BAR.High,
        icon: SEV_ICONS.High,
        values: hourlySeverityValues(10, buckets, spikeIndex),
      },
      {
        id: "Critical",
        label: "Critical",
        color: SEV_BAR.Critical,
        icon: SEV_ICONS.Critical,
        values: hourlySeverityValues(4, buckets, spikeIndex),
      },
    ] as const;

    const spikeHighlight =
      spikeIndex != null
        ? { index: spikeIndex, label: `spike ~${SPIKE_CLOCK_HOUR}:00` }
        : undefined;

    return { series, xLabels, xTickIndices, xTickLabels, spikeHighlight, buckets };
  }, [timeframe]);

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <InsightCard title="System Events Per Hour By Severity">
        <ChartZoomHint unit="Hours" isChartZoomed={isChartZoomed} onReset={handleChartZoomReset} />
        <TimeSeriesAreaChart
          series={eventsPerHourChart.series}
          xLabels={eventsPerHourChart.xLabels}
          xTickIndices={eventsPerHourChart.xTickIndices}
          xTickLabels={eventsPerHourChart.xTickLabels}
          spikeHighlight={eventsPerHourChart.spikeHighlight}
          ariaLabel="System activity events per hour by severity"
          selectedSeriesId={severityFilter}
          onSeriesClick={handleSeverityClick}
          onBrushCommit={(selection) => handleTimelineBrush(selection, eventsPerHourChart.buckets)}
        />
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Activity Classes" fillHeight>
          <HorizontalBarPanel
            rows={activityClassRows}
            selectedLabel={activityClassFilter}
            onBarClick={handleActivityClassClick}
            filterAriaLabel={(label) => `Filter system activity by ${label}`}
            xMax={activityClassBarScale.xMax}
            xTicks={activityClassBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Severity ID" fillHeight>
          <HorizontalBarPanel
            rows={severityChartRows}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityClick}
            filterAriaLabel={(label) => `Filter system activity by ${label} severity`}
            xMax={severityBarScale.xMax}
            xTicks={severityBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Top Hosts By Process Launches" fillHeight>
          <HorizontalBarPanel
            rows={hostChartRows}
            selectedLabel={hostFilter}
            onBarClick={handleHostClick}
            filterAriaLabel={(label) => `Filter system activity by host ${label}`}
            xMax={hostBarScale.xMax}
            xTicks={hostBarScale.xTicks}
          />
        </InsightCard>
      </div>

      <section className="mx-0 mb-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2)]">
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-6 pt-3 sm:pl-5">
          <h2 className="text-base-semibold text-text-primary">System Activity Events</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="shrink-0 text-base-small text-text-secondary">
              {filteredRows.length} of {timeframeScopedRows.length} Results
              {activityClassFilter ? ` · ${activityClassFilter}` : ""}
              {severityFilter ? ` · ${severityFilter}` : ""}
              {hostFilter ? ` · ${hostFilter}` : ""}
              {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            </p>
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="!bg-datavis-card-bg"
                aria-label="Search system activity events"
              />
            </div>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
                onClick={() => {
                  setActivityClassFilter(null);
                  setSeverityFilter(null);
                  setHostFilter(null);
                  setSearchQuery("");
                }}
              >
                <Icon name="action-filter-list" size={12} aria-hidden />
                Clear all filters
              </Button>
            ) : null}
            <DataGridExportButton />
          </div>
        </div>
        <DatavisGridlineRule inset={false} />
        <div className="flex min-h-0 flex-1 overflow-auto bg-datavis-card-bg">
          <FilterColumnPanel
            active={tableTool}
            onFilterClick={() => setTableTool(tableTool === "filter" ? null : "filter")}
            onColumnsClick={() => setTableTool(tableTool === "columns" ? null : "columns")}
          />
          <div className="min-h-0 min-w-0 flex-1 pb-3">
            <SystemActivityTable rows={filteredRows} />
          </div>
        </div>
      </section>
    </div>
  );
}
