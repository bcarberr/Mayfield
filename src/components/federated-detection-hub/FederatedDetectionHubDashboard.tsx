import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { FederatedDetectionHubLocationState } from "../../app/routes";
import {
  DATA_GRID_ABOVE_SECTION_CLASS,
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
import { Plus } from "lucide-react";
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
import {
  PageSlideOver,
  FORM_CONTENT_SLIDE_OVER_PANEL_CLASS,
  type ContentAreaSlideOverState,
} from "../ui/SlideOver";
import { renderDataGridEntityOrEmptyBodyCell } from "../ui/dataGridEntityAttributeCells";
import { TruncatedText } from "../ui/TruncatedText";
import { DonutChartPanel } from "../ui/DonutChartPanel";
import { FEDERATED_DETECTIONS_DATA_GRID_COLUMNS } from "../ui/dataGridColumnCatalog";
import { useDataGridColumnPanel } from "../ui/dataGridColumnTypes";
import {
  dataGridBodyCellClass,
  dataGridHeaderCellClass,
  useDynamicResizableColumns,
} from "../ui/dataGridDynamicTableHelpers";
import { useDataGridPagination } from "../ui/useDataGridPagination";
import { InsightCard } from "../summary-insights/datavisCard";
import { getCategoricalPaletteColor } from "../../design-system";
import { HorizontalBarPanel } from "../summary-insights/horizontalBarPanel";
import type { DetectionRow } from "./detectionHubTypes";
import { useDetectionHub } from "../../context/DetectionHubContext";
import { DetectionExpandedDetails } from "./detectionRunConnectors";
import { FindingsSearchCell } from "./FindingsSearchCell";
import { DetectionHistoryContent } from "./DetectionHistoryContent";
import { detectionEnabledKey, getDetectionEnabled } from "./detectionEnabledState";
import { CreateDetectionSlideOver, type NewDetectionPayload } from "./CreateDetectionSlideOver";
import { DetectionLibraryContent, type LibraryDetectionRow } from "./DetectionLibraryContent";
import { QueuedForReviewContent } from "./QueuedForReviewContent";
import {
  detectionRowToQueuedRow,
  INITIAL_QUEUED_DETECTION_ROWS,
  type QueuedDetectionRow,
} from "./detectionQueue";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

/** Figma `7671:7964` — Manage Detections tab content. */
const HUB_TABS = [
  "Manage Detections",
  "Detection Library",
  "Queued For Review",
  "Detection History",
] as const;

type HubTab = (typeof HUB_TABS)[number];

type DetectionSeverity = "Critical" | "High" | "Medium" | "Low";

type BreakdownSeverity = "Critical" | "High" | "Medium" | "Low";

function rowMatchesSeverityFilter(rowSeverity: DetectionSeverity, filter: BreakdownSeverity) {
  return rowSeverity === filter;
}

function detectionNeedsAttention(row: DetectionRow): boolean {
  return row.findings === "error";
}

type SystemHealthFilter = "running-normally" | "need-attention" | "inactive";

const SYSTEM_HEALTH_FILTER_LABELS: Record<SystemHealthFilter, string> = {
  "running-normally": "Running normally",
  "need-attention": "Need attention",
  inactive: "Inactive",
};

function detectionIsEnabled(row: DetectionRow, enabledByName: Record<string, boolean>): boolean {
  return getDetectionEnabled(row.name, row.enabled, enabledByName);
}

function detectionRunsNormally(row: DetectionRow, enabledByName: Record<string, boolean>): boolean {
  return detectionIsEnabled(row, enabledByName) && !detectionNeedsAttention(row);
}

function detectionIsInactive(row: DetectionRow, enabledByName: Record<string, boolean>): boolean {
  return !detectionIsEnabled(row, enabledByName);
}

function detectionMatchesSearch(row: DetectionRow, query: string, enabled: boolean): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const findings =
    row.findings === "error" ? "error" : row.findings === "none" ? "none" : String(row.findings);

  const haystack = [
    row.name,
    row.description,
    row.severity,
    row.lastRun,
    row.recurrence,
    findings,
    enabled ? "enabled" : "disabled",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

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

const OVERALL_FINDINGS_COUNT = 1389;

const SEVERITY_BREAKDOWN_ROWS = [
  { label: "Critical", value: 118, color: SEV_COLORS.Critical },
  { label: "High", value: 337, color: SEV_COLORS.High },
  { label: "Medium", value: 667, color: SEV_COLORS.Medium },
  { label: "Low", value: 267, color: SEV_COLORS.Low },
] as const;

const SEVERITY_BREAKDOWN_X_MAX = 700;
const SEVERITY_BREAKDOWN_X_TICKS = [0, 175, 350, 525, 700] as const;



function libraryDetectionToViewRow(
  row: LibraryDetectionRow,
  enabledByName: Record<string, boolean>,
): DetectionRow {
  return {
    id: row.id,
    source: "library",
    name: row.name,
    description: row.description,
    enabled: getDetectionEnabled(row.name, row.enabled, enabledByName),
    severity: row.severity,
    lastRun: row.lastRun,
    recurrence: row.recurrence,
    findings: row.findings,
    connectorsActive: row.connectorsActive,
    connectorsTotal: row.connectorsTotal,
  };
}

function libraryDetectionToManagedRow(row: LibraryDetectionRow): DetectionRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    severity: row.severity,
    lastRun: "—",
    recurrence: row.recurrence,
    findings: "none",
  };
}

