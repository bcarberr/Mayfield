import { useMemo, useState } from "react";
import { DATA_GRID_ABOVE_SECTION_CLASS, DATA_GRID_HEADER_ROW_CLASS, DATA_GRID_RESULTS_SEARCH_PLACEHOLDER, DATA_GRID_TABLE_CLASS, DATA_GRID_TABLE_SCROLL_CLASS, DATA_GRID_THEAD_CLASS } from "../ui/dataGridTableStyles";
import { Checkbox, Icon, type SeverityShapeIconName } from "../../design-system";
import { Button } from "@/components/shadcn/button";
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
  formatBucketTimeLabel,
  shouldIncludeDateInBucketLabels,
  hourlySeverityValues,
  resolveAnalyticsSpikeIndices,
  SPIKE_CLOCK_HOUR,
} from "./timeframeChartUtils";

type IdentitySeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const SEV_BAR: Record<IdentitySeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const SEV_ICONS: Record<IdentitySeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  Informational: "severity-info",
};

const SEVERITY_ORDER: Record<IdentitySeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};

type AuthOutcome = "Success" | "Failure" | "Unknown";

type AccountChangeActivity = "Password reset" | "Enable" | "Disable" | "Lock" | "Delete";

type IdentityEventClass =
  | "Authentication"
  | "Account Change"
  | "Authorize Session"
  | "Group Management"
  | "Entity Management"
  | "User Access Management";

type IdentityAccessRow = {
  id: string;
  severity: IdentitySeverity;
  title: string;
  time: string;
  activity: string;
  eventClass: IdentityEventClass;
  authOutcome: AuthOutcome;
  accountChangeActivity?: AccountChangeActivity;
  connector: string;
  user: string;
  sourceIp: string;
};

function isIdentityEventClass(label: string): label is IdentityEventClass {
  return (
    label === "Account Change" ||
    label === "Authentication" ||
    label === "Authorize Session" ||
    label === "Entity Management" ||
    label === "User Access Management" ||
    label === "Group Management"
  );
}

function isIdentitySeverity(label: string): label is IdentitySeverity {
  return label in SEV_BAR;
}

/** OCSF Identity & Access Management classes — https://schema.ocsf.io/ category [3]. */
const IAM_MANAGEMENT_CLASS_ROWS = [
  { label: "Account Change", value: 756 },
  { label: "Authentication", value: 1842 },
  { label: "Authorize Session", value: 245 },
  { label: "Entity Management", value: 178 },
  { label: "User Access Management", value: 512 },
  { label: "Group Management", value: 389 },
] as const;

const SEVERITY_ROWS = [
  { label: "Critical", value: 38, color: SEV_BAR.Critical },
  { label: "High", value: 196, color: SEV_BAR.High },
  { label: "Medium", value: 512, color: SEV_BAR.Medium },
  { label: "Low", value: 401, color: SEV_BAR.Low },
  { label: "Informational", value: 623, color: SEV_BAR.Informational },
] as const;

const TOP_USERS_BAR = "#4a9eff";

const IAM_MANAGEMENT_CLASS_ORDER = IAM_MANAGEMENT_CLASS_ROWS.map((row) => row.label);
const SEVERITY_CHART_ORDER = SEVERITY_ROWS.map((row) => row.label);

