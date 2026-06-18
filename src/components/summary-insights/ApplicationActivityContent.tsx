import { useMemo, useState } from "react";
import { DATA_GRID_ABOVE_SECTION_CLASS, DATA_GRID_HEADER_ROW_CLASS, DATA_GRID_RESULTS_SEARCH_PLACEHOLDER, DATA_GRID_TABLE_CLASS, DATA_GRID_TABLE_SCROLL_CLASS, DATA_GRID_THEAD_CLASS } from "../ui/dataGridTableStyles";
import { Checkbox, Icon, type SeverityShapeIconName } from "../../design-system";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
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
import { cx, InsightCard } from "./datavisCard";
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
  shouldIncludeDateInBucketLabels,
  hourlySeverityValues,
} from "./timeframeChartUtils";

const APPLICATION_SPIKE_HOUR = 10;

type ApplicationSeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const SEV_BAR: Record<ApplicationSeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const SEV_ICONS: Record<ApplicationSeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  Informational: "severity-info",
};

const SEVERITY_ORDER: Record<ApplicationSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};

const APP_BAR_FILL = "#4a9eff";

type ActivityClass =
  | "API Activity"
  | "Web Resource Access"
  | "Datastore Activity"
  | "File Hosting"
  | "App Lifecycle"
  | "App Error";

type ApplicationEventClass =
  | "API Activity"
  | "Web Resource Access Activity"
  | "Datastore Activity"
  | "File Hosting Activity"
  | "Application Lifecycle"
  | "Application Error";

type ApplicationActivityRow = {
  id: string;
  severity: ApplicationSeverity;
  title: string;
  time: string;
  activity: string;
  eventClass: ApplicationEventClass;
  activityClass: ActivityClass;
  app: string;
  user: string;
  connector: string;
};

const ACTIVITY_CLASS_ORDER = [
  "API Activity",
  "Web Resource Access",
  "Datastore Activity",
  "File Hosting",
  "App Lifecycle",
  "App Error",
] as const;

const SEVERITY_CHART_ORDER = ["Critical", "High", "Medium", "Low", "Info"] as const;

const APPLICATION_ACTIVITY_ROW_TEMPLATES: ApplicationActivityRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "Bulk export of customer records via API exceeded baseline volume…",
    time: "10:22:08",
    activity: "Query",
    eventClass: "Datastore Activity",
    activityClass: "Datastore Activity",
    app: "Snowflake",
    user: "svc-etl",
    connector: demoTableConnector(0),
  },
  {
    id: "2",
    severity: "High",
    title: "External share link created for restricted document library…",
    time: "09:58:41",
    activity: "Share",
    eventClass: "File Hosting Activity",
    activityClass: "File Hosting",
    app: "M365",
    user: "k.patel",
    connector: demoTableConnector(1),
  },
  {
    id: "3",
    severity: "High",
    title: "OAuth token refresh storm from unattended integration account…",
    time: "09:40:12",
    activity: "Read",
    eventClass: "API Activity",
    activityClass: "API Activity",
    app: "Salesforce",
    user: "integration-bot",
    connector: demoTableConnector(2),
  },
  {
    id: "4",
    severity: "Medium",
    title: "Repository workflow dispatch from new IP geolocation…",
    time: "08:12:00",
    activity: "Update",
    eventClass: "Web Resource Access Activity",
    activityClass: "Web Resource Access",
    app: "GitHub",
    user: "devops-ci",
    connector: demoTableConnector(3),
  },
  {
    id: "5",
    severity: "Low",
    title: "Application install event on managed endpoint outside change window…",
    time: "22:18:55",
    activity: "Install",
    eventClass: "Application Lifecycle",
    activityClass: "App Lifecycle",
    app: "M365",
    user: "a.nguyen",
    connector: demoTableConnector(4),
  },
  {
    id: "6",
    severity: "Informational",
    title: "Scheduled API health check completed with elevated latency…",
    time: "18:00:03",
    activity: "Read",
    eventClass: "API Activity",
    activityClass: "API Activity",
    app: "Salesforce",
    user: "monitor-svc",
    connector: demoTableConnector(5),
  },
  {
    id: "7",
    severity: "Critical",
    title: "Unhandled application error exposed stack trace in API response…",
    time: "16:44:19",
    activity: "Error",
    eventClass: "Application Error",
    activityClass: "App Error",
    app: "Snowflake",
    user: "svc-analytics",
    connector: demoTableConnector(6),
  },
  {
    id: "8",
    severity: "High",
    title: "Mass file download from shared drive during off-hours session…",
    time: "12:01:47",
    activity: "Read",
    eventClass: "File Hosting Activity",
    activityClass: "File Hosting",
    app: "M365",
    user: "contractor-07",
    connector: demoTableConnector(7),
  },
  {
    id: "9",
    severity: "Medium",
    title: "Datastore query returned unusually wide result set to service account…",
    time: "09:33:22",
    activity: "Query",
    eventClass: "Datastore Activity",
    activityClass: "Datastore Activity",
    app: "Snowflake",
    user: "svc-reporting",
    connector: demoTableConnector(8),
  },
  {
    id: "10",
    severity: "Low",
    title: "Web resource access denied for deprecated API version…",
    time: "21:15:08",
    activity: "Read",
    eventClass: "Web Resource Access Activity",
    activityClass: "Web Resource Access",
    app: "GitHub",
    user: "release-bot",
    connector: demoTableConnector(9),
  },
];

