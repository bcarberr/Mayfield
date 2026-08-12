import { Fragment, useEffect, useMemo, useState } from "react";
import {
  DATA_GRID_BODY_CELL_CENTER_CLASS,
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
  compareStrings,
  useColumnSort,
} from "../ui/useColumnSort";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { eventGridFacetDefinitions, formatDetectionFindings } from "../ui/dataGridFacetDefinitions";
import { useDataGridFacetFilter } from "../ui/dataGridFilterTypes";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { Snackbar } from "../ui/Snackbar";
import { useDataGridJsonExport } from "../ui/useDataGridJsonExport";
import { DataGridPagination } from "../ui/DataGridPagination";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { type ContentAreaSlideOverState } from "../ui/SlideOver";
import { renderDataGridEntityOrEmptyBodyCell } from "../ui/dataGridEntityAttributeCells";
import { TruncatedText } from "../ui/TruncatedText";
import { QUEUED_FOR_REVIEW_DATA_GRID_COLUMNS } from "../ui/dataGridColumnCatalog";
import { useDataGridColumnPanel } from "../ui/dataGridColumnTypes";
import {
  dataGridBodyCellClass,
  dataGridHeaderCellClass,
  useDynamicResizableColumns,
} from "../ui/dataGridDynamicTableHelpers";
import { useDataGridPagination } from "../ui/useDataGridPagination";
import {
  DetectionConnectorsRunPanel,
  DetectionExpandedDetails,
  getLastRunConnectorsForDetection,
} from "./detectionRunConnectors";
import { FindingsSearchCell } from "./FindingsSearchCell";
import {
  type DetectionSeverity,
  type QueuedDetectionRow,
} from "./detectionQueue";
import { getDetectionEnabled } from "./detectionEnabledState";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function DatavisGridlineRule({ inset = true }: { inset?: boolean }) {
  return <div className={cx("h-px shrink-0 bg-datavis-gridlines", inset && "mx-[20px]")} aria-hidden />;
}

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

function ReviewStatCard({
  label,
  value,
  selected,
  onClick,
  severityIcon,
}: {
  label: string;
  value: number;
  selected: boolean;
  onClick: () => void;
  severityIcon?: { name: SeverityShapeIconName; color: string };
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
          "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide",
          selected ? "text-interactive-active" : "text-text-tertiary",
        )}
      >
        {severityIcon ? (
          <Icon name={severityIcon.name} size={14} style={{ color: severityIcon.color }} aria-hidden className="shrink-0" />
        ) : null}
        <span>{label}</span>
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">{value}</p>
    </button>
  );
}

type ReviewStatFilter = "active" | "high-findings" | "critical";

const REVIEW_STAT_FILTER_LABELS: Record<ReviewStatFilter, string> = {
  active: "Active",
  "high-findings": "High Findings",
  critical: "Critical Severity",
};


function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 border border-border-rule bg-surface-modal p-0 text-text-primary ring-0 shadow-xl sm:max-w-sm"
      >
        <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-border-rule px-4 py-3">
          <DialogTitle className="text-base font-bold leading-normal tracking-wide text-text-primary">
            Remove from queue
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            className="h-auto shrink-0 p-0 text-text-tertiary hover:text-text-primary"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon name="close" size={20} />
          </Button>
        </DialogHeader>
        <div className="px-4 py-6 text-sm text-text-secondary">
          Remove this detection from the review queue? It will remain in Manage Detections.
        </div>
        <DialogFooter className="mx-0 mb-0 gap-2 rounded-b-xl border-t border-border-rule bg-transparent px-4 py-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary-outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={onConfirm}
          >
            Remove from queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewActions({
  name,
  onEdit,
  onRunNow,
  onCopy,
  onDelete,
  onQueueForReview,
}: {
  name: string;
  onEdit: () => void;
  onRunNow: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onQueueForReview: () => void;
}) {
  const actionBtn =
    "shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-3 [&_svg]:!h-3 [&_svg]:!w-3";
  const actionBtnLg =
    "shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4 [&_svg]:!h-4 [&_svg]:!w-4";
  const moreBtn =
    "shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4 [&_svg]:!h-4 [&_svg]:!w-4";

  return (
    <TooltipProvider>
      <div className="flex items-center justify-start gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" className={actionBtn} aria-label="Edit detection" onClick={onEdit}>
              <Icon name="action-edit" size={12} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit detection</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" className={actionBtnLg} aria-label="Run now" onClick={onRunNow}>
              <Icon name="navi-double-chevron" size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Run now</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={actionBtn}
              aria-label="Clear from review"
              onClick={onDelete}
            >
              <Icon name="action-close" size={12} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear from review</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" className={moreBtn} aria-label={`More actions for ${name}`}>
              <Icon name="navi-more-vert" size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCopy}>
              Create copy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onQueueForReview}>
              Queued for review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}

