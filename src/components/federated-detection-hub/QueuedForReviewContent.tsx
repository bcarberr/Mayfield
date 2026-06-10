import { Fragment, useMemo, useState } from "react";
import { Checkbox, Icon, Switch, type SeverityShapeIconName } from "../../design-system";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import {
  compareBooleans,
  compareFindings,
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

type QueuedDetectionRow = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  queuedBy: string;
  queuedDate: string;
  severity: DetectionSeverity;
  findings: number | "error" | "none";
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

const QUEUED_DETECTION_ROWS: QueuedDetectionRow[] = [
  {
    id: "review-1",
    name: "Active Ransomware Campaign Detected",
    description:
      "Correlates endpoint encryption bursts, shadow copy deletion, and ransom-note file creation across multiple hosts in the finance segment.",
    enabled: true,
    queuedBy: "Admin User",
    queuedDate: "Oct 12, 2025",
    severity: "High",
    findings: 3,
  },
  {
    id: "review-2",
    name: "Unusual Network Traffic Pattern",
    description:
      "Flags sustained outbound connections to rare destinations with elevated byte counts inconsistent with baseline peer behavior.",
    enabled: true,
    queuedBy: "Security Team",
    queuedDate: "Oct 11, 2025",
    severity: "High",
    findings: 7,
  },
  {
    id: "review-3",
    name: "Privileged Account Misuse",
    description:
      "Detects privileged account activity executing sensitive commands outside approved maintenance windows or jump host paths.",
    enabled: true,
    queuedBy: "Admin User",
    queuedDate: "Oct 10, 2025",
    severity: "Critical",
    findings: 2,
  },
  {
    id: "review-4",
    name: "Abnormal SaaS OAuth Grant",
    description:
      "Monitors third-party OAuth applications receiving broad mail or directory scopes on executive mailboxes without change approval.",
    enabled: false,
    queuedBy: "Security Team",
    queuedDate: "Oct 9, 2025",
    severity: "High",
    findings: 5,
  },
  {
    id: "review-5",
    name: "Excessive Failed Auth Attempts",
    description:
      "Surfaces authentication failure spikes against VPN and identity providers from distributed source addresses within short intervals.",
    enabled: false,
    queuedBy: "Analyst Team",
    queuedDate: "Oct 8, 2025",
    severity: "Critical",
    findings: 1,
  },
];

function queuedMatchesSearch(row: QueuedDetectionRow, query: string, enabled: boolean): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const findings =
    row.findings === "error" ? "error" : row.findings === "none" ? "none" : String(row.findings);

  const haystack = [
    row.name,
    row.description,
    row.queuedBy,
    row.queuedDate,
    row.severity,
    findings,
    enabled ? "enabled" : "disabled",
    enabled ? "active" : "inactive",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function ReviewStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[4px] border border-border-container bg-datavis-card-bg px-6 py-5 shadow-datavis-card">
      <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">{value}</p>
    </div>
  );
}

