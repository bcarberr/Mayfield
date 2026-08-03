import { useCallback, useMemo, useState } from "react";
import { DATA_GRID_ABOVE_SECTION_CLASS, DATA_GRID_HEADER_ROW_CLASS, DATA_GRID_RESULTS_SEARCH_PLACEHOLDER, DATA_GRID_TABLE_CLASS, DATA_GRID_TABLE_SCROLL_CLASS, DATA_GRID_THEAD_CLASS } from "../ui/dataGridTableStyles";
import { Checkbox, Icon, type SeverityShapeIconName, withCategoricalColors } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { DonutChartPanel } from "../ui/DonutChartPanel";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { eventGridFacetDefinitions } from "../ui/dataGridFacetDefinitions";
import {
  applyDataGridFacetFilters,
  buildDataGridFacets,
  hasDataGridFacetSelections,
  type DataGridFacetSelections,
} from "../ui/dataGridFilterTypes";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { DataGridSearchSelectedActions } from "../ui/DataGridSearchSelectedActions";
import { Snackbar } from "../ui/Snackbar";
import { useDataGridJsonExport } from "../ui/useDataGridJsonExport";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { compareStrings } from "../ui/useColumnSort";
import { useSortedDataGridPagination } from "../ui/useSortedDataGridPagination";
import { DataGridSection } from "../ui/DataGridSection";
import { DataGridPaginationFooter } from "../ui/DataGridTableLayout";
import { REMEDIATION_DATA_GRID_COLUMNS } from "../ui/dataGridColumnCatalog";
import { useDataGridColumnPanel } from "../ui/dataGridColumnTypes";
import {
  dataGridBodyCellClass,
  dataGridHeaderCellClass,
  useDynamicResizableColumns,
} from "../ui/dataGridDynamicTableHelpers";
import { renderDataGridEntityOrEmptyBodyCell } from "../ui/dataGridEntityAttributeCells";
import { TruncatedText } from "../ui/TruncatedText";
import { DataGridTitleLink } from "../ui/DataGridTitleLink";
import { dataGridDetailRowProps } from "../ui/dataGridDetailRowHighlight";
import { ResultsDetailSlideOver, useResultsDetailSlideOver } from "../ui/useResultsDetailSlideOver";
import { useResultsDetailPaginationSync } from "../ui/useResultsDetailPaginationSync";
import { demoTableConnector } from "../connectors/demoTableConnectors";
import { ConnectorTableCell } from "../ui/ConnectorTableCell";
import { useCopilot } from "../../context/CopilotContext";
import { buildTitlesFsqlQuery } from "../../lib/buildEntitiesFsqlQuery";
import { cx, InsightCard, InsightCardHeaderActions } from "./datavisCard";
import {
  ExpandableColumnWidgetLayout,
  ExpandableColumnWidgetShell,
  useExpandableColumnWidgets,
} from "./useExpandableColumnWidgets";
import {
  buildHourlyEventRows,
  ChartZoomHint,
  countByLabel,
  formatAnalyticsRowTime,
  horizontalBarScale,
  parseAnalyticsRowTime,
  rowTimeInTimeframe,
  useFederatedAnalyticsTimeframeZoom,
} from "./federatedAnalyticsZoom";
import { chartFiltersActive, formatChartFilterLabels, toggleChartFilter } from "./chartFilterSet";
import { HorizontalBarPanel } from "./horizontalBarPanel";
import { TimeSeriesAreaChart } from "./timeSeriesAreaChart";
import { SEVERITY_TIMELINE_VIZ_OPTIONS, type SeverityTimelineViz } from "./severityTimelineViz";
import {
  buildSeverityTimelineChart,
  normalizeSeverityFilterIds,
} from "./severityTimelineSeries";
import { CATEGORICAL_WIDGET_VIZ_OPTIONS, type CategoricalWidgetViz } from "./categoricalWidgetViz";

