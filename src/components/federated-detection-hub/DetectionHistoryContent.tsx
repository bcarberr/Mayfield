import { useMemo, useState } from "react";
import { Icon, type SeverityShapeIconName } from "../../design-system";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { compareStrings, useColumnSort } from "../ui/useColumnSort";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { DonutChartPanel } from "../ui/DonutChartPanel";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { TruncatedText } from "../ui/TruncatedText";
import { useResizableColumns } from "../ui/useResizableColumns";
import { InsightCard } from "../summary-insights/datavisCard";
import { HorizontalBarPanel } from "../summary-insights/horizontalBarPanel";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function DatavisGridlineRule({ inset = true }: { inset?: boolean }) {
  return <div className={cx("h-px shrink-0 bg-datavis-gridlines", inset && "mx-[20px]")} aria-hidden />;
}

type DetectionSeverity = "Critical" | "High" | "Medium" | "Low";

type RunStatus = "Success" | "Error" | "Skipped (disabled)";

type RunHistoryFilter = "completed" | "errored" | "skipped";

const RUN_HISTORY_FILTER_LABELS: Record<RunHistoryFilter, string> = {
  completed: "Success",
  errored: "Error",
  skipped: "Skipped (disabled)",
};

type RunHistoryRow = {
  id: string;
  detectionName: string;
  severity: DetectionSeverity;
  runTime: string;
  status: RunStatus;
  findingsGenerated: number | null;
  duration: string | null;
  triggeredBy: string;
};

const SEV_COLORS: Record<DetectionSeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
};

const SEV_ICONS: Record<DetectionSeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
};

const DETECTION_SEVERITY_ORDER: Record<DetectionSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const RUNS_COMPLETED_COUNT = 412;
const RUNS_ERRORED_COUNT = 9;
const RUNS_SKIPPED_COUNT = 3;

const TOP_TRIGGERED_SEGMENTS = [
  { label: "Suspicious PowerShell Execution", color: "#b4549a", value: 861 },
  { label: "Privilege Escalation Attempts", color: "#817cf6", value: 319 },
  { label: "Credential Dumping Activity", color: "#5fd3f8", value: 209 },
] as const;

const TOP_TRIGGERED_TOTAL = 1389;

const SEVERITY_BREAKDOWN_ROWS = [
  { label: "Critical", value: 118, color: SEV_COLORS.Critical },
  { label: "High", value: 337, color: SEV_COLORS.High },
  { label: "Medium", value: 667, color: SEV_COLORS.Medium },
  { label: "Low", value: 267, color: SEV_COLORS.Low },
] as const;

const SEVERITY_BREAKDOWN_X_MAX = 700;
const SEVERITY_BREAKDOWN_X_TICKS = [0, 175, 350, 525, 700] as const;

