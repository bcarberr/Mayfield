import { Fragment, useMemo, useState } from "react";
import { Checkbox, Icon, Switch, type SeverityShapeIconName } from "../../design-system";
import { Button } from "../ui/Button";
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
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { SlideOver } from "../ui/SlideOver";
import { TruncatedText } from "../ui/TruncatedText";
import { useResizableColumns } from "../ui/useResizableColumns";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function DatavisGridlineRule({ inset = true }: { inset?: boolean }) {
  return <div className={cx("h-px shrink-0 bg-datavis-gridlines", inset && "mx-[20px]")} aria-hidden />;
}

type DetectionSeverity = "Critical" | "High" | "Medium" | "Low";

type LibraryCategory = "Network" | "Endpoint" | "Identity" | "Web" | "Cloud" | "Database" | "Email";

type LibraryDetectionRow = {
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

const LIBRARY_DETECTION_ROWS: LibraryDetectionRow[] = [
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

function LibraryStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[4px] border border-border-container bg-datavis-card-bg px-6 py-5 shadow-datavis-card">
      <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">{value}</p>
    </div>
  );
}

function LibraryFindingsCell({ findings }: { findings: LibraryDetectionRow["findings"] }) {
  if (findings === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-feedback-negative">
        <Icon name="error-outline" size={16} aria-hidden />
        Error
      </span>
    );
  }
  if (findings === "none") {
    return <span className="text-sm text-text-secondary">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-interactive-active">
      <Icon name="search" size={14} aria-hidden />
      <span className="tabular-nums">{findings}</span>
    </span>
  );
}

function ConnectorsCell({ active, total }: { active: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
      <Icon name="nav-federated-joins" size={14} className="text-text-tertiary" aria-hidden />
      <span className="tabular-nums">
        {active} of {total}
      </span>
    </span>
  );
}

function LibraryCopyAction({ name }: { name: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-3 [&_svg]:!h-3 [&_svg]:!w-3"
      aria-label={`Copy ${name}`}
    >
      <Icon name="action-content-copy" size={12} />
    </Button>
  );
}