const REMEDIATION_SPIKE_HOUR = 10;
const REMEDIATION_COLUMN_WIDGET_ORDER = ["classes", "severity", "status"] as const;
type RemediationSeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const SEV_BAR: Record<RemediationSeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const SEV_ICONS: Record<RemediationSeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  Informational: "severity-info",
};

const SEVERITY_TIMELINE_STYLES = {
  Informational: { color: SEV_BAR.Informational, icon: SEV_ICONS.Informational },
  Low: { color: SEV_BAR.Low, icon: SEV_ICONS.Low },
  Medium: { color: SEV_BAR.Medium, icon: SEV_ICONS.Medium },
  High: { color: SEV_BAR.High, icon: SEV_ICONS.High },
  Critical: { color: SEV_BAR.Critical, icon: SEV_ICONS.Critical },
} as const;

const SEVERITY_ORDER: Record<RemediationSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};

type ActivityClass =
  | "File Remediation"
  | "Process Remediation"
  | "Network Remediation"
  | "Remediation Activity";

type RemediationEventClass =
  | "File Remediation Activity"
  | "Process Remediation Activity"
  | "Network Remediation Activity"
  | "Remediation Activity";

type RemediationStatus = "Succeeded" | "Failed" | "Pending";

type RemediationRow = {
  id: string;
  severity: RemediationSeverity;
  title: string;
  time: string;
  activity: string;
  eventClass: RemediationEventClass;
  activityClass: ActivityClass;
  entity: string;
  status: RemediationStatus;
  connector: string;
};

const ACTIVITY_CLASS_ORDER = [
  "File Remediation",
  "Process Remediation",
  "Network Remediation",
  "Remediation Activity",
] as const;

const SEVERITY_CHART_ORDER = ["Critical", "High", "Medium", "Low", "Info"] as const;

const STATUS_ORDER = ["Succeeded", "Failed", "Pending"] as const;

const REMEDIATION_ROW_TEMPLATES: RemediationRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "Isolate host failed — endpoint unreachable during response window",
    time: "10:31:02",
    activity: "Isolate",
    eventClass: "Network Remediation Activity",
    activityClass: "Network Remediation",
    entity: "fin-ws-014",
    status: "Failed",
    connector: demoTableConnector(0),
  },
  {
    id: "2",
    severity: "High",
    title: "Quarantine malicious file blocked by policy on shared endpoint",
    time: "09:58:41",
    activity: "Quarantine",
    eventClass: "File Remediation Activity",
    activityClass: "File Remediation",
    entity: "C:\\Users\\Public\\update.exe",
    status: "Succeeded",
    connector: demoTableConnector(1),
  },
  {
    id: "3",
    severity: "High",
    title: "Kill process action completed for suspicious PowerShell child process",
    time: "09:40:12",
    activity: "Kill Process",
    eventClass: "Process Remediation Activity",
    activityClass: "Process Remediation",
    entity: "powershell.exe (PID 8842)",
    status: "Succeeded",
    connector: demoTableConnector(2),
  },
  {
    id: "4",
    severity: "Medium",
    title: "Block outbound connection to known C2 address pending approval",
    time: "08:12:00",
    activity: "Block",
    eventClass: "Network Remediation Activity",
    activityClass: "Network Remediation",
    entity: "203.0.113.44:443",
    status: "Pending",
    connector: demoTableConnector(3),
  },
  {
    id: "5",
    severity: "Low",
    title: "Remediation ticket updated with containment playbook reference",
    time: "22:18:55",
    activity: "Update",
    eventClass: "Remediation Activity",
    activityClass: "Remediation Activity",
    entity: "INC-2024-8841",
    status: "Succeeded",
    connector: demoTableConnector(4),
  },
  {
    id: "6",
    severity: "Informational",
    title: "Automated file delete succeeded on staging share artifact",
    time: "18:00:03",
    activity: "Update",
    eventClass: "File Remediation Activity",
    activityClass: "File Remediation",
    entity: "\\\\file-stg\\quarantine\\drop.zip",
    status: "Succeeded",
    connector: demoTableConnector(5),
  },
  {
    id: "7",
    severity: "Critical",
    title: "Network isolation rollback failed — host still routing externally",
    time: "16:44:19",
    activity: "Isolate",
    eventClass: "Network Remediation Activity",
    activityClass: "Network Remediation",
    entity: "ops-jump-03",
    status: "Failed",
    connector: demoTableConnector(6),
  },
  {
    id: "8",
    severity: "High",
    title: "Process termination queued for unsigned service binary",
    time: "12:01:47",
    activity: "Kill Process",
    eventClass: "Process Remediation Activity",
    activityClass: "Process Remediation",
    entity: "svc-host.exe",
    status: "Pending",
    connector: demoTableConnector(7),
  },
  {
    id: "9",
    severity: "Medium",
    title: "File hash block rule pushed to edge firewall policy set",
    time: "09:33:22",
    activity: "Block",
    eventClass: "File Remediation Activity",
    activityClass: "File Remediation",
    entity: "sha256:9f2c…a11b",
    status: "Succeeded",
    connector: demoTableConnector(8),
  },
  {
    id: "10",
    severity: "Low",
    title: "Remediation workflow marked complete after host compliance check",
    time: "21:15:08",
    activity: "Update",
    eventClass: "Remediation Activity",
    activityClass: "Remediation Activity",
    entity: "hr-laptop-22",
    status: "Succeeded",
    connector: demoTableConnector(9),
  },
];

