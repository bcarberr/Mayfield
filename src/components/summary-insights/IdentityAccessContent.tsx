import { useMemo, useState } from "react";
import { Icon, type SeverityShapeIconName } from "../../design-system";
import { useTimeframe } from "../../context/TimeframeContext";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { compareStrings, useColumnSort } from "../ui/useColumnSort";
import { useResizableColumns } from "../ui/useResizableColumns";
import { TruncatedText } from "../ui/TruncatedText";
import { Checkbox } from "../uiCheckbox";
import { cx, DatavisGridlineRule, InsightCard } from "./datavisCard";
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

function connectorSwatch(connector: string) {
  if (connector.startsWith("BCs")) return "bg-feedback-info";
  if (connector.includes("Athena")) return "bg-interactive-active";
  return "bg-feedback-negative";
}

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

const TOP_USERS_ROWS = [
  { label: "svc-backup", value: 214, color: TOP_USERS_BAR },
  { label: "j.alvarez", value: 112, color: TOP_USERS_BAR },
  { label: "admin", value: 81, color: TOP_USERS_BAR },
  { label: "t.nguyen", value: 42, color: TOP_USERS_BAR },
] as const;

const IDENTITY_ACCESS_ROWS: IdentityAccessRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "Impossible travel: login from two countries within 5 min…",
    time: "14:22:08",
    activity: "Logon",
    eventClass: "Authentication",
    authOutcome: "Failure",
    connector: "BCs1",
    user: "j.alvarez",
    sourceIp: "203.0.113.5",
  },
  {
    id: "2",
    severity: "High",
    title: "Repeated failed logons for privileged service account…",
    time: "13:05:41",
    activity: "Logon",
    eventClass: "Authentication",
    authOutcome: "Failure",
    connector: "BC-CS-Athena",
    user: "svc-backup",
    sourceIp: "198.51.100.22",
  },
  {
    id: "3",
    severity: "High",
    title: "Admin account password reset outside change window…",
    time: "11:40:12",
    activity: "Update",
    eventClass: "Account Change",
    authOutcome: "Success",
    accountChangeActivity: "Password reset",
    connector: "BC-CS",
    user: "admin",
    sourceIp: "10.0.2.18",
  },
  {
    id: "4",
    severity: "Medium",
    title: "New user added to Domain Admins group…",
    time: "09:12:00",
    activity: "Add",
    eventClass: "Group Management",
    authOutcome: "Success",
    connector: "BCs1",
    user: "t.nguyen",
    sourceIp: "10.0.3.55",
  },
  {
    id: "5",
    severity: "Low",
    title: "Session privilege elevation for standard user context…",
    time: "22:18:55",
    activity: "Assign Privileges",
    eventClass: "Authorize Session",
    authOutcome: "Success",
    connector: "BC-CS-Athena",
    user: "m.chen",
    sourceIp: "10.0.1.44",
  },
  {
    id: "6",
    severity: "Informational",
    title: "MFA enrollment completed for contractor account…",
    time: "18:00:03",
    activity: "Update",
    eventClass: "Entity Management",
    authOutcome: "Success",
    connector: "BCs1",
    user: "k.patel",
    sourceIp: "172.16.4.90",
  },
  {
    id: "7",
    severity: "Critical",
    title: "Disabled account re-enabled without approval ticket…",
    time: "16:44:19",
    activity: "Enable",
    eventClass: "Account Change",
    authOutcome: "Success",
    accountChangeActivity: "Enable",
    connector: "BC-CS",
    user: "legacy.ops",
    sourceIp: "192.0.2.77",
  },
  {
    id: "8",
    severity: "High",
    title: "OAuth consent grant to unverified third-party app…",
    time: "12:01:47",
    activity: "Authorize",
    eventClass: "User Access Management",
    authOutcome: "Unknown",
    connector: "BC-CS-Athena",
    user: "j.alvarez",
    sourceIp: "203.0.113.5",
  },
];

const TOTAL_IDENTITY_RESULTS = 6566;

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

/** px widths: select, severity, title, time, activity, class, connector, user, source IP */
const SELECT_COL_WIDTH = 40;
const COL_DEFAULTS: readonly number[] = [SELECT_COL_WIDTH, 108, 280, 96, 100, 148, 120, 112, 120];
const COL_MINS: readonly number[] = [SELECT_COL_WIDTH, 72, 120, 72, 56, 96, 80, 80, 88];

