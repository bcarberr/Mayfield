import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../design-system";
import { useTimeframe } from "../../context/TimeframeContext";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { compareStrings, useColumnSort } from "../ui/useColumnSort";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { TruncatedText } from "../ui/TruncatedText";
import { useResizableColumns } from "../ui/useResizableColumns";
import { Checkbox } from "../uiCheckbox";
import { cx, DatavisGridlineRule, InsightCard } from "../summary-insights/datavisCard";
import { TimeSeriesBarChart } from "../summary-insights/timeSeriesBarChart";
import {
  buildFsqlResultsTimeline,
  buildFsqlSearchResults,
  fsqlResultMatchesSearch,
  type FsqlSearchResultRow,
} from "./fsqlSearchResultsData";

const RESULTS_PAGE_SIZE = 20;

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

function connectorSwatch(connector: string) {
  if (connector.startsWith("Prod")) return "bg-feedback-negative";
  if (connector.startsWith("AWS")) return "bg-feedback-info";
  if (connector.startsWith("GCP")) return "bg-datavis-data-smalt-green-40";
  if (connector.includes("Athena")) return "bg-interactive-active";
  return "bg-datavis-data-pop-teal-20";
}

const SELECT_COL_WIDTH = 40;
const COL_DEFAULTS: readonly number[] = [SELECT_COL_WIDTH, 108, 280, 168, 88, 112, 132, 140];
const COL_MINS: readonly number[] = [SELECT_COL_WIDTH, 72, 120, 120, 56, 72, 96, 96];

type SortColumn = "severity" | "title" | "time" | "activity" | "status" | "eventType" | "connector";

function FsqlSearchResultsTable({ rows }: { rows: FsqlSearchResultRow[] }) {
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

  const allIds = useMemo(() => rows.map((row) => row.id), [rows]);
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
  const { sortedRows, getSortProps } = useColumnSort(sortComparators);
  const displayRows = sortedRows(rows);

  return (
    <div ref={containerRef} className={cx("min-h-0 w-full min-w-0", isResizing && "select-none")}>
      <table
        className="table-fixed border-collapse text-left text-sm"
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
        <thead>
          <tr className="h-10 border-b border-datavis-gridlines bg-surface-table-row-header">
            <th
              scope="col"
              style={colStyle(0)}
              className="relative h-10 border-r border-datavis-gridlines px-0 py-0 align-middle"
            >
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
                      onCheckedChange={(checked) => toggleRow(row.id, checked)}
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
                  <TruncatedText className="text-sm text-interactive-active">{row.time}</TruncatedText>
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
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span
                      className={cx("size-2.5 shrink-0 rounded-sm", connectorSwatch(row.connector))}
                      aria-hidden
                    />
                    <TruncatedText className="text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                      {row.connector}
                    </TruncatedText>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FsqlSearchResultsView({ isSearching }: { isSearching?: boolean }) {
  const { range: timeframe } = useTimeframe();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);
  const [timeframeRefreshing, setTimeframeRefreshing] = useState(false);
  const isFirstTimeframeRender = useRef(true);

  const resultRows = useMemo(() => buildFsqlSearchResults(timeframe), [timeframe]);
  const timeline = useMemo(() => buildFsqlResultsTimeline(timeframe), [timeframe]);

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
    () => resultRows.filter((row) => fsqlResultMatchesSearch(row, searchQuery)),
    [resultRows, searchQuery],
  );

  useEffect(() => {
    setPage(0);
  }, [searchQuery, timeframe.from.getTime(), timeframe.to.getTime(), filteredRows.length]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / RESULTS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageStart = safePage * RESULTS_PAGE_SIZE;
  const displayedRows = useMemo(
    () => filteredRows.slice(pageStart, pageStart + RESULTS_PAGE_SIZE),
    [filteredRows, pageStart],
  );

  const showLoading = Boolean(isSearching || timeframeRefreshing);
  const showPagination = filteredRows.length > RESULTS_PAGE_SIZE;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-container p-4 sm:p-5">
      <InsightCard title="Total Results">
        <div className="flex min-h-0 flex-col">
          <p className="mb-2 pl-9 text-base-small text-text-tertiary">Hours</p>
          {showLoading ? (
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
            />
          )}
        </div>
      </InsightCard>

      <section className="mt-4 flex min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2)]">
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-[20px] pt-3 sm:pl-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="shrink-0 text-base-small text-text-secondary">
              {displayedRows.length} of {filteredRows.length} Results
              {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            </p>
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search results…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="!bg-datavis-card-bg"
                aria-label="Filter search results"
              />
            </div>
            <DataGridExportButton />
          </div>
        </div>
        <DatavisGridlineRule inset={false} />
        <div className="flex min-h-0 flex-1 overflow-auto bg-datavis-card-bg">
          <FilterColumnPanel
            active={tableTool}
            onFilterClick={() => setTableTool(tableTool === "filter" ? null : "filter")}
            onColumnsClick={() => setTableTool(tableTool === "columns" ? null : "columns")}
          />
          <div className="min-h-0 min-w-0 flex-1 pb-3">
            {showLoading ? (
              <div className="flex h-40 items-center justify-center text-sm text-text-tertiary">Loading results…</div>
            ) : (
              <FsqlSearchResultsTable rows={displayedRows} />
            )}
          </div>
        </div>
        {showPagination && !showLoading ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-datavis-gridlines px-4 py-2.5 sm:px-5">
            <p className="text-base-small text-text-tertiary">
              Page {safePage + 1} of {pageCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-8 px-3"
                disabled={safePage === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-8 px-3"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