const IDENTITY_ACCESS_ROWS: IdentityAccessRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "Impossible travel: login from two countries within 5 minutes",
    time: "14:22:08",
    activity: "Logon",
    eventClass: "Authentication",
    authOutcome: "Failure",
    connector: demoTableConnector(0),
    user: "j.alvarez",
    sourceIp: "203.0.113.5",
  },
  {
    id: "2",
    severity: "High",
    title: "Repeated failed logons for privileged service account",
    time: "13:05:41",
    activity: "Logon",
    eventClass: "Authentication",
    authOutcome: "Failure",
    connector: demoTableConnector(1),
    user: "svc-backup",
    sourceIp: "198.51.100.22",
  },
  {
    id: "3",
    severity: "High",
    title: "Admin account password reset outside change window",
    time: "11:40:12",
    activity: "Update",
    eventClass: "Account Change",
    authOutcome: "Success",
    accountChangeActivity: "Password reset",
    connector: demoTableConnector(2),
    user: "admin",
    sourceIp: "10.0.2.18",
  },
  {
    id: "4",
    severity: "Medium",
    title: "New user added to Domain Admins group",
    time: "09:12:00",
    activity: "Add",
    eventClass: "Group Management",
    authOutcome: "Success",
    connector: demoTableConnector(3),
    user: "t.nguyen",
    sourceIp: "10.0.3.55",
  },
  {
    id: "5",
    severity: "Low",
    title: "Session privilege elevation for standard user context",
    time: "22:18:55",
    activity: "Assign Privileges",
    eventClass: "Authorize Session",
    authOutcome: "Success",
    connector: demoTableConnector(4),
    user: "m.chen",
    sourceIp: "10.0.1.44",
  },
  {
    id: "6",
    severity: "Informational",
    title: "MFA enrollment completed for contractor account",
    time: "18:00:03",
    activity: "Update",
    eventClass: "Entity Management",
    authOutcome: "Success",
    connector: demoTableConnector(5),
    user: "k.patel",
    sourceIp: "172.16.4.90",
  },
  {
    id: "7",
    severity: "Critical",
    title: "Disabled account re-enabled without approval ticket",
    time: "16:44:19",
    activity: "Enable",
    eventClass: "Account Change",
    authOutcome: "Success",
    accountChangeActivity: "Enable",
    connector: demoTableConnector(6),
    user: "legacy.ops",
    sourceIp: "192.0.2.77",
  },
  {
    id: "8",
    severity: "High",
    title: "OAuth consent grant to unverified third-party app",
    time: "12:01:47",
    activity: "Authorize",
    eventClass: "User Access Management",
    authOutcome: "Unknown",
    connector: demoTableConnector(7),
    user: "j.alvarez",
    sourceIp: "203.0.113.5",
  },
];

const IDENTITY_SECONDARY_SPIKE_ROWS: IdentityAccessRow[] = [
  {
    id: "s1",
    severity: "Critical",
    title: "Impossible travel: Bucharest login followed by Virginia session 4 minutes later",
    time: "21:30:08",
    activity: "Logon",
    eventClass: "Authentication",
    authOutcome: "Success",
    connector: demoTableConnector(0),
    user: "c.fischer",
    sourceIp: "185.220.101.44",
  },
  {
    id: "s2",
    severity: "Critical",
    title: "Domain Admin sign-in without MFA after hours from Tor exit node",
    time: "21:30:18",
    activity: "Logon",
    eventClass: "Authentication",
    authOutcome: "Success",
    connector: demoTableConnector(1),
    user: "admin",
    sourceIp: "198.51.100.77",
  },
  {
    id: "s3",
    severity: "High",
    title: "Service account added to Domain Admins outside change window",
    time: "21:30:28",
    activity: "Add",
    eventClass: "Group Management",
    authOutcome: "Success",
    connector: demoTableConnector(2),
    user: "svc-backup",
    sourceIp: "10.0.0.12",
  },
];

