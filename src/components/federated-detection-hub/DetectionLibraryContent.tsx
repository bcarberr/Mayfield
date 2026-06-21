import { Fragment, useMemo, useState } from "react";
import {
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
import { Checkbox, Icon, Switch, type SeverityShapeIconName } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import {
  compareBooleans,
  compareFindings,
  compareNumbers,
  compareStrings,
  useColumnSort,
} from "../ui/useColumnSort";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { DataGridPagination } from "../ui/DataGridPagination";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { TruncatedText } from "../ui/TruncatedText";
import { useResizableColumns } from "../ui/useResizableColumns";
import { useDataGridPagination } from "../ui/useDataGridPagination";
import { DetectionExpandedDetails } from "./detectionRunConnectors";
import { FindingsSearchCell } from "./FindingsSearchCell";
import { getDetectionEnabled } from "./detectionEnabledState";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function DatavisGridlineRule({ inset = true }: { inset?: boolean }) {
  return <div className={cx("h-px shrink-0 bg-datavis-gridlines", inset && "mx-[20px]")} aria-hidden />;
}

type DetectionSeverity = "Critical" | "High" | "Medium" | "Low";

type LibraryCategory = "Network" | "Endpoint" | "Identity" | "Web" | "Cloud" | "Database" | "Email";

export type LibraryDetectionRow = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: LibraryCategory;
  severity: DetectionSeverity;
  lastRun: string;
  recurrence: string;
  findings: number | "error" | "none";
  connectorsActive: number;
  connectorsTotal: number;
};

const SEV_COLORS: Record<DetectionSeverity, string> = {
  Critical: "var(--color-feedback-negative)",
  High: "#f28830",
  Medium: "var(--color-feedback-caution)",
  Low: "var(--color-text-tertiary)",
};

const SEV_ICONS: Record<DetectionSeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
};

