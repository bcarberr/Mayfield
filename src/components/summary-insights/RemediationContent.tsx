import { useMemo, useState } from "react";
import { Icon, type SeverityShapeIconName } from "../../design-system";
import { useTimeframe } from "../../context/TimeframeContext";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { DonutChartPanel } from "../ui/DonutChartPanel";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { compareStrings, useColumnSort } from "../ui/useColumnSort";
import { useResizableColumns } from "../ui/useResizableColumns";
import { TruncatedText } from "../ui/TruncatedText";
import { Checkbox } from "../uiCheckbox";
import { cx, DatavisGridlineRule, InsightCard } from "./datavisCard";
import { CHART_CATEGORY_FILL, HorizontalBarPanel } from "./horizontalBarPanel";
import { TimeSeriesAreaChart } from "./timeSeriesAreaChart";
import {
  buildHourlyAxisTicks,
  buildHourlyBuckets,
  findSpikeBucketIndex,
  formatBucketTimeLabel,
  hourlySeverityValues,
} from "./timeframeChartUtils";

const REMEDIATION_SPIKE_HOUR = 10;
const STATUS_UNKNOWN_FILL = "#717882";

type RemediationSeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const SEV_BAR: Record<RemediationSeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const SEV_ICONS: Record<RemediationSeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  Informational: "severity-info",
};

const SEVERITY_ORDER: Record<RemediationSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};

type ActivityClass =
  | "File Remediation"
  | "Process Remediation"
  | "Network Remediation"
  | "Remediation Activity";

type RemediationEventClass =
  | "File Remediation Activity"
  | "Process Remediation Activity"
  | "Network Remediation Activity"
  | "Remediation Activity";

type RemediationStatus = "Succeeded" | "Failed" | "Pending";

type RemediationRow = {
  id: string;
  severity: RemediationSeverity;
  title: string;
  time: string;
  activity: string;
  eventClass: RemediationEventClass;
  activityClass: ActivityClass;
  entity: string;
  status: RemediationStatus;
  connector: string;
};

const ACTIVITY_CLASS_ROWS = [
  { label: "File Remediation", value: 1240, color: CHART_CATEGORY_FILL },
  { label: "Process Remediation", value: 870, color: CHART_CATEGORY_FILL },
  { label: "Network Remediation", value: 560, color: CHART_CATEGORY_FILL },
  { label: "Remediation Activity", value: 198, color: CHART_CATEGORY_FILL },
] as const;

const SEVERITY_ROWS = [
  { label: "Critical", value: 38, color: SEV_BAR.Critical },
  { label: "High", value: 214, color: SEV_BAR.High },
  { label: "Medium", value: 498, color: SEV_BAR.Medium },
  { label: "Low", value: 612, color: SEV_BAR.Low },
  { label: "Info", value: 361, color: SEV_BAR.Informational },
] as const;

const STATUS_SEGMENTS = [
  { label: "Succeeded", color: CHART_CATEGORY_FILL, value: 1172 },
  { label: "Failed", color: "#f28830", value: 310 },
  { label: "Pending", color: STATUS_UNKNOWN_FILL, value: 241 },
] as const;

const REMEDIATION_STATUS_TOTAL = 1723;
const TOTAL_REMEDIATION_RESULTS = 1723;

