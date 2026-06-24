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
import { Icon } from "../../design-system";
import { useTimeframe, type TimeframeRange } from "../../context/TimeframeContext";
import { useSearch } from "../../context/SearchContext";
import { FilterColumnPanel } from "../ui/FilterColumnPanel";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { compareStrings } from "../ui/useColumnSort";
import { useSortedDataGridPagination } from "../ui/useSortedDataGridPagination";
import { DataGridSection } from "../ui/DataGridSection";
import { Input } from "../ui/Input";
import { DATA_GRID_RESULTS_SEARCH_PLACEHOLDER } from "../ui/dataGridTableStyles";
import { DataGridPaginationFooter } from "../ui/DataGridTableLayout";
import { TruncatedText } from "../ui/TruncatedText";
import { ConnectorTableCell } from "../ui/ConnectorTableCell";
import { useResizableColumns } from "../ui/useResizableColumns";
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
import { Checkbox } from "@/components/shadcn/checkbox";

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

const SELECT_COL_WIDTH = 40;
const COL_DEFAULTS: readonly number[] = [SELECT_COL_WIDTH, 108, 280, 168, 88, 112, 132, 140];
const COL_MINS: readonly number[] = [SELECT_COL_WIDTH, 72, 120, 120, 56, 72, 96, 96];

type SortColumn = "severity" | "title" | "time" | "activity" | "status" | "eventType" | "connector";

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
}: {
  displayRows: FsqlSearchResultRow[];
  getSortProps: ReturnType<typeof useFsqlSearchTableGrid>["getSortProps"];
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
    selectColWidth: SELECT_COL_WIDTH,
    colDefaults: COL_DEFAULTS,
    colMins: COL_MINS,
  });

  const allIds = useMemo(() => displayRows.map((row) => row.id), [displayRows]);
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

  return (
    <div ref={containerRef} className={cx(DATA_GRID_TABLE_SCROLL_CLASS, isResizing && "select-none")}>
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
            <th
              scope="col"
              style={colStyle(0)}
              className="relative h-10 border-r border-datavis-gridlines px-0 py-0 align-middle"
            >
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={someSelected ? "indeterminate" : allSelected}
                  onCheckedChange={(value) => toggleAll(value === true)}
                  aria-label="Select all rows"
                />
              </div>
              {resizeHandle(0)}
            </th>
            {(
              [
                ["Severity", "severity"],
                ["Title", "title"],
                ["Time", "time"],
                ["Activity", "activity"],
                ["Status", "status"],
                ["Event type", "eventType"],
                ["Connector", "connector"],
              ] as const
            ).map(([label, columnId], index) => (
              <th
                key={columnId}
                scope="col"
                style={colStyle(index + 1)}
                className={cx(
                  "relative h-10 px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary",
                  index < 6 && "border-r border-datavis-gridlines",
                )}
              >
                <ColumnHeaderMenu
                  label={label}
                  menuLabel={`${label} column options`}
                  {...getSortProps(columnId)}
                />
                {resizeHandle(index + 1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => {
            const eventType = EVENT_TYPE_ICON[row.eventType];
            return (
              <tr key={row.id} className="h-10 border-b border-datavis-gridlines hover:bg-overlay-subtle">
                <td style={colStyle(0)} className="h-10 px-0 py-0 align-middle">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={(checked) => toggleRow(row.id, checked === true)}
                      aria-label={`Select result ${row.id}`}
                    />
                  </div>
                </td>
                <td style={colStyle(1)} className="h-10 px-2 py-0 align-middle">
                  <span className="inline-flex items-center gap-2">
                    <SeverityTableIcon name="severity-critical" color={SEV_CRITICAL} />
                    <span className="text-sm text-text-secondary">{row.severity}</span>
                  </span>
                </td>
                <td style={colStyle(2)} className="h-10 min-w-0 px-2 py-0 align-middle">
                  <TruncatedText className="text-sm font-semibold text-interactive-active">{row.title}</TruncatedText>
                </td>
                <td style={colStyle(3)} className="h-10 min-w-0 px-2 py-0 align-middle tabular-nums">
                  <TruncatedText className="text-sm text-text-secondary">{row.time}</TruncatedText>
                </td>
                <td style={colStyle(4)} className="h-10 min-w-0 px-2 py-0 align-middle">
                  <TruncatedText className="text-sm text-text-secondary">{row.activity}</TruncatedText>
                </td>
                <td style={colStyle(5)} className="h-10 min-w-0 px-2 py-0 align-middle">
                  <TruncatedText className="text-sm text-text-secondary">{row.status}</TruncatedText>
                </td>
                <td style={colStyle(6)} className="h-10 min-w-0 px-2 py-0 align-middle">
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
                <td style={colStyle(7)} className="h-10 min-w-0 px-2 py-0 align-middle">
                  <ConnectorTableCell name={row.connector} />
                </td>
              </tr>
            );
          })}
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

  const filteredRows = useMemo(
    () => streamingRows.filter((row) => fsqlResultMatchesSearch(row, resultsFilterQuery)),
    [streamingRows, resultsFilterQuery],
  );

  const showTableLoading = timeframeRefreshing;
  const showChartLoading = Boolean(fsqlSearching || searchProgress.isProgressActive);
  const resultsTitle = detectionName ? `Total Results: ${detectionName}` : "Total Results";
  const tableGrid = useFsqlSearchTableGrid(filteredRows, {
    page: resultsPage,
    onPageChange: setResultsPage,
  });

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
                    : `${filteredRows.length} Results`}
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
                <DataGridExportButton />
              </div>
            </>
          }
          filterPanel={
            <FilterColumnPanel
              active={resultsTableTool}
              onFilterClick={() => setResultsTableTool(resultsTableTool === "filter" ? null : "filter")}
              onColumnsClick={() => setResultsTableTool(resultsTableTool === "columns" ? null : "columns")}
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
              <FsqlSearchResultsTable displayRows={tableGrid.displayRows} getSortProps={tableGrid.getSortProps} />
            )
          }
          footer={
            showTableLoading || (filteredRows.length === 0 && searchProgress.isProgressActive) ? null : (
              <DataGridPaginationFooter grid={tableGrid} />
            )
          }
        />
      </div>
      </div>
    </div>
  );
}