const RUN_HISTORY_ROWS: RunHistoryRow[] = [
  {
    id: "run-1",
    detectionName: "Lateral Movement via SMB",
    severity: "Critical",
    runTime: "22 mins ago",
    status: "Error",
    findingsGenerated: null,
    duration: null,
    triggeredBy: "Schedule",
  },
  {
    id: "run-2",
    detectionName: "Suspicious PowerShell Execution",
    severity: "High",
    runTime: "58 mins ago",
    status: "Success",
    findingsGenerated: 861,
    duration: "3.2s",
    triggeredBy: "Schedule",
  },
  {
    id: "run-3",
    detectionName: "Credential Dumping Activity",
    severity: "High",
    runTime: "1 hour 15 mins ago",
    status: "Success",
    findingsGenerated: 209,
    duration: "2.8s",
    triggeredBy: "Schedule",
  },
  {
    id: "run-4",
    detectionName: "Unusual Outbound DNS Queries",
    severity: "High",
    runTime: "1 hour 15 mins ago",
    status: "Skipped (disabled)",
    findingsGenerated: null,
    duration: null,
    triggeredBy: "Schedule",
  },
  {
    id: "run-5",
    detectionName: "Privilege Escalation Attempts",
    severity: "Medium",
    runTime: "6 hours ago",
    status: "Success",
    findingsGenerated: 24,
    duration: "4.1s",
    triggeredBy: "Manual (j.alvarez)",
  },
  {
    id: "run-6",
    detectionName: "Lateral Movement via SMB",
    severity: "Critical",
    runTime: "7 hours ago",
    status: "Success",
    findingsGenerated: 319,
    duration: "3.5s",
    triggeredBy: "Schedule",
  },
  {
    id: "run-7",
    detectionName: "Credential Dumping Activity",
    severity: "Low",
    runTime: "8 hours ago",
    status: "Success",
    findingsGenerated: 11,
    duration: "2.1s",
    triggeredBy: "Schedule",
  },
  {
    id: "run-8",
    detectionName: "Unusual Outbound DNS Queries",
    severity: "Medium",
    runTime: "10 hours ago",
    status: "Success",
    findingsGenerated: 56,
    duration: "3.0s",
    triggeredBy: "Schedule",
  },
  {
    id: "run-9",
    detectionName: "Privilege Escalation Attempts",
    severity: "High",
    runTime: "18 hours ago",
    status: "Success",
    findingsGenerated: 33,
    duration: "2.9s",
    triggeredBy: "Schedule",
  },
  {
    id: "run-10",
    detectionName: "Ransomware Precursor File Activity",
    severity: "Critical",
    runTime: "20 hours ago",
    status: "Success",
    findingsGenerated: 42,
    duration: "3.8s",
    triggeredBy: "Schedule",
  },
  {
    id: "run-11",
    detectionName: "Impossible Travel Login",
    severity: "High",
    runTime: "1 day ago",
    status: "Error",
    findingsGenerated: null,
    duration: null,
    triggeredBy: "Schedule",
  },
  {
    id: "run-12",
    detectionName: "Cloud Storage Public Exposure",
    severity: "Medium",
    runTime: "1 day ago",
    status: "Success",
    findingsGenerated: null,
    duration: "1.9s",
    triggeredBy: "Schedule",
  },
  {
    id: "run-13",
    detectionName: "Kerberoasting Anomaly",
    severity: "High",
    runTime: "2 days ago",
    status: "Success",
    findingsGenerated: 72,
    duration: "3.1s",
    triggeredBy: "Manual (s.chen)",
  },
  {
    id: "run-14",
    detectionName: "Disabled AV Tampering",
    severity: "High",
    runTime: "2 days ago",
    status: "Success",
    findingsGenerated: 18,
    duration: "2.4s",
    triggeredBy: "Schedule",
  },
  {
    id: "run-15",
    detectionName: "Anomalous SaaS OAuth Grant",
    severity: "Low",
    runTime: "3 days ago",
    status: "Success",
    findingsGenerated: 9,
    duration: "2.0s",
    triggeredBy: "Schedule",
  },
  {
    id: "run-16",
    detectionName: "Suspicious PowerShell Execution",
    severity: "Medium",
    runTime: "3 days ago",
    status: "Success",
    findingsGenerated: 24,
    duration: "2.7s",
    triggeredBy: "Schedule",
  },
];