function identityMatchesSearch(row: IdentityAccessRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.severity,
    row.title,
    row.time,
    row.activity,
    row.eventClass,
    row.authOutcome,
    row.accountChangeActivity,
    row.connector,
    row.user,
    row.sourceIp,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

type IdentitySortColumn =
  | "severity"
  | "title"
  | "time"
  | "activity"
  | "eventClass"
  | "connector"
  | "user"
  | "sourceIp";

/** px widths: select, severity, title, time, activity, class, user, source IP, connector */
const SELECT_COL_WIDTH = 40;
const COL_DEFAULTS: readonly number[] = [SELECT_COL_WIDTH, 108, 280, 96, 100, 148, 112, 120, 120];
const COL_MINS: readonly number[] = [SELECT_COL_WIDTH, 72, 120, 72, 56, 96, 80, 88, 80];

export function useIdentityAccessTableGrid(rows: readonly Parameters<typeof IdentityAccessTable>[0]["displayRows"][number][]) {
  const sortComparators = useMemo(
    (): Record<IdentitySortColumn, (a: IdentityAccessRow, b: IdentityAccessRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      eventClass: (a, b) => compareStrings(a.eventClass, b.eventClass),
      connector: (a, b) => compareStrings(a.connector, b.connector),
      user: (a, b) => compareStrings(a.user, b.user),
      sourceIp: (a, b) => compareStrings(a.sourceIp, b.sourceIp),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators);
}

function IdentityAccessTable({ displayRows, getSortProps }: { displayRows: IdentityAccessRow[]; getSortProps: ReturnType<typeof useIdentityAccessTableGrid>["getSortProps"] }) {
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
        <caption className="sr-only">Identity and access events</caption>
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
              <ColumnHeaderMenu label="User" menuLabel="User column options" {...getSortProps("user")} />
              {resizeHandle(6)}
            </th>
            <th
              scope="col"
              style={colStyle(7)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Source IP" menuLabel="Source IP column options" {...getSortProps("sourceIp")} />
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
                    aria-label={`Select identity event ${row.id}`}
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
                    name="ocsf-identity-access"
                    size={16}
                    className="size-4 shrink-0 text-interactive-active [&_svg]:!size-4"
                    aria-hidden
                  />
                  <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                    {row.eventClass}
                  </TruncatedText>
                </span>
              </td>
              <td style={colStyle(6)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.user}</TruncatedText>
              </td>
              <td style={colStyle(7)} className="min-w-0 px-2 py-0 align-middle tabular-nums">
                <TruncatedText className="text-sm text-text-secondary">{row.sourceIp}</TruncatedText>
              </td>
              <td style={colStyle(8)} className="min-w-0 overflow-hidden px-2 py-0 align-middle">
                <ConnectorTableCell
                  name={row.connector}
                  className="w-full"
                  textClassName="w-full text-sm text-text-secondary"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Figma concept — Identity & Access body for Federated Analytics. */
export function IdentityAccessContent() {
  const { timeframe, initialTimeframe, isChartZoomed, handleTimelineBrush, handleChartZoomReset } =
    useFederatedAnalyticsTimeframeZoom("hourly");
  const [eventClassFilter, setEventClassFilter] = useState<IdentityEventClass | null>(null);
  const [severityFilter, setSeverityFilter] = useState<IdentitySeverity | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const tableRows = useMemo(
    () =>
      buildHourlyEventRows(
        IDENTITY_ACCESS_ROWS,
        initialTimeframe,
        (template, id, eventTime) => ({
          ...template,
          id,
          time: formatAnalyticsRowTime(eventTime),
        }),
        { secondarySpikeTemplates: IDENTITY_SECONDARY_SPIKE_ROWS },
      ),
    [initialTimeframe],
  );

  const timeframeScopedRows = useMemo(
    () => tableRows.filter((row) => rowTimeInTimeframe(row.time, timeframe)),
    [tableRows, timeframe],
  );

  const iamManagementClassRows = useMemo(
    () => countByLabel(timeframeScopedRows, IAM_MANAGEMENT_CLASS_ORDER, (row) => row.eventClass),
    [timeframeScopedRows],
  );

  const iamManagementClassBarScale = useMemo(
    () => horizontalBarScale(iamManagementClassRows.map((row) => row.value)),
    [iamManagementClassRows],
  );

  const severityChartRows = useMemo(
    () =>
      countByLabel(timeframeScopedRows, SEVERITY_CHART_ORDER, (row) => row.severity).map((row) => ({
        ...row,
        color: SEV_BAR[row.label as IdentitySeverity],
      })),
    [timeframeScopedRows],
  );

  const severityBarScale = useMemo(
    () => horizontalBarScale(severityChartRows.map((row) => row.value)),
    [severityChartRows],
  );

  const topUsersChartRows = useMemo(
    () => topCountsByLabel(timeframeScopedRows, (row) => row.user, 4, TOP_USERS_BAR),
    [timeframeScopedRows],
  );

  const topUsersBarScale = useMemo(
    () => horizontalBarScale(topUsersChartRows.map((row) => row.value)),
    [topUsersChartRows],
  );

    const filteredRows = useMemo(
    () =>
      timeframeScopedRows.filter((row) => {
        if (eventClassFilter && row.eventClass !== eventClassFilter) return false;
        if (severityFilter && row.severity !== severityFilter) return false;
        if (userFilter && row.user !== userFilter) return false;
        if (!identityMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [timeframeScopedRows, eventClassFilter, severityFilter, userFilter, searchQuery],
  );
  const tableGrid = useIdentityAccessTableGrid(filteredRows);

  const hasActiveFilters =
    eventClassFilter != null ||
    severityFilter != null ||
    userFilter != null ||
    searchQuery.trim().length > 0;

  const handleEventClassClick = (label: string) => {
    if (!isIdentityEventClass(label)) return;
    setEventClassFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (label: string) => {
    if (!isIdentitySeverity(label)) return;
    setSeverityFilter((current) => (current === label ? null : label));
  };

  const handleUserClick = (label: string) => {
    setUserFilter((current) => (current === label ? null : label));
  };

  const eventsPerHourChart = useMemo(() => {
    const buckets = buildHourlyBuckets(timeframe);
    const { spikeIndex, secondarySpikeIndex } = resolveAnalyticsSpikeIndices(buckets, timeframe.to);
    const includeDate = shouldIncludeDateInBucketLabels(timeframe);
    const xLabels = buckets.map((bucket) => formatBucketTimeLabel(bucket.start, includeDate));
    const { indices: xTickIndices, labels: xTickLabels } = buildHourlyAxisTicks(buckets, timeframe);

    const series = [
      {
        id: "Medium",
        label: "Medium",
        color: SEV_BAR.Medium,
        icon: SEV_ICONS.Medium,
        values: hourlySeverityValues(12, buckets, spikeIndex, secondarySpikeIndex),
      },
      {
        id: "High",
        label: "High",
        color: SEV_BAR.High,
        icon: SEV_ICONS.High,
        values: hourlySeverityValues(8, buckets, spikeIndex, secondarySpikeIndex),
      },
      {
        id: "Critical",
        label: "Critical",
        color: SEV_BAR.Critical,
        icon: SEV_ICONS.Critical,
        values: hourlySeverityValues(3, buckets, spikeIndex, secondarySpikeIndex),
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
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
      <InsightCard title="Identity & Access Events Per Hour By Severity">
        <ChartZoomHint unit="Hours" isChartZoomed={isChartZoomed} onReset={handleChartZoomReset} />
        <TimeSeriesAreaChart
          series={eventsPerHourChart.series}
          xLabels={eventsPerHourChart.xLabels}
          xTickIndices={eventsPerHourChart.xTickIndices}
          xTickLabels={eventsPerHourChart.xTickLabels}
          bucketStarts={eventsPerHourChart.buckets.map((bucket) => bucket.start)}
          spikeHighlight={eventsPerHourChart.spikeHighlight}
          ariaLabel="Identity and access events per hour by severity"
          selectedSeriesId={severityFilter}
          onSeriesClick={handleSeverityClick}
          onBrushCommit={(selection) => handleTimelineBrush(selection, eventsPerHourChart.buckets)}
        />
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Identity & Access Management Classes" fillHeight>
          <HorizontalBarPanel
            rows={iamManagementClassRows}
            selectedLabel={eventClassFilter}
            onBarClick={handleEventClassClick}
            filterAriaLabel={(label) => `Filter identity events by ${label}`}
            xMax={iamManagementClassBarScale.xMax}
            xTicks={iamManagementClassBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Severity ID" fillHeight>
          <HorizontalBarPanel
            rows={severityChartRows}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityClick}
            filterAriaLabel={(label) => `Filter identity events by ${label} severity`}
            xMax={severityBarScale.xMax}
            xTicks={severityBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Top Users By Failed Logins" fillHeight>
          <HorizontalBarPanel
            rows={topUsersChartRows}
            selectedLabel={userFilter}
            onBarClick={handleUserClick}
            filterAriaLabel={(label) => `Filter identity events by user ${label}`}
            xMax={topUsersBarScale.xMax}
            xTicks={topUsersBarScale.xTicks}
          />
        </InsightCard>
      </div>
      </div>

      <DataGridSection
        header={
          <>
            <h2 className="text-base-semibold text-text-primary">Identity & Access Events</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="shrink-0 text-base-small text-text-secondary">
                {filteredRows.length} of {timeframeScopedRows.length} Results
                {eventClassFilter ? ` · ${eventClassFilter}` : ""}
                {severityFilter ? ` · ${severityFilter}` : ""}
                {userFilter ? ` · ${userFilter}` : ""}
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
                  aria-label="Search identity and access events"
                />
              </div>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
                  onClick={() => {
                    setEventClassFilter(null);
                    setSeverityFilter(null);
                    setUserFilter(null);
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
        table={<IdentityAccessTable displayRows={tableGrid.displayRows} getSortProps={tableGrid.getSortProps} />}
        footer={<DataGridPaginationFooter grid={tableGrid} />}
      />
    </div>
  );
}
