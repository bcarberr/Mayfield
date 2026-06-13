import { useMemo, useState } from "react";
import { Icon, type SeverityShapeIconName } from "../../design-system";
import { useTimeframe } from "../../context/TimeframeContext";
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
import { CHART_CATEGORY_FILL, HorizontalBarPanel } from "./horizontalBarPanel";
import { TimeSeriesAreaChart } from "./timeSeriesAreaChart";
import {
  buildHourlyAxisTicks,
  buildHourlyBuckets,
  findSpikeBucketIndex,
  formatBucketTimeLabel,
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

function connectorSwatch(connector: string) {
  if (connector.startsWith("BCs")) return "bg-feedback-info";
  if (connector.includes("Athena")) return "bg-interactive-active";
  return "bg-feedback-negative";
}

const ACTIVITY_CLASS_ROWS = [
  { label: "API Activity", value: 4180, color: CHART_CATEGORY_FILL },
  { label: "Web Resource Access", value: 3210, color: CHART_CATEGORY_FILL },
  { label: "Datastore Activity", value: 1840, color: CHART_CATEGORY_FILL },
  { label: "File Hosting", value: 1260, color: CHART_CATEGORY_FILL },
  { label: "App Lifecycle", value: 890, color: CHART_CATEGORY_FILL },
  { label: "App Error", value: 620, color: CHART_CATEGORY_FILL },
] as const;

const SEVERITY_ROWS = [
  { label: "Critical", value: 24, color: SEV_BAR.Critical },
  { label: "High", value: 156, color: SEV_BAR.High },
  { label: "Medium", value: 340, color: SEV_BAR.Medium },
  { label: "Low", value: 462, color: SEV_BAR.Low },
  { label: "Info", value: 7215, color: SEV_BAR.Informational },
] as const;

const TOP_APP_ROWS = [
  { label: "Salesforce", value: 2310, color: APP_BAR_FILL },
  { label: "M365", value: 1740, color: APP_BAR_FILL },
  { label: "Snowflake", value: 980, color: APP_BAR_FILL },
  { label: "GitHub", value: 640, color: APP_BAR_FILL },
] as const;

const APPLICATION_ACTIVITY_ROWS: ApplicationActivityRow[] = [
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
    connector: "BCs1",
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
    connector: "BC-CS-Athena",
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
    connector: "BC-CS",
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
    connector: "BCs1",
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
    connector: "BC-CS-Athena",
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
    connector: "BC-CS",
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
    connector: "BCs1",
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
    connector: "BC-CS-Athena",
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
    connector: "BCs1",
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
    connector: "BC-CS",
  },
];

const TOTAL_APPLICATION_RESULTS = 8197;

function isActivityClass(label: string): label is ActivityClass {
  return ACTIVITY_CLASS_ROWS.some((row) => row.label === label);
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

function ApplicationActivityTable({ rows }: { rows: ApplicationActivityRow[] }) {
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
        <caption className="sr-only">Application activity events</caption>
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

/** Figma concept — Application Activity body for Federated Analytics. */
export function ApplicationActivityContent() {
  const { range: timeframe } = useTimeframe();
  const [activityClassFilter, setActivityClassFilter] = useState<ActivityClass | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [appFilter, setAppFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const filteredRows = useMemo(
    () =>
      APPLICATION_ACTIVITY_ROWS.filter((row) => {
        if (activityClassFilter && row.activityClass !== activityClassFilter) return false;
        if (severityFilter && !severityMatchesFilter(row.severity, severityFilter)) return false;
        if (appFilter && row.app !== appFilter) return false;
        if (!applicationMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [activityClassFilter, severityFilter, appFilter, searchQuery],
  );

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
        ? { index: spikeIndex, label: `spike ~${APPLICATION_SPIKE_HOUR}:00` }
        : undefined;

    return { series, xLabels, xTickIndices, xTickLabels, spikeHighlight };
  }, [timeframe]);

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <InsightCard title="Application Activity Events Per Hour By Severity">
        <TimeSeriesAreaChart
          series={eventsPerHourChart.series}
          xLabels={eventsPerHourChart.xLabels}
          xTickIndices={eventsPerHourChart.xTickIndices}
          xTickLabels={eventsPerHourChart.xTickLabels}
          spikeHighlight={eventsPerHourChart.spikeHighlight}
          ariaLabel="Application activity events per hour by severity"
          selectedSeriesId={severityFilter && isApplicationSeverity(severityFilter) ? severityFilter : null}
          onSeriesClick={handleChartSeverityClick}
        />
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Application Activity Classes" fillHeight>
          <HorizontalBarPanel
            rows={ACTIVITY_CLASS_ROWS}
            selectedLabel={activityClassFilter}
            onBarClick={handleActivityClassClick}
            filterAriaLabel={(label) => `Filter application activity by ${label}`}
            xMax={4500}
            xTicks={[0, 1125, 2250, 3375, 4500]}
          />
        </InsightCard>
        <InsightCard title="Severity ID" fillHeight>
          <HorizontalBarPanel
            rows={SEVERITY_ROWS}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityClick}
            filterAriaLabel={(label) => `Filter application activity by ${label} severity`}
            xMax={7500}
            xTicks={[0, 1875, 3750, 5625, 7500]}
          />
        </InsightCard>
        <InsightCard title="Top Apps By API Call Volume" fillHeight>
          <HorizontalBarPanel
            rows={TOP_APP_ROWS}
            selectedLabel={appFilter}
            onBarClick={handleAppClick}
            filterAriaLabel={(label) => `Filter application activity by app ${label}`}
            xMax={2500}
            xTicks={[0, 625, 1250, 1875, 2500]}
          />
        </InsightCard>
      </div>

      <section className="mx-0 mb-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2)]">
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-6 pt-3 sm:pl-5">
          <h2 className="text-base-semibold text-text-primary">Application Activity Events</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="shrink-0 text-base-small text-text-secondary">
              {filteredRows.length} of {TOTAL_APPLICATION_RESULTS} Results
              {activityClassFilter ? ` · ${activityClassFilter}` : ""}
              {severityFilter ? ` · ${severityFilter}` : ""}
              {appFilter ? ` · ${appFilter}` : ""}
              {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            </p>
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
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
        </div>
        <DatavisGridlineRule inset={false} />
        <div className="flex min-h-0 flex-1 overflow-auto bg-datavis-card-bg">
          <FilterColumnPanel
            active={tableTool}
            onFilterClick={() => setTableTool(tableTool === "filter" ? null : "filter")}
            onColumnsClick={() => setTableTool(tableTool === "columns" ? null : "columns")}
          />
          <div className="min-h-0 min-w-0 flex-1 pb-3">
            <ApplicationActivityTable rows={filteredRows} />
          </div>
        </div>
      </section>
    </div>
  );
}
