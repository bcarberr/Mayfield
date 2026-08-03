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
import { SYSTEM_ACTIVITY_DATA_GRID_COLUMNS } from "../ui/dataGridColumnCatalog";
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
  topCountsByLabel,
  useFederatedAnalyticsTimeframeZoom,
} from "./federatedAnalyticsZoom";
import { chartFiltersActive, formatChartFilterLabels, toggleChartFilter } from "./chartFilterSet";
import { CHART_CATEGORY_FILL, HorizontalBarPanel } from "./horizontalBarPanel";
import { TimeSeriesAreaChart } from "./timeSeriesAreaChart";
import { SEVERITY_TIMELINE_VIZ_OPTIONS, type SeverityTimelineViz } from "./severityTimelineViz";
import { buildSeverityTimelineChart } from "./severityTimelineSeries";
import { CATEGORICAL_WIDGET_VIZ_OPTIONS, type CategoricalWidgetViz } from "./categoricalWidgetViz";

type SystemSeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const SYSTEM_COLUMN_WIDGET_ORDER = ["activity", "severity", "hosts"] as const;

const SEV_BAR: Record<SystemSeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const SEV_ICONS: Record<SystemSeverity, SeverityShapeIconName> = {
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

const SEVERITY_ORDER: Record<SystemSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};


type ActivityClass =
  | "Process"
  | "File system"
  | "Module"
  | "Scheduled job"
  | "Script"
  | "Kernel";

type SystemEventClass =
  | "Process Activity"
  | "File System Activity"
  | "Module Activity"
  | "Scheduled Job Activity"
  | "Script Activity"
  | "Kernel Activity";

type SystemActivityRow = {
  id: string;
  severity: SystemSeverity;
  title: string;
  time: string;
  activity: string;
  eventClass: SystemEventClass;
  activityClass: ActivityClass;
  connector: string;
  host: string;
  process: string;
};

function isActivityClass(label: string): label is ActivityClass {
  return (
    label === "Process" ||
    label === "File system" ||
    label === "Module" ||
    label === "Scheduled job" ||
    label === "Script" ||
    label === "Kernel"
  );
}

function isSystemSeverity(label: string): label is SystemSeverity {
  return label in SEV_BAR;
}

const ACTIVITY_CLASS_ROWS = [
  { label: "Process", value: 812 },
  { label: "File system", value: 664 },
  { label: "Module", value: 410 },
  { label: "Scheduled job", value: 255 },
  { label: "Script", value: 183 },
  { label: "Kernel", value: 78 },
] as const;

const SEVERITY_ROWS = [
  { label: "Critical", value: 52, color: SEV_BAR.Critical },
  { label: "High", value: 214, color: SEV_BAR.High },
  { label: "Medium", value: 498, color: SEV_BAR.Medium },
  { label: "Low", value: 390, color: SEV_BAR.Low },
  { label: "Informational", value: 540, color: SEV_BAR.Informational },
] as const;

const ACTIVITY_CLASS_ORDER = ACTIVITY_CLASS_ROWS.map((row) => row.label);
const SEVERITY_CHART_ORDER = SEVERITY_ROWS.map((row) => row.label);

const SYSTEM_ACTIVITY_ROWS: SystemActivityRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "Encoded PowerShell launched from spawned cmd.exe",
    time: "04:12:08",
    activity: "Launch",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: demoTableConnector(0),
    host: "WIN-DC01",
    process: "powershell.exe",
  },
  {
    id: "2",
    severity: "High",
    title: "Suspicious scheduled job created under SYSTEM context",
    time: "03:58:41",
    activity: "Create",
    eventClass: "Scheduled Job Activity",
    activityClass: "Scheduled job",
    connector: demoTableConnector(1),
    host: "SQL-PROD-02",
    process: "schtasks.exe",
  },
  {
    id: "3",
    severity: "High",
    title: "Unsigned module loaded from user-writable directory",
    time: "03:40:12",
    activity: "Load",
    eventClass: "Module Activity",
    activityClass: "Module",
    connector: demoTableConnector(2),
    host: "JUMP-HOST-01",
    process: "unknown.dll",
  },
  {
    id: "4",
    severity: "Medium",
    title: "Kernel driver service registered with matching persistence key",
    time: "02:12:00",
    activity: "Update",
    eventClass: "Kernel Activity",
    activityClass: "Kernel",
    connector: demoTableConnector(3),
    host: "WEB-EDGE-07",
    process: "services.exe",
  },
  {
    id: "5",
    severity: "Low",
    title: "Temporary script executed from AppData with outbound connection",
    time: "22:18:55",
    activity: "Launch",
    eventClass: "Script Activity",
    activityClass: "Script",
    connector: demoTableConnector(4),
    host: "WIN-DC01",
    process: "wscript.exe",
  },
  {
    id: "6",
    severity: "Informational",
    title: "Process creation auditing enabled on endpoint policy",
    time: "18:00:03",
    activity: "Update",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: demoTableConnector(5),
    host: "WIN-DC01",
    process: "gpupdate.exe",
  },
  {
    id: "7",
    severity: "Critical",
    title: "LSASS memory access attempt from unexpected process",
    time: "16:44:19",
    activity: "Inject",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: demoTableConnector(6),
    host: "SQL-PROD-02",
    process: "mimikatz.exe",
  },
  {
    id: "8",
    severity: "High",
    title: "Executable renamed to resemble system binary in System32",
    time: "12:01:47",
    activity: "Rename",
    eventClass: "File System Activity",
    activityClass: "File system",
    connector: demoTableConnector(7),
    host: "JUMP-HOST-01",
    process: "svchost.exe",
  },
  {
    id: "9",
    severity: "Medium",
    title: "New service installed with auto-start and network binding",
    time: "09:33:22",
    activity: "Create",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: demoTableConnector(8),
    host: "WEB-EDGE-07",
    process: "sc.exe",
  },
  {
    id: "10",
    severity: "Low",
    title: "Script block logging captured obfuscated batch content",
    time: "21:15:08",
    activity: "Launch",
    eventClass: "Script Activity",
    activityClass: "Script",
    connector: demoTableConnector(9),
    host: "WIN-DC01",
    process: "cmd.exe",
  },
];

