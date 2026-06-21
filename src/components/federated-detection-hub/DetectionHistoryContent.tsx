import { Fragment, useMemo, useState } from "react";
import {
  DATA_GRID_ABOVE_SECTION_CLASS,
  DATA_GRID_BODY_CELL_CENTER_CLASS,
  DATA_GRID_BODY_CELL_CLASS,
  DATA_GRID_BODY_ROW_CLASS,
  DATA_GRID_EXPANDED_CELL_CLASS,
  DATA_GRID_EXPANDED_ROW_CLASS,
  DATA_GRID_FILTER_ROW_CLASS,
  DATA_GRID_HEADER_ROW_CLASS,
  DATA_GRID_ROW_EXPAND_BTN_CLASS,
  DATA_GRID_ROW_EXPAND_ICON_SIZE,
  DATA_GRID_SECTION_CLASS,
  DATA_GRID_TABLE_CLASS,
  DATA_GRID_TABLE_SCROLL_CLASS,
  DATA_GRID_THEAD_CLASS,
  DATA_GRID_TOOLBAR_STICKY_CLASS,
} from "../ui/dataGridTableStyles";
import { useDataGridStickyToolbar } from "../ui/useDataGridStickyToolbar";
import { Checkbox, Icon, type SeverityShapeIconName } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { compareStrings, useColumnSort } from "../ui/useColumnSort";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { DataGridPagination } from "../ui/DataGridPagination";
import { DonutChartPanel } from "../ui/DonutChartPanel";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { TruncatedText } from "../ui/TruncatedText";
import { useResizableColumns } from "../ui/useResizableColumns";
import { useDataGridPagination } from "../ui/useDataGridPagination";
import { InsightCard } from "../summary-insights/datavisCard";
import { HorizontalBarPanel } from "../summary-insights/horizontalBarPanel";
import { FindingsSearchCell, type DetectionFindings } from "./FindingsSearchCell";

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
  details: string;
};

const RUN_HISTORY_SELECT_COL_WIDTH = 40;
const RUN_HISTORY_EXPAND_COL_WIDTH = 40;
const RUN_HISTORY_COLUMN_COUNT = 9;

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
    details:
      "Run failed during connector query execution. SMB lateral movement correlation did not complete; verify Athena table permissions.",
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
    details:
      "Scheduled run completed successfully. Encoded PowerShell activity was evaluated across connected endpoints and 861 findings were generated.",
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
    details:
      "Scheduled run completed successfully. LSASS and credential store access patterns were correlated against baseline activity.",
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
    details: "Detection is disabled. The scheduled run was skipped and no findings were generated.",
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
    details:
      "Manual run triggered by j.alvarez completed successfully. Token manipulation and sudo misuse events were evaluated.",
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
    details:
      "Scheduled run completed successfully. Unusual SMB session setup patterns were correlated across endpoint telemetry sources.",
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
    details:
      "Scheduled run completed successfully. Low-volume credential access anomalies were indexed for analyst review.",
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
    details:
      "Scheduled run completed successfully. High-entropy DNS lookups were matched against resolver and endpoint logs.",
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
    details:
      "Scheduled run completed successfully. Local admin group changes outside approved change windows were flagged.",
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
    details:
      "Scheduled run completed successfully. Mass file rename and encryption extension patterns were evaluated across file activity logs.",
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
    details:
      "Run failed while joining identity geolocation data. Authentication source tables returned incomplete location metadata.",
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
    details:
      "Scheduled run completed with no new findings. Bucket ACL changes were evaluated and no public exposure was detected in this interval.",
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
    details:
      "Manual run triggered by s.chen completed successfully. Service ticket requests targeting weak SPN configurations were indexed.",
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
    details:
      "Scheduled run completed successfully. Endpoint protection stop and exclusion path events were correlated with change tickets.",
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
    details:
      "Scheduled run completed successfully. Third-party OAuth grants with broad mail scopes were evaluated for privileged accounts.",
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
    details:
      "Scheduled run completed successfully. Obfuscated PowerShell commands outside approved automation accounts were flagged.",
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

function runHistoryFindings(findingsGenerated: number | null, status: RunStatus): DetectionFindings {
  if (status === "Error") return "error";
  if (findingsGenerated == null) return "none";
  return findingsGenerated;
}

type RunHistorySortColumn =
  | "detectionName"
  | "severity"
  | "runTime"
  | "status"
  | "findingsGenerated"
  | "duration"
  | "triggeredBy";

