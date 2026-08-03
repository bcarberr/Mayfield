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
import { APPLICATION_ACTIVITY_DATA_GRID_COLUMNS } from "../ui/dataGridColumnCatalog";
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
import {
  buildSeverityTimelineChart,
  normalizeSeverityFilterIds,
} from "./severityTimelineSeries";
import { CATEGORICAL_WIDGET_VIZ_OPTIONS, type CategoricalWidgetViz } from "./categoricalWidgetViz";

const APPLICATION_SPIKE_HOUR = 10;

const APPLICATION_COLUMN_WIDGET_ORDER = ["classes", "severity", "apps"] as const;

type ApplicationSeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const SEV_BAR: Record<ApplicationSeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const SEV_ICONS: Record<ApplicationSeverity, SeverityShapeIconName> = {
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

const SEVERITY_ORDER: Record<ApplicationSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};


type ActivityClass =
  | "API Activity"
  | "Web Resource Access"
  | "Datastore Activity"
  | "File Hosting"
  | "App Lifecycle"
  | "App Error";

type ApplicationEventClass =
  | "API Activity"
  | "Web Resource Access Activity"
  | "Datastore Activity"
  | "File Hosting Activity"
  | "Application Lifecycle"
  | "Application Error";

type ApplicationActivityRow = {
  id: string;
  severity: ApplicationSeverity;
  title: string;
  time: string;
  activity: string;
  eventClass: ApplicationEventClass;
  activityClass: ActivityClass;
  app: string;
  user: string;
  connector: string;
};

const ACTIVITY_CLASS_ORDER = [
  "API Activity",
  "Web Resource Access",
  "Datastore Activity",
  "File Hosting",
  "App Lifecycle",
  "App Error",
] as const;

const SEVERITY_CHART_ORDER = ["Critical", "High", "Medium", "Low", "Info"] as const;

const APPLICATION_ACTIVITY_ROW_TEMPLATES: ApplicationActivityRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "Bulk export of customer records via API exceeded baseline volume",
    time: "10:22:08",
    activity: "Query",
    eventClass: "Datastore Activity",
    activityClass: "Datastore Activity",
    app: "Snowflake",
    user: "svc-etl",
    connector: demoTableConnector(0),
  },
  {
    id: "2",
    severity: "High",
    title: "External share link created for restricted document library",
    time: "09:58:41",
    activity: "Share",
    eventClass: "File Hosting Activity",
    activityClass: "File Hosting",
    app: "M365",
    user: "k.patel",
    connector: demoTableConnector(1),
  },
  {
    id: "3",
    severity: "High",
    title: "OAuth token refresh storm from unattended integration account",
    time: "09:40:12",
    activity: "Read",
    eventClass: "API Activity",
    activityClass: "API Activity",
    app: "Salesforce",
    user: "integration-bot",
    connector: demoTableConnector(2),
  },
  {
    id: "4",
    severity: "Medium",
    title: "Repository workflow dispatch from new IP geolocation",
    time: "08:12:00",
    activity: "Update",
    eventClass: "Web Resource Access Activity",
    activityClass: "Web Resource Access",
    app: "GitHub",
    user: "devops-ci",
    connector: demoTableConnector(3),
  },
  {
    id: "5",
    severity: "Low",
    title: "Application install event on managed endpoint outside change window",
    time: "22:18:55",
    activity: "Install",
    eventClass: "Application Lifecycle",
    activityClass: "App Lifecycle",
    app: "M365",
    user: "a.nguyen",
    connector: demoTableConnector(4),
  },
  {
    id: "6",
    severity: "Informational",
    title: "Scheduled API health check completed with elevated latency",
    time: "18:00:03",
    activity: "Read",
    eventClass: "API Activity",
    activityClass: "API Activity",
    app: "Salesforce",
    user: "monitor-svc",
    connector: demoTableConnector(5),
  },
  {
    id: "7",
    severity: "Critical",
    title: "Unhandled application error exposed stack trace in API response",
    time: "16:44:19",
    activity: "Error",
    eventClass: "Application Error",
    activityClass: "App Error",
    app: "Snowflake",
    user: "svc-analytics",
    connector: demoTableConnector(6),
  },
  {
    id: "8",
    severity: "High",
    title: "Mass file download from shared drive during off-hours session",
    time: "12:01:47",
    activity: "Read",
    eventClass: "File Hosting Activity",
    activityClass: "File Hosting",
    app: "M365",
    user: "contractor-07",
    connector: demoTableConnector(7),
  },
  {
    id: "9",
    severity: "Medium",
    title: "Datastore query returned unusually wide result set to service account",
    time: "09:33:22",
    activity: "Query",
    eventClass: "Datastore Activity",
    activityClass: "Datastore Activity",
    app: "Snowflake",
    user: "svc-reporting",
    connector: demoTableConnector(8),
  },
  {
    id: "10",
    severity: "Low",
    title: "Web resource access denied for deprecated API version",
    time: "21:15:08",
    activity: "Read",
    eventClass: "Web Resource Access Activity",
    activityClass: "Web Resource Access",
    app: "GitHub",
    user: "release-bot",
    connector: demoTableConnector(9),
  },
];