const REMEDIATION_SECONDARY_SPIKE_ROWS: RemediationRow[] = [
  {
    id: "s1",
    severity: "Critical",
    title: "Auto-isolate failed — compromised host still beaconing to C2",
    time: "21:30:08",
    activity: "Isolate",
    eventClass: "Network Remediation Activity",
    activityClass: "Network Remediation",
    entity: "FIN-WS-014",
    status: "Failed",
    connector: demoTableConnector(0),
  },
  {
    id: "s2",
    severity: "High",
    title: "Emergency block on C2 IP queued pending SOC approval",
    time: "21:30:18",
    activity: "Block",
    eventClass: "Network Remediation Activity",
    activityClass: "Network Remediation",
    entity: "185.220.101.44:443",
    status: "Pending",
    connector: demoTableConnector(1),
  },
  {
    id: "s3",
    severity: "High",
    title: "Kill process action failed on persistent malware parent chain",
    time: "21:30:28",
    activity: "Kill Process",
    eventClass: "Process Remediation Activity",
    activityClass: "Process Remediation",
    entity: "beacon.exe (PID 4412)",
    status: "Failed",
    connector: demoTableConnector(2),
  },
];


function isActivityClass(label: string): label is ActivityClass {
  return (ACTIVITY_CLASS_ORDER as readonly string[]).includes(label);
}

function isRemediationSeverity(label: string): label is RemediationSeverity {
  return label in SEV_BAR;
}

function isRemediationStatus(label: string): label is RemediationStatus {
  return label === "Succeeded" || label === "Failed" || label === "Pending";
}

function severityMatchesFilter(rowSeverity: RemediationSeverity, filter: string): boolean {
  if (filter === "Info") return rowSeverity === "Informational";
  return rowSeverity === filter;
}

