import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DATA_GRID_ABOVE_SECTION_CLASS,
  DATA_GRID_HEADER_ROW_CLASS,
  DATA_GRID_PAGE_SCROLL_INNER_CLASS,
  DATA_GRID_PAGE_SCROLL_OUTER_CLASS,
  DATA_GRID_TABLE_CLASS,
  DATA_GRID_TABLE_SCROLL_CLASS,
  DATA_GRID_THEAD_CLASS,
} from "../ui/dataGridTableStyles";
import { Checkbox, Icon } from "../../design-system";
import { useTimeframe, type TimeframeRange } from "../../context/TimeframeContext";
import { useSearch } from "../../context/SearchContext";
import { FilterColumnPanel } from "../ui/FilterColumnPanel";
import {
  applyDataGridFacetFilters,
  buildDataGridFacets,
  type DataGridFacetSelections,
} from "../ui/dataGridFilterTypes";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { DataGridExportHeaderAction } from "../ui/DataGridExportHeaderAction";
import { DataGridExportSelectionBanner } from "../ui/DataGridExportSelectionBanner";
import { buildExportFilename, downloadJsonExport } from "../ui/exportRowsToJson";
import { Snackbar } from "../ui/Snackbar";
import {
  getDataGridExportSelectionSnapshot,
  resolveExportRows,
  useDataGridExportSelection,
} from "../ui/useDataGridExportSelection";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { compareStrings } from "../ui/useColumnSort";
import { useSortedDataGridPagination } from "../ui/useSortedDataGridPagination";
import { DataGridSection } from "../ui/DataGridSection";
import { Input } from "../ui/Input";
import { DATA_GRID_RESULTS_SEARCH_PLACEHOLDER } from "../ui/dataGridTableStyles";
import { DataGridPaginationFooter } from "../ui/DataGridTableLayout";
import { TruncatedText } from "../ui/TruncatedText";
import { ConnectorTableCell } from "../ui/ConnectorTableCell";
import { FSQL_SEARCH_DATA_GRID_COLUMNS } from "../ui/dataGridColumnCatalog";
import { useDataGridColumnPanel } from "../ui/dataGridColumnTypes";
import {
  dataGridBodyCellClass,
  dataGridHeaderCellClass,
  useDynamicResizableColumns,
} from "../ui/dataGridDynamicTableHelpers";
import { cx, InsightCard } from "../summary-insights/datavisCard";
import { TimeSeriesBarChart } from "../summary-insights/timeSeriesBarChart";
import {
  buildFsqlResultsTimeline,
  buildFsqlSearchResults,
  fsqlResultMatchesSearch,
  type FsqlSearchResultRow,
} from "./fsqlSearchResultsData";
import { timeframeFromBucketSelection } from "../summary-insights/timeframeChartUtils";
import { ChartZoomHint } from "../summary-insights/federatedAnalyticsZoom";
import { FsqlSearchProgressStats } from "./FsqlSearchProgressStats";
import { useFsqlSearchProgress } from "./useFsqlSearchProgress";
import { useConnectorSelectionCounts } from "../connectors/connectorEnabledState";

const SEV_CRITICAL = "#ff604a";

const EVENT_TYPE_ICON: Record<
  FsqlSearchResultRow["eventType"],
  { name: "ocsf-discovery" | "ocsf-findings"; className: string }
> = {
  "OSINT Inventory": {
    name: "ocsf-discovery",
    className: "text-datavis-data-weak-red-30",
  },
  Vulnerability: {
    name: "ocsf-findings",
    className: "text-datavis-data-smalt-green-40",
  },
};

type SortColumn = "severity" | "title" | "time" | "activity" | "status" | "eventType" | "connector";

const SORTABLE_COLUMN_LABELS: Record<SortColumn, string> = {
  severity: "Severity",
  title: "Title",
  time: "Time",
  activity: "Activity",
  status: "Status",
  eventType: "Event type",
  connector: "Connector",
};