const APPLICATION_SECONDARY_SPIKE_ROWS: ApplicationActivityRow[] = [
  {
    id: "s1",
    severity: "Critical",
    title: "Mass M365 file download by terminated employee account after hours",
    time: "21:30:08",
    activity: "Read",
    eventClass: "File Hosting Activity",
    activityClass: "File Hosting",
    app: "M365",
    user: "former.contractor",
    connector: demoTableConnector(0),
  },
  {
    id: "s2",
    severity: "Critical",
    title: "Snowflake COPY INTO external stage exported 2.1M rows overnight",
    time: "21:30:18",
    activity: "Query",
    eventClass: "Datastore Activity",
    activityClass: "Datastore Activity",
    app: "Snowflake",
    user: "svc-etl",
    connector: demoTableConnector(1),
  },
  {
    id: "s3",
    severity: "High",
    title: "OAuth consent grant to unverified app from Global Admin account",
    time: "21:30:28",
    activity: "Authorize",
    eventClass: "API Activity",
    activityClass: "API Activity",
    app: "M365",
    user: "global.admin",
    connector: demoTableConnector(2),
  },
];

function isActivityClass(label: string): label is ActivityClass {
  return (ACTIVITY_CLASS_ORDER as readonly string[]).includes(label);
}

function isApplicationSeverity(label: string): label is ApplicationSeverity {
  return label in SEV_BAR;
}

function severityMatchesFilter(rowSeverity: ApplicationSeverity, filter: string): boolean {
  if (filter === "Info") return rowSeverity === "Informational";
  return rowSeverity === filter;
}