/** Figma `7671:8909` — System Health widget. */
function SystemHealthCard({
  runningNormallyCount,
  totalCount,
  needAttentionCount,
  inactiveCount,
  selectedFilter,
  onFilterClick,
}: {
  runningNormallyCount: number;
  totalCount: number;
  needAttentionCount: number;
  inactiveCount: number;
  selectedFilter: SystemHealthFilter | null;
  onFilterClick: (filter: SystemHealthFilter) => void;
}) {
  const linkClass = (filter: SystemHealthFilter) =>
    cx(
      "text-left text-sm font-semibold transition-colors hover:text-interactive-active hover:underline",
      selectedFilter === filter ? "text-interactive-active underline" : "text-text-primary",
    );

  return (
    <InsightCard
      title="System Health"
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
        <span className="text-xl font-bold tracking-wide text-text-primary">System Healthy</span>
        <ul className="col-start-2 space-y-1.5">
          <li className="flex items-baseline gap-3">
            <span className="w-14 shrink-0 text-xl font-bold tabular-nums text-text-primary">
              {runningNormallyCount}/{totalCount}
            </span>
            <button
              type="button"
              aria-pressed={selectedFilter === "running-normally"}
              className={linkClass("running-normally")}
              onClick={() => onFilterClick("running-normally")}
            >
              Detections running normally
            </button>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="flex w-14 shrink-0 items-center gap-1">
              <span className="text-xl font-bold tabular-nums text-text-primary">{needAttentionCount}</span>
              <Icon name="error-outline" size={16} className="shrink-0 text-feedback-negative" aria-hidden />
            </span>
            <button
              type="button"
              aria-pressed={selectedFilter === "need-attention"}
              className={linkClass("need-attention")}
              onClick={() => onFilterClick("need-attention")}
            >
              Detections need attention
            </button>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-14 shrink-0 text-xl font-bold tabular-nums text-text-primary">{inactiveCount}</span>
            <button
              type="button"
              aria-pressed={selectedFilter === "inactive"}
              className={linkClass("inactive")}
              onClick={() => onFilterClick("inactive")}
            >
              Detections are inactive
            </button>
          </li>
        </ul>
        </div>
      </div>
    </InsightCard>
  );
}

const TOP_FINDINGS_SEGMENTS = [
  { label: "Suspicious PowerShell Execution", color: getCategoricalPaletteColor(0), value: 861 },
  { label: "Privilege Escalation Attempts", color: getCategoricalPaletteColor(1), value: 319 },
  { label: "Credential Dumping Activity", color: getCategoricalPaletteColor(2), value: 209 },
] as const;

function TopFindingsCard({
  selectedLabel,
  onSegmentClick,
}: {
  selectedLabel: string | null;
  onSegmentClick: (label: string) => void;
}) {
  return (
    <InsightCard title="Top Findings Detection" compact stretch>
      <div className="flex h-full items-start pt-1">
        <DonutChartPanel
          segments={TOP_FINDINGS_SEGMENTS}
          total={OVERALL_FINDINGS_COUNT}
          centerLabel="findings"
          selectedLabel={selectedLabel}
          onSegmentClick={onSegmentClick}
          ariaLabel="Top findings by detection"
          size="compact"
        />
      </div>
    </InsightCard>
  );
}