function ReviewFindingsCell({ findings }: { findings: QueuedDetectionRow["findings"] }) {
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

function ReviewActions({ name }: { name: string }) {
  const actionBtn =
    "size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-3 [&_svg]:!h-3 [&_svg]:!w-3";
  const moreBtn =
    "size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4 [&_svg]:!h-4 [&_svg]:!w-4";

  return (
    <div className="flex items-center justify-start gap-0.5">
      <Button type="button" variant="ghost" className={actionBtn} aria-label={`Edit ${name}`}>
        <Icon name="action-edit" size={12} />
      </Button>
      <Button type="button" variant="ghost" className={actionBtn} aria-label={`Delete ${name}`}>
        <Icon name="action-delete" size={12} />
      </Button>
      <Button type="button" variant="ghost" className={moreBtn} aria-label={`More actions for ${name}`}>
        <Icon name="navi-more-vert" size={16} />
      </Button>
    </div>
  );
}

function QueuedDetectionDetailPanel({
  row,
  enabled,
  onClose,
}: {
  row: QueuedDetectionRow;
  enabled: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col text-text-primary">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-rule px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">Queued For Review</p>
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
          <span className="text-sm text-text-secondary">{enabled ? "Active" : "Inactive"}</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">{row.description}</p>
        <dl className="mt-6 space-y-3 border-t border-border-rule pt-4 text-sm">
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-text-tertiary">Queued by</dt>
            <dd className="text-text-secondary">{row.queuedBy}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-text-tertiary">Queued date</dt>
            <dd className="text-text-secondary">{row.queuedDate}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-text-tertiary">Findings</dt>
            <dd>
              <ReviewFindingsCell findings={row.findings} />
            </dd>
          </div>
        </dl>
      </div>
      <footer className="flex shrink-0 justify-end gap-2 border-t border-border-rule px-5 py-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button type="button" variant="primary">
          Approve detection
        </Button>
      </footer>
    </div>
  );
}

const QUEUED_SEVERITY_ORDER: Record<DetectionSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

type QueuedSortColumn = "name" | "state" | "queuedBy" | "queuedDate" | "severity" | "findings";

const REVIEW_SELECT_COL_WIDTH = 40;
const REVIEW_EXPAND_COL_WIDTH = 40;
const REVIEW_COLUMN_COUNT = 9;
const REVIEW_COL_DEFAULTS: readonly number[] = [
  REVIEW_SELECT_COL_WIDTH,
  REVIEW_EXPAND_COL_WIDTH,
  280,
  72,
  120,
  120,
  115,
  130,
  100,
];
const REVIEW_COL_MINS: readonly number[] = [
  REVIEW_SELECT_COL_WIDTH,
  REVIEW_EXPAND_COL_WIDTH,
  160,
  56,
  88,
  96,
  72,
  88,
  88,
];

function QueuedReviewTable({
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
  rows: QueuedDetectionRow[];
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
    selectColWidth: REVIEW_SELECT_COL_WIDTH,
    colDefaults: REVIEW_COL_DEFAULTS,
    colMins: REVIEW_COL_MINS,
    minTableWidth: 960,
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
    "relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary";
  const tdClass = "h-10 px-2 py-0 align-middle text-sm text-text-secondary";
  const hasActiveFilters = searchQuery.trim().length > 0;
  const allExpanded = rows.length > 0 && rows.every((row) => expandedIds.has(row.id));
  const sortComparators = useMemo(
    (): Record<QueuedSortColumn, (a: QueuedDetectionRow, b: QueuedDetectionRow) => number> => ({
      name: (a, b) => compareStrings(a.name, b.name),
      state: (a, b) =>
        compareBooleans(enabledById[a.id] ?? a.enabled, enabledById[b.id] ?? b.enabled),
      queuedBy: (a, b) => compareStrings(a.queuedBy, b.queuedBy),
      queuedDate: (a, b) => compareStrings(a.queuedDate, b.queuedDate),
      severity: (a, b) => QUEUED_SEVERITY_ORDER[a.severity] - QUEUED_SEVERITY_ORDER[b.severity],
      findings: (a, b) => compareFindings(a.findings, b.findings),
    }),
    [enabledById],
  );
  const { sortedRows, getSortProps } = useColumnSort(sortComparators);
  const displayRows = sortedRows(rows);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-datavis-card">
      <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-[20px] pt-3 sm:pl-5">
        <h2 className="text-base-semibold text-text-primary">Queued For Review</h2>
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
                aria-label="Search queued detections"
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
            <caption className="sr-only">Queued for review detections</caption>
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
                  <ColumnHeaderMenu label="Queued By" menuLabel="Queued By column options" {...getSortProps("queuedBy")} />
                  {resizeHandle(4)}
                </th>
                <th scope="col" style={colStyle(5)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Queued Date"
                    menuLabel="Queued Date column options"
                    {...getSortProps("queuedDate")}
                  />
                  {resizeHandle(5)}
                </th>
                <th scope="col" style={colStyle(6)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Severity"
                    menuLabel="Severity column options"
                    {...getSortProps("severity")}
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
                <th scope="col" style={colStyle(8)} className="relative h-10 px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary">
                  <span className="block translate-y-px truncate">Actions</span>
                  {resizeHandle(8)}
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
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selected.has(row.id)}
                            onCheckedChange={(checked) => toggleRow(row.id, checked)}
                            aria-label={`Select ${row.name}`}
                          />
                        </div>
                      </td>
                      <td style={colStyle(1)} className="h-10 px-0 py-0 align-middle">
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
                      <td style={colStyle(2)} className={cx(tdClass, "min-w-0")}>
                        <TruncatedText
                          as="button"
                          className="w-full text-left font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                          onClick={() => onOpenDetection(row.id)}
                        >
                          {row.name}
                        </TruncatedText>
                      </td>
                      <td style={colStyle(3)} className={tdClass}>
                        <Switch
                          checked={enabledById[row.id] ?? row.enabled}
                          onCheckedChange={(checked) => onEnabledChange(row.id, checked)}
                          aria-label={`Toggle ${row.name}`}
                        />
                      </td>
                      <td style={colStyle(4)} className={tdClass}>
                        {row.queuedBy}
                      </td>
                      <td style={colStyle(5)} className={cx(tdClass, "tabular-nums")}>
                        {row.queuedDate}
                      </td>
                      <td style={colStyle(6)} className={tdClass}>
                        <span className="inline-flex items-center gap-2">
                          <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_COLORS[row.severity]} />
                          <span>{row.severity}</span>
                        </span>
                      </td>
                      <td style={colStyle(7)} className={tdClass}>
                        <ReviewFindingsCell findings={row.findings} />
                      </td>
                      <td style={colStyle(8)} className={tdClass}>
                        <ReviewActions name={row.name} />
                      </td>
                    </tr>
                    {expanded ? (
                      <tr
                        className={cx(
                          "border-b border-datavis-gridlines bg-surface-table-row-header",
                          !enabled && "opacity-70",
                        )}
                      >
                        <td colSpan={REVIEW_COLUMN_COUNT} className="px-4 py-3 align-top">
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

export function QueuedForReviewContent() {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>("filter");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [drawerDetectionId, setDrawerDetectionId] = useState<string | null>(null);
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(QUEUED_DETECTION_ROWS.map((r) => [r.id, r.enabled])),
  );
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const filteredRows = useMemo(() => {
    return QUEUED_DETECTION_ROWS.filter((row) => {
      const enabled = enabledById[row.id] ?? row.enabled;
      if (showOnlyActive && !enabled) return false;
      return queuedMatchesSearch(row, searchQuery, enabled);
    });
  }, [searchQuery, enabledById, showOnlyActive]);

  const summaryStats = useMemo(() => {
    const pending = QUEUED_DETECTION_ROWS.length;
    const active = QUEUED_DETECTION_ROWS.filter((row) => enabledById[row.id] ?? row.enabled).length;
    const highFindings = QUEUED_DETECTION_ROWS.filter((row) => row.severity === "High").reduce((sum, row) => {
      return sum + (typeof row.findings === "number" ? row.findings : 0);
    }, 0);
    const criticalSeverity = QUEUED_DETECTION_ROWS.filter((row) => row.severity === "Critical").length;
    return { pending, active, highFindings, criticalSeverity };
  }, [enabledById]);

  const drawerRow = drawerDetectionId
    ? QUEUED_DETECTION_ROWS.find((row) => row.id === drawerDetectionId) ?? null
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
        <ReviewStatCard label="Pending Review" value={summaryStats.pending} />
        <ReviewStatCard label="Active" value={summaryStats.active} />
        <ReviewStatCard label="High Findings" value={summaryStats.highFindings} />
        <ReviewStatCard label="Critical Severity" value={summaryStats.criticalSeverity} />
      </div>

      <QueuedReviewTable
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
        totalCount={QUEUED_DETECTION_ROWS.length}
        onClearFilters={() => setSearchQuery("")}
      />

      {drawerRow ? (
        <SlideOver
          open
          onClose={() => setDrawerDetectionId(null)}
          ariaLabel={`Detection: ${drawerRow.name}`}
          panelClassName="max-w-[480px]"
        >
          <QueuedDetectionDetailPanel
            row={drawerRow}
            enabled={enabledById[drawerRow.id] ?? drawerRow.enabled}
            onClose={() => setDrawerDetectionId(null)}
          />
        </SlideOver>
      ) : null}
    </>
  );
}