function LibraryDetectionDetailPanel({
  row,
  enabled,
  onClose,
}: {
  row: LibraryDetectionRow;
  enabled: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col text-text-primary">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-rule px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">Detection Library</p>
          <h2 className="mt-1 text-page-title text-text-primary">{row.name}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="shrink-0 p-1 text-text-tertiary hover:text-text-primary"
          aria-label="Close detection details"
          onClick={onClose}
        >
          <Icon name="close" size={20} />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_COLORS[row.severity]} />
          <span className="text-sm font-semibold text-text-primary">{row.severity}</span>
          <span className="text-sm text-text-tertiary">·</span>
          <span className="text-sm text-text-secondary">{row.category}</span>
          <span className="text-sm text-text-tertiary">·</span>
          <span className="text-sm text-text-secondary">{enabled ? "Enabled" : "Disabled"}</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">{row.description}</p>
        <dl className="mt-6 space-y-3 border-t border-border-rule pt-4 text-sm">
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-text-tertiary">Last run</dt>
            <dd className="text-text-secondary">{row.lastRun}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-text-tertiary">Recurrence</dt>
            <dd className="text-text-secondary">{row.recurrence}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-text-tertiary">Findings</dt>
            <dd>
              <LibraryFindingsCell findings={row.findings} />
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-text-tertiary">Connectors</dt>
            <dd className="text-text-secondary">
              {row.connectorsActive} of {row.connectorsTotal}
            </dd>
          </div>
        </dl>
      </div>
      <footer className="flex shrink-0 justify-end gap-2 border-t border-border-rule px-5 py-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button type="button" variant="primary">
          Add to workspace
        </Button>
      </footer>
    </div>
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

const LIBRARY_EXPAND_COL_WIDTH = 40;
const LIBRARY_COLUMN_COUNT = 10;
const LIBRARY_COL_DEFAULTS: readonly number[] = [
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
  enabledById,
  onEnabledChange,
  searchQuery,
  onSearchQueryChange,
  showOnlyActive,
  onShowOnlyActiveChange,
  totalCount,
  onClearFilters,
}: {
  rows: LibraryDetectionRow[];
  tableTool: FilterColumnPanelTool | null;
  onTableToolChange: (tool: FilterColumnPanelTool | null) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleExpandAll: () => void;
  onOpenDetection: (id: string) => void;
  enabledById: Record<string, boolean>;
  onEnabledChange: (id: string, enabled: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  showOnlyActive: boolean;
  onShowOnlyActiveChange: (checked: boolean) => void;
  totalCount: number;
  onClearFilters: () => void;
}) {
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
    selectColWidth: LIBRARY_EXPAND_COL_WIDTH,
    colDefaults: LIBRARY_COL_DEFAULTS,
    colMins: LIBRARY_COL_MINS,
    minTableWidth: 1100,
  });

  const thClass =
    "relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary";
  const tdClass = "h-10 px-2 py-0 align-middle text-sm text-text-secondary";
  const hasActiveFilters = searchQuery.trim().length > 0;
  const allExpanded = rows.length > 0 && rows.every((row) => expandedIds.has(row.id));
  const sortComparators = useMemo(
    (): Record<LibrarySortColumn, (a: LibraryDetectionRow, b: LibraryDetectionRow) => number> => ({
      name: (a, b) => compareStrings(a.name, b.name),
      state: (a, b) =>
        compareBooleans(enabledById[a.id] ?? a.enabled, enabledById[b.id] ?? b.enabled),
      category: (a, b) => compareStrings(a.category, b.category),
      severity: (a, b) => LIBRARY_SEVERITY_ORDER[a.severity] - LIBRARY_SEVERITY_ORDER[b.severity],
      lastRun: (a, b) => compareStrings(a.lastRun, b.lastRun),
      recurrence: (a, b) => compareStrings(a.recurrence, b.recurrence),
      findings: (a, b) => compareFindings(a.findings, b.findings),
      connectors: (a, b) => compareNumbers(a.connectorsActive, b.connectorsActive),
    }),
    [enabledById],
  );
  const { sortedRows, getSortProps } = useColumnSort(sortComparators);
  const displayRows = sortedRows(rows);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-datavis-card">
      <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-[20px] pt-3 sm:pl-5">
        <h2 className="text-base-semibold text-text-primary">Detection Library</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="shrink-0 text-base-small text-text-secondary">
            {rows.length} of {totalCount} Results
            {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                className="!bg-datavis-card-bg"
                aria-label="Search detection library"
              />
            </div>
            <Checkbox
              checked={showOnlyActive}
              onCheckedChange={onShowOnlyActiveChange}
              label="Show only Active Detections"
              className="shrink-0"
            />
          </div>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
              onClick={onClearFilters}
            >
              <Icon name="action-filter-list" size={12} aria-hidden />
              Clear All Filters
            </Button>
          ) : null}
        </div>
      </div>
      <DatavisGridlineRule inset={false} />
      <div className="flex min-h-0 flex-1 overflow-auto bg-datavis-card-bg">
        <FilterColumnPanel
          active={tableTool}
          onFilterClick={() => onTableToolChange(tableTool === "filter" ? null : "filter")}
          onColumnsClick={() => onTableToolChange(tableTool === "columns" ? null : "columns")}
        />
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
            <caption className="sr-only">Detection library</caption>
            <colgroup>
              {displayWidths.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <thead>
              <tr className="h-10 border-b border-datavis-gridlines bg-surface-table-row-header">
                <th scope="col" style={colStyle(0)} className={cx(thClass, "px-0")}>
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
                  {resizeHandle(0)}
                </th>
                <th scope="col" style={colStyle(1)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Detections"
                    menuLabel="Detections column options"
                    {...getSortProps("name")}
                  />
                  {resizeHandle(1)}
                </th>
                <th scope="col" style={colStyle(2)} className={thClass}>
                  <ColumnHeaderMenu label="State" menuLabel="State column options" {...getSortProps("state")} />
                  {resizeHandle(2)}
                </th>
                <th scope="col" style={colStyle(3)} className={thClass}>
                  <ColumnHeaderMenu label="Category" menuLabel="Category column options" {...getSortProps("category")} />
                  {resizeHandle(3)}
                </th>
                <th scope="col" style={colStyle(4)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Severity"
                    menuLabel="Severity column options"
                    {...getSortProps("severity")}
                  />
                  {resizeHandle(4)}
                </th>
                <th scope="col" style={colStyle(5)} className={thClass}>
                  <ColumnHeaderMenu label="Last Run" menuLabel="Last Run column options" {...getSortProps("lastRun")} />
                  {resizeHandle(5)}
                </th>
                <th scope="col" style={colStyle(6)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Recurrence"
                    menuLabel="Recurrence column options"
                    {...getSortProps("recurrence")}
                  />
                  {resizeHandle(6)}
                </th>
                <th scope="col" style={colStyle(7)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Detection Findings"
                    menuLabel="Detection Findings column options"
                    {...getSortProps("findings")}
                  />
                  {resizeHandle(7)}
                </th>
                <th scope="col" style={colStyle(8)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Connectors"
                    menuLabel="Connectors column options"
                    {...getSortProps("connectors")}
                  />
                  {resizeHandle(8)}
                </th>
                <th scope="col" style={colStyle(9)} className="relative h-10 px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary">
                  <span className="block translate-y-px truncate">Actions</span>
                  {resizeHandle(9)}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => {
                const expanded = expandedIds.has(row.id);
                const enabled = enabledById[row.id] ?? row.enabled;
                return (
                  <Fragment key={row.id}>
                    <tr
                      className={cx(
                        "h-10 border-b border-datavis-gridlines hover:bg-overlay-subtle",
                        !enabled && "opacity-70",
                      )}
                    >
                      <td style={colStyle(0)} className="h-10 px-0 py-0 align-middle">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            className="p-1 text-text-tertiary hover:text-text-primary"
                            aria-expanded={expanded}
                            aria-label={
                              expanded ? `Collapse description for ${row.name}` : `Expand description for ${row.name}`
                            }
                            onClick={() => onToggleExpand(row.id)}
                          >
                            <Icon
                              name="navi-arrow-drop-down"
                              size={32}
                              className={cx("block transition-transform", expanded ? "rotate-0" : "-rotate-90")}
                              aria-hidden
                            />
                          </button>
                        </div>
                      </td>
                      <td style={colStyle(1)} className={cx(tdClass, "min-w-0")}>
                        <div className="flex min-w-0 items-center gap-2">
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
                      <td style={colStyle(2)} className={tdClass}>
                        <Switch
                          checked={enabledById[row.id] ?? row.enabled}
                          onCheckedChange={(checked) => onEnabledChange(row.id, checked)}
                          aria-label={`Toggle ${row.name}`}
                        />
                      </td>
                      <td style={colStyle(3)} className={tdClass}>
                        {row.category}
                      </td>
                      <td style={colStyle(4)} className={tdClass}>
                        <span className="inline-flex items-center gap-2">
                          <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_COLORS[row.severity]} />
                          <span>{row.severity}</span>
                        </span>
                      </td>
                      <td style={colStyle(5)} className={cx(tdClass, "tabular-nums")}>
                        {row.lastRun}
                      </td>
                      <td style={colStyle(6)} className={tdClass}>
                        {row.recurrence}
                      </td>
                      <td style={colStyle(7)} className={tdClass}>
                        <LibraryFindingsCell findings={row.findings} />
                      </td>
                      <td style={colStyle(8)} className={tdClass}>
                        <ConnectorsCell active={row.connectorsActive} total={row.connectorsTotal} />
                      </td>
                      <td style={colStyle(9)} className={tdClass}>
                        <LibraryCopyAction name={row.name} />
                      </td>
                    </tr>
                    {expanded ? (
                      <tr
                        className={cx(
                          "border-b border-datavis-gridlines bg-surface-table-row-header",
                          !enabled && "opacity-70",
                        )}
                      >
                        <td colSpan={LIBRARY_COLUMN_COUNT} className="px-4 py-3 align-top">
                          <p className="text-sm leading-relaxed text-text-secondary">{row.description}</p>
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
    </section>
  );
}

export function DetectionLibraryContent() {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>("filter");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [drawerDetectionId, setDrawerDetectionId] = useState<string | null>(null);
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(LIBRARY_DETECTION_ROWS.map((r) => [r.id, r.enabled])),
  );
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const filteredRows = useMemo(() => {
    return LIBRARY_DETECTION_ROWS.filter((row) => {
      const enabled = enabledById[row.id] ?? row.enabled;
      if (showOnlyActive && !enabled) return false;
      return libraryMatchesSearch(row, searchQuery, enabled);
    });
  }, [searchQuery, enabledById, showOnlyActive]);

  const summaryStats = useMemo(() => {
    const total = LIBRARY_DETECTION_ROWS.length;
    const enabled = LIBRARY_DETECTION_ROWS.filter((row) => enabledById[row.id] ?? row.enabled).length;
    const critical = LIBRARY_DETECTION_ROWS.filter((row) => row.severity === "Critical").length;
    const high = LIBRARY_DETECTION_ROWS.filter((row) => row.severity === "High").length;
    return { total, enabled, critical, high };
  }, [enabledById]);

  const drawerRow = drawerDetectionId
    ? LIBRARY_DETECTION_ROWS.find((row) => row.id === drawerDetectionId) ?? null
    : null;

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
    <>
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LibraryStatCard label="Total Detections" value={summaryStats.total} />
        <LibraryStatCard label="Enabled" value={summaryStats.enabled} />
        <LibraryStatCard label="Critical Severity" value={summaryStats.critical} />
        <LibraryStatCard label="High Severity" value={summaryStats.high} />
      </div>

      <LibraryDetectionsTable
        rows={filteredRows}
        tableTool={tableTool}
        onTableToolChange={setTableTool}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onToggleExpandAll={toggleExpandAll}
        onOpenDetection={setDrawerDetectionId}
        enabledById={enabledById}
        onEnabledChange={(id, enabled) => setEnabledById((prev) => ({ ...prev, [id]: enabled }))}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        showOnlyActive={showOnlyActive}
        onShowOnlyActiveChange={setShowOnlyActive}
        totalCount={LIBRARY_DETECTION_ROWS.length}
        onClearFilters={() => setSearchQuery("")}
      />

      {drawerRow ? (
        <SlideOver
          open
          onClose={() => setDrawerDetectionId(null)}
          ariaLabel={`Detection: ${drawerRow.name}`}
          panelClassName="max-w-[480px]"
        >
          <LibraryDetectionDetailPanel
            row={drawerRow}
            enabled={enabledById[drawerRow.id] ?? drawerRow.enabled}
            onClose={() => setDrawerDetectionId(null)}
          />
        </SlideOver>
      ) : null}
    </>
  );
}