function runHistoryMatchesSearch(row: RunHistoryRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.detectionName,
    row.severity,
    row.runTime,
    row.status,
    row.findingsGenerated != null ? String(row.findingsGenerated) : "",
    row.duration ?? "",
    row.triggeredBy,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function RunHistoryCard({
  completedCount,
  erroredCount,
  skippedCount,
  selectedFilter,
  onFilterClick,
}: {
  completedCount: number;
  erroredCount: number;
  skippedCount: number;
  selectedFilter: RunHistoryFilter | null;
  onFilterClick: (filter: RunHistoryFilter) => void;
}) {
  const linkClass = (filter: RunHistoryFilter) =>
    cx(
      "text-left text-sm font-semibold transition-colors hover:text-interactive-active hover:underline",
      selectedFilter === filter ? "text-interactive-active underline" : "text-text-primary",
    );

  return (
    <InsightCard
      title="Run History (Last 24h)"
      compact
      stretch
      headerActions={
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-base-small text-text-tertiary">Last evaluated: 18h ago</span>
          <Button variant="ghost" className="shrink-0 p-1 text-text-tertiary hover:text-text-primary" aria-label="Chart options">
            <Icon name="navi-more-vert" />
          </Button>
        </div>
      }
    >
      <div className="flex h-full flex-col justify-start pt-1">
        <div className="grid grid-cols-[27px_minmax(0,1fr)] gap-x-3 gap-y-2">
          <Icon
            name="action-check"
            size={20}
            className="inline-flex h-5 w-[27px] shrink-0 self-start text-feedback-positive [&>svg]:!h-5 [&>svg]:!w-[27px]"
            aria-hidden
          />
          <button
            type="button"
            aria-pressed={selectedFilter === "completed"}
            className={cx(
              "col-start-2 text-left text-xl font-bold tracking-wide transition-colors hover:text-interactive-active",
              selectedFilter === "completed" ? "text-interactive-active underline" : "text-text-primary",
            )}
            onClick={() => onFilterClick("completed")}
          >
            {completedCount} Runs Completed
          </button>
          <ul className="col-start-2 space-y-1.5">
            <li className="flex items-baseline gap-3">
              <span className="flex w-8 shrink-0 items-center gap-1">
                <span className="text-xl font-bold tabular-nums text-text-primary">{erroredCount}</span>
                <Icon name="error-outline" size={16} className="shrink-0 text-feedback-negative" aria-hidden />
              </span>
              <button
                type="button"
                aria-pressed={selectedFilter === "errored"}
                className={linkClass("errored")}
                onClick={() => onFilterClick("errored")}
              >
                runs errored
              </button>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-8 shrink-0 text-xl font-bold tabular-nums text-text-primary">{skippedCount}</span>
              <button
                type="button"
                aria-pressed={selectedFilter === "skipped"}
                className={cx(
                  linkClass("skipped"),
                  selectedFilter !== "skipped" && "text-text-secondary hover:text-text-primary",
                )}
                onClick={() => onFilterClick("skipped")}
              >
                runs skipped (disabled)
              </button>
            </li>
          </ul>
        </div>
      </div>
    </InsightCard>
  );
}

function TopTriggeredDetectionsCard({
  selectedLabel,
  onSegmentClick,
}: {
  selectedLabel: string | null;
  onSegmentClick: (label: string) => void;
}) {
  return (
    <InsightCard title="Top Triggered Detections" compact stretch>
      <div className="flex h-full items-start pt-1">
        <DonutChartPanel
          segments={TOP_TRIGGERED_SEGMENTS}
          total={TOP_TRIGGERED_TOTAL}
          centerLabel="findings"
          selectedLabel={selectedLabel}
          onSegmentClick={onSegmentClick}
          ariaLabel="Top triggered detections"
          size="compact"
        />
      </div>
    </InsightCard>
  );
}

function SeverityBreakdownCard({
  selectedSeverity,
  onSeverityClick,
}: {
  selectedSeverity: DetectionSeverity | null;
  onSeverityClick: (severity: DetectionSeverity) => void;
}) {
  return (
    <InsightCard title="Severity ID" compact stretch>
      <HorizontalBarPanel
        rows={SEVERITY_BREAKDOWN_ROWS}
        selectedLabel={selectedSeverity}
        onBarClick={(label) => onSeverityClick(label as DetectionSeverity)}
        filterAriaLabel={(label) => `Filter run history by ${label} severity`}
        xMax={SEVERITY_BREAKDOWN_X_MAX}
        xTicks={SEVERITY_BREAKDOWN_X_TICKS}
        axisLabel="Findings"
        dense
        denseRowGap={16}
      />
    </InsightCard>
  );
}

function RunStatusCell({ status }: { status: RunStatus }) {
  if (status === "Error") {
    return <span className="text-sm font-semibold text-feedback-negative">Error</span>;
  }
  if (status === "Skipped (disabled)") {
    return <span className="text-sm text-text-secondary">Skipped (disabled)</span>;
  }
  return <span className="text-sm font-semibold text-feedback-positive">Success</span>;
}

function FindingsGeneratedCell({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-sm text-text-secondary">—</span>;
  }
  return <span className="text-sm font-semibold tabular-nums text-text-primary">{value}</span>;
}

type RunHistorySortColumn =
  | "detectionName"
  | "severity"
  | "runTime"
  | "status"
  | "findingsGenerated"
  | "duration"
  | "triggeredBy";

const RUN_HISTORY_COL_DEFAULTS: readonly number[] = [280, 115, 130, 130, 140, 90, 180];
const RUN_HISTORY_COL_MINS: readonly number[] = [160, 72, 100, 100, 100, 72, 120];

function RunHistoryTable({ rows }: { rows: RunHistoryRow[] }) {
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
    selectColWidth: RUN_HISTORY_COL_DEFAULTS[0]!,
    colDefaults: RUN_HISTORY_COL_DEFAULTS,
    colMins: RUN_HISTORY_COL_MINS,
    minTableWidth: 960,
  });

  const thClass =
    "relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary";
  const tdClass = "h-10 px-2 py-0 align-middle text-sm text-text-secondary";

  const sortComparators = useMemo(
    (): Record<RunHistorySortColumn, (a: RunHistoryRow, b: RunHistoryRow) => number> => ({
      detectionName: (a, b) => compareStrings(a.detectionName, b.detectionName),
      severity: (a, b) => DETECTION_SEVERITY_ORDER[a.severity] - DETECTION_SEVERITY_ORDER[b.severity],
      runTime: (a, b) => compareStrings(a.runTime, b.runTime),
      status: (a, b) => compareStrings(a.status, b.status),
      findingsGenerated: (a, b) => (a.findingsGenerated ?? -1) - (b.findingsGenerated ?? -1),
      duration: (a, b) => compareStrings(a.duration ?? "", b.duration ?? ""),
      triggeredBy: (a, b) => compareStrings(a.triggeredBy, b.triggeredBy),
    }),
    [],
  );
  const { sortedRows, getSortProps } = useColumnSort(sortComparators);
  const displayRows = sortedRows(rows);

  return (
    <div
      ref={containerRef}
      className={cx("min-h-0 min-w-0 flex-1 overflow-x-auto pb-3", isResizing && "select-none")}
    >
      <table
        className="table-fixed border-collapse text-left text-sm"
        style={{
          width: tableFillsContainer ? "100%" : baseTotal,
          minWidth: Math.max(minTableWidth, baseTotal),
        }}
      >
        <caption className="sr-only">Detection run history</caption>
        <colgroup>
          {displayWidths.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr className="h-10 border-b border-datavis-gridlines bg-surface-table-row-header">
            <th scope="col" style={colStyle(0)} className={thClass}>
              <ColumnHeaderMenu label="Detection" menuLabel="Detection column options" {...getSortProps("detectionName")} />
              {resizeHandle(0)}
            </th>
            <th scope="col" style={colStyle(1)} className={thClass}>
              <ColumnHeaderMenu label="Severity" menuLabel="Severity column options" {...getSortProps("severity")} />
              {resizeHandle(1)}
            </th>
            <th scope="col" style={colStyle(2)} className={thClass}>
              <ColumnHeaderMenu label="Run Time" menuLabel="Run Time column options" {...getSortProps("runTime")} />
              {resizeHandle(2)}
            </th>
            <th scope="col" style={colStyle(3)} className={thClass}>
              <ColumnHeaderMenu label="Status" menuLabel="Status column options" {...getSortProps("status")} />
              {resizeHandle(3)}
            </th>
            <th scope="col" style={colStyle(4)} className={thClass}>
              <ColumnHeaderMenu
                label="Findings Generated"
                menuLabel="Findings Generated column options"
                {...getSortProps("findingsGenerated")}
              />
              {resizeHandle(4)}
            </th>
            <th scope="col" style={colStyle(5)} className={thClass}>
              <ColumnHeaderMenu label="Duration" menuLabel="Duration column options" {...getSortProps("duration")} />
              {resizeHandle(5)}
            </th>
            <th scope="col" style={colStyle(6)} className={thClass}>
              <ColumnHeaderMenu
                label="Triggered By"
                menuLabel="Triggered By column options"
                {...getSortProps("triggeredBy")}
              />
              {resizeHandle(6)}
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.id} className="h-10 border-b border-datavis-gridlines hover:bg-overlay-subtle">
              <td style={colStyle(0)} className={cx(tdClass, "min-w-0")}>
                <TruncatedText className="w-full font-semibold text-interactive-active">{row.detectionName}</TruncatedText>
              </td>
              <td style={colStyle(1)} className={tdClass}>
                <span className="inline-flex items-center gap-2">
                  <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_COLORS[row.severity]} />
                  <span className="font-semibold text-text-primary">{row.severity}</span>
                </span>
              </td>
              <td style={colStyle(2)} className={tdClass}>
                {row.runTime}
              </td>
              <td style={colStyle(3)} className={tdClass}>
                <RunStatusCell status={row.status} />
              </td>
              <td style={colStyle(4)} className={tdClass}>
                <FindingsGeneratedCell value={row.findingsGenerated} />
              </td>
              <td style={colStyle(5)} className={tdClass}>
                {row.duration ?? "—"}
              </td>
              <td style={colStyle(6)} className={tdClass}>
                {row.triggeredBy}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetectionHistoryContent() {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>("filter");
  const [searchQuery, setSearchQuery] = useState("");
  const [runHistoryFilter, setRunHistoryFilter] = useState<RunHistoryFilter | null>(null);
  const [detectionNameFilter, setDetectionNameFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<DetectionSeverity | null>(null);

  const filteredRows = useMemo(
    () =>
      RUN_HISTORY_ROWS.filter((row) => {
        if (runHistoryFilter && row.status !== RUN_HISTORY_FILTER_LABELS[runHistoryFilter]) return false;
        if (detectionNameFilter && row.detectionName !== detectionNameFilter) return false;
        if (severityFilter && row.severity !== severityFilter) return false;
        if (!runHistoryMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [runHistoryFilter, detectionNameFilter, severityFilter, searchQuery],
  );

  const hasActiveFilters =
    runHistoryFilter != null ||
    detectionNameFilter != null ||
    severityFilter != null ||
    searchQuery.trim().length > 0;

  const handleRunHistoryFilterClick = (filter: RunHistoryFilter) => {
    setRunHistoryFilter((current) => (current === filter ? null : filter));
    setDetectionNameFilter(null);
    setSeverityFilter(null);
  };

  const handleDetectionClick = (label: string) => {
    setDetectionNameFilter((current) => (current === label ? null : label));
    setRunHistoryFilter(null);
    setSeverityFilter(null);
  };

  const handleSeverityClick = (severity: DetectionSeverity) => {
    setSeverityFilter((current) => (current === severity ? null : severity));
    setRunHistoryFilter(null);
    setDetectionNameFilter(null);
  };

  return (
    <>
      <div className="grid shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <RunHistoryCard
          completedCount={RUNS_COMPLETED_COUNT}
          erroredCount={RUNS_ERRORED_COUNT}
          skippedCount={RUNS_SKIPPED_COUNT}
          selectedFilter={runHistoryFilter}
          onFilterClick={handleRunHistoryFilterClick}
        />
        <TopTriggeredDetectionsCard selectedLabel={detectionNameFilter} onSegmentClick={handleDetectionClick} />
        <SeverityBreakdownCard selectedSeverity={severityFilter} onSeverityClick={handleSeverityClick} />
      </div>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-datavis-card">
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-[20px] pt-3 sm:pl-5">
          <h2 className="text-base-semibold text-text-primary">Detection Run History</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="shrink-0 text-base-small text-text-secondary">
              {filteredRows.length} of {RUN_HISTORY_ROWS.length} Results
              {runHistoryFilter ? ` · ${RUN_HISTORY_FILTER_LABELS[runHistoryFilter]}` : ""}
              {detectionNameFilter ? ` · ${detectionNameFilter}` : ""}
              {severityFilter ? ` · ${severityFilter}` : ""}
              {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            </p>
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="!bg-datavis-card-bg"
                aria-label="Search detection run history"
              />
            </div>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
                onClick={() => {
                  setRunHistoryFilter(null);
                  setDetectionNameFilter(null);
                  setSeverityFilter(null);
                  setSearchQuery("");
                }}
              >
                <Icon name="action-filter-list" size={12} aria-hidden />
                Clear all filters
              </Button>
            ) : null}
          </div>
        </div>
        <DatavisGridlineRule inset={false} />
        <div className="flex min-h-0 flex-1 overflow-auto bg-datavis-card-bg">
          <FilterColumnPanel
            active={tableTool}
            onFilterClick={() => setTableTool(tableTool === "filter" ? null : "filter")}
            onColumnsClick={() => setTableTool(tableTool === "columns" ? null : "columns")}
          />
          <RunHistoryTable rows={filteredRows} />
        </div>
      </section>
    </>
  );
}