function IdentityAccessTable({ rows }: { rows: IdentityAccessRow[] }) {
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
        <caption className="sr-only">Identity and access events</caption>
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
              <ColumnHeaderMenu label="Connector" menuLabel="Connector column options" {...getSortProps("connector")} />
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
              <ColumnHeaderMenu label="Source IP" menuLabel="Source IP column options" {...getSortProps("sourceIp")} />
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
                    aria-label={`Select identity event ${row.id}`}
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
              <td style={colStyle(6)} className="h-10 min-w-0 overflow-hidden px-2 py-0 align-middle">
                <span className="flex w-full min-w-0 items-center gap-2">
                  <span
                    className={cx("size-2.5 shrink-0 rounded-sm", connectorSwatch(row.connector))}
                    aria-hidden
                  />
                  <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                    {row.connector}
                  </TruncatedText>
                </span>
              </td>
              <td style={colStyle(7)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.user}</TruncatedText>
              </td>
              <td style={colStyle(8)} className="h-10 min-w-0 px-2 py-0 align-middle tabular-nums">
                <TruncatedText className="text-sm text-text-secondary">{row.sourceIp}</TruncatedText>
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
  const { range: timeframe } = useTimeframe();
  const [eventClassFilter, setEventClassFilter] = useState<IdentityEventClass | null>(null);
  const [severityFilter, setSeverityFilter] = useState<IdentitySeverity | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const filteredRows = useMemo(
    () =>
      IDENTITY_ACCESS_ROWS.filter((row) => {
        if (eventClassFilter && row.eventClass !== eventClassFilter) return false;
        if (severityFilter && row.severity !== severityFilter) return false;
        if (userFilter && row.user !== userFilter) return false;
        if (!identityMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [eventClassFilter, severityFilter, userFilter, searchQuery],
  );

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
        values: hourlySeverityValues(12, buckets, spikeIndex),
      },
      {
        id: "High",
        label: "High",
        color: SEV_BAR.High,
        icon: SEV_ICONS.High,
        values: hourlySeverityValues(8, buckets, spikeIndex),
      },
      {
        id: "Critical",
        label: "Critical",
        color: SEV_BAR.Critical,
        icon: SEV_ICONS.Critical,
        values: hourlySeverityValues(3, buckets, spikeIndex),
      },
    ] as const;

    const spikeHighlight =
      spikeIndex != null
        ? { index: spikeIndex, label: `spike ~${SPIKE_CLOCK_HOUR}:00` }
        : undefined;

    return { series, xLabels, xTickIndices, xTickLabels, spikeHighlight };
  }, [timeframe]);

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <InsightCard title="Events Per Hour By Severity">
        <TimeSeriesAreaChart
          series={eventsPerHourChart.series}
          xLabels={eventsPerHourChart.xLabels}
          xTickIndices={eventsPerHourChart.xTickIndices}
          xTickLabels={eventsPerHourChart.xTickLabels}
          spikeHighlight={eventsPerHourChart.spikeHighlight}
          ariaLabel="Identity and access events per hour by severity"
          selectedSeriesId={severityFilter}
          onSeriesClick={handleSeverityClick}
        />
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Identity & Access Management Classes" fillHeight>
          <HorizontalBarPanel
            rows={IAM_MANAGEMENT_CLASS_ROWS}
            selectedLabel={eventClassFilter}
            onBarClick={handleEventClassClick}
            filterAriaLabel={(label) => `Filter identity events by ${label}`}
            xMax={2000}
            xTicks={[0, 500, 1000, 1500, 2000]}
          />
        </InsightCard>
        <InsightCard title="Severity ID" fillHeight>
          <HorizontalBarPanel
            rows={SEVERITY_ROWS}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityClick}
            filterAriaLabel={(label) => `Filter identity events by ${label} severity`}
            xMax={700}
            xTicks={[0, 175, 350, 525, 700]}
          />
        </InsightCard>
        <InsightCard title="Top Users By Failed Logins" fillHeight>
          <HorizontalBarPanel
            rows={TOP_USERS_ROWS}
            selectedLabel={userFilter}
            onBarClick={handleUserClick}
            filterAriaLabel={(label) => `Filter identity events by user ${label}`}
            xMax={250}
            xTicks={[0, 50, 100, 150, 200]}
          />
        </InsightCard>
      </div>

      <section className="mx-0 mb-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2)]">
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-6 pt-3 sm:pl-5">
          <h2 className="text-base-semibold text-text-primary">Identity & Access Events</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="shrink-0 text-base-small text-text-secondary">
              {filteredRows.length} of {TOTAL_IDENTITY_RESULTS} Results
              {eventClassFilter ? ` · ${eventClassFilter}` : ""}
              {severityFilter ? ` · ${severityFilter}` : ""}
              {userFilter ? ` · ${userFilter}` : ""}
              {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            </p>
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
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
                <Icon name="action-filter-list" size={12} aria-hidden />
                Clear all filters
              </Button>
            ) : null}
            <Button type="button" variant="secondary" className="ml-auto shrink-0 gap-1.5 px-3">
              <Icon name="action-file-download" size={18} aria-hidden />
              Export All
            </Button>
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
            <IdentityAccessTable rows={filteredRows} />
          </div>
        </div>
      </section>
    </div>
  );
}