const REMEDIATION_ROWS: RemediationRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "Isolate host failed — endpoint unreachable during response window…",
    time: "10:31:02",
    activity: "Isolate",
    eventClass: "Network Remediation Activity",
    activityClass: "Network Remediation",
    entity: "fin-ws-014",
    status: "Failed",
    connector: "CrowdStrike",
  },
  {
    id: "2",
    severity: "High",
    title: "Quarantine malicious file blocked by policy on shared endpoint…",
    time: "09:58:41",
    activity: "Quarantine",
    eventClass: "File Remediation Activity",
    activityClass: "File Remediation",
    entity: "C:\\Users\\Public\\update.exe",
    status: "Succeeded",
    connector: "Defender",
  },
  {
    id: "3",
    severity: "High",
    title: "Kill process action completed for suspicious PowerShell child…",
    time: "09:40:12",
    activity: "Kill Process",
    eventClass: "Process Remediation Activity",
    activityClass: "Process Remediation",
    entity: "powershell.exe (PID 8842)",
    status: "Succeeded",
    connector: "CrowdStrike",
  },
  {
    id: "4",
    severity: "Medium",
    title: "Block outbound connection to known C2 address pending approval…",
    time: "08:12:00",
    activity: "Block",
    eventClass: "Network Remediation Activity",
    activityClass: "Network Remediation",
    entity: "203.0.113.44:443",
    status: "Pending",
    connector: "Panorama",
  },
  {
    id: "5",
    severity: "Low",
    title: "Remediation ticket updated with containment playbook reference…",
    time: "22:18:55",
    activity: "Update",
    eventClass: "Remediation Activity",
    activityClass: "Remediation Activity",
    entity: "INC-2024-8841",
    status: "Succeeded",
    connector: "Intune",
  },
  {
    id: "6",
    severity: "Informational",
    title: "Automated file delete succeeded on staging share artifact…",
    time: "18:00:03",
    activity: "Update",
    eventClass: "File Remediation Activity",
    activityClass: "File Remediation",
    entity: "\\\\file-stg\\quarantine\\drop.zip",
    status: "Succeeded",
    connector: "Defender",
  },
  {
    id: "7",
    severity: "Critical",
    title: "Network isolation rollback failed — host still routing externally…",
    time: "16:44:19",
    activity: "Isolate",
    eventClass: "Network Remediation Activity",
    activityClass: "Network Remediation",
    entity: "ops-jump-03",
    status: "Failed",
    connector: "Panorama",
  },
  {
    id: "8",
    severity: "High",
    title: "Process termination queued for unsigned service binary…",
    time: "12:01:47",
    activity: "Kill Process",
    eventClass: "Process Remediation Activity",
    activityClass: "Process Remediation",
    entity: "svc-host.exe",
    status: "Pending",
    connector: "CrowdStrike",
  },
  {
    id: "9",
    severity: "Medium",
    title: "File hash block rule pushed to edge firewall policy set…",
    time: "09:33:22",
    activity: "Block",
    eventClass: "File Remediation Activity",
    activityClass: "File Remediation",
    entity: "sha256:9f2c…a11b",
    status: "Succeeded",
    connector: "Panorama",
  },
  {
    id: "10",
    severity: "Low",
    title: "Remediation workflow marked complete after host compliance check…",
    time: "21:15:08",
    activity: "Update",
    eventClass: "Remediation Activity",
    activityClass: "Remediation Activity",
    entity: "hr-laptop-22",
    status: "Succeeded",
    connector: "Intune",
  },
];

function connectorSwatch(connector: string) {
  if (connector === "CrowdStrike") return "bg-feedback-negative";
  if (connector === "Defender") return "bg-interactive-active";
  if (connector === "Panorama") return "bg-datavis-data-peanut-orange";
  return "bg-datavis-data-pop-teal-20";
}

function statusClassName(status: RemediationStatus): string {
  if (status === "Succeeded") return "text-feedback-positive";
  if (status === "Failed") return "text-datavis-data-peanut-orange";
  return "text-text-tertiary";
}

function isActivityClass(label: string): label is ActivityClass {
  return ACTIVITY_CLASS_ROWS.some((row) => row.label === label);
}

function isRemediationSeverity(label: string): label is RemediationSeverity {
  return label in SEV_BAR;
}

function isRemediationStatus(label: string): label is RemediationStatus {
  return label === "Succeeded" || label === "Failed" || label === "Pending";
}

function severityMatchesFilter(rowSeverity: RemediationSeverity, filter: string): boolean {
  if (filter === "Info") return rowSeverity === "Informational";
  return rowSeverity === filter;
}