const RUN_HISTORY_COL_DEFAULTS: readonly number[] = [
  RUN_HISTORY_SELECT_COL_WIDTH,
  RUN_HISTORY_EXPAND_COL_WIDTH,
  280,
  115,
  130,
  130,
  140,
  90,
  180,
];
const RUN_HISTORY_COL_MINS: readonly number[] = [
  RUN_HISTORY_SELECT_COL_WIDTH,
  RUN_HISTORY_EXPAND_COL_WIDTH,
  160,
  72,
  100,
  100,
  100,
  72,
  120,
];

function RunHistoryTable({
  rows,
  expandedIds,
  onToggleExpand,
  onToggleExpandAll,
  tableTool,
  onTableToolChange,
}: {
  rows: RunHistoryRow[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleExpandAll: () => void;
  tableTool: FilterColumnPanelTool | null;
  onTableToolChange: (tool: FilterColumnPanelTool | null) => void;
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
    selectColWidth: RUN_HISTORY_SELECT_COL_WIDTH,
    colDefaults: RUN_HISTORY_COL_DEFAULTS,
    colMins: RUN_HISTORY_COL_MINS,
    minTableWidth: 960,
  });

  const allIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const total = allIds.length;
  const selectedOnPage = useMemo(() => allIds.filter((id) => selected.has(id)).length, [allIds, selected]);
  const allSelected = total > 0 && selectedOnPage === total;
  const someSelected = selectedOnPage > 0 && !allSelected;
  const allExpanded = rows.length > 0 && rows.every((row) => expandedIds.has(row.id));

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

  const thClass =
    "relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary";
  const tdClass = cx(DATA_GRID_BODY_CELL_CLASS, "text-sm text-text-secondary");

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
  const sorted = sortedRows(rows);
  const {
    page,
    setPage,
    pageCount,
    pagedItems: displayRows,
    pageSize,
    setPageSize,
    pageSizeOptions,
    showPagination,
    showPageControls,
    itemCount,
  } = useDataGridPagination(sorted);

  return (
    <div className="flex min-w-0 flex-col bg-datavis-card-bg">
      <div className={DATA_GRID_FILTER_ROW_CLASS}>
        <FilterColumnPanel
          active={tableTool}
          onFilterClick={() => onTableToolChange(tableTool === "filter" ? null : "filter")}
          onColumnsClick={() => onTableToolChange(tableTool === "columns" ? null : "columns")}
        />
        <div
          ref={containerRef}
          className={cx(DATA_GRID_TABLE_SCROLL_CLASS, isResizing && "select-none")}
        >
      <table
        className={DATA_GRID_TABLE_CLASS}
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
            <th scope="col" style={colStyle(1)} className={cx(thClass, "px-0")}>
              <div className="flex justify-center">
                <button
                  type="button"
                  className="inline-flex items-center p-0 text-text-tertiary hover:text-text-primary"
                  aria-expanded={allExpanded}
                  aria-label={allExpanded ? "Collapse all run details" : "Expand all run details"}
                  onClick={onToggleExpandAll}
                >
                  <Icon
                    name="navi-arrow-drop-down"
                    size={32}
                    className={cx("block shrink-0 transition-transform", allExpanded ? "rotate-0" : "-rotate-90")}
                    aria-hidden
                  />
                  <Icon name="navi-chevron-right" size={20} className="-ml-4 block shrink-0" aria-hidden />
                </button>
              </div>
              {resizeHandle(1)}
            </th>
            <th scope="col" style={colStyle(2)} className={thClass}>
              <ColumnHeaderMenu label="Detection" menuLabel="Detection column options" {...getSortProps("detectionName")} />
              {resizeHandle(2)}
            </th>
            <th scope="col" style={colStyle(3)} className={thClass}>
              <ColumnHeaderMenu label="Severity" menuLabel="Severity column options" {...getSortProps("severity")} />
              {resizeHandle(3)}
            </th>
            <th scope="col" style={colStyle(4)} className={thClass}>
              <ColumnHeaderMenu label="Run Time" menuLabel="Run Time column options" {...getSortProps("runTime")} />
              {resizeHandle(4)}
            </th>
            <th scope="col" style={colStyle(5)} className={thClass}>
              <ColumnHeaderMenu label="Status" menuLabel="Status column options" {...getSortProps("status")} />
              {resizeHandle(5)}
            </th>
            <th scope="col" style={colStyle(6)} className={thClass}>
              <ColumnHeaderMenu
                label="Findings Generated"
                menuLabel="Findings Generated column options"
                {...getSortProps("findingsGenerated")}
              />
              {resizeHandle(6)}
            </th>
            <th scope="col" style={colStyle(7)} className={thClass}>
              <ColumnHeaderMenu label="Duration" menuLabel="Duration column options" {...getSortProps("duration")} />
              {resizeHandle(7)}
            </th>
            <th scope="col" style={colStyle(8)} className={thClass}>
              <ColumnHeaderMenu
                label="Triggered By"
                menuLabel="Triggered By column options"
                {...getSortProps("triggeredBy")}
              />
              {resizeHandle(8)}
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => {
            const expanded = expandedIds.has(row.id);
            return (
              <Fragment key={row.id}>
                <tr className={DATA_GRID_BODY_ROW_CLASS}>
                  <td style={colStyle(0)} className="px-0 py-0 align-middle">
                    <div className={DATA_GRID_BODY_CELL_CENTER_CLASS}>
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(checked) => toggleRow(row.id, checked)}
                        aria-label={`Select ${row.detectionName}`}
                      />
                    </div>
                  </td>
                  <td style={colStyle(1)} className="px-0 py-0 align-middle">
                    <div className={DATA_GRID_BODY_CELL_CENTER_CLASS}>
                      <button
                        type="button"
                        className={DATA_GRID_ROW_EXPAND_BTN_CLASS}
                        aria-expanded={expanded}
                        aria-label={
                          expanded ? `Collapse run details for ${row.detectionName}` : `Expand run details for ${row.detectionName}`
                        }
                        onClick={() => onToggleExpand(row.id)}
                      >
                        <Icon
                          name="navi-arrow-drop-down"
                          size={DATA_GRID_ROW_EXPAND_ICON_SIZE}
                          className={cx("block transition-transform", expanded ? "rotate-0" : "-rotate-90")}
                          aria-hidden
                        />
                      </button>
                    </div>
                  </td>
                  <td style={colStyle(2)} className={cx(tdClass, "min-w-0")}>
                    <TruncatedText className="w-full font-semibold text-interactive-active">{row.detectionName}</TruncatedText>
                  </td>
                  <td style={colStyle(3)} className={tdClass}>
                    <span className="inline-flex items-center gap-2">
                      <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_COLORS[row.severity]} />
                      <span className="font-semibold text-text-primary">{row.severity}</span>
                    </span>
                  </td>
                  <td style={colStyle(4)} className={tdClass}>
                    {row.runTime}
                  </td>
                  <td style={colStyle(5)} className={tdClass}>
                    <RunStatusCell status={row.status} />
                  </td>
                  <td style={colStyle(6)} className={tdClass}>
                    <FindingsSearchCell
                      findings={runHistoryFindings(row.findingsGenerated, row.status)}
                      detectionId={row.id}
                      detectionName={row.detectionName}
                    />
                  </td>
                  <td style={colStyle(7)} className={tdClass}>
                    {row.duration ?? "—"}
                  </td>
                  <td style={colStyle(8)} className={tdClass}>
                    {row.triggeredBy}
                  </td>
                </tr>
                {expanded ? (
                  <tr className={DATA_GRID_EXPANDED_ROW_CLASS}>
                    <td colSpan={RUN_HISTORY_COLUMN_COUNT} className={cx(DATA_GRID_EXPANDED_CELL_CLASS, "!pb-4")}>
                      <p className="text-sm leading-relaxed text-text-secondary">{row.details}</p>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
        </div>
      </div>
      {showPagination ? (
        <DataGridPagination
          page={page}
          pageCount={pageCount}
          itemCount={itemCount}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          showPageControls={showPageControls}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </div>
  );
}

export function DetectionHistoryContent() {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>("filter");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
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

  const toggleExpand = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandAll = () => {
    setExpandedIds((current) => {
      const visibleIds = filteredRows.map((row) => row.id);
      const everyVisibleExpanded =
        visibleIds.length > 0 && visibleIds.every((id) => current.has(id));

      if (everyVisibleExpanded) {
        const next = new Set(current);
        for (const id of visibleIds) next.delete(id);
        return next;
      }

      return new Set([...current, ...visibleIds]);
    });
  };

  const { toolbarRef, sectionStyle } = useDataGridStickyToolbar();

  return (
    <div className="flex flex-col gap-4">
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
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
      </div>

      <section
        className={DATA_GRID_SECTION_CLASS}
        style={sectionStyle}
      >
        <div ref={toolbarRef} className={DATA_GRID_TOOLBAR_STICKY_CLASS}>
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
                placeholder="Search detections"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onClear={() => setSearchQuery("")}
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
                <Icon name="action-filter-list" size={14} aria-hidden />
                Clear all filters
              </Button>
            ) : null}
            <DataGridExportButton />
          </div>
        </div>
          <DatavisGridlineRule inset={false} />
        </div>
        <RunHistoryTable
          rows={filteredRows}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
          onToggleExpandAll={toggleExpandAll}
          tableTool={tableTool}
          onTableToolChange={setTableTool}
        />
      </section>
    </div>
  );
}