export function useFsqlSearchTableGrid(
  rows: FsqlSearchResultRow[],
  paginationConfig?: Parameters<typeof useSortedDataGridPagination<FsqlSearchResultRow, SortColumn>>[2],
) {
  const sortComparators = useMemo(
    (): Record<SortColumn, (a: FsqlSearchResultRow, b: FsqlSearchResultRow) => number> => ({
      severity: (a, b) => a.severity.localeCompare(b.severity),
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      status: (a, b) => compareStrings(a.status, b.status),
      eventType: (a, b) => compareStrings(a.eventType, b.eventType),
      connector: (a, b) => compareStrings(a.connector, b.connector),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators, paginationConfig);
}

function FsqlSearchResultsTable({
  displayRows,
  getSortProps,
  tableColumnIds,
  selectedIds,
  allResultsSelected,
  onToggleRow,
  onTogglePage,
}: {
  displayRows: FsqlSearchResultRow[];
  getSortProps: ReturnType<typeof useFsqlSearchTableGrid>["getSortProps"];
  tableColumnIds: readonly string[];
  selectedIds: Set<string>;
  allResultsSelected: boolean;
  onToggleRow: (id: string, checked: boolean) => void;
  onTogglePage: (pageIds: readonly string[], checked: boolean) => void;
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
  } = useDynamicResizableColumns(tableColumnIds);

  const allIds = useMemo(() => displayRows.map((row) => row.id), [displayRows]);
  const total = allIds.length;
  const selectedOnPage = useMemo(() => allIds.filter((id) => selectedIds.has(id)).length, [allIds, selectedIds]);
  const allSelected = total > 0 && (allResultsSelected || selectedOnPage === total);
  const someSelected = !allResultsSelected && selectedOnPage > 0 && selectedOnPage < total;

  const toggleAll = (checked: boolean) => {
    onTogglePage(allIds, checked);
  };

  const toggleRow = (id: string, checked: boolean) => {
    onToggleRow(id, checked);
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
      case "eventType":
      case "connector": {
        const label = SORTABLE_COLUMN_LABELS[columnId];
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={headerClass}>
            <ColumnHeaderMenu
              label={label}
              menuLabel={`${label} column options`}
              {...getSortProps(columnId)}
            />
            {resizeHandle(colIndex)}
          </th>
        );
      }
      default:
        return (
          <th key={columnId} scope="col" style={colStyle(colIndex)} className={headerClass}>
            <span className="block translate-y-px truncate">
              {FSQL_SEARCH_DATA_GRID_COLUMNS.find((col) => col.id === columnId)?.label ?? columnId}
            </span>
            {resizeHandle(colIndex)}
          </th>
        );
    }
  };

  const renderBodyCell = (columnId: string, row: FsqlSearchResultRow, colIndex: number) => {
    const cellClass = dataGridBodyCellClass(columnId);

    switch (columnId) {
      case "select":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cellClass}>
            <div className="flex items-center justify-center">
              <Checkbox
                checked={selectedIds.has(row.id) || allResultsSelected}
                onCheckedChange={(checked) => toggleRow(row.id, checked)}
                aria-label={`Select result ${row.id}`}
              />
            </div>
          </td>
        );
      case "severity":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cellClass}>
            <span className="inline-flex items-center gap-2">
              <SeverityTableIcon name="severity-critical" color={SEV_CRITICAL} />
              <span className="text-sm text-text-secondary">{row.severity}</span>
            </span>
          </td>
        );
      case "title":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm font-semibold text-interactive-active">{row.title}</TruncatedText>
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
      case "eventType": {
        const eventType = EVENT_TYPE_ICON[row.eventType];
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <span className="inline-flex min-w-0 items-center gap-2">
              <Icon
                name={eventType.name}
                size={16}
                className={cx("size-4 shrink-0 [&_svg]:!size-4", eventType.className)}
                aria-hidden
              />
              <TruncatedText className="text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                {row.eventType}
              </TruncatedText>
            </span>
          </td>
        );
      }
      case "connector":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <ConnectorTableCell name={row.connector} />
          </td>
        );
      default:
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">—</TruncatedText>
          </td>
        );
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
        style={{
          width: tableFillsContainer ? "100%" : baseTotal,
          minWidth: Math.max(minTableWidth, baseTotal),
        }}
      >
        <caption className="sr-only">FSQL search results</caption>
        <colgroup>
          {displayWidths.map((width, index) => (
            <col key={index} style={{ width }} />
          ))}
        </colgroup>
        <thead className={DATA_GRID_THEAD_CLASS}>
          <tr className={DATA_GRID_HEADER_ROW_CLASS}>
            {tableColumnIds.map((columnId, colIndex) => renderHeaderCell(columnId, colIndex))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.id} className="border-b border-datavis-gridlines hover:bg-overlay-subtle">
              {tableColumnIds.map((columnId, colIndex) => renderBodyCell(columnId, row, colIndex))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FsqlSearchResultsView({
  searchInitialTimeframe,
  detectionName,
}: {
  searchInitialTimeframe: TimeframeRange | null;
  detectionName?: string | null;
}) {
  const {
    range: timeframe,
    setRange,
    applyAnalyticsChartZoom,
    isAnalyticsChartZoomed,
    analyticsBaselineRange,
  } = useTimeframe();
  const {
    resultsFilterQuery,
    setResultsFilterQuery,
    resultsTableTool,
    setResultsTableTool,
    resultsPage,
    setResultsPage,
    fsqlSearching,
    searchSessionKey,
    completedSearchSessionKey,
    markSearchSessionComplete,
  } = useSearch();
  const connectorCounts = useConnectorSelectionCounts();
  const [timeframeRefreshing, setTimeframeRefreshing] = useState(false);
  const isFirstTimeframeRender = useRef(true);

  const resultRows = useMemo(() => buildFsqlSearchResults(timeframe), [timeframe]);
  const timeline = useMemo(() => buildFsqlResultsTimeline(timeframe), [timeframe]);
  const progressSearchKey =
    searchSessionKey && completedSearchSessionKey === searchSessionKey ? null : searchSessionKey;
  const searchProgress = useFsqlSearchProgress({
    searchKey: progressSearchKey,
    finalTotalResults: resultRows.length,
    selectedConnectorCount: connectorCounts.selectedCount,
  });
  const streamingRows = useMemo(() => {
    if (!searchProgress.isProgressActive) return resultRows;
    return resultRows.slice(0, searchProgress.displayedTotalResults);
  }, [resultRows, searchProgress.displayedTotalResults, searchProgress.isProgressActive]);

  const handleTimelineBrush = useCallback(
    ({ startIndex, endIndex }: { startIndex: number; endIndex: number }) => {
      const nextRange = timeframeFromBucketSelection(timeframe, timeline.buckets, startIndex, endIndex);
      if (!nextRange) return;
      applyAnalyticsChartZoom(nextRange);
    },
    [timeframe, timeline.buckets, applyAnalyticsChartZoom],
  );

  const handleChartZoomReset = useCallback(() => {
    const baseline = searchInitialTimeframe ?? analyticsBaselineRange;
    setRange({
      from: new Date(baseline.from),
      to: new Date(baseline.to),
    });
  }, [searchInitialTimeframe, analyticsBaselineRange, setRange]);

  useEffect(() => {
    if (!searchSessionKey) return;
    if (completedSearchSessionKey === searchSessionKey) return;
    if (!searchProgress.returningResultsComplete) return;
    markSearchSessionComplete(searchSessionKey);
  }, [
    searchSessionKey,
    completedSearchSessionKey,
    searchProgress.returningResultsComplete,
    markSearchSessionComplete,
  ]);

  useEffect(() => {
    if (isFirstTimeframeRender.current) {
      isFirstTimeframeRender.current = false;
      return;
    }
    setTimeframeRefreshing(true);
    const timer = window.setTimeout(() => setTimeframeRefreshing(false), 350);
    return () => window.clearTimeout(timer);
  }, [timeframe.from.getTime(), timeframe.to.getTime()]);

  const [facetSelections, setFacetSelections] = useState<DataGridFacetSelections>({});

  const facetDefs = useMemo(
    () =>
      [
        { id: "eventType", label: "Event Type", getValue: (row: FsqlSearchResultRow) => row.eventType },
        { id: "status", label: "Status", getValue: (row: FsqlSearchResultRow) => row.status },
        { id: "connector", label: "Connectors", getValue: (row: FsqlSearchResultRow) => row.connector },
        { id: "activity", label: "Activity", getValue: (row: FsqlSearchResultRow) => row.activity },
      ] as const,
    [],
  );

  const facets = useMemo(() => buildDataGridFacets(streamingRows, facetDefs), [streamingRows, facetDefs]);

  const filteredRows = useMemo(() => {
    const facetFiltered = applyDataGridFacetFilters(streamingRows, facetSelections, (row, facetId) => {
      const definition = facetDefs.find((entry) => entry.id === facetId);
      return definition ? definition.getValue(row) : "";
    });
    return facetFiltered.filter((row) => fsqlResultMatchesSearch(row, resultsFilterQuery));
  }, [streamingRows, facetSelections, facetDefs, resultsFilterQuery]);

  const showTableLoading = timeframeRefreshing;
  const showChartLoading = Boolean(fsqlSearching || searchProgress.isProgressActive);
  const resultsTitle = detectionName ? `Total Results: ${detectionName}` : "Total Results";
  const tableGrid = useFsqlSearchTableGrid(filteredRows, {
    page: resultsPage,
    onPageChange: setResultsPage,
  });
  const { tableColumnIds, filterColumnPanelColumnProps } = useDataGridColumnPanel(
    FSQL_SEARCH_DATA_GRID_COLUMNS,
  );
  const exportSelection = useDataGridExportSelection();
  const [exportSnackbarOpen, setExportSnackbarOpen] = useState(false);
  const [exportSnackbarMessage, setExportSnackbarMessage] = useState("");

  const pageRowIds = useMemo(
    () => tableGrid.displayRows.map((row) => row.id),
    [tableGrid.displayRows],
  );
  const exportSnapshot = useMemo(
    () =>
      getDataGridExportSelectionSnapshot(
        exportSelection.selectedIds,
        exportSelection.allResultsSelected,
        pageRowIds,
        filteredRows.length,
        tableGrid.pageCount,
      ),
    [
      exportSelection.selectedIds,
      exportSelection.allResultsSelected,
      pageRowIds,
      filteredRows.length,
      tableGrid.pageCount,
    ],
  );

  const exportSelectionBanner =
    exportSnapshot.showAllResultsBanner ? (
      <DataGridExportSelectionBanner
        variant="all"
        pageCount={pageRowIds.length}
        totalCount={filteredRows.length}
        onSelectAllResults={exportSelection.selectAllResults}
        onClearSelection={exportSelection.clearSelection}
      />
    ) : exportSnapshot.showPageBanner ? (
      <DataGridExportSelectionBanner
        variant="page"
        pageCount={pageRowIds.length}
        totalCount={filteredRows.length}
        onSelectAllResults={exportSelection.selectAllResults}
        onClearSelection={exportSelection.clearSelection}
      />
    ) : null;

  const runExport = useCallback(() => {
    const rows = resolveExportRows(
      filteredRows,
      exportSelection.selectedIds,
      exportSelection.allResultsSelected,
    );
    downloadJsonExport(rows, buildExportFilename("fsql-search-results"));
    setExportSnackbarMessage(`Exported ${rows.length.toLocaleString()} results as JSON`);
    setExportSnackbarOpen(true);
  }, [filteredRows, exportSelection.selectedIds, exportSelection.allResultsSelected]);

  useEffect(() => {
    exportSelection.clearSelection();
  }, [resultsFilterQuery, facetSelections, exportSelection.clearSelection]);

  return (
    <div className={cx(DATA_GRID_PAGE_SCROLL_OUTER_CLASS, "bg-surface-page")}>
      <div className={cx(DATA_GRID_PAGE_SCROLL_INNER_CLASS, "px-6 pb-4 sm:pb-5")}>
      <div className="flex shrink-0 flex-col gap-4 pt-4">
        <FsqlSearchProgressStats progress={searchProgress} />

        <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
          <InsightCard title={resultsTitle}>
          <div className="flex shrink-0 flex-col">
            <ChartZoomHint
              unit="Hours"
              isChartZoomed={isAnalyticsChartZoomed}
              onReset={handleChartZoomReset}
            />
            {showChartLoading ? (
              <div className="flex h-[140px] items-center justify-center text-sm text-text-tertiary">Searching…</div>
            ) : (
              <TimeSeriesBarChart
                values={timeline.values}
                xLabels={timeline.xLabels}
                barColor={timeline.barColor}
                yMax={timeline.yMax}
                yTicks={timeline.yTicks}
                height={140}
                ariaLabel="Total search results per hour"
                bucketStarts={timeline.buckets.map((bucket) => bucket.start)}
                onBrushCommit={handleTimelineBrush}
              />
            )}
          </div>
        </InsightCard>
        </div>

        <DataGridSection
          header={
            <>
              <div className="flex flex-wrap items-center gap-3">
                <p className="shrink-0 text-base-small text-text-secondary">
                  {searchProgress.isProgressActive
                    ? `${searchProgress.displayedTotalResults.toLocaleString()} of ${resultRows.length.toLocaleString()} Results`
                    : tableGrid.pageCount > 1
                      ? `${pageRowIds.length} of ${filteredRows.length.toLocaleString()} Results`
                      : `${filteredRows.length} of ${resultRows.length.toLocaleString()} Results`}
                  {resultsFilterQuery.trim() ? ` · “${resultsFilterQuery.trim()}”` : ""}
                </p>
                <div className="w-[300px] shrink-0">
                  <Input
                    variant="search"
                    placeholder={DATA_GRID_RESULTS_SEARCH_PLACEHOLDER}
                    value={resultsFilterQuery}
                    onChange={(event) => setResultsFilterQuery(event.target.value)}
                    onClear={() => setResultsFilterQuery("")}
                    className="!bg-datavis-card-bg"
                    aria-label="Filter search results"
                  />
                </div>
                <DataGridExportHeaderAction
                  snapshot={exportSnapshot}
                  onExportAll={runExport}
                  onExportSelected={runExport}
                />
              </div>
            </>
          }
          selectionBanner={exportSelectionBanner}
          filterPanel={
            <FilterColumnPanel
              active={resultsTableTool}
              onFilterClick={() => setResultsTableTool(resultsTableTool === "filter" ? null : "filter")}
              onColumnsClick={() => setResultsTableTool(resultsTableTool === "columns" ? null : "columns")}
              facets={facets}
              selections={facetSelections}
              onSelectionsChange={setFacetSelections}
              {...filterColumnPanelColumnProps}
            />
          }
          table={
            showTableLoading ? (
              <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">Loading results…</div>
            ) : filteredRows.length === 0 && searchProgress.isProgressActive ? (
              <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">
                Waiting for connector results…
              </div>
            ) : (
              <FsqlSearchResultsTable
                displayRows={tableGrid.displayRows}
                getSortProps={tableGrid.getSortProps}
                tableColumnIds={tableColumnIds}
                selectedIds={exportSelection.selectedIds}
                allResultsSelected={exportSelection.allResultsSelected}
                onToggleRow={exportSelection.toggleRow}
                onTogglePage={exportSelection.togglePage}
              />
            )
          }
          footer={
            showTableLoading || (filteredRows.length === 0 && searchProgress.isProgressActive) ? null : (
              <DataGridPaginationFooter grid={tableGrid} />
            )
          }
        />
        <Snackbar
          open={exportSnackbarOpen}
          message={exportSnackbarMessage}
          onClose={() => setExportSnackbarOpen(false)}
        />
      </div>
      </div>
    </div>
  );
}