const SYSTEM_SECONDARY_SPIKE_ROWS: SystemActivityRow[] = [
  {
    id: "s1",
    severity: "Critical",
    title: "LSASS memory access attempt from unsigned remote process",
    time: "21:30:08",
    activity: "Inject",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: demoTableConnector(0),
    host: "FIN-WS-014",
    process: "rundll32.exe",
  },
  {
    id: "s2",
    severity: "Critical",
    title: "Cobalt Strike-like beacon spawned from w3wp.exe parent process",
    time: "21:30:18",
    activity: "Launch",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: demoTableConnector(1),
    host: "WEB-EDGE-07",
    process: "beacon.exe",
  },
  {
    id: "s3",
    severity: "High",
    title: "Remote service created via PsExec pattern from compromised jump host",
    time: "21:30:28",
    activity: "Create",
    eventClass: "Process Activity",
    activityClass: "Process",
    connector: demoTableConnector(2),
    host: "JUMP-HOST-01",
    process: "PSEXESVC.exe",
  },
];

function systemMatchesSearch(row: SystemActivityRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.severity,
    row.title,
    row.time,
    row.activity,
    row.eventClass,
    row.connector,
    row.host,
    row.process,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

type SystemSortColumn =
  | "severity"
  | "title"
  | "time"
  | "activity"
  | "eventClass"
  | "connector"
  | "host"
  | "process";

/** px widths: select, severity, title, time, activity, class, host, process, connector */
const SYSTEM_SORTABLE_COLUMN_LABELS: Record<SystemSortColumn, string> = {
  severity: "Severity",
  title: "Title",
  time: "Time",
  activity: "Activity",
  eventClass: "Event Class",
  host: "Host",
  process: "Process",
  connector: "Connectors",
};

export function useSystemActivityTableGrid(rows: readonly Parameters<typeof SystemActivityTable>[0]["displayRows"][number][]) {
  const sortComparators = useMemo(
    (): Record<SystemSortColumn, (a: SystemActivityRow, b: SystemActivityRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      eventClass: (a, b) => compareStrings(a.eventClass, b.eventClass),
      connector: (a, b) => compareStrings(a.connector, b.connector),
      host: (a, b) => compareStrings(a.host, b.host),
      process: (a, b) => compareStrings(a.process, b.process),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators);
}

function SystemActivityTable({
  displayRows,
  getSortProps,
  tableColumnIds,
  onOpenDetail,
  highlightedRowId,
  selected,
  onSelectedChange,
}: {
  displayRows: SystemActivityRow[];
  getSortProps: ReturnType<typeof useSystemActivityTableGrid>["getSortProps"];
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
      case "eventClass":
      case "host":
      case "process":
      case "connector": {
        const label = SYSTEM_SORTABLE_COLUMN_LABELS[columnId];
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
              {SYSTEM_ACTIVITY_DATA_GRID_COLUMNS.find((col) => col.id === columnId)?.label ?? columnId}
            </span>
            {resizeHandle(colIndex)}
          </th>
        );
    }
  };

  const renderBodyCell = (columnId: string, row: SystemActivityRow, colIndex: number) => {
    const cellClass = dataGridBodyCellClass(columnId);

    switch (columnId) {
      case "select":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cellClass}>
            <div className="flex items-center justify-center">
              <Checkbox
                checked={selected.has(row.id)}
                onCheckedChange={(c) => toggleRow(row.id, c)}
                aria-label={`Select system activity event ${row.id}`}
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
      case "eventClass":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0 overflow-hidden")}>
            <span className="flex w-full min-w-0 items-center gap-2">
              <Icon
                name="ocsf-system-activity"
                size={16}
                className="size-4 shrink-0 text-datavis-data-peanut-orange [&_svg]:!size-4"
                aria-hidden
              />
              <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                {row.eventClass}
              </TruncatedText>
            </span>
          </td>
        );
      case "host":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">{row.host}</TruncatedText>
          </td>
        );
      case "process":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">{row.process}</TruncatedText>
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
        <caption className="sr-only">System activity events</caption>
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

/** Figma concept — System Activity body for Federated Analytics. */
export function SystemActivityContent() {
  const { setPendingFsqlSearch } = useCopilot();
  const { timeframe, initialTimeframe, isChartZoomed, handleTimelineBrush, handleChartZoomReset } =
    useFederatedAnalyticsTimeframeZoom("adaptive");
  const [activityClassFilter, setActivityClassFilter] = useState<ActivityClass | null>(null);
  const [severityFilters, setSeverityFilters] = useState<ReadonlySet<string>>(() => new Set());
  const [hostFilter, setHostFilter] = useState<string | null>(null);
  const [timelineViz, setTimelineViz] = useState<SeverityTimelineViz>("area");
  const [activityViz, setActivityViz] = useState<CategoricalWidgetViz>("bar");
  const [severityViz, setSeverityViz] = useState<CategoricalWidgetViz>("bar");
  const [hostsViz, setHostsViz] = useState<CategoricalWidgetViz>("bar");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);
  const [facetSelections, setFacetSelections] = useState<DataGridFacetSelections>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const columnExpand = useExpandableColumnWidgets(SYSTEM_COLUMN_WIDGET_ORDER);

  const facetDefs = useMemo(
    () =>
      eventGridFacetDefinitions<SystemActivityRow>({
        severity: (row) => row.severity,
        activity: (row) => row.activity,
        eventClass: (row) => row.eventClass,
        host: (row) => row.host,
        process: (row) => row.process,
        connector: (row) => row.connector,
      }),
    [],
  );

  const tableRows = useMemo(
    () =>
      buildHourlyEventRows(
        SYSTEM_ACTIVITY_ROWS,
        initialTimeframe,
        (template, id, eventTime) => ({
          ...template,
          id,
          time: formatAnalyticsRowTime(eventTime),
        }),
        { secondarySpikeTemplates: SYSTEM_SECONDARY_SPIKE_ROWS },
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
      if (severityFilters.size > 0 && !severityFilters.has(row.severity)) return false;
      if (hostFilter && row.host !== hostFilter) return false;
      return true;
    });
  }, [timeframeScopedRows, activityClassFilter, severityFilters, hostFilter]);

  const timelineScopedRows = useMemo(() => {
    return timeframeScopedRows.filter((row) => {
      if (activityClassFilter && row.activityClass !== activityClassFilter) return false;
      if (hostFilter && row.host !== hostFilter) return false;
      return true;
    });
  }, [timeframeScopedRows, activityClassFilter, hostFilter]);

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
      countByLabel(chartScopedRows, SEVERITY_CHART_ORDER, (row) => row.severity).map((row) => ({
        ...row,
        color: SEV_BAR[row.label as SystemSeverity],
      })),
    [chartScopedRows],
  );

  const severityBarScale = useMemo(
    () => horizontalBarScale(severityChartRows.map((row) => row.value)),
    [severityChartRows],
  );

  const hostChartRows = useMemo(
    () => topCountsByLabel(chartScopedRows, (row) => row.host, 4, CHART_CATEGORY_FILL),
    [chartScopedRows],
  );

  const hostBarScale = useMemo(
    () => horizontalBarScale(hostChartRows.map((row) => row.value)),
    [hostChartRows],
  );

  const hostSegments = useMemo(
    () => withCategoricalColors(hostChartRows.map(({ label, value }) => ({ label, value }))),
    [hostChartRows],
  );

  const filteredRows = useMemo(() => {
    return applyDataGridFacetFilters(chartScopedRows, facetSelections, facetDefs).filter((row) =>
      systemMatchesSearch(row, searchQuery),
    );
  }, [chartScopedRows, facetSelections, facetDefs, searchQuery]);
  const tableGrid = useSystemActivityTableGrid(filteredRows);
  const resultsDetail = useResultsDetailSlideOver(filteredRows);
  useResultsDetailPaginationSync({
    activeId: resultsDetail.activeId,
    isOpen: resultsDetail.isOpen,
    rows: filteredRows,
    page: tableGrid.page,
    setPage: tableGrid.setPage,
    pageSize: tableGrid.pageSize,
  });
  const { exportAll, snackbarProps } = useDataGridJsonExport(filteredRows, "system-activity");
  const { tableColumnIds, filterColumnPanelColumnProps } = useDataGridColumnPanel(
    SYSTEM_ACTIVITY_DATA_GRID_COLUMNS,
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
    hostFilter != null ||
    hasDataGridFacetSelections(facetSelections);

  const handleActivityClassClick = (label: string) => {
    if (!isActivityClass(label)) return;
    setActivityClassFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (label: string) => {
    if (!isSystemSeverity(label)) return;
    setSeverityFilters((current) => toggleChartFilter(current, label));
  };

  const handleHostClick = (label: string) => {
    setHostFilter((current) => (current === label ? null : label));
  };

  const eventsPerHourChart = useMemo(
    () =>
      buildSeverityTimelineChart(
        timeframe,
        timelineScopedRows,
        SEVERITY_TIMELINE_STYLES,
        (row) => row.severity,
        (row) => parseAnalyticsRowTime(row.time),
      ),
    [timeframe, timelineScopedRows],
  );

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
      <InsightCard
        title={`System Events ${eventsPerHourChart.titleCadence} By Severity`}
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
          ariaLabel="System activity events per hour by severity"
          selectedSeriesIds={[...severityFilters]}
          onSeriesClick={handleSeverityClick}
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
            id === "activity" ? (
              activityViz === "donut" ? (
                <DonutChartPanel
                  segments={activityClassSegments}
                  total={chartScopedRows.length}
                  centerLabel="events"
                  selectedLabel={activityClassFilter}
                  onSegmentClick={handleActivityClassClick}
                  ariaLabel="System activity classes"
                />
              ) : (
                <HorizontalBarPanel
                  rows={activityClassRows}
                  selectedLabel={activityClassFilter}
                  onBarClick={handleActivityClassClick}
                  filterAriaLabel={(label) => `Filter system activity by ${label}`}
                  xMax={activityClassBarScale.xMax}
                  xTicks={activityClassBarScale.xTicks}
                />
              )
            ) : id === "severity" ? (
              severityViz === "donut" ? (
                <DonutChartPanel
                  segments={severityChartRows}
                  total={chartScopedRows.length}
                  centerLabel="events"
                  selectedLabels={[...severityFilters]}
                  onSegmentClick={handleSeverityClick}
                  ariaLabel="System activity by severity"
                />
              ) : (
                <HorizontalBarPanel
                  rows={severityChartRows}
                  selectedLabels={[...severityFilters]}
                  onBarClick={handleSeverityClick}
                  filterAriaLabel={(label) => `Filter system activity by ${label} severity`}
                  xMax={severityBarScale.xMax}
                  xTicks={severityBarScale.xTicks}
                />
              )
            ) : hostsViz === "donut" ? (
              <DonutChartPanel
                segments={hostSegments}
                total={hostSegments.reduce((sum, segment) => sum + segment.value, 0)}
                centerLabel="events"
                selectedLabel={hostFilter}
                onSegmentClick={handleHostClick}
                ariaLabel="Top hosts by process launches"
              />
            ) : (
              <HorizontalBarPanel
                rows={hostChartRows}
                selectedLabel={hostFilter}
                onBarClick={handleHostClick}
                filterAriaLabel={(label) => `Filter system activity by host ${label}`}
                xMax={hostBarScale.xMax}
                xTicks={hostBarScale.xTicks}
              />
            );
          const title =
            id === "activity"
              ? "Activity Classes"
              : id === "severity"
                ? "Severity ID"
                : "Top Hosts By Process Launches";
          const visualization =
            id === "activity"
              ? {
                  value: activityViz,
                  options: CATEGORICAL_WIDGET_VIZ_OPTIONS,
                  onChange: (next: string) => setActivityViz(next as CategoricalWidgetViz),
                }
              : id === "severity"
                ? {
                    value: severityViz,
                    options: CATEGORICAL_WIDGET_VIZ_OPTIONS,
                    onChange: (next: string) => setSeverityViz(next as CategoricalWidgetViz),
                  }
                : {
                    value: hostsViz,
                    options: CATEGORICAL_WIDGET_VIZ_OPTIONS,
                    onChange: (next: string) => setHostsViz(next as CategoricalWidgetViz),
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
            <h2 className="text-base-semibold text-text-primary">System Activity Events</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <p className="shrink-0 text-base-small text-text-secondary">
                  {filteredRows.length} of {timeframeScopedRows.length} Results
                  {activityClassFilter ? ` · ${activityClassFilter}` : ""}
                  {severityFilters.size > 0 ? ` · ${formatChartFilterLabels(severityFilters)}` : ""}
                  {hostFilter ? ` · ${hostFilter}` : ""}
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
                    aria-label="Search system activity events"
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
                      setHostFilter(null);
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
          <SystemActivityTable
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