/** Figma `7671:9039` — Severity breakdown bars. */
function SeverityBreakdownCard({
  selectedSeverity,
  onSeverityClick,
}: {
  selectedSeverity: BreakdownSeverity | null;
  onSeverityClick: (severity: BreakdownSeverity) => void;
}) {
  return (
    <InsightCard title="Severity ID" compact stretch>
      <HorizontalBarPanel
        rows={SEVERITY_BREAKDOWN_ROWS}
        selectedLabel={selectedSeverity}
        onBarClick={(label) => onSeverityClick(label as BreakdownSeverity)}
        filterAriaLabel={(label) => `Filter detections by ${label} severity`}
        xMax={SEVERITY_BREAKDOWN_X_MAX}
        xTicks={SEVERITY_BREAKDOWN_X_TICKS}
        dense
        denseRowGap={16}
      />
    </InsightCard>
  );
}

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
            Delete Detection
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
          Are you sure you want to delete this detection? This action cannot be undone.
        </div>
        <DialogFooter className="mx-0 mb-0 gap-2 rounded-b-xl border-t border-border-rule bg-transparent px-4 py-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary-outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            className="!bg-feedback-negative hover:!opacity-90"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QueuedForReviewIndicator({ onClear }: { onClear: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-feedback-caution hover:bg-overlay-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
          aria-label="Queued for review"
        >
          <Icon name="action-time" size={14} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Queued for review</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onClear}>Clear from queue</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DisabledTableActionIcon({
  icon,
  label,
  tooltip,
}: {
  icon: "action-edit" | "action-delete";
  label: string;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={label}
          className="inline-flex size-7 cursor-not-allowed items-center justify-center text-text-disabled opacity-[0.22] saturate-0 [&_svg]:!size-3 [&_svg]:!h-3 [&_svg]:!w-3"
        >
          <Icon name={icon} size={12} aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function DetectionActions({
  name,
  onEdit,
  onRunNow,
  onCopy,
  onDelete,
  onQueueForReview,
  isQueuedForReview,
  isLibraryManaged = false,
}: {
  name: string;
  onEdit: () => void;
  onRunNow: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onQueueForReview: () => void;
  isQueuedForReview: boolean;
  isLibraryManaged?: boolean;
}) {
  const actionBtn =
    "shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-3 [&_svg]:!h-3 [&_svg]:!w-3";
  const actionBtnLg =
    "shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4 [&_svg]:!h-4 [&_svg]:!w-4";
  const moreBtn =
    "shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4 [&_svg]:!h-4 [&_svg]:!w-4";
  const libraryActionTooltip = "Pre-configured from Query library — copy to customize";

  return (
    <TooltipProvider>
      <div className="flex items-center justify-start gap-0.5">
        {isLibraryManaged ? (
          <DisabledTableActionIcon
            icon="action-edit"
            label="Edit detection"
            tooltip={libraryActionTooltip}
          />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" className={actionBtn} aria-label="Edit detection" onClick={onEdit}>
                <Icon name="action-edit" size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit detection</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" className={actionBtnLg} aria-label="Run now" onClick={onRunNow}>
              <Icon name="navi-double-chevron" size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Run now</TooltipContent>
        </Tooltip>

        {isLibraryManaged ? (
          <DisabledTableActionIcon
            icon="action-delete"
            label="Delete detection"
            tooltip="Library detections cannot be deleted"
          />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" className={actionBtn} aria-label="Delete detection" onClick={onDelete}>
                <Icon name="action-delete" size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete detection</TooltipContent>
          </Tooltip>
        )}

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
            {!isQueuedForReview ? (
              <DropdownMenuItem onClick={onQueueForReview}>
                Queue for review
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}


const DETECTION_SEVERITY_ORDER: Record<DetectionSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

type DetectionSortColumn = "name" | "state" | "severity" | "lastRun" | "recurrence" | "findings";

function DetectionsTable({
  rows,
  tableTool,
  onTableToolChange,
  expandedIds,
  onToggleExpand,
  onToggleExpandAll,
  onEditDetection,
  onViewLibraryDetection,
  onCopyDetection,
  onDeleteDetection,
  onRunNow,
  onQueueForReview,
  onClearFromReview,
  queuedById,
  enabledByName,
  onEnabledChange,
  detectionNameFilter,
  severityFilter,
  systemHealthFilter,
  searchQuery,
  onSearchQueryChange,
  showOnlyActive,
  onShowOnlyActiveChange,
  totalCount,
  onClearFilters,
  scrollToRowId,
}: {
  rows: DetectionRow[];
  tableTool: FilterColumnPanelTool | null;
  onTableToolChange: (tool: FilterColumnPanelTool | null) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleExpandAll: () => void;
  onEditDetection: (id: string) => void;
  onViewLibraryDetection: (id: string) => void;
  onCopyDetection: (id: string) => void;
  onDeleteDetection: (id: string) => void;
  onRunNow: (name: string) => void;
  onQueueForReview: (id: string) => void;
  onClearFromReview: (id: string) => void;
  queuedById: Record<string, boolean>;
  enabledByName: Record<string, boolean>;
  onEnabledChange: (name: string, enabled: boolean) => void;
  detectionNameFilter: string | null;
  severityFilter: BreakdownSeverity | null;
  systemHealthFilter: SystemHealthFilter | null;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  showOnlyActive: boolean;
  onShowOnlyActiveChange: (checked: boolean) => void;
  totalCount: number;
  onClearFilters: () => void;
  scrollToRowId?: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const { tableColumnIds, filterColumnPanelColumnProps } = useDataGridColumnPanel(
    FEDERATED_DETECTIONS_DATA_GRID_COLUMNS,
  );
  const facetDefs = useMemo(
    () =>
      eventGridFacetDefinitions<DetectionRow>(
        {
          severity: (row) => row.severity,
          state: (row) =>
            getDetectionEnabled(row.name, row.enabled, enabledByName) ? "Enabled" : "Disabled",
          recurrence: (row) => row.recurrence,
          findings: (row) => formatDetectionFindings(row.findings),
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
  const { exportAll, snackbarProps } = useDataGridJsonExport(filteredRows, "federated-detections");
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
  const hasActiveFilters =
    detectionNameFilter != null ||
    severityFilter != null ||
    systemHealthFilter != null ||
    hasFacetFilters;
  const allExpanded = filteredRows.length > 0 && filteredRows.every((row) => expandedIds.has(row.id));
  const sortComparators = useMemo(
    (): Record<DetectionSortColumn, (a: DetectionRow, b: DetectionRow) => number> => ({
      name: (a, b) => compareStrings(a.name, b.name),
      state: (a, b) =>
        compareBooleans(
          getDetectionEnabled(a.name, a.enabled, enabledByName),
          getDetectionEnabled(b.name, b.enabled, enabledByName),
        ),
      severity: (a, b) => DETECTION_SEVERITY_ORDER[a.severity] - DETECTION_SEVERITY_ORDER[b.severity],
      lastRun: (a, b) => compareStrings(a.lastRun, b.lastRun),
      recurrence: (a, b) => compareStrings(a.recurrence, b.recurrence),
      findings: (a, b) => compareFindings(a.findings, b.findings),
    }),
    [enabledByName],
  );
  const { sortedRows, getSortProps, clearSort } = useColumnSort(sortComparators);
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

  useEffect(() => {
    if (!scrollToRowId) return;
    clearSort();
    setPage(1);
  }, [scrollToRowId, clearSort, setPage]);

  const { toolbarRef, sectionStyle } = useDataGridStickyToolbar();

  const renderHeaderCell = (columnId: string, colIndex: number) => {
    switch (columnId) {
      case "select":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <div className="flex items-center justify-center">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all rows"
              />
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
            {resizeHandle(colIndex)}
          </th>
        );
      case "name":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu
              label="Detections"
              menuLabel="Detections column options"
              {...getSortProps("name")}
            />
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
      case "severity":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu
              label="Severity"
              menuLabel="Severity column options"
              {...getSortProps("severity")}
            />
            {resizeHandle(colIndex)}
          </th>
        );
      case "lastRun":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu label="Last Run" menuLabel="Last Run column options" {...getSortProps("lastRun")} />
            {resizeHandle(colIndex)}
          </th>
        );
      case "recurrence":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu
              label="Recurrence"
              menuLabel="Recurrence column options"
              {...getSortProps("recurrence")}
            />
            {resizeHandle(colIndex)}
          </th>
        );
      case "findings":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={thClass(colIndex, columnId)}>
            <ColumnHeaderMenu
              label="Detection Findings"
              menuLabel="Detection Findings column options"
              {...getSortProps("findings")}
            />
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
              {FEDERATED_DETECTIONS_DATA_GRID_COLUMNS.find((col) => col.id === columnId)?.label ?? columnId}
            </span>
            {resizeHandle(colIndex)}
          </th>
        );
    }
  };

  const renderBodyCell = (
    columnId: string,
    row: DetectionRow,
    colIndex: number,
    opts: {
      expanded: boolean;
      enabled: boolean;
      isLibraryManaged: boolean;
      inactiveCellClass: string;
    },
  ) => {
    const { expanded, isLibraryManaged, inactiveCellClass } = opts;
    switch (columnId) {
      case "select":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), inactiveCellClass)}>
            <div className={DATA_GRID_BODY_CELL_CENTER_CLASS}>
              <Checkbox
                checked={selected.has(row.id)}
                onCheckedChange={(checked) => toggleRow(row.id, checked)}
                aria-label={`Select ${row.name}`}
              />
            </div>
          </td>
        );
      case "expand":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), inactiveCellClass)}>
            <div className={DATA_GRID_BODY_CELL_CENTER_CLASS}>
              <button
                type="button"
                className={DATA_GRID_ROW_EXPAND_BTN_CLASS}
                aria-expanded={expanded}
                aria-label={expanded ? `Collapse description for ${row.name}` : `Expand description for ${row.name}`}
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
        );
      case "name":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), "min-w-0", inactiveCellClass)}>
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
              {queuedById[row.id] ? (
                <QueuedForReviewIndicator onClear={() => onClearFromReview(row.id)} />
              ) : null}
              {isLibraryManaged ? (
                <>
                  <Icon
                    name="nav-detections"
                    size={16}
                    className="shrink-0 text-text-tertiary"
                    aria-hidden
                  />
                  <TruncatedText
                    as="button"
                    className="min-w-0 flex-1 text-left font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                    onClick={() => onViewLibraryDetection(row.id)}
                  >
                    {row.name}
                  </TruncatedText>
                </>
              ) : (
                <TruncatedText
                  as="button"
                  className="min-w-0 flex-1 text-left font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                  onClick={() => onEditDetection(row.id)}
                >
                  {row.name}
                </TruncatedText>
              )}
            </div>
          </td>
        );
      case "state":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), inactiveCellClass)}>
            <Switch
              checked={getDetectionEnabled(row.name, row.enabled, enabledByName)}
              onCheckedChange={(checked) => onEnabledChange(row.name, checked)}
              aria-label={`Toggle ${row.name}`}
            />
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
      case "lastRun":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), "tabular-nums", inactiveCellClass)}>
            {row.lastRun}
          </td>
        );
      case "recurrence":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(tdClass(columnId), inactiveCellClass)}>
            {row.recurrence}
          </td>
        );
      case "findings":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={tdClass(columnId)}>
            <FindingsSearchCell
              findings={row.findings}
              detectionId={row.id}
              detectionName={row.name}
            />
          </td>
        );
      case "actions":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={tdClass(columnId)}>
            <div className="flex items-center justify-start gap-0.5 overflow-hidden">
              <DetectionActions
                name={row.name}
                onEdit={() => onEditDetection(row.id)}
                onRunNow={() => onRunNow(row.name)}
                onCopy={() => onCopyDetection(row.id)}
                onDelete={() => onDeleteDetection(row.id)}
                onQueueForReview={() => onQueueForReview(row.id)}
                isQueuedForReview={Boolean(queuedById[row.id])}
                isLibraryManaged={isLibraryManaged}
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
        <h2 className="text-base-semibold text-text-primary">Detections</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="shrink-0 text-base-small text-text-secondary">
            {filteredRows.length} of {totalCount} Results
            {detectionNameFilter ? ` · ${detectionNameFilter}` : ""}
            {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            {severityFilter ? ` · ${severityFilter}` : ""}
            {systemHealthFilter ? ` · ${SYSTEM_HEALTH_FILTER_LABELS[systemHealthFilter]}` : ""}
            {showOnlyActive ? " · Enabled only" : ""}
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
                aria-label="Search detections"
              />
            </div>
            <Checkbox
              checked={showOnlyActive}
              onCheckedChange={onShowOnlyActiveChange}
              label="Show only enabled detections"
              className="shrink-0"
            />
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
            <caption className="sr-only">Manage detections</caption>
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
                const isLibraryManaged = row.source === "library";
                const inactiveCellClass = !enabled ? "opacity-70" : "";
                return (
                  <Fragment key={row.id}>
                    <tr className={DATA_GRID_BODY_ROW_CLASS}>
                      {tableColumnIds.map((columnId, colIndex) =>
                        renderBodyCell(columnId, row, colIndex, {
                          expanded,
                          enabled,
                          isLibraryManaged,
                          inactiveCellClass,
                        }),
                      )}
                    </tr>
                    {expanded ? (
                      <tr
                        className={cx(DATA_GRID_EXPANDED_ROW_CLASS, !enabled && "opacity-70")}
                      >
                        <td colSpan={tableColumnIds.length} className={DATA_GRID_EXPANDED_CELL_CLASS}>
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
    <Snackbar {...snackbarProps} />
    </>
  );
}

function ManageDetectionsContent({
  detectionRows,
  setDetectionRows,
  newDetectionRow,
  onEditDetection,
  onViewLibraryDetection,
  onCopyDetection,
  onRunNow,
  queuedById,
  onQueueForReview,
  onClearFromReview,
  enabledByName,
  onEnabledChange,
}: {
  detectionRows: DetectionRow[];
  setDetectionRows: Dispatch<SetStateAction<DetectionRow[]>>;
  newDetectionRow?: DetectionRow | null;
  onEditDetection: (row: DetectionRow) => void;
  onViewLibraryDetection: (row: DetectionRow) => void;
  onCopyDetection: (row: DetectionRow) => void;
  onRunNow: (name: string) => void;
  queuedById: Record<string, boolean>;
  onQueueForReview: (row: DetectionRow) => void;
  onClearFromReview: (id: string) => void;
  enabledByName: Record<string, boolean>;
  onEnabledChange: (name: string, enabled: boolean) => void;
}) {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>("filter");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [detectionNameFilter, setDetectionNameFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<BreakdownSeverity | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [systemHealthFilter, setSystemHealthFilter] = useState<SystemHealthFilter | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!newDetectionRow) return;
    setDetectionNameFilter(null);
    setSeverityFilter(null);
    setSystemHealthFilter(null);
    setShowOnlyActive(false);
    setSearchQuery("");
  }, [newDetectionRow]);

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    setDetectionRows((rows) => rows.filter((row) => row.id !== deleteTargetId));
    onClearFromReview(deleteTargetId);
    setExpandedIds((current) => {
      const next = new Set(current);
      next.delete(deleteTargetId);
      return next;
    });
    setDeleteTargetId(null);
  };

  const handleCopyDetectionById = (id: string) => {
    const row = detectionRows.find((r) => r.id === id);
    if (row) onCopyDetection(row);
  };

  const handleQueueForReview = (id: string) => {
    if (queuedById[id]) return;
    const row = detectionRows.find((detection) => detection.id === id);
    if (row) onQueueForReview(row);
  };

  const systemHealthCounts = useMemo(() => {
    const inactive = detectionRows.filter((row) => detectionIsInactive(row, enabledByName)).length;
    const needAttention = detectionRows.filter(detectionNeedsAttention).length;
    const runningNormally = detectionRows.filter((row) => detectionRunsNormally(row, enabledByName)).length;
    return {
      inactive,
      needAttention,
      runningNormally,
      total: detectionRows.length,
    };
  }, [detectionRows, enabledByName]);

  const filteredRows = useMemo(
    () =>
      detectionRows.filter((row) => {
        if (detectionNameFilter && row.name !== detectionNameFilter) return false;
        if (severityFilter && !rowMatchesSeverityFilter(row.severity, severityFilter)) return false;
        if (systemHealthFilter === "need-attention" && !detectionNeedsAttention(row)) return false;
        if (systemHealthFilter === "inactive" && !detectionIsInactive(row, enabledByName)) return false;
        if (systemHealthFilter === "running-normally" && !detectionRunsNormally(row, enabledByName)) return false;
        const enabled = getDetectionEnabled(row.name, row.enabled, enabledByName);
        if (showOnlyActive && !enabled) return false;
        if (!detectionMatchesSearch(row, searchQuery, enabled)) return false;
        return true;
      }),
    [detectionRows, detectionNameFilter, severityFilter, systemHealthFilter, searchQuery, enabledByName, showOnlyActive],
  );

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

  const handleSegmentClick = (label: string) => {
    setDetectionNameFilter((current) => (current === label ? null : label));
    setSystemHealthFilter(null);
  };

  const handleSeverityClick = (severity: BreakdownSeverity) => {
    setSeverityFilter((current) => (current === severity ? null : severity));
    setSystemHealthFilter(null);
  };

  const handleSystemHealthFilterClick = (filter: SystemHealthFilter) => {
    setSystemHealthFilter((current) => (current === filter ? null : filter));
    setDetectionNameFilter(null);
    setSeverityFilter(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
      <div className="grid shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <SystemHealthCard
          runningNormallyCount={systemHealthCounts.runningNormally}
          totalCount={systemHealthCounts.total}
          needAttentionCount={systemHealthCounts.needAttention}
          inactiveCount={systemHealthCounts.inactive}
          selectedFilter={systemHealthFilter}
          onFilterClick={handleSystemHealthFilterClick}
        />
        <TopFindingsCard selectedLabel={detectionNameFilter} onSegmentClick={handleSegmentClick} />
        <SeverityBreakdownCard selectedSeverity={severityFilter} onSeverityClick={handleSeverityClick} />
      </div>
      </div>
      <DetectionsTable
        rows={filteredRows}
        tableTool={tableTool}
        onTableToolChange={setTableTool}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onToggleExpandAll={toggleExpandAll}
        onEditDetection={(id) => {
          const row = detectionRows.find((r) => r.id === id);
          if (row && row.source !== "library") onEditDetection(row);
        }}
        onViewLibraryDetection={(id) => {
          const row = detectionRows.find((r) => r.id === id);
          if (row?.source === "library") onViewLibraryDetection(row);
        }}
        onCopyDetection={handleCopyDetectionById}
        onDeleteDetection={(id) => {
          const row = detectionRows.find((r) => r.id === id);
          if (row?.source === "library") return;
          setDeleteTargetId(id);
        }}
        onRunNow={onRunNow}
        onQueueForReview={handleQueueForReview}
        onClearFromReview={onClearFromReview}
        queuedById={queuedById}
        enabledByName={enabledByName}
        onEnabledChange={onEnabledChange}
        detectionNameFilter={detectionNameFilter}
        severityFilter={severityFilter}
        systemHealthFilter={systemHealthFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        showOnlyActive={showOnlyActive}
        onShowOnlyActiveChange={setShowOnlyActive}
        totalCount={detectionRows.length}
        onClearFilters={() => {
          setDetectionNameFilter(null);
          setSeverityFilter(null);
          setSystemHealthFilter(null);
          setShowOnlyActive(false);
          setSearchQuery("");
        }}
        scrollToRowId={newDetectionRow?.id}
      />
      <DeleteConfirmationModal
        open={deleteTargetId != null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export function FederatedDetectionHubDashboard({
  onSlideOverChange,
}: {
  onSlideOverChange: (state: ContentAreaSlideOverState | null) => void;
}) {
  const [activeTab, setActiveTab] = useState<HubTab>("Manage Detections");
  const [createDetectionOpen, setCreateDetectionOpen] = useState(false);
  const createDetectionOpenRef = useRef(createDetectionOpen);
  createDetectionOpenRef.current = createDetectionOpen;
  const [editDetectionRow, setEditDetectionRow] = useState<DetectionRow | null>(null);
  const [slideOverMode, setSlideOverMode] = useState<"create" | "edit" | "copy" | "view">("create");
  const [runningDetectionName, setRunningDetectionName] = useState<string | null>(null);
  const [queuedRows, setQueuedRows] = useState<QueuedDetectionRow[]>(() => [...INITIAL_QUEUED_DETECTION_ROWS]);
  const [queuedById, setQueuedById] = useState<Record<string, boolean>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const libraryCopySaveRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    detectionRows,
    setDetectionRows,
    newDetectionRow,
    updatedDetectionRow,
    setUpdatedDetectionRow,
    enabledByName,
    setEnabledByName,
    registerCreatedDetection,
  } = useDetectionHub();

  const handleEnabledChange = useCallback((name: string, enabled: boolean) => {
    setEnabledByName((prev) => ({
      ...prev,
      [detectionEnabledKey(name)]: enabled,
    }));
  }, []);

  const handleChildSlideOverChange = useCallback(
    (state: ContentAreaSlideOverState | null) => {
      if (!createDetectionOpenRef.current) {
        onSlideOverChange(state);
      }
    },
    [onSlideOverChange],
  );

  const handleCloseCreateDetection = useCallback(() => {
    setCreateDetectionOpen(false);
    setEditDetectionRow(null);
    setSlideOverMode("create");
    libraryCopySaveRef.current = false;
  }, []);

  const handleEditDetection = useCallback((row: DetectionRow) => {
    setSlideOverMode("edit");
    setEditDetectionRow(row);
    setCreateDetectionOpen(true);
  }, []);

  const handleViewLibraryDetection = useCallback((row: DetectionRow) => {
    setSlideOverMode("view");
    setEditDetectionRow(row);
    setCreateDetectionOpen(true);
  }, []);

  const handleViewLibraryRow = useCallback(
    (row: LibraryDetectionRow) => {
      handleViewLibraryDetection(libraryDetectionToViewRow(row, enabledByName));
    },
    [handleViewLibraryDetection, enabledByName],
  );

  const handleCopyFromView = useCallback(() => {
    if (!editDetectionRow) return;
    if (editDetectionRow.source === "library" || editDetectionRow.id.startsWith("lib-")) {
      libraryCopySaveRef.current = true;
    }
    setSlideOverMode("copy");
  }, [editDetectionRow]);

  const handleCopyDetection = useCallback((row: DetectionRow) => {
    setSlideOverMode("copy");
    setEditDetectionRow(row);
    setCreateDetectionOpen(true);
  }, []);

  const handleCopyLibraryDetection = useCallback((row: LibraryDetectionRow) => {
    libraryCopySaveRef.current = true;
    handleCopyDetection({
      ...libraryDetectionToManagedRow(row),
      enabled: getDetectionEnabled(row.name, row.enabled, enabledByName),
    });
  }, [handleCopyDetection, enabledByName]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const handleRunNow = useCallback((name: string) => {
    setRunningDetectionName(name);
    setTimeout(() => setRunningDetectionName(null), 2500);
  }, []);

  const handleQueueDetection = useCallback((row: DetectionRow) => {
    const enabled = getDetectionEnabled(row.name, row.enabled, enabledByName);
    const rowWithEnabled = { ...row, enabled };
    setQueuedById((prev) => ({ ...prev, [row.id]: true }));
    setQueuedRows((prev) => {
      const existing = prev.find((queued) => queued.id === row.id);
      if (existing) {
        return prev.map((queued) =>
          queued.id === row.id
            ? detectionRowToQueuedRow(rowWithEnabled, existing.queuedBy, existing.queuedDate)
            : queued,
        );
      }
      return [detectionRowToQueuedRow(rowWithEnabled), ...prev];
    });
  }, [enabledByName]);

  const handleClearFromReview = useCallback((id: string) => {
    setQueuedById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setQueuedRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  useEffect(() => {
    if (!updatedDetectionRow) return;
    setQueuedRows((rows) =>
      rows.map((row) =>
        row.id === updatedDetectionRow.id
          ? detectionRowToQueuedRow(updatedDetectionRow, row.queuedBy, row.queuedDate)
          : row,
      ),
    );
  }, [updatedDetectionRow]);

  const handleDetectionSaved = useCallback((payload: NewDetectionPayload) => {
    const savedName = payload.name.trim() || "Untitled Detection";
    setEnabledByName((prev) => ({
      ...prev,
      [detectionEnabledKey(savedName)]: payload.enabled,
    }));

    if (payload.id) {
      const existingRow =
        editDetectionRow?.id === payload.id
          ? editDetectionRow
          : detectionRows.find((row) => row.id === payload.id);
      const updatedRow: DetectionRow = {
        ...(existingRow ?? { lastRun: "—", findings: "none" as const, enabled: payload.enabled }),
        id: payload.id,
        name: payload.name,
        description: payload.description,
        enabled: payload.enabled,
        severity: payload.severity,
        recurrence: payload.recurrence,
      };
      setDetectionRows((rows) => rows.map((row) => (row.id === payload.id ? updatedRow : row)));
      setUpdatedDetectionRow(updatedRow);
    } else {
      registerCreatedDetection(payload);
      setActiveTab("Manage Detections");
      if (libraryCopySaveRef.current) {
        setSnackbarMessage(`"${savedName}" has been added to Manage Detections.`);
        setSnackbarOpen(true);
        libraryCopySaveRef.current = false;
      }
    }
    setCreateDetectionOpen(false);
    setEditDetectionRow(null);
    setSlideOverMode("create");
  }, [detectionRows, editDetectionRow, registerCreatedDetection, setDetectionRows, setEnabledByName, setUpdatedDetectionRow]);

  useEffect(() => {
    const state = location.state as FederatedDetectionHubLocationState | null;
    if (state?.focusManageDetections) {
      setActiveTab("Manage Detections");
      navigate(location.pathname, { replace: true, state: null });
      return;
    }
    if (!state?.openCreateDetection) return;
    setSlideOverMode("create");
    setEditDetectionRow(null);
    setCreateDetectionOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const previousActiveTabRef = useRef<HubTab>(activeTab);

  useEffect(() => {
    if (previousActiveTabRef.current === activeTab) return;
    previousActiveTabRef.current = activeTab;
    onSlideOverChange(null);
    setCreateDetectionOpen(false);
  }, [activeTab, onSlideOverChange]);

  return (
    <TooltipProvider>
    <>
      <PageSlideOver
        open={createDetectionOpen}
        onClose={handleCloseCreateDetection}
        ariaLabel={slideOverMode === "view" ? "View Detection" : "Create New Detection"}
        panelClassName={FORM_CONTENT_SLIDE_OVER_PANEL_CLASS}
      >
        <CreateDetectionSlideOver
          key={
            slideOverMode === "copy"
              ? `copy-${editDetectionRow?.id ?? ""}`
              : slideOverMode === "view"
                ? `view-${editDetectionRow?.id ?? ""}`
                : (editDetectionRow?.id ?? "new")
          }
          onClose={handleCloseCreateDetection}
          onSave={handleDetectionSaved}
          mode={slideOverMode === "copy" ? "copy" : slideOverMode === "view" ? "view" : undefined}
          onCopy={handleCopyFromView}
          editValues={editDetectionRow ? {
            id: editDetectionRow.id,
            name: editDetectionRow.name,
            description: editDetectionRow.description,
            severity: editDetectionRow.severity,
            enabled: editDetectionRow.enabled,
            recurrence: editDetectionRow.recurrence,
            lastRun: editDetectionRow.lastRun,
            connectorsActive: editDetectionRow.connectorsActive,
            connectorsTotal: editDetectionRow.connectorsTotal,
          } : undefined}
        />
      </PageSlideOver>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as HubTab)}
        className="flex flex-col"
      >
        <div className="sticky top-0 z-20 flex shrink-0 items-end justify-between gap-4 bg-surface-page px-6 pt-4">
        <TabsList
          variant="line"
          className="h-auto w-auto gap-6 rounded-none bg-transparent p-0"
          aria-label="Detection hub sections"
        >
          {HUB_TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="h-auto flex-none rounded-none border-0 px-0 pb-3 text-sm font-semibold text-text-tertiary transition-colors hover:text-text-secondary [&::after]:hidden before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:bg-transparent before:transition-colors data-active:!bg-transparent data-active:before:bg-interactive-active data-active:text-text-primary data-active:shadow-none"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          type="button"
          variant="secondary-outline"
          className="mb-3 h-8 shrink-0 ring-offset-surface-page"
          onClick={() => {
            setSlideOverMode("create");
            setCreateDetectionOpen(true);
          }}
        >
          <Plus size={12} strokeWidth={1.5} className="size-3 shrink-0 text-current" aria-hidden />
          Create New Detection
        </Button>
      </div>

      <TabsContent
        value="Manage Detections"
        className="mt-0 px-6 pt-2 pb-4 sm:pt-3 sm:pb-5"
      >
        <ManageDetectionsContent
          detectionRows={detectionRows}
          setDetectionRows={setDetectionRows}
          newDetectionRow={newDetectionRow}
          onEditDetection={handleEditDetection}
          onViewLibraryDetection={handleViewLibraryDetection}
          onCopyDetection={handleCopyDetection}
          onRunNow={handleRunNow}
          queuedById={queuedById}
          onQueueForReview={handleQueueDetection}
          onClearFromReview={handleClearFromReview}
          enabledByName={enabledByName}
          onEnabledChange={handleEnabledChange}
        />
      </TabsContent>
      <TabsContent
        value="Detection Library"
        className="mt-0 px-6 pt-2 pb-4 sm:pt-3 sm:pb-5"
      >
        <DetectionLibraryContent
          onCopyDetection={handleCopyLibraryDetection}
          onViewDetection={handleViewLibraryRow}
          enabledByName={enabledByName}
          onEnabledChange={handleEnabledChange}
        />
      </TabsContent>
      <TabsContent
        value="Queued For Review"
        className="mt-0 px-6 pt-2 pb-4 sm:pt-3 sm:pb-5"
      >
        <QueuedForReviewContent
          onSlideOverChange={handleChildSlideOverChange}
          onRunNow={handleRunNow}
          queuedRows={queuedRows}
          onClearFromReview={handleClearFromReview}
          enabledByName={enabledByName}
          onEnabledChange={handleEnabledChange}
          onCopyDetection={(values) => handleCopyDetection({
            id: `queued-${Date.now()}`,
            lastRun: "—",
            recurrence: "—",
            findings: "none" as const,
            ...values,
          })}
        />
      </TabsContent>
      <TabsContent
        value="Detection History"
        className="mt-0 px-6 pt-2 pb-4 sm:pt-3 sm:pb-5"
      >
        <DetectionHistoryContent />
      </TabsContent>
    </Tabs>

    {runningDetectionName ? (
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2.5 rounded-lg bg-surface-modal px-4 py-3 shadow-lg ring-1 ring-border-rule">
        <svg
          className="h-4 w-4 shrink-0 animate-spin text-interactive-active"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="whitespace-nowrap text-sm font-semibold text-text-primary">
          Running "{runningDetectionName}"…
        </span>
      </div>
    ) : null}

    <Snackbar open={snackbarOpen} message={snackbarMessage} onClose={handleCloseSnackbar} />
    </>
    </TooltipProvider>
  );
}