function isActivityClass(label: string): label is ActivityClass {
  return (ACTIVITY_CLASS_ORDER as readonly string[]).includes(label);
}

function isApplicationSeverity(label: string): label is ApplicationSeverity {
  return label in SEV_BAR;
}

function severityMatchesFilter(rowSeverity: ApplicationSeverity, filter: string): boolean {
  if (filter === "Info") return rowSeverity === "Informational";
  return rowSeverity === filter;
}

function applicationMatchesSearch(row: ApplicationActivityRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    row.severity,
    row.title,
    row.time,
    row.activity,
    row.eventClass,
    row.activityClass,
    row.app,
    row.user,
    row.connector,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

type ApplicationSortColumn =
  | "severity"
  | "title"
  | "time"
  | "activity"
  | "eventClass"
  | "app"
  | "user"
  | "connector";

const SELECT_COL_WIDTH = 40;
const COL_DEFAULTS: readonly number[] = [SELECT_COL_WIDTH, 108, 280, 96, 88, 160, 100, 120, 120];
const COL_MINS: readonly number[] = [SELECT_COL_WIDTH, 72, 120, 72, 56, 96, 72, 80, 80];

export function useApplicationActivityTableGrid(rows: readonly Parameters<typeof ApplicationActivityTable>[0]["displayRows"][number][]) {
  const sortComparators = useMemo(
    (): Record<ApplicationSortColumn, (a: ApplicationActivityRow, b: ApplicationActivityRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      eventClass: (a, b) => compareStrings(a.eventClass, b.eventClass),
      app: (a, b) => compareStrings(a.app, b.app),
      user: (a, b) => compareStrings(a.user, b.user),
      connector: (a, b) => compareStrings(a.connector, b.connector),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators);
}

function ApplicationActivityTable({
  displayRows,
  getSortProps,
}: {
  displayRows: ApplicationActivityRow[];
  getSortProps: ReturnType<typeof useApplicationActivityTableGrid>["getSortProps"];
}) {
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
        <caption className="sr-only">Application activity events</caption>
        <colgroup>
          {displayWidths.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead className={DATA_GRID_THEAD_CLASS}>
          <tr className={DATA_GRID_HEADER_ROW_CLASS}>
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
              <ColumnHeaderMenu label="App" menuLabel="App column options" {...getSortProps("app")} />
              {resizeHandle(6)}
            </th>
            <th
              scope="col"
              style={colStyle(7)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="User" menuLabel="User column options" {...getSortProps("user")} />
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
                    aria-label={`Select application activity event ${row.id}`}
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
                    name="ocsf-application-activity"
                    size={16}
                    className="size-4 shrink-0 text-datavis-data-rouge-40 [&_svg]:!size-4"
                    aria-hidden
                  />
                  <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                    {row.eventClass}
                  </TruncatedText>
                </span>
              </td>
              <td style={colStyle(6)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.app}</TruncatedText>
              </td>
              <td style={colStyle(7)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.user}</TruncatedText>
              </td>
              <td style={colStyle(8)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <ConnectorTableCell name={row.connector} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Figma concept — Application Activity body for Federated Analytics. */
export function ApplicationActivityContent() {
  const { timeframe, initialTimeframe, isChartZoomed, handleTimelineBrush, handleChartZoomReset } =
    useFederatedAnalyticsTimeframeZoom("hourly");
  const [activityClassFilter, setActivityClassFilter] = useState<ActivityClass | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [appFilter, setAppFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const tableRows = useMemo(
    () =>
      buildHourlyEventRows(APPLICATION_ACTIVITY_ROW_TEMPLATES, initialTimeframe, (template, id, eventTime) => ({
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
      countByLabel(timeframeScopedRows, SEVERITY_CHART_ORDER, (row) =>
        row.severity === "Informational" ? "Info" : row.severity,
      ).map((row) => ({
        ...row,
        color: row.label === "Info" ? SEV_BAR.Informational : SEV_BAR[row.label as ApplicationSeverity],
      })),
    [timeframeScopedRows],
  );

  const severityBarScale = useMemo(
    () => horizontalBarScale(severityChartRows.map((row) => row.value)),
    [severityChartRows],
  );

  const topAppRows = useMemo(
    () => topCountsByLabel(timeframeScopedRows, (row) => row.app, 4, APP_BAR_FILL),
    [timeframeScopedRows],
  );

  const topAppBarScale = useMemo(
    () => horizontalBarScale(topAppRows.map((row) => row.value)),
    [topAppRows],
  );

    const filteredRows = useMemo(
    () =>
      timeframeScopedRows.filter((row) => {
        if (activityClassFilter && row.activityClass !== activityClassFilter) return false;
        if (severityFilter && !severityMatchesFilter(row.severity, severityFilter)) return false;
        if (appFilter && row.app !== appFilter) return false;
        if (!applicationMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [timeframeScopedRows, activityClassFilter, severityFilter, appFilter, searchQuery],
  );
  const tableGrid = useApplicationActivityTableGrid(filteredRows);

  const hasActiveFilters =
    activityClassFilter != null ||
    severityFilter != null ||
    appFilter != null ||
    searchQuery.trim().length > 0;

  const handleActivityClassClick = (label: string) => {
    if (!isActivityClass(label)) return;
    setActivityClassFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (label: string) => {
    if (label !== "Info" && !isApplicationSeverity(label)) return;
    setSeverityFilter((current) => (current === label ? null : label));
  };

  const handleChartSeverityClick = (seriesId: string) => {
    if (!isApplicationSeverity(seriesId)) return;
    setSeverityFilter((current) => (current === seriesId ? null : seriesId));
  };

  const handleAppClick = (label: string) => {
    setAppFilter((current) => (current === label ? null : label));
  };

  const eventsPerHourChart = useMemo(() => {
    const buckets = buildHourlyBuckets(timeframe);
    const spikeIndex = findSpikeBucketIndex(buckets, timeframe.to, APPLICATION_SPIKE_HOUR);
    const includeDate = shouldIncludeDateInBucketLabels(timeframe);
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
        ? { index: spikeIndex, label: `spike ~${APPLICATION_SPIKE_HOUR}:00` }
        : undefined;

    return { series, xLabels, xTickIndices, xTickLabels, spikeHighlight, buckets };
  }, [timeframe]);

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
      <InsightCard title="Application Activity Events Per Hour By Severity">
        <ChartZoomHint unit="Hours" isChartZoomed={isChartZoomed} onReset={handleChartZoomReset} />
        <TimeSeriesAreaChart
          series={eventsPerHourChart.series}
          xLabels={eventsPerHourChart.xLabels}
          xTickIndices={eventsPerHourChart.xTickIndices}
          xTickLabels={eventsPerHourChart.xTickLabels}
          bucketStarts={eventsPerHourChart.buckets.map((bucket) => bucket.start)}
          spikeHighlight={eventsPerHourChart.spikeHighlight}
          ariaLabel="Application activity events per hour by severity"
          selectedSeriesId={severityFilter && isApplicationSeverity(severityFilter) ? severityFilter : null}
          onSeriesClick={handleChartSeverityClick}
          onBrushCommit={(selection) => handleTimelineBrush(selection, eventsPerHourChart.buckets)}
        />
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Application Activity Classes" fillHeight>
          <HorizontalBarPanel
            rows={activityClassRows}
            selectedLabel={activityClassFilter}
            onBarClick={handleActivityClassClick}
            filterAriaLabel={(label) => `Filter application activity by ${label}`}
            xMax={activityClassBarScale.xMax}
            xTicks={activityClassBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Severity ID" fillHeight>
          <HorizontalBarPanel
            rows={severityChartRows}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityClick}
            filterAriaLabel={(label) => `Filter application activity by ${label} severity`}
            xMax={severityBarScale.xMax}
            xTicks={severityBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Top Apps By API Call Volume" fillHeight>
          <HorizontalBarPanel
            rows={topAppRows}
            selectedLabel={appFilter}
            onBarClick={handleAppClick}
            filterAriaLabel={(label) => `Filter application activity by app ${label}`}
            xMax={topAppBarScale.xMax}
            xTicks={topAppBarScale.xTicks}
          />
        </InsightCard>
      </div>
      </div>

      <DataGridSection
        header={
          <>
            <h2 className="text-base-semibold text-text-primary">Application Activity Events</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="shrink-0 text-base-small text-text-secondary">
                {filteredRows.length} of {timeframeScopedRows.length} Results
                {activityClassFilter ? ` · ${activityClassFilter}` : ""}
                {severityFilter ? ` · ${severityFilter}` : ""}
                {appFilter ? ` · ${appFilter}` : ""}
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
                  aria-label="Search application activity events"
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
                    setAppFilter(null);
                    setSearchQuery("");
                  }}
                >
                  <Icon name="action-filter-list" size={12} aria-hidden />
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
        table={<ApplicationActivityTable displayRows={tableGrid.displayRows} getSortProps={tableGrid.getSortProps} />}
        footer={<DataGridPaginationFooter grid={tableGrid} />}
      />
    </div>
  );
}