function remediationMatchesSearch(row: RemediationRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    row.severity,
    row.title,
    row.time,
    row.activity,
    row.eventClass,
    row.activityClass,
    row.entity,
    row.status,
    row.connector,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

type RemediationSortColumn =
  | "severity"
  | "title"
  | "time"
  | "activity"
  | "eventClass"
  | "entity"
  | "status"
  | "connector";

const SELECT_COL_WIDTH = 40;
const COL_DEFAULTS: readonly number[] = [SELECT_COL_WIDTH, 108, 280, 96, 96, 168, 140, 96, 120];
const COL_MINS: readonly number[] = [SELECT_COL_WIDTH, 72, 120, 72, 56, 96, 80, 72, 80];

function RemediationEventsTable({ rows }: { rows: RemediationRow[] }) {
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
    (): Record<RemediationSortColumn, (a: RemediationRow, b: RemediationRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      eventClass: (a, b) => compareStrings(a.eventClass, b.eventClass),
      entity: (a, b) => compareStrings(a.entity, b.entity),
      status: (a, b) => compareStrings(a.status, b.status),
      connector: (a, b) => compareStrings(a.connector, b.connector),
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
        <caption className="sr-only">Remediation activity events</caption>
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
              <ColumnHeaderMenu label="Severity" menuLabel="Severity column options" {...getSortProps("severity")} />
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
              <ColumnHeaderMenu label="Entity" menuLabel="Entity column options" {...getSortProps("entity")} />
              {resizeHandle(6)}
            </th>
            <th
              scope="col"
              style={colStyle(7)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Status" menuLabel="Status column options" {...getSortProps("status")} />
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
                    aria-label={`Select remediation event ${row.id}`}
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
                    name="ocsf-remediation"
                    size={16}
                    className="size-4 shrink-0 text-datavis-data-pop-teal-20 [&_svg]:!size-4"
                    aria-hidden
                  />
                  <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                    {row.eventClass}
                  </TruncatedText>
                </span>
              </td>
              <td style={colStyle(6)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.entity}</TruncatedText>
              </td>
              <td style={colStyle(7)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText className={cx("text-sm font-semibold", statusClassName(row.status))}>
                  {row.status}
                </TruncatedText>
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

/** Figma concept — Remediation body for Federated Analytics. */
export function RemediationContent() {
  const { range: timeframe } = useTimeframe();
  const [activityClassFilter, setActivityClassFilter] = useState<ActivityClass | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RemediationStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const filteredRows = useMemo(
    () =>
      REMEDIATION_ROWS.filter((row) => {
        if (activityClassFilter && row.activityClass !== activityClassFilter) return false;
        if (severityFilter && !severityMatchesFilter(row.severity, severityFilter)) return false;
        if (statusFilter && row.status !== statusFilter) return false;
        if (!remediationMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [activityClassFilter, severityFilter, statusFilter, searchQuery],
  );

  const hasActiveFilters =
    activityClassFilter != null ||
    severityFilter != null ||
    statusFilter != null ||
    searchQuery.trim().length > 0;

  const handleActivityClassClick = (label: string) => {
    if (!isActivityClass(label)) return;
    setActivityClassFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (label: string) => {
    if (label !== "Info" && !isRemediationSeverity(label)) return;
    setSeverityFilter((current) => (current === label ? null : label));
  };

  const handleChartSeverityClick = (seriesId: string) => {
    if (!isRemediationSeverity(seriesId)) return;
    setSeverityFilter((current) => (current === seriesId ? null : seriesId));
  };

  const handleStatusClick = (label: string) => {
    if (!isRemediationStatus(label)) return;
    setStatusFilter((current) => (current === label ? null : label));
  };

  const eventsPerHourChart = useMemo(() => {
    const buckets = buildHourlyBuckets(timeframe);
    const spikeIndex = findSpikeBucketIndex(buckets, timeframe.to, REMEDIATION_SPIKE_HOUR);
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
        ? { index: spikeIndex, label: "spike ~10:30" }
        : undefined;

    return { series, xLabels, xTickIndices, xTickLabels, spikeHighlight };
  }, [timeframe]);

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <InsightCard title="Remediation Events Per Hour By Severity">
        <TimeSeriesAreaChart
          series={eventsPerHourChart.series}
          xLabels={eventsPerHourChart.xLabels}
          xTickIndices={eventsPerHourChart.xTickIndices}
          xTickLabels={eventsPerHourChart.xTickLabels}
          spikeHighlight={eventsPerHourChart.spikeHighlight}
          ariaLabel="Remediation events per hour by severity"
          selectedSeriesId={severityFilter && isRemediationSeverity(severityFilter) ? severityFilter : null}
          onSeriesClick={handleChartSeverityClick}
        />
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Remediation Activity Classes" fillHeight>
          <HorizontalBarPanel
            rows={ACTIVITY_CLASS_ROWS}
            selectedLabel={activityClassFilter}
            onBarClick={handleActivityClassClick}
            filterAriaLabel={(label) => `Filter remediation events by ${label}`}
            xMax={1400}
            xTicks={[0, 350, 700, 1050, 1400]}
          />
        </InsightCard>
        <InsightCard title="Severity ID" fillHeight>
          <HorizontalBarPanel
            rows={SEVERITY_ROWS}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityClick}
            filterAriaLabel={(label) => `Filter remediation events by ${label} severity`}
            xMax={700}
            xTicks={[0, 175, 350, 525, 700]}
          />
        </InsightCard>
        <InsightCard title="Remediation Status" fillHeight>
          <DonutChartPanel
            segments={STATUS_SEGMENTS}
            total={REMEDIATION_STATUS_TOTAL}
            centerLabel="actions"
            selectedLabel={statusFilter}
            onSegmentClick={handleStatusClick}
            ariaLabel="Remediation status breakdown"
          />
        </InsightCard>
      </div>

      <section className="mx-0 mb-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2)]">
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-6 pt-3 sm:pl-5">
          <h2 className="text-base-semibold text-text-primary">Remediation Activity Events</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="shrink-0 text-base-small text-text-secondary">
              {filteredRows.length} of {TOTAL_REMEDIATION_RESULTS} Results
              {activityClassFilter ? ` · ${activityClassFilter}` : ""}
              {severityFilter ? ` · ${severityFilter}` : ""}
              {statusFilter ? ` · ${statusFilter}` : ""}
              {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            </p>
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="!bg-datavis-card-bg"
                aria-label="Search remediation activity events"
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
                  setStatusFilter(null);
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
            <RemediationEventsTable rows={filteredRows} />
          </div>
        </div>
      </section>
    </div>
  );
}