function remediationMatchesSearch(row: RemediationRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    row.severity,
    row.title,
    row.time,
    row.activity,
    row.eventClass,
    row.activityClass,
    row.entity,
    row.status,
    row.connector,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

type RemediationSortColumn =
  | "severity"
  | "title"
  | "time"
  | "activity"
  | "eventClass"
  | "entity"
  | "status"
  | "connector";

const REMEDIATION_SORTABLE_COLUMN_LABELS: Record<RemediationSortColumn, string> = {
  severity: "Severity",
  title: "Title",
  time: "Time",
  activity: "Activity",
  status: "Status",
  eventClass: "Event Class",
  entity: "Entity",
  connector: "Connectors",
};

export function useRemediationEventsTableGrid(rows: readonly Parameters<typeof RemediationEventsTable>[0]["displayRows"][number][]) {
  const sortComparators = useMemo(
    (): Record<RemediationSortColumn, (a: RemediationRow, b: RemediationRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      eventClass: (a, b) => compareStrings(a.eventClass, b.eventClass),
      entity: (a, b) => compareStrings(a.entity, b.entity),
      status: (a, b) => compareStrings(a.status, b.status),
      connector: (a, b) => compareStrings(a.connector, b.connector),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators);
}

function RemediationEventsTable({
  displayRows,
  getSortProps,
  tableColumnIds,
  onOpenDetail,
  highlightedRowId,
  selected,
  onSelectedChange,
}: {
  displayRows: RemediationRow[];
  getSortProps: ReturnType<typeof useRemediationEventsTableGrid>["getSortProps"];
  tableColumnIds: readonly string[];
  onOpenDetail: (id: string) => void;
  highlightedRowId?: string | null;
  selected: ReadonlySet<string>;
  onSelectedChange: (next: Set<string>) => void;
}) {
  const {
    containerRef,
    colStyle,
    tableSizeStyle,
    isResizing,
    resizeHandle,
    displayWidths,
  } = useDynamicResizableColumns(tableColumnIds);

  const allIds = useMemo(() => displayRows.map((r) => r.id), [displayRows]);
  const total = allIds.length;
  const selectedOnPage = useMemo(() => allIds.filter((id) => selected.has(id)).length, [allIds, selected]);
  const allSelected = total > 0 && selectedOnPage === total;
  const someSelected = selectedOnPage > 0 && !allSelected;

  const toggleAll = (checked: boolean) => {
    onSelectedChange(checked ? new Set([...selected, ...allIds]) : new Set());
  };

  const toggleRow = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedChange(next);
  };

  const renderHeaderCell = (columnId: string, colIndex: number) => {
    const headerClass = dataGridHeaderCellClass(colIndex, tableColumnIds.length, columnId);

    switch (columnId) {
      case "select":
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={headerClass}>
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
      case "severity":
      case "title":
      case "time":
      case "activity":
      case "status":
      case "eventClass":
      case "entity":
      case "connector": {
        const label = REMEDIATION_SORTABLE_COLUMN_LABELS[columnId];
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={headerClass}>
            <ColumnHeaderMenu label={label} menuLabel={`${label} column options`} {...getSortProps(columnId)} />
            {resizeHandle(colIndex)}
          </th>
        );
      }
      default:
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={headerClass}>
            <span className="block translate-y-px truncate">
              {REMEDIATION_DATA_GRID_COLUMNS.find((col) => col.id === columnId)?.label ?? columnId}
            </span>
            {resizeHandle(colIndex)}
          </th>
        );
    }
  };

  const renderBodyCell = (columnId: string, row: RemediationRow, colIndex: number) => {
    const cellClass = dataGridBodyCellClass(columnId);

    switch (columnId) {
      case "select":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cellClass}>
            <div className="flex items-center justify-center">
              <Checkbox
                checked={selected.has(row.id)}
                onCheckedChange={(c) => toggleRow(row.id, c)}
                aria-label={`Select remediation event ${row.id}`}
              />
            </div>
          </td>
        );
      case "severity":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cellClass}>
            <span className="inline-flex items-center gap-2">
              <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_BAR[row.severity]} />
              <span className="text-sm text-text-secondary">{row.severity}</span>
            </span>
          </td>
        );
      case "title":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <DataGridTitleLink onClick={() => onOpenDetail(row.id)}>{row.title}</DataGridTitleLink>
          </td>
        );
      case "time":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0 tabular-nums")}>
            <TruncatedText className="text-sm text-text-secondary">{row.time}</TruncatedText>
          </td>
        );
      case "activity":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">{row.activity}</TruncatedText>
          </td>
        );
      case "status":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">{row.status}</TruncatedText>
          </td>
        );
      case "eventClass":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0 overflow-hidden")}>
            <span className="flex w-full min-w-0 items-center gap-2">
              <Icon
                name="ocsf-remediation"
                size={16}
                className="size-4 shrink-0 text-datavis-data-pop-teal-20 [&_svg]:!size-4"
                aria-hidden
              />
              <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                {row.eventClass}
              </TruncatedText>
            </span>
          </td>
        );
      case "entity":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">{row.entity}</TruncatedText>
          </td>
        );
      case "connector":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <ConnectorTableCell name={row.connector} />
          </td>
        );
      default:
        return renderDataGridEntityOrEmptyBodyCell({
          columnId,
          rowId: row.id,
          colIndex,
          colStyle,
          className: cellClass,
        });
    }
  };

  return (
    <div
      key={tableColumnIds.join("|")}
      ref={containerRef}
      className={cx(DATA_GRID_TABLE_SCROLL_CLASS, isResizing && "select-none")}
    >
      <table
        className={DATA_GRID_TABLE_CLASS}
        style={tableSizeStyle}
      >
        <caption className="sr-only">Remediation activity events</caption>
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
          {displayRows.map((row) => (
            <tr key={row.id} {...dataGridDetailRowProps(highlightedRowId, row.id)}>
              {tableColumnIds.map((columnId, colIndex) => renderBodyCell(columnId, row, colIndex))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Figma concept — Remediation body for Federated Analytics. */
export function RemediationContent() {
  const { setPendingFsqlSearch } = useCopilot();
  const { timeframe, initialTimeframe, isChartZoomed, handleTimelineBrush, handleChartZoomReset } =
    useFederatedAnalyticsTimeframeZoom("adaptive");
  const [activityClassFilter, setActivityClassFilter] = useState<ActivityClass | null>(null);
  const [severityFilters, setSeverityFilters] = useState<ReadonlySet<string>>(() => new Set());
  const [statusFilter, setStatusFilter] = useState<RemediationStatus | null>(null);
  const [timelineViz, setTimelineViz] = useState<SeverityTimelineViz>("area");
  const [classesViz, setClassesViz] = useState<CategoricalWidgetViz>("bar");
  const [severityViz, setSeverityViz] = useState<CategoricalWidgetViz>("bar");
  const [statusViz, setStatusViz] = useState<CategoricalWidgetViz>("donut");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);
  const [facetSelections, setFacetSelections] = useState<DataGridFacetSelections>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const columnExpand = useExpandableColumnWidgets(REMEDIATION_COLUMN_WIDGET_ORDER);

  const facetDefs = useMemo(
    () =>
      eventGridFacetDefinitions<RemediationRow>({
        severity: (row) => row.severity,
        activity: (row) => row.activity,
        status: (row) => row.status,
        eventClass: (row) => row.eventClass,
        entity: (row) => row.entity,
        connector: (row) => row.connector,
      }),
    [],
  );

  const tableRows = useMemo(
    () =>
      buildHourlyEventRows(
        REMEDIATION_ROW_TEMPLATES,
        initialTimeframe,
        (template, id, eventTime) => ({
          ...template,
          id,
          time: formatAnalyticsRowTime(eventTime),
        }),
        {
          primarySpikeHour: REMEDIATION_SPIKE_HOUR,
          secondarySpikeTemplates: REMEDIATION_SECONDARY_SPIKE_ROWS,
        },
      ),
    [initialTimeframe],
  );

  const timeframeScopedRows = useMemo(
    () => tableRows.filter((row) => rowTimeInTimeframe(row.time, timeframe)),
    [tableRows, timeframe],
  );

  const chartScopedRows = useMemo(() => {
    return timeframeScopedRows.filter((row) => {
      if (activityClassFilter && row.activityClass !== activityClassFilter) return false;
      if (severityFilters.size > 0) {
        if (![...severityFilters].some((f) => severityMatchesFilter(row.severity, f))) return false;
      }
      if (statusFilter && row.status !== statusFilter) return false;
      return true;
    });
  }, [timeframeScopedRows, activityClassFilter, severityFilters, statusFilter]);

  const timelineScopedRows = useMemo(() => {
    return timeframeScopedRows.filter((row) => {
      if (activityClassFilter && row.activityClass !== activityClassFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      return true;
    });
  }, [timeframeScopedRows, activityClassFilter, statusFilter]);

  const facets = useMemo(
    () => buildDataGridFacets(timeframeScopedRows, facetDefs),
    [timeframeScopedRows, facetDefs],
  );

  const activityClassRows = useMemo(
    () => countByLabel(chartScopedRows, ACTIVITY_CLASS_ORDER, (row) => row.activityClass),
    [chartScopedRows],
  );

  const activityClassBarScale = useMemo(
    () => horizontalBarScale(activityClassRows.map((row) => row.value)),
    [activityClassRows],
  );

  const activityClassSegments = useMemo(
    () => withCategoricalColors(activityClassRows),
    [activityClassRows],
  );

  const severityChartRows = useMemo(
    () =>
      countByLabel(chartScopedRows, SEVERITY_CHART_ORDER, (row) =>
        row.severity === "Informational" ? "Info" : row.severity,
      ).map((row) => ({
        ...row,
        color: row.label === "Info" ? SEV_BAR.Informational : SEV_BAR[row.label as RemediationSeverity],
      })),
    [chartScopedRows],
  );

  const severityBarScale = useMemo(
    () => horizontalBarScale(severityChartRows.map((row) => row.value)),
    [severityChartRows],
  );

  const statusSegments = useMemo(
    () =>
      withCategoricalColors(countByLabel(chartScopedRows, STATUS_ORDER, (row) => row.status)),
    [chartScopedRows],
  );

  const statusBarRows = useMemo(
    () => statusSegments.map(({ label, value, color }) => ({ label, value, color })),
    [statusSegments],
  );

  const statusBarScale = useMemo(
    () => horizontalBarScale(statusBarRows.map((row) => row.value)),
    [statusBarRows],
  );

  const filteredRows = useMemo(() => {
    return applyDataGridFacetFilters(chartScopedRows, facetSelections, facetDefs).filter((row) =>
      remediationMatchesSearch(row, searchQuery),
    );
  }, [chartScopedRows, facetSelections, facetDefs, searchQuery]);
  const tableGrid = useRemediationEventsTableGrid(filteredRows);
  const resultsDetail = useResultsDetailSlideOver(filteredRows);
  useResultsDetailPaginationSync({
    activeId: resultsDetail.activeId,
    isOpen: resultsDetail.isOpen,
    rows: filteredRows,
    page: tableGrid.page,
    setPage: tableGrid.setPage,
    pageSize: tableGrid.pageSize,
  });
  const { exportAll, snackbarProps } = useDataGridJsonExport(filteredRows, "remediation-events");
  const { tableColumnIds, filterColumnPanelColumnProps } = useDataGridColumnPanel(
    REMEDIATION_DATA_GRID_COLUMNS,
  );

  const handleSearchSelected = useCallback(() => {
    const selectedRows = filteredRows.filter((row) => selectedIds.has(row.id));
    const query = buildTitlesFsqlQuery(selectedRows.map((row) => row.title));
    if (!query.trim()) return;
    setPendingFsqlSearch({ query, autoExecute: true });
    setSelectedIds(new Set());
  }, [filteredRows, selectedIds, setPendingFsqlSearch]);

  const hasActiveFilters =
    activityClassFilter != null ||
    chartFiltersActive(severityFilters) ||
    statusFilter != null ||
    hasDataGridFacetSelections(facetSelections);

  const handleActivityClassClick = (label: string) => {
    if (!isActivityClass(label)) return;
    setActivityClassFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (label: string) => {
    if (label !== "Info" && !isRemediationSeverity(label)) return;
    setSeverityFilters((current) => toggleChartFilter(current, label));
  };

  const handleChartSeverityClick = (seriesId: string) => {
    if (!isRemediationSeverity(seriesId)) return;
    setSeverityFilters((current) => toggleChartFilter(current, seriesId));
  };

  const handleStatusClick = (label: string) => {
    if (!isRemediationStatus(label)) return;
    setStatusFilter((current) => (current === label ? null : label));
  };

  const eventsPerHourChart = useMemo(
    () =>
      buildSeverityTimelineChart(
        timeframe,
        timelineScopedRows,
        SEVERITY_TIMELINE_STYLES,
        (row) => row.severity,
        (row) => parseAnalyticsRowTime(row.time),
        { primarySpikeHour: REMEDIATION_SPIKE_HOUR, spikeLabel: "spike ~10:30" },
      ),
    [timeframe, timelineScopedRows],
  );

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
      <InsightCard
        title={`Remediation Events ${eventsPerHourChart.titleCadence} By Severity`}
        headerActions={
          <InsightCardHeaderActions
            visualization={{
              value: timelineViz,
              options: SEVERITY_TIMELINE_VIZ_OPTIONS,
              onChange: (id) => setTimelineViz(id as SeverityTimelineViz),
            }}
          />
        }
      >
        <ChartZoomHint unit={eventsPerHourChart.zoomUnit} isChartZoomed={isChartZoomed} onReset={handleChartZoomReset} />
        <TimeSeriesAreaChart
          mode={timelineViz}
          series={eventsPerHourChart.series}
          xLabels={eventsPerHourChart.xLabels}
          xTickIndices={eventsPerHourChart.xTickIndices}
          xTickLabels={eventsPerHourChart.xTickLabels}
          bucketStarts={eventsPerHourChart.buckets.map((bucket) => bucket.start)}
          spikeHighlight={eventsPerHourChart.spikeHighlight}
          yMax={eventsPerHourChart.yMax}
          yTicks={eventsPerHourChart.yTicks}
          ariaLabel="Remediation events per hour by severity"
          selectedSeriesIds={normalizeSeverityFilterIds(severityFilters).filter(isRemediationSeverity)}
          onSeriesClick={handleChartSeverityClick}
          onBrushCommit={(selection) =>
            handleTimelineBrush(selection, eventsPerHourChart.buckets, eventsPerHourChart.durationMs)
          }
        />
      </InsightCard>

      <ExpandableColumnWidgetLayout
        expandedIds={columnExpand.expandedIds}
        collapsedIds={columnExpand.collapsedIds}
        renderWidget={(id, expanded) => {
          const chart =
            id === "classes" ? (
              classesViz === "donut" ? (
                <DonutChartPanel
                  segments={activityClassSegments}
                  total={chartScopedRows.length}
                  centerLabel="actions"
                  selectedLabel={activityClassFilter}
                  onSegmentClick={handleActivityClassClick}
                  ariaLabel="Remediation activity classes"
                />
              ) : (
                <HorizontalBarPanel
                  rows={activityClassRows}
                  selectedLabel={activityClassFilter}
                  onBarClick={handleActivityClassClick}
                  filterAriaLabel={(label) => `Filter remediation events by ${label}`}
                  xMax={activityClassBarScale.xMax}
                  xTicks={activityClassBarScale.xTicks}
                />
              )
            ) : id === "severity" ? (
              severityViz === "donut" ? (
                <DonutChartPanel
                  segments={severityChartRows}
                  total={chartScopedRows.length}
                  centerLabel="actions"
                  selectedLabels={[...severityFilters]}
                  onSegmentClick={handleSeverityClick}
                  ariaLabel="Remediation events by severity"
                />
              ) : (
                <HorizontalBarPanel
                  rows={severityChartRows}
                  selectedLabels={[...severityFilters]}
                  onBarClick={handleSeverityClick}
                  filterAriaLabel={(label) => `Filter remediation events by ${label} severity`}
                  xMax={severityBarScale.xMax}
                  xTicks={severityBarScale.xTicks}
                />
              )
            ) : statusViz === "bar" ? (
              <HorizontalBarPanel
                rows={statusBarRows}
                selectedLabel={statusFilter}
                onBarClick={handleStatusClick}
                filterAriaLabel={(label) => `Filter remediation events by ${label} status`}
                xMax={statusBarScale.xMax}
                xTicks={statusBarScale.xTicks}
              />
            ) : (
              <DonutChartPanel
                segments={statusSegments}
                total={chartScopedRows.length}
                centerLabel="actions"
                selectedLabel={statusFilter}
                onSegmentClick={handleStatusClick}
                ariaLabel="Remediation status breakdown"
              />
            );
          const title =
            id === "classes"
              ? "Remediation Activity Classes"
              : id === "severity"
                ? "Severity ID"
                : "Remediation Status";
          const visualization =
            id === "classes"
              ? {
                  value: classesViz,
                  options: CATEGORICAL_WIDGET_VIZ_OPTIONS,
                  onChange: (next: string) => setClassesViz(next as CategoricalWidgetViz),
                }
              : id === "severity"
                ? {
                    value: severityViz,
                    options: CATEGORICAL_WIDGET_VIZ_OPTIONS,
                    onChange: (next: string) => setSeverityViz(next as CategoricalWidgetViz),
                  }
                : {
                    value: statusViz,
                    options: CATEGORICAL_WIDGET_VIZ_OPTIONS,
                    onChange: (next: string) => setStatusViz(next as CategoricalWidgetViz),
                  };
          return (
            <ExpandableColumnWidgetShell id={id} expanded={expanded} api={columnExpand}>
              <InsightCard
                title={title}
                fillHeight
                headerActions={
                  <InsightCardHeaderActions
                    expand={{ expanded, onToggle: () => columnExpand.toggle(id) }}
                    visualization={visualization}
                  />
                }
              >
                {chart}
              </InsightCard>
            </ExpandableColumnWidgetShell>
          );
        }}
      />
      </div>

      <DataGridSection
        header={
          <>
            <h2 className="text-base-semibold text-text-primary">Remediation Activity Events</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <p className="shrink-0 text-base-small text-text-secondary">
                  {filteredRows.length} of {timeframeScopedRows.length} Results
                  {activityClassFilter ? ` · ${activityClassFilter}` : ""}
                  {severityFilters.size > 0 ? ` · ${formatChartFilterLabels(severityFilters)}` : ""}
                  {statusFilter ? ` · ${statusFilter}` : ""}
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
                    aria-label="Search remediation activity events"
                  />
                </div>
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
                    onClick={() => {
                      setActivityClassFilter(null);
                      setSeverityFilters(new Set());
                      setStatusFilter(null);
                      setFacetSelections({});
                      setSearchQuery("");
                    }}
                  >
                    <Icon name="action-filter-list" size={14} aria-hidden />
                    Clear all filters
                  </Button>
                ) : null}
                <DataGridExportButton onClick={exportAll} />
              </div>
              {selectedIds.size > 0 ? (
                <DataGridSearchSelectedActions
                  className="!ml-0"
                  onSearch={handleSearchSelected}
                  onClear={() => setSelectedIds(new Set())}
                />
              ) : null}
            </div>
          </>
        }
        filterPanel={
          <FilterColumnPanel
            active={tableTool}
            onFilterClick={() => setTableTool(tableTool === "filter" ? null : "filter")}
            onColumnsClick={() => setTableTool(tableTool === "columns" ? null : "columns")}
            facets={facets}
            selections={facetSelections}
            onSelectionsChange={setFacetSelections}
            {...filterColumnPanelColumnProps}
          />
        }
        table={
          <RemediationEventsTable
            displayRows={tableGrid.displayRows}
            getSortProps={tableGrid.getSortProps}
            tableColumnIds={tableColumnIds}
            onOpenDetail={resultsDetail.open}
            highlightedRowId={resultsDetail.isOpen ? resultsDetail.activeId : null}
            selected={selectedIds}
            onSelectedChange={setSelectedIds}
          />
        }
        footer={<DataGridPaginationFooter grid={tableGrid} />}
      />
      <Snackbar {...snackbarProps} />
      <ResultsDetailSlideOver {...resultsDetail} />
    </div>
  );
}