export const LIBRARY_DETECTION_ROWS: LibraryDetectionRow[] = [
  {
    id: "lib-1",
    name: "APT28 Operation Phantom Net Voxel",
    description:
      "Detects command-and-control beaconing and DNS tunneling patterns associated with APT28 infrastructure across perimeter and internal resolvers.",
    enabled: true,
    category: "Network",
    severity: "High",
    lastRun: "Oct 31, 2024 2:15 PM",
    recurrence: "Every 30 minutes",
    findings: 42,
    connectorsActive: 14,
    connectorsTotal: 36,
  },
  {
    id: "lib-2",
    name: "Suspicious Kerberos TGT Request",
    description:
      "Flags anomalous Kerberos ticket-granting ticket requests indicative of credential theft or golden ticket activity.",
    enabled: true,
    category: "Identity",
    severity: "Critical",
    lastRun: "Oct 31, 2024 1:45 PM",
    recurrence: "Every 30 minutes",
    findings: 18,
    connectorsActive: 12,
    connectorsTotal: 36,
  },
  {
    id: "lib-3",
    name: "Ransomware File Encryption Burst",
    description:
      "Correlates rapid file rename and encryption events on endpoints with known ransomware extensions and shadow copy deletion.",
    enabled: true,
    category: "Endpoint",
    severity: "High",
    lastRun: "Oct 31, 2024 12:30 PM",
    recurrence: "Every 15 minutes",
    findings: 7,
    connectorsActive: 16,
    connectorsTotal: 36,
  },
  {
    id: "lib-4",
    name: "Impossible Travel Sign-In",
    description:
      "Identifies authentications from geographically distant locations within an implausible time window for the same user principal.",
    enabled: true,
    category: "Identity",
    severity: "High",
    lastRun: "Oct 31, 2024 11:00 AM",
    recurrence: "Every hour",
    findings: 31,
    connectorsActive: 9,
    connectorsTotal: 36,
  },
  {
    id: "lib-5",
    name: "SQL Injection Attempt",
    description:
      "Surfaces web application requests containing SQL injection payloads against protected database-backed endpoints.",
    enabled: false,
    category: "Web",
    severity: "High",
    lastRun: "Oct 30, 2024 9:20 PM",
    recurrence: "Every 30 minutes",
    findings: 5,
    connectorsActive: 8,
    connectorsTotal: 36,
  },
  {
    id: "lib-6",
    name: "Abnormal S3 Bucket Policy Change",
    description:
      "Alerts when S3 bucket policies are modified to allow public read or cross-account access outside approved change windows.",
    enabled: true,
    category: "Cloud",
    severity: "Critical",
    lastRun: "Oct 30, 2024 6:10 PM",
    recurrence: "Every hour",
    findings: 12,
    connectorsActive: 11,
    connectorsTotal: 36,
  },
  {
    id: "lib-7",
    name: "Privileged Database Login After Hours",
    description:
      "Monitors privileged database authentications occurring outside business hours or from non-administrative jump hosts.",
    enabled: true,
    category: "Database",
    severity: "Critical",
    lastRun: "Oct 30, 2024 3:45 PM",
    recurrence: "Every 30 minutes",
    findings: 9,
    connectorsActive: 10,
    connectorsTotal: 36,
  },
  {
    id: "lib-8",
    name: "Phishing Link Clicked",
    description:
      "Correlates email security events with proxy and endpoint telemetry when users follow suspicious URLs from flagged messages.",
    enabled: true,
    category: "Email",
    severity: "High",
    lastRun: "Oct 30, 2024 1:15 PM",
    recurrence: "Every 30 minutes",
    findings: 24,
    connectorsActive: 13,
    connectorsTotal: 36,
  },
  {
    id: "lib-9",
    name: "Lateral Movement via SMB",
    description:
      "Detects unusual SMB session establishment patterns between workstations that do not typically communicate.",
    enabled: true,
    category: "Network",
    severity: "Critical",
    lastRun: "Oct 29, 2024 10:40 AM",
    recurrence: "Every 30 minutes",
    findings: 15,
    connectorsActive: 14,
    connectorsTotal: 36,
  },
  {
    id: "lib-10",
    name: "Unsigned PowerShell Execution",
    description:
      "Flags execution of unsigned or remotely sourced PowerShell scripts with encoded command arguments on managed endpoints.",
    enabled: false,
    category: "Endpoint",
    severity: "Medium",
    lastRun: "Oct 29, 2024 8:05 AM",
    recurrence: "Every hour",
    findings: 3,
    connectorsActive: 7,
    connectorsTotal: 36,
  },
  {
    id: "lib-11",
    name: "OAuth Consent Grant Abuse",
    description:
      "Monitors broad OAuth application consents granted to third-party apps with mail, files, or directory read scopes.",
    enabled: true,
    category: "Identity",
    severity: "High",
    lastRun: "Oct 28, 2024 4:50 PM",
    recurrence: "Every hour",
    findings: 6,
    connectorsActive: 9,
    connectorsTotal: 36,
  },
  {
    id: "lib-12",
    name: "Web Shell Upload",
    description:
      "Identifies HTTP POST requests uploading executable web content to internet-facing application directories.",
    enabled: true,
    category: "Web",
    severity: "Critical",
    lastRun: "Oct 28, 2024 2:30 PM",
    recurrence: "Every 30 minutes",
    findings: 2,
    connectorsActive: 8,
    connectorsTotal: 36,
  },
  {
    id: "lib-13",
    name: "GCP Service Account Key Created",
    description:
      "Alerts when new long-lived service account keys are created in GCP projects without an approved automation pipeline.",
    enabled: false,
    category: "Cloud",
    severity: "Medium",
    lastRun: "Oct 27, 2024 11:15 AM",
    recurrence: "Every 2 hours",
    findings: 1,
    connectorsActive: 6,
    connectorsTotal: 36,
  },
  {
    id: "lib-14",
    name: "Sensitive Table Bulk Export",
    description:
      "Detects large result-set exports from tables tagged as containing PII or payment card data.",
    enabled: true,
    category: "Database",
    severity: "Medium",
    lastRun: "Oct 27, 2024 9:00 AM",
    recurrence: "Every hour",
    findings: 4,
    connectorsActive: 10,
    connectorsTotal: 36,
  },
  {
    id: "lib-15",
    name: "Malware Attachment Delivered",
    description:
      "Correlates email gateway verdicts with endpoint prevention events when malware-laden attachments reach user inboxes.",
    enabled: false,
    category: "Email",
    severity: "Medium",
    lastRun: "Oct 26, 2024 5:25 PM",
    recurrence: "Every 30 minutes",
    findings: "none",
    connectorsActive: 12,
    connectorsTotal: 36,
  },
];