function applicationMatchesSearch(row: ApplicationActivityRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    row.severity,
    row.title,
    row.time,
    row.activity,
    row.eventClass,
    row.activityClass,
    row.app,
    row.user,
    row.connector,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

type ApplicationSortColumn =
  | "severity"
  | "title"
  | "time"
  | "activity"
  | "eventClass"
  | "app"
  | "user"
  | "connector";

const APPLICATION_SORTABLE_COLUMN_LABELS: Record<ApplicationSortColumn, string> = {
  severity: "Severity",
  title: "Title",
  time: "Time",
  activity: "Activity",
  eventClass: "Event Class",
  app: "App",
  user: "User",
  connector: "Connectors",
};

export function useApplicationActivityTableGrid(rows: readonly Parameters<typeof ApplicationActivityTable>[0]["displayRows"][number][]) {
  const sortComparators = useMemo(
    (): Record<ApplicationSortColumn, (a: ApplicationActivityRow, b: ApplicationActivityRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      eventClass: (a, b) => compareStrings(a.eventClass, b.eventClass),
      app: (a, b) => compareStrings(a.app, b.app),
      user: (a, b) => compareStrings(a.user, b.user),
      connector: (a, b) => compareStrings(a.connector, b.connector),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators);
}

function ApplicationActivityTable({
  displayRows,
  getSortProps,
  tableColumnIds,
  onOpenDetail,
  highlightedRowId,
  selected,
  onSelectedChange,
}: {
  displayRows: ApplicationActivityRow[];
  getSortProps: ReturnType<typeof useApplicationActivityTableGrid>["getSortProps"];
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
      case "app":
      case "user":
      case "connector": {
        const label = APPLICATION_SORTABLE_COLUMN_LABELS[columnId];
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
              {APPLICATION_ACTIVITY_DATA_GRID_COLUMNS.find((col) => col.id === columnId)?.label ?? columnId}
            </span>
            {resizeHandle(colIndex)}
          </th>
        );
    }
  };

  const renderBodyCell = (columnId: string, row: ApplicationActivityRow, colIndex: number) => {
    const cellClass = dataGridBodyCellClass(columnId);

    switch (columnId) {
      case "select":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cellClass}>
            <div className="flex items-center justify-center">
              <Checkbox
                checked={selected.has(row.id)}
                onCheckedChange={(c) => toggleRow(row.id, c)}
                aria-label={`Select application activity event ${row.id}`}
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
                name="ocsf-application-activity"
                size={16}
                className="size-4 shrink-0 text-datavis-data-rouge-40 [&_svg]:!size-4"
                aria-hidden
              />
              <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                {row.eventClass}
              </TruncatedText>
            </span>
          </td>
        );
      case "app":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">{row.app}</TruncatedText>
          </td>
        );
      case "user":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">{row.user}</TruncatedText>
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
        <caption className="sr-only">Application activity events</caption>
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

/** Figma concept — Application Activity body for Federated Analytics. */
export function ApplicationActivityContent() {
  const { setPendingFsqlSearch } = useCopilot();
  const { timeframe, initialTimeframe, isChartZoomed, handleTimelineBrush, handleChartZoomReset } =
    useFederatedAnalyticsTimeframeZoom("adaptive");
  const [activityClassFilter, setActivityClassFilter] = useState<ActivityClass | null>(null);
  const [severityFilters, setSeverityFilters] = useState<ReadonlySet<string>>(() => new Set());
  const [appFilter, setAppFilter] = useState<string | null>(null);
  const [timelineViz, setTimelineViz] = useState<SeverityTimelineViz>("area");
  const [classesViz, setClassesViz] = useState<CategoricalWidgetViz>("bar");
  const [severityViz, setSeverityViz] = useState<CategoricalWidgetViz>("bar");
  const [appsViz, setAppsViz] = useState<CategoricalWidgetViz>("bar");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);
  const [facetSelections, setFacetSelections] = useState<DataGridFacetSelections>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const columnExpand = useExpandableColumnWidgets(APPLICATION_COLUMN_WIDGET_ORDER);

  const facetDefs = useMemo(
    () =>
      eventGridFacetDefinitions<ApplicationActivityRow>({
        severity: (row) => row.severity,
        activity: (row) => row.activity,
        eventClass: (row) => row.eventClass,
        app: (row) => row.app,
        user: (row) => row.user,
        connector: (row) => row.connector,
      }),
    [],
  );

  const tableRows = useMemo(
    () =>
      buildHourlyEventRows(
        APPLICATION_ACTIVITY_ROW_TEMPLATES,
        initialTimeframe,
        (template, id, eventTime) => ({
          ...template,
          id,
          time: formatAnalyticsRowTime(eventTime),
        }),
        {
          primarySpikeHour: APPLICATION_SPIKE_HOUR,
          secondarySpikeTemplates: APPLICATION_SECONDARY_SPIKE_ROWS,
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
      if (appFilter && row.app !== appFilter) return false;
      return true;
    });
  }, [timeframeScopedRows, activityClassFilter, severityFilters, appFilter]);

  const timelineScopedRows = useMemo(() => {
    return timeframeScopedRows.filter((row) => {
      if (activityClassFilter && row.activityClass !== activityClassFilter) return false;
      if (appFilter && row.app !== appFilter) return false;
      return true;
    });
  }, [timeframeScopedRows, activityClassFilter, appFilter]);

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
        color: row.label === "Info" ? SEV_BAR.Informational : SEV_BAR[row.label as ApplicationSeverity],
      })),
    [chartScopedRows],
  );

  const severityBarScale = useMemo(
    () => horizontalBarScale(severityChartRows.map((row) => row.value)),
    [severityChartRows],
  );

  const topAppRows = useMemo(
    () => topCountsByLabel(chartScopedRows, (row) => row.app, 4, CHART_CATEGORY_FILL),
    [chartScopedRows],
  );

  const topAppBarScale = useMemo(
    () => horizontalBarScale(topAppRows.map((row) => row.value)),
    [topAppRows],
  );

  const topAppSegments = useMemo(
    () => withCategoricalColors(topAppRows.map(({ label, value }) => ({ label, value }))),
    [topAppRows],
  );

  const filteredRows = useMemo(() => {
    return applyDataGridFacetFilters(chartScopedRows, facetSelections, facetDefs).filter((row) =>
      applicationMatchesSearch(row, searchQuery),
    );
  }, [chartScopedRows, facetSelections, facetDefs, searchQuery]);
  const tableGrid = useApplicationActivityTableGrid(filteredRows);
  const resultsDetail = useResultsDetailSlideOver(filteredRows);
  useResultsDetailPaginationSync({
    activeId: resultsDetail.activeId,
    isOpen: resultsDetail.isOpen,
    rows: filteredRows,
    page: tableGrid.page,
    setPage: tableGrid.setPage,
    pageSize: tableGrid.pageSize,
  });
  const { exportAll, snackbarProps } = useDataGridJsonExport(filteredRows, "application-activity");
  const { tableColumnIds, filterColumnPanelColumnProps } = useDataGridColumnPanel(
    APPLICATION_ACTIVITY_DATA_GRID_COLUMNS,
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
    appFilter != null ||
    hasDataGridFacetSelections(facetSelections);

  const handleActivityClassClick = (label: string) => {
    if (!isActivityClass(label)) return;
    setActivityClassFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (label: string) => {
    if (label !== "Info" && !isApplicationSeverity(label)) return;
    setSeverityFilters((current) => toggleChartFilter(current, label));
  };

  const handleChartSeverityClick = (seriesId: string) => {
    if (!isApplicationSeverity(seriesId)) return;
    setSeverityFilters((current) => toggleChartFilter(current, seriesId));
  };

  const handleAppClick = (label: string) => {
    setAppFilter((current) => (current === label ? null : label));
  };

  const eventsPerHourChart = useMemo(
    () =>
      buildSeverityTimelineChart(
        timeframe,
        timelineScopedRows,
        SEVERITY_TIMELINE_STYLES,
        (row) => row.severity,
        (row) => parseAnalyticsRowTime(row.time),
        { primarySpikeHour: APPLICATION_SPIKE_HOUR },
      ),
    [timeframe, timelineScopedRows],
  );

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
      <InsightCard
        title={`Application Activity Events ${eventsPerHourChart.titleCadence} By Severity`}
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
          ariaLabel="Application activity events per hour by severity"
          selectedSeriesIds={normalizeSeverityFilterIds(severityFilters).filter(isApplicationSeverity)}
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
                  centerLabel="events"
                  selectedLabel={activityClassFilter}
                  onSegmentClick={handleActivityClassClick}
                  ariaLabel="Application activity classes"
                />
              ) : (
                <HorizontalBarPanel
                  rows={activityClassRows}
                  selectedLabel={activityClassFilter}
                  onBarClick={handleActivityClassClick}
                  filterAriaLabel={(label) => `Filter application activity by ${label}`}
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
                  ariaLabel="Application activity by severity"
                />
              ) : (
                <HorizontalBarPanel
                  rows={severityChartRows}
                  selectedLabels={[...severityFilters]}
                  onBarClick={handleSeverityClick}
                  filterAriaLabel={(label) => `Filter application activity by ${label} severity`}
                  xMax={severityBarScale.xMax}
                  xTicks={severityBarScale.xTicks}
                />
              )
            ) : appsViz === "donut" ? (
              <DonutChartPanel
                segments={topAppSegments}
                total={topAppSegments.reduce((sum, segment) => sum + segment.value, 0)}
                centerLabel="events"
                selectedLabel={appFilter}
                onSegmentClick={handleAppClick}
                ariaLabel="Top apps by API call volume"
              />
            ) : (
              <HorizontalBarPanel
                rows={topAppRows}
                selectedLabel={appFilter}
                onBarClick={handleAppClick}
                filterAriaLabel={(label) => `Filter application activity by app ${label}`}
                xMax={topAppBarScale.xMax}
                xTicks={topAppBarScale.xTicks}
              />
            );
          const title =
            id === "classes"
              ? "Application Activity Classes"
              : id === "severity"
                ? "Severity ID"
                : "Top Apps By API Call Volume";
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
                    value: appsViz,
                    options: CATEGORICAL_WIDGET_VIZ_OPTIONS,
                    onChange: (next: string) => setAppsViz(next as CategoricalWidgetViz),
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
            <h2 className="text-base-semibold text-text-primary">Application Activity Events</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <p className="shrink-0 text-base-small text-text-secondary">
                  {filteredRows.length} of {timeframeScopedRows.length} Results
                  {activityClassFilter ? ` · ${activityClassFilter}` : ""}
                  {severityFilters.size > 0 ? ` · ${formatChartFilterLabels(severityFilters)}` : ""}
                  {appFilter ? ` · ${appFilter}` : ""}
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
                    aria-label="Search application activity events"
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
                      setAppFilter(null);
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
          <ApplicationActivityTable
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