function QueuedDetectionDetailPanel({
  row,
  enabled,
  mode,
  onClose,
}: {
  row: QueuedDetectionRow;
  enabled: boolean;
  mode: "view" | "edit";
  onClose: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col text-text-primary">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-rule px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
            {mode === "edit" ? "Edit detection" : "Detection"}
          </p>
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
        <div className="mt-4">
          <DetectionConnectorsRunPanel
            connectors={getLastRunConnectorsForDetection(row.id)}
            variant="last-run"
          />
        </div>
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
              <FindingsSearchCell
                findings={row.findings}
                detectionId={row.id}
                detectionName={row.name}
              />
            </dd>
          </div>
        </dl>
      </div>
      <footer className="flex shrink-0 justify-end gap-2 border-t border-border-rule px-5 py-4">
        <Button type="button" variant="secondary-outline" onClick={onClose}>
          Close
        </Button>
        <Button type="button" variant="default">
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

function QueuedReviewTable({
  rows,
  tableTool,
  onTableToolChange,
  expandedIds,
  onToggleExpand,
  onToggleExpandAll,
  onOpenDetection,
  onEditDetection,
  onCopyDetection,
  onDeleteDetection,
  onRunNow,
  enabledByName,
  onEnabledChange,
  searchQuery,
  onSearchQueryChange,
  totalCount,
  onClearFilters,
  statFilterLabel,
}: {
  rows: QueuedDetectionRow[];
  tableTool: FilterColumnPanelTool | null;
  onTableToolChange: (tool: FilterColumnPanelTool | null) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleExpandAll: () => void;
  onOpenDetection: (id: string) => void;
  onEditDetection: (id: string) => void;
  onCopyDetection: (id: string) => void;
  onDeleteDetection: (id: string) => void;
  onRunNow: (name: string) => void;
  enabledByName: Record<string, boolean>;
  onEnabledChange: (name: string, enabled: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  totalCount: number;
  onClearFilters: () => void;
  statFilterLabel: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const { tableColumnIds, filterColumnPanelColumnProps } = useDataGridColumnPanel(
    QUEUED_FOR_REVIEW_DATA_GRID_COLUMNS,
  );
  const facetDefs = useMemo(
    () =>
      eventGridFacetDefinitions<QueuedDetectionRow>(
        {
          severity: (row) => row.severity,
          queuedBy: (row) => row.queuedBy,
          findings: (row) => formatDetectionFindings(row.findings),
          state: (row) =>
            getDetectionEnabled(row.name, row.enabled, enabledByName) ? "Enabled" : "Disabled",
        },
        { includeEntityAttributes: true },
      ),
    [enabledByName],
  );
  const {
    facets,
    selections: facetSelections,
    setSelections: setFacetSelections,
    filteredRows,
    hasFacetFilters,
    clearSelections: clearFacetSelections,
  } = useDataGridFacetFilter(rows, facetDefs);
  const { exportAll, snackbarProps } = useDataGridJsonExport(filteredRows, "queued-for-review");
  const {
    containerRef,
    colStyle,
    tableSizeStyle,
    isResizing,
    resizeHandle,
    displayWidths,
  } = useDynamicResizableColumns(tableColumnIds);

  const allIds = useMemo(() => filteredRows.map((r) => r.id), [filteredRows]);
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

  const thClass = (colIndex: number, columnId: string) =>
    dataGridHeaderCellClass(colIndex, tableColumnIds.length, columnId);
  const tdClass = (columnId: string) =>
    cx(dataGridBodyCellClass(columnId), "text-sm text-text-secondary");
  const hasActiveFilters = statFilterLabel != null || hasFacetFilters;
  const allExpanded = filteredRows.length > 0 && filteredRows.every((row) => expandedIds.has(row.id));
  const sortComparators = useMemo(
    (): Record<QueuedSortColumn, (a: QueuedDetectionRow, b: QueuedDetectionRow) => number> => ({
      name: (a, b) => compareStrings(a.name, b.name),
      state: (a, b) =>
        compareBooleans(
          getDetectionEnabled(a.name, a.enabled, enabledByName),
          getDetectionEnabled(b.name, b.enabled, enabledByName),
        ),
      queuedBy: (a, b) => compareStrings(a.queuedBy, b.queuedBy),
      queuedDate: (a, b) => compareStrings(a.queuedDate, b.queuedDate),
      severity: (a, b) => QUEUED_SEVERITY_ORDER[a.severity] - QUEUED_SEVERITY_ORDER[b.severity],
      findings: (a, b) => compareFindings(a.findings, b.findings),
    }),
    [enabledByName],
  );
  const { sortedRows, getSortProps } = useColumnSort(sortComparators);
  const sorted = sortedRows(filteredRows);
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

  const renderHeaderCell = (columnId: string, colIndex: number) => {
    switch (columnId) {
      case "select":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <div className="flex items-center justify-center">
              <Checkbox checked={allSelected} indeterminate={someSelected} onCheckedChange={toggleAll} aria-label="Select all rows" />
            </div>
            {resizeHandle(colIndex)}
          </th>
        );
      case "expand":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <div className="flex justify-center">
              <button
                type="button"
                className="inline-flex items-center p-0 text-text-tertiary hover:text-text-primary"
                aria-expanded={allExpanded}
                aria-label={allExpanded ? "Collapse all detection descriptions" : "Expand all detection descriptions"}
                onClick={onToggleExpandAll}
              >
                <Icon name="navi-arrow-drop-down" size={32} className={cx("block shrink-0 transition-transform", allExpanded ? "rotate-0" : "-rotate-90")} aria-hidden />
                <Icon name="navi-chevron-right" size={20} className="-ml-4 block shrink-0" aria-hidden />
              </button>
            </div>
            {resizeHandle(colIndex)}
          </th>
        );
      case "name":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu label="Detections" menuLabel="Detections column options" {...getSortProps("name")} />
            {resizeHandle(colIndex)}
          </th>
        );
      case "state":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu label="State" menuLabel="State column options" {...getSortProps("state")} />
            {resizeHandle(colIndex)}
          </th>
        );
      case "queuedBy":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu label="Queued By" menuLabel="Queued By column options" {...getSortProps("queuedBy")} />
            {resizeHandle(colIndex)}
          </th>
        );
      case "queuedDate":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu label="Queued Date" menuLabel="Queued Date column options" {...getSortProps("queuedDate")} />
            {resizeHandle(colIndex)}
          </th>
        );
      case "severity":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu label="Severity" menuLabel="Severity column options" {...getSortProps("severity")} />
            {resizeHandle(colIndex)}
          </th>
        );
      case "findings":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu label="Detection Findings" menuLabel="Detection Findings column options" {...getSortProps("findings")} />
            {resizeHandle(colIndex)}
          </th>
        );
      case "actions":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <span className="block translate-y-px truncate">Actions</span>
            {resizeHandle(colIndex)}
          </th>
        );
      default:
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <span className="block translate-y-px truncate">
              {QUEUED_FOR_REVIEW_DATA_GRID_COLUMNS.find((col) => col.id === columnId)?.label ?? columnId}
            </span>
            {resizeHandle(colIndex)}
          </th>
        );
    }
  };

  const renderBodyCell = (
    columnId: string,
    row: QueuedDetectionRow,
    colIndex: number,
    opts: { expanded: boolean; inactiveCellClass: string },
  ) => {
    const { expanded, inactiveCellClass } = opts;
    switch (columnId) {
      case "select":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), inactiveCellClass)}>
            <div className={DATA_GRID_BODY_CELL_CENTER_CLASS}>
              <Checkbox checked={selected.has(row.id)} onCheckedChange={(checked) => toggleRow(row.id, checked)} aria-label={`Select ${row.name}`} />
            </div>
          </td>
        );
      case "expand":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), inactiveCellClass)}>
            <div className={DATA_GRID_BODY_CELL_CENTER_CLASS}>
              <button type="button" className={DATA_GRID_ROW_EXPAND_BTN_CLASS} aria-expanded={expanded} aria-label={expanded ? `Collapse description for ${row.name}` : `Expand description for ${row.name}`} onClick={() => onToggleExpand(row.id)}>
                <Icon name="navi-arrow-drop-down" size={DATA_GRID_ROW_EXPAND_ICON_SIZE} className={cx("block transition-transform", expanded ? "rotate-0" : "-rotate-90")} aria-hidden />
              </button>
            </div>
          </td>
        );
      case "name":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), "min-w-0", inactiveCellClass)}>
            <TruncatedText as="button" className="w-full text-left font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active" onClick={() => onOpenDetection(row.id)}>
              {row.name}
            </TruncatedText>
          </td>
        );
      case "state":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), inactiveCellClass)}>
            <Switch checked={getDetectionEnabled(row.name, row.enabled, enabledByName)} onCheckedChange={(checked) => onEnabledChange(row.name, checked)} aria-label={`Toggle ${row.name}`} />
          </td>
        );
      case "queuedBy":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), inactiveCellClass)}>
            {row.queuedBy}
          </td>
        );
      case "queuedDate":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), "tabular-nums", inactiveCellClass)}>
            {row.queuedDate}
          </td>
        );
      case "severity":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), inactiveCellClass)}>
            <span className="inline-flex items-center gap-2">
              <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_COLORS[row.severity]} />
              <span>{row.severity}</span>
            </span>
          </td>
        );
      case "findings":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={tdClass(columnId)}>
            <FindingsSearchCell findings={row.findings} detectionId={row.id} detectionName={row.name} />
          </td>
        );
      case "actions":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={tdClass(columnId)}>
            <div className="flex items-center justify-start overflow-hidden">
              <ReviewActions
                name={row.name}
                onEdit={() => onEditDetection(row.id)}
                onRunNow={() => onRunNow(row.name)}
                onCopy={() => onCopyDetection(row.id)}
                onDelete={() => onDeleteDetection(row.id)}
                onQueueForReview={() => {}}
              />
            </div>
          </td>
        );
      default:
        return renderDataGridEntityOrEmptyBodyCell({
          columnId,
          rowId: row.id,
          colIndex,
          colStyle,
          className: cx(tdClass(columnId), inactiveCellClass),
        });
    }
  };

  return (
    <>
    <section
      className={DATA_GRID_SECTION_CLASS}
      style={sectionStyle}
    >
      <div ref={toolbarRef} className={DATA_GRID_TOOLBAR_STICKY_CLASS}>
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-[20px] pt-3 sm:pl-5">
        <h2 className="text-base-semibold text-text-primary">Queued For Review</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="shrink-0 text-base-small text-text-secondary">
            {filteredRows.length} of {totalCount} Results
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
                aria-label="Search queued detections"
              />
            </div>
          </div>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
              onClick={() => {
                onClearFilters();
                clearFacetSelections();
              }}
            >
              <Icon name="action-filter-list" size={14} aria-hidden />
              Clear all filters
            </Button>
          ) : null}
          <DataGridExportButton onClick={exportAll} />
        </div>
      </div>
        <DatavisGridlineRule inset={false} />
      </div>
      <div className={DATA_GRID_FILTER_ROW_CLASS}>
        <FilterColumnPanel
          active={tableTool}
          onFilterClick={() => onTableToolChange(tableTool === "filter" ? null : "filter")}
          onColumnsClick={() => onTableToolChange(tableTool === "columns" ? null : "columns")}
          facets={facets}
          selections={facetSelections}
          onSelectionsChange={setFacetSelections}
          {...filterColumnPanelColumnProps}
        />
        <div
          key={tableColumnIds.join("|")}
          ref={containerRef}
          className={cx(DATA_GRID_TABLE_SCROLL_CLASS, isResizing && "select-none")}
        >
          <table
            className={DATA_GRID_TABLE_CLASS}
            style={tableSizeStyle}
          >
            <caption className="sr-only">Queued for review detections</caption>
            <colgroup>
              {displayWidths.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <thead className={DATA_GRID_THEAD_CLASS}>
              <tr className={DATA_GRID_HEADER_ROW_CLASS}>
                {tableColumnIds.map((columnId, colIndex) => renderHeaderCell(columnId, colIndex))}
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
                      {tableColumnIds.map((columnId, colIndex) =>
                        renderBodyCell(columnId, row, colIndex, { expanded, inactiveCellClass }),
                      )}
                    </tr>
                    {expanded ? (
                      <tr className={cx(DATA_GRID_EXPANDED_ROW_CLASS, !enabled && "opacity-70")}>
                        <td colSpan={tableColumnIds.length} className={DATA_GRID_EXPANDED_CELL_CLASS}>
                          <DetectionExpandedDetails description={row.description} detectionId={row.id} />
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
    <Snackbar {...snackbarProps} />
    </>
  );
}

type CopyDetectionValues = {
  name: string;
  description: string;
  severity: DetectionSeverity;
  enabled: boolean;
};

export function QueuedForReviewContent({
  onSlideOverChange,
  onRunNow,
  onCopyDetection,
  queuedRows,
  onClearFromReview,
  enabledByName,
  onEnabledChange,
}: {
  onSlideOverChange: (state: ContentAreaSlideOverState | null) => void;
  onRunNow?: (name: string) => void;
  onCopyDetection?: (values: CopyDetectionValues) => void;
  queuedRows: QueuedDetectionRow[];
  onClearFromReview: (id: string) => void;
  enabledByName: Record<string, boolean>;
  onEnabledChange: (name: string, enabled: boolean) => void;
}) {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>("filter");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [drawerDetectionId, setDrawerDetectionId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [statFilter, setStatFilter] = useState<ReviewStatFilter | null>(null);

  const handleStatFilterClick = (filter: ReviewStatFilter) => {
    setStatFilter((current) => (current === filter ? null : filter));
  };

  const openDetectionPanel = (id: string, mode: "view" | "edit") => {
    setDrawerDetectionId(id);
    setDrawerMode(mode);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    onClearFromReview(deleteTargetId);
    setDrawerDetectionId((current) => (current === deleteTargetId ? null : current));
    setExpandedIds((current) => {
      const next = new Set(current);
      next.delete(deleteTargetId);
      return next;
    });
    setDeleteTargetId(null);
  };

  const handleOpenCopyDetection = (id: string) => {
    const source = queuedRows.find((row) => row.id === id);
    if (!source || !onCopyDetection) return;
    onCopyDetection({
      name: source.name,
      description: source.description,
      severity: source.severity,
      enabled: getDetectionEnabled(source.name, source.enabled, enabledByName),
    });
  };

  const filteredRows = useMemo(() => {
    return queuedRows.filter((row) => {
      const enabled = getDetectionEnabled(row.name, row.enabled, enabledByName);
      if (statFilter === "active" && !enabled) return false;
      if (statFilter === "high-findings" && row.severity !== "High") return false;
      if (statFilter === "critical" && row.severity !== "Critical") return false;
      return queuedMatchesSearch(row, searchQuery, enabled);
    });
  }, [queuedRows, searchQuery, enabledByName, statFilter]);

  const summaryStats = useMemo(() => {
    const pending = queuedRows.length;
    const active = queuedRows.filter(
      (row) => getDetectionEnabled(row.name, row.enabled, enabledByName),
    ).length;
    const highFindings = queuedRows.filter((row) => row.severity === "High").reduce((sum, row) => {
      return sum + (typeof row.findings === "number" ? row.findings : 0);
    }, 0);
    const criticalSeverity = queuedRows.filter((row) => row.severity === "Critical").length;
    return { pending, active, highFindings, criticalSeverity };
  }, [queuedRows, enabledByName]);

  const drawerRow = drawerDetectionId
    ? queuedRows.find((row) => row.id === drawerDetectionId) ?? null
    : null;

  useEffect(() => {
    onSlideOverChange(
      drawerRow
        ? {
            ariaLabel: `Detection: ${drawerRow.name}`,
            onClose: () => setDrawerDetectionId(null),
            panel: (
              <QueuedDetectionDetailPanel
                row={drawerRow}
                enabled={getDetectionEnabled(drawerRow.name, drawerRow.enabled, enabledByName)}
                mode={drawerMode}
                onClose={() => setDrawerDetectionId(null)}
              />
            ),
          }
        : null,
    );
    return () => onSlideOverChange(null);
  }, [drawerRow, drawerMode, enabledByName, onSlideOverChange]);

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
        <ReviewStatCard
          label="Pending Review"
          value={summaryStats.pending}
          selected={false}
          onClick={() => setStatFilter(null)}
        />
        <ReviewStatCard
          label="Active"
          value={summaryStats.active}
          selected={statFilter === "active"}
          onClick={() => handleStatFilterClick("active")}
        />
        <ReviewStatCard
          label="High Findings"
          value={summaryStats.highFindings}
          selected={statFilter === "high-findings"}
          onClick={() => handleStatFilterClick("high-findings")}
          severityIcon={{ name: SEV_ICONS.High, color: SEV_COLORS.High }}
        />
        <ReviewStatCard
          label="Critical Severity"
          value={summaryStats.criticalSeverity}
          selected={statFilter === "critical"}
          onClick={() => handleStatFilterClick("critical")}
          severityIcon={{ name: SEV_ICONS.Critical, color: SEV_COLORS.Critical }}
        />
      </div>

      <QueuedReviewTable
        rows={filteredRows}
        tableTool={tableTool}
        onTableToolChange={setTableTool}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onToggleExpandAll={toggleExpandAll}
        onOpenDetection={(id) => openDetectionPanel(id, "view")}
        onEditDetection={(id) => openDetectionPanel(id, "edit")}
        onCopyDetection={handleOpenCopyDetection}
        onDeleteDetection={(id) => setDeleteTargetId(id)}
        onRunNow={(name) => onRunNow?.(name)}
        enabledByName={enabledByName}
        onEnabledChange={onEnabledChange}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        totalCount={queuedRows.length}
        statFilterLabel={statFilter ? REVIEW_STAT_FILTER_LABELS[statFilter] : null}
        onClearFilters={() => {
          setSearchQuery("");
          setStatFilter(null);
        }}
      />

      <DeleteConfirmationModal
        open={deleteTargetId != null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