function libraryMatchesSearch(row: LibraryDetectionRow, query: string, enabled: boolean): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const findings =
    row.findings === "error" ? "error" : row.findings === "none" ? "none" : String(row.findings);

  const haystack = [
    row.name,
    row.description,
    row.category,
    row.severity,
    row.lastRun,
    row.recurrence,
    findings,
    `${row.connectorsActive} of ${row.connectorsTotal}`,
    enabled ? "enabled" : "disabled",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function LibraryStatCard({
  label,
  value,
  selected,
  onClick,
}: {
  label: string;
  value: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Filter by ${label}`}
      onClick={onClick}
      className={cx(
        "rounded-[4px] border bg-datavis-card-bg px-6 py-5 text-left shadow-datavis-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active",
        selected
          ? "border-interactive-active hover:bg-overlay-subtle"
          : "border-border-container hover:border-border-rule hover:bg-overlay-subtle",
      )}
    >
      <p
        className={cx(
          "text-xs font-bold uppercase tracking-wide",
          selected ? "text-interactive-active" : "text-text-tertiary",
        )}
      >
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">{value}</p>
    </button>
  );
}

type LibraryStatFilter = "enabled" | "critical" | "high";

const LIBRARY_STAT_FILTER_LABELS: Record<LibraryStatFilter, string> = {
  enabled: "Enabled",
  critical: "Critical Severity",
  high: "High Severity",
};


function ConnectorsCell({ active, total }: { active: number; total: number }) {
  return (
    <span className="text-sm tabular-nums text-text-secondary">
      {active} of {total}
    </span>
  );
}

function LibraryCopyAction({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-3 [&_svg]:!h-3 [&_svg]:!w-3"
      aria-label={`Copy ${name}`}
      onClick={onClick}
    >
      <Icon name="action-content-copy" size={12} />
    </Button>
  );
}

const LIBRARY_SEVERITY_ORDER: Record<DetectionSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

type LibrarySortColumn =
  | "name"
  | "state"
  | "category"
  | "severity"
  | "lastRun"
  | "recurrence"
  | "findings"
  | "connectors";

const LIBRARY_SELECT_COL_WIDTH = 40;
const LIBRARY_EXPAND_COL_WIDTH = 40;
const LIBRARY_COLUMN_COUNT = 11;
const LIBRARY_COL_DEFAULTS: readonly number[] = [
  LIBRARY_SELECT_COL_WIDTH,
  LIBRARY_EXPAND_COL_WIDTH,
  280,
  72,
  100,
  115,
  140,
  130,
  140,
  120,
  72,
];
const LIBRARY_COL_MINS: readonly number[] = [
  LIBRARY_SELECT_COL_WIDTH,
  LIBRARY_EXPAND_COL_WIDTH,
  160,
  56,
  72,
  72,
  100,
  80,
  100,
  96,
  56,
];

function LibraryDetectionsTable({
  rows,
  tableTool,
  onTableToolChange,
  expandedIds,
  onToggleExpand,
  onToggleExpandAll,
  onOpenDetection,
  onCopyDetection,
  enabledByName,
  onEnabledChange,
  searchQuery,
  onSearchQueryChange,
  totalCount,
  onClearFilters,
  statFilterLabel,
}: {
  rows: LibraryDetectionRow[];
  tableTool: FilterColumnPanelTool | null;
  onTableToolChange: (tool: FilterColumnPanelTool | null) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleExpandAll: () => void;
  onOpenDetection: (id: string) => void;
  onCopyDetection: (id: string) => void;
  enabledByName: Record<string, boolean>;
  onEnabledChange: (name: string, enabled: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  totalCount: number;
  onClearFilters: () => void;
  statFilterLabel: string | null;
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
    selectColWidth: LIBRARY_SELECT_COL_WIDTH,
    colDefaults: LIBRARY_COL_DEFAULTS,
    colMins: LIBRARY_COL_MINS,
    minTableWidth: 1100,
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

  const thClass =
    "relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary";
  const tdClass = cx(DATA_GRID_BODY_CELL_CLASS, "text-sm text-text-secondary");
  const hasActiveFilters = searchQuery.trim().length > 0 || statFilterLabel != null;
  const allExpanded = rows.length > 0 && rows.every((row) => expandedIds.has(row.id));
  const sortComparators = useMemo(
    (): Record<LibrarySortColumn, (a: LibraryDetectionRow, b: LibraryDetectionRow) => number> => ({
      name: (a, b) => compareStrings(a.name, b.name),
      state: (a, b) =>
        compareBooleans(
          getDetectionEnabled(a.name, a.enabled, enabledByName),
          getDetectionEnabled(b.name, b.enabled, enabledByName),
        ),
      category: (a, b) => compareStrings(a.category, b.category),
      severity: (a, b) => LIBRARY_SEVERITY_ORDER[a.severity] - LIBRARY_SEVERITY_ORDER[b.severity],
      lastRun: (a, b) => compareStrings(a.lastRun, b.lastRun),
      recurrence: (a, b) => compareStrings(a.recurrence, b.recurrence),
      findings: (a, b) => compareFindings(a.findings, b.findings),
      connectors: (a, b) => compareNumbers(a.connectorsActive, b.connectorsActive),
    }),
    [enabledByName],
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

  const { toolbarRef, sectionStyle } = useDataGridStickyToolbar();

  return (
    <section
      className={DATA_GRID_SECTION_CLASS}
      style={sectionStyle}
    >
      <div ref={toolbarRef} className={DATA_GRID_TOOLBAR_STICKY_CLASS}>
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-[20px] pt-3 sm:pl-5">
        <h2 className="text-base-semibold text-text-primary">Detection Library</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="shrink-0 text-base-small text-text-secondary">
            {rows.length} of {totalCount} Results
            {statFilterLabel ? ` · ${statFilterLabel}` : ""}
            {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search detections"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                onClear={() => onSearchQueryChange("")}
                className="!bg-datavis-card-bg"
                aria-label="Search detection library"
              />
            </div>
          </div>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
              onClick={onClearFilters}
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
            <caption className="sr-only">Detection library</caption>
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
                      aria-label={
                        allExpanded ? "Collapse all detection descriptions" : "Expand all detection descriptions"
                      }
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
                  <ColumnHeaderMenu
                    label="Detections"
                    leadingIcon="nav-detections"
                    menuLabel="Detections column options"
                    {...getSortProps("name")}
                  />
                  {resizeHandle(2)}
                </th>
                <th scope="col" style={colStyle(3)} className={thClass}>
                  <ColumnHeaderMenu label="State" menuLabel="State column options" {...getSortProps("state")} />
                  {resizeHandle(3)}
                </th>
                <th scope="col" style={colStyle(4)} className={thClass}>
                  <ColumnHeaderMenu label="Category" menuLabel="Category column options" {...getSortProps("category")} />
                  {resizeHandle(4)}
                </th>
                <th scope="col" style={colStyle(5)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Severity"
                    menuLabel="Severity column options"
                    {...getSortProps("severity")}
                  />
                  {resizeHandle(5)}
                </th>
                <th scope="col" style={colStyle(6)} className={thClass}>
                  <ColumnHeaderMenu label="Last Run" menuLabel="Last Run column options" {...getSortProps("lastRun")} />
                  {resizeHandle(6)}
                </th>
                <th scope="col" style={colStyle(7)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Recurrence"
                    menuLabel="Recurrence column options"
                    {...getSortProps("recurrence")}
                  />
                  {resizeHandle(7)}
                </th>
                <th scope="col" style={colStyle(8)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Detection Findings"
                    menuLabel="Detection Findings column options"
                    {...getSortProps("findings")}
                  />
                  {resizeHandle(8)}
                </th>
                <th scope="col" style={colStyle(9)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Connectors"
                    menuLabel="Connectors column options"
                    {...getSortProps("connectors")}
                  />
                  {resizeHandle(9)}
                </th>
                <th scope="col" style={colStyle(10)} className="relative px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary">
                  <span className="block translate-y-px truncate">Actions</span>
                  {resizeHandle(10)}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => {
                const expanded = expandedIds.has(row.id);
                const enabled = getDetectionEnabled(row.name, row.enabled, enabledByName);
                const inactiveCellClass = !enabled ? "opacity-70" : "";
                return (
                  <Fragment key={row.id}>
                    <tr className={DATA_GRID_BODY_ROW_CLASS}>
                      <td style={colStyle(0)} className={cx("px-0 py-0 align-middle", inactiveCellClass)}>
                        <div className={DATA_GRID_BODY_CELL_CENTER_CLASS}>
                          <Checkbox
                            checked={selected.has(row.id)}
                            onCheckedChange={(checked) => toggleRow(row.id, checked)}
                            aria-label={`Select ${row.name}`}
                          />
                        </div>
                      </td>
                      <td style={colStyle(1)} className={cx("px-0 py-0 align-middle", inactiveCellClass)}>
                        <div className={DATA_GRID_BODY_CELL_CENTER_CLASS}>
                          <button
                            type="button"
                            className={DATA_GRID_ROW_EXPAND_BTN_CLASS}
                            aria-expanded={expanded}
                            aria-label={
                              expanded ? `Collapse description for ${row.name}` : `Expand description for ${row.name}`
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
                      <td style={colStyle(2)} className={cx(tdClass, "min-w-0", inactiveCellClass)}>
                        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                          <Icon
                            name="nav-detections"
                            size={16}
                            className="shrink-0 text-text-tertiary"
                            aria-hidden
                          />
                          <TruncatedText
                            as="button"
                            className="text-left font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                            wrapperClassName="min-w-0 flex-1"
                            onClick={() => onOpenDetection(row.id)}
                          >
                            {row.name}
                          </TruncatedText>
                        </div>
                      </td>
                      <td style={colStyle(3)} className={cx(tdClass, inactiveCellClass)}>
                        <Switch
                          checked={getDetectionEnabled(row.name, row.enabled, enabledByName)}
                          onCheckedChange={(checked) => onEnabledChange(row.name, checked)}
                          aria-label={`Toggle ${row.name}`}
                        />
                      </td>
                      <td style={colStyle(4)} className={cx(tdClass, inactiveCellClass)}>
                        {row.category}
                      </td>
                      <td style={colStyle(5)} className={cx(tdClass, inactiveCellClass)}>
                        <span className="inline-flex items-center gap-2">
                          <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_COLORS[row.severity]} />
                          <span>{row.severity}</span>
                        </span>
                      </td>
                      <td style={colStyle(6)} className={cx(tdClass, "tabular-nums", inactiveCellClass)}>
                        {row.lastRun}
                      </td>
                      <td style={colStyle(7)} className={cx(tdClass, inactiveCellClass)}>
                        {row.recurrence}
                      </td>
                      <td style={colStyle(8)} className={cx(tdClass, inactiveCellClass)}>
                        <FindingsSearchCell
                          findings={row.findings}
                          detectionId={row.id}
                          detectionName={row.name}
                        />
                      </td>
                      <td style={colStyle(9)} className={cx(tdClass, inactiveCellClass)}>
                        <ConnectorsCell active={row.connectorsActive} total={row.connectorsTotal} />
                      </td>
                      <td style={colStyle(10)} className={tdClass}>
                        <LibraryCopyAction name={row.name} onClick={() => onCopyDetection(row.id)} />
                      </td>
                    </tr>
                    {expanded ? (
                      <tr
                        className={cx(DATA_GRID_EXPANDED_ROW_CLASS, !enabled && "opacity-70")}
                      >
                        <td colSpan={LIBRARY_COLUMN_COUNT} className={DATA_GRID_EXPANDED_CELL_CLASS}>
                          <DetectionExpandedDetails
                            description={row.description}
                            detectionId={row.id}
                            lastRun={row.lastRun}
                            connectorsActive={row.connectorsActive}
                            connectorsTotal={row.connectorsTotal}
                          />
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
    </section>
  );
}

export function DetectionLibraryContent({
  onCopyDetection,
  onViewDetection,
  enabledByName,
  onEnabledChange,
}: {
  onCopyDetection: (row: LibraryDetectionRow) => void;
  onViewDetection: (row: LibraryDetectionRow) => void;
  enabledByName: Record<string, boolean>;
  onEnabledChange: (name: string, enabled: boolean) => void;
}) {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [statFilter, setStatFilter] = useState<LibraryStatFilter | null>(null);

  const handleStatFilterClick = (filter: LibraryStatFilter) => {
    setStatFilter((current) => (current === filter ? null : filter));
  };

  const filteredRows = useMemo(() => {
    return LIBRARY_DETECTION_ROWS.filter((row) => {
      const enabled = getDetectionEnabled(row.name, row.enabled, enabledByName);
      if (statFilter === "enabled" && !enabled) return false;
      if (statFilter === "critical" && row.severity !== "Critical") return false;
      if (statFilter === "high" && row.severity !== "High") return false;
      return libraryMatchesSearch(row, searchQuery, enabled);
    });
  }, [searchQuery, enabledByName, statFilter]);

  const summaryStats = useMemo(() => {
    const total = LIBRARY_DETECTION_ROWS.length;
    const enabled = LIBRARY_DETECTION_ROWS.filter(
      (row) => getDetectionEnabled(row.name, row.enabled, enabledByName),
    ).length;
    const critical = LIBRARY_DETECTION_ROWS.filter((row) => row.severity === "Critical").length;
    const high = LIBRARY_DETECTION_ROWS.filter((row) => row.severity === "High").length;
    return { total, enabled, critical, high };
  }, [enabledByName]);

  const handleCopyDetection = (id: string) => {
    const row = LIBRARY_DETECTION_ROWS.find((entry) => entry.id === id);
    if (!row) return;
    onCopyDetection(row);
  };

  const handleOpenDetection = (id: string) => {
    const row = LIBRARY_DETECTION_ROWS.find((entry) => entry.id === id);
    if (row) onViewDetection(row);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandAll = () => {
    setExpandedIds((prev) => {
      const allExpanded = filteredRows.length > 0 && filteredRows.every((row) => prev.has(row.id));
      if (allExpanded) return new Set();
      return new Set(filteredRows.map((row) => row.id));
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LibraryStatCard
          label="Total Detections"
          value={summaryStats.total}
          selected={false}
          onClick={() => setStatFilter(null)}
        />
        <LibraryStatCard
          label="Enabled"
          value={summaryStats.enabled}
          selected={statFilter === "enabled"}
          onClick={() => handleStatFilterClick("enabled")}
        />
        <LibraryStatCard
          label="Critical Severity"
          value={summaryStats.critical}
          selected={statFilter === "critical"}
          onClick={() => handleStatFilterClick("critical")}
        />
        <LibraryStatCard
          label="High Severity"
          value={summaryStats.high}
          selected={statFilter === "high"}
          onClick={() => handleStatFilterClick("high")}
        />
      </div>

      <LibraryDetectionsTable
        rows={filteredRows}
        tableTool={tableTool}
        onTableToolChange={setTableTool}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onToggleExpandAll={toggleExpandAll}
        onOpenDetection={handleOpenDetection}
        onCopyDetection={handleCopyDetection}
        enabledByName={enabledByName}
        onEnabledChange={onEnabledChange}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        totalCount={LIBRARY_DETECTION_ROWS.length}
        statFilterLabel={statFilter ? LIBRARY_STAT_FILTER_LABELS[statFilter] : null}
        onClearFilters={() => {
          setSearchQuery("");
          setStatFilter(null);
        }}
      />
    </div>
  );
}
