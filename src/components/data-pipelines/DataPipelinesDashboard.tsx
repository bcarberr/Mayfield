import { Fragment, useMemo, useState } from "react";
import { Checkbox, Icon } from "../../design-system";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { compareNumbers, compareStrings, useColumnSort } from "../ui/useColumnSort";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { TruncatedText } from "../ui/TruncatedText";
import { useResizableColumns } from "../ui/useResizableColumns";
import { DatavisGridlineRule } from "../summary-insights/datavisCard";
import {
  DATA_PIPELINE_ROWS,
  getPipelineSummaryStats,
  pipelineMatchesSearch,
  type DataPipelineRow,
  type PipelineState,
} from "./dataPipelinesData";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type PipelineStatFilter = "active" | "paused";

const PIPELINE_EXPAND_COL_WIDTH = 40;
const PIPELINE_COLUMN_COUNT = 8;

const PIPELINE_COL_DEFAULTS: readonly number[] = [
  PIPELINE_EXPAND_COL_WIDTH,
  280,
  160,
  160,
  120,
  100,
  120,
  56,
];

const PIPELINE_COL_MINS: readonly number[] = [
  PIPELINE_EXPAND_COL_WIDTH,
  180,
  120,
  120,
  96,
  80,
  96,
  48,
];

function PipelineStatCard({
  label,
  value,
  selected = false,
  onClick,
}: {
  label: string;
  value: string | number;
  selected?: boolean;
  onClick?: () => void;
}) {
  const className = cx(
    "rounded-[4px] border bg-datavis-card-bg px-6 py-5 text-left shadow-datavis-card transition-colors",
    onClick
      ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
      : "",
    selected
      ? "border-interactive-active"
      : "border-border-container",
    onClick ? "hover:border-border-rule hover:bg-overlay-subtle" : "",
  );

  const content = (
    <>
      <p
        className={cx(
          "text-xs font-bold uppercase tracking-wide",
          selected ? "text-interactive-active" : "text-text-tertiary",
        )}
      >
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">{value}</p>
    </>
  );

  if (!onClick) {
    return (
      <div className={className} aria-label={label}>
        {content}
      </div>
    );
  }

  return (
    <button type="button" aria-pressed={selected} aria-label={`Filter by ${label}`} className={className} onClick={onClick}>
      {content}
    </button>
  );
}

function buildInitialEventLogState() {
  const initial: Record<string, Record<string, boolean>> = {};
  for (const row of DATA_PIPELINE_ROWS) {
    initial[row.id] = Object.fromEntries(row.eventLogs.map((log) => [log.id, log.enabled]));
  }
  return initial;
}

function PipelineExpandedRow({
  row,
  eventLogEnabled,
  onEventLogToggle,
}: {
  row: DataPipelineRow;
  eventLogEnabled: Record<string, boolean>;
  onEventLogToggle: (logId: string, enabled: boolean) => void;
}) {
  return (
    <div className="space-y-5 px-2 py-1">
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-text-primary">Description</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{row.description}</p>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-text-primary">Event Logs</h3>
        <ul className="mt-3 space-y-2">
          {row.eventLogs.map((log) => (
            <li key={log.id} className="flex items-center gap-2">
              <Checkbox
                checked={eventLogEnabled[log.id] ?? log.enabled}
                onCheckedChange={(checked) => onEventLogToggle(log.id, checked)}
                aria-label={log.label}
              />
              <Icon
                name={log.icon}
                size={16}
                className={cx("size-4 shrink-0 [&_svg]:!size-4", log.iconClassName)}
                aria-hidden
              />
              <span className="text-sm font-semibold text-text-secondary">{log.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PipelineStateBadge({ state }: { state: PipelineState }) {
  if (state === "Paused") {
    return (
      <span className="inline-flex items-center rounded-[3px] bg-[#60502e] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-text-primary">
        Paused
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-[3px] bg-[#1b5845] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-text-primary">
      Active
    </span>
  );
}

type PipelineSortColumn = "name" | "source" | "destination" | "state" | "records" | "lastRun";

function PipelinesTable({
  rows,
  tableTool,
  onTableToolChange,
  expandedIds,
  onToggleExpand,
  onToggleExpandAll,
  statFilterLabel,
  onClearFilters,
  hasActiveFilters,
  eventLogEnabledByPipeline,
  onEventLogToggle,
}: {
  rows: DataPipelineRow[];
  tableTool: FilterColumnPanelTool | null;
  onTableToolChange: (tool: FilterColumnPanelTool | null) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleExpandAll: () => void;
  statFilterLabel: string | null;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  eventLogEnabledByPipeline: Record<string, Record<string, boolean>>;
  onEventLogToggle: (pipelineId: string, logId: string, enabled: boolean) => void;
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
    selectColWidth: PIPELINE_EXPAND_COL_WIDTH,
    colDefaults: PIPELINE_COL_DEFAULTS,
    colMins: PIPELINE_COL_MINS,
    minTableWidth: 980,
  });

  const thClass =
    "relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary";
  const tdClass = "h-10 px-2 py-0 align-middle text-sm text-text-secondary";

  const allExpanded = rows.length > 0 && rows.every((row) => expandedIds.has(row.id));

  const sortComparators = useMemo(
    (): Record<PipelineSortColumn, (a: DataPipelineRow, b: DataPipelineRow) => number> => ({
      name: (a, b) => compareStrings(a.name, b.name),
      source: (a, b) => compareStrings(a.source, b.source),
      destination: (a, b) => compareStrings(a.destination, b.destination),
      state: (a, b) => compareStrings(a.state, b.state),
      records: (a, b) => compareNumbers(a.recordsNumeric, b.recordsNumeric),
      lastRun: (a, b) => compareStrings(a.lastRun, b.lastRun),
    }),
    [],
  );
  const { sortedRows, getSortProps } = useColumnSort(sortComparators);
  const displayRows = sortedRows(rows);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-datavis-card">
      <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-[20px] pt-3 sm:pl-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="shrink-0 text-base-small text-text-secondary">
            {rows.length} of {DATA_PIPELINE_ROWS.length} Results
            {statFilterLabel ? ` · ${statFilterLabel}` : ""}
          </p>
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
            <caption className="sr-only">Security data pipelines</caption>
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
                      aria-label={allExpanded ? "Collapse all pipeline details" : "Expand all pipeline details"}
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
                  <ColumnHeaderMenu label="Pipeline Name" menuLabel="Pipeline Name column options" {...getSortProps("name")} />
                  {resizeHandle(1)}
                </th>
                <th scope="col" style={colStyle(2)} className={thClass}>
                  <ColumnHeaderMenu label="Source" menuLabel="Source column options" {...getSortProps("source")} />
                  {resizeHandle(2)}
                </th>
                <th scope="col" style={colStyle(3)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Destination"
                    menuLabel="Destination column options"
                    {...getSortProps("destination")}
                  />
                  {resizeHandle(3)}
                </th>
                <th scope="col" style={colStyle(4)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Pipeline State"
                    menuLabel="Pipeline State column options"
                    {...getSortProps("state")}
                  />
                  {resizeHandle(4)}
                </th>
                <th scope="col" style={colStyle(5)} className={thClass}>
                  <ColumnHeaderMenu label="Records" menuLabel="Records column options" {...getSortProps("records")} />
                  {resizeHandle(5)}
                </th>
                <th scope="col" style={colStyle(6)} className={thClass}>
                  <ColumnHeaderMenu label="Last Run" menuLabel="Last Run column options" {...getSortProps("lastRun")} />
                  {resizeHandle(6)}
                </th>
                <th scope="col" style={colStyle(7)} className={thClass}>
                  <span className="px-1">Actions</span>
                  {resizeHandle(7)}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => {
                const expanded = expandedIds.has(row.id);
                return (
                  <Fragment key={row.id}>
                    <tr className="h-10 border-b border-datavis-gridlines hover:bg-overlay-subtle">
                      <td style={colStyle(0)} className="h-10 px-0 py-0 align-middle">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            className="p-1 text-text-tertiary hover:text-text-primary"
                            aria-expanded={expanded}
                            aria-label={
                              expanded ? `Collapse details for ${row.name}` : `Expand details for ${row.name}`
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
                        <TruncatedText className="w-full font-semibold text-interactive-active">{row.name}</TruncatedText>
                      </td>
                      <td style={colStyle(2)} className={cx(tdClass, "min-w-0")}>
                        <TruncatedText className="w-full">{row.source}</TruncatedText>
                      </td>
                      <td style={colStyle(3)} className={cx(tdClass, "min-w-0")}>
                        <TruncatedText className="w-full">{row.destination}</TruncatedText>
                      </td>
                      <td style={colStyle(4)} className={tdClass}>
                        <PipelineStateBadge state={row.state} />
                      </td>
                      <td style={colStyle(5)} className={tdClass}>
                        <span className="font-semibold tabular-nums text-text-primary">{row.records}</span>
                      </td>
                      <td style={colStyle(6)} className={tdClass}>
                        {row.lastRun}
                      </td>
                      <td style={colStyle(7)} className="px-0 py-0 align-middle">
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            className="size-8 p-0 text-text-tertiary hover:text-text-primary"
                            aria-label={`Actions for ${row.name}`}
                          >
                            <Icon name="navi-more-vert" size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-datavis-gridlines bg-surface-table-row-header">
                        <td colSpan={PIPELINE_COLUMN_COUNT} className="px-6 py-4 align-top">
                          <PipelineExpandedRow
                            row={row}
                            eventLogEnabled={eventLogEnabledByPipeline[row.id] ?? {}}
                            onEventLogToggle={(logId, enabled) => onEventLogToggle(row.id, logId, enabled)}
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
    </section>
  );
}

export type DataPipelinesDashboardProps = {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

export function DataPipelinesDashboard({ searchQuery, onSearchQueryChange }: DataPipelinesDashboardProps) {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>("filter");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [statFilter, setStatFilter] = useState<PipelineStatFilter | null>(null);

  const [eventLogEnabledByPipeline, setEventLogEnabledByPipeline] = useState(buildInitialEventLogState);

  const summaryStats = useMemo(() => getPipelineSummaryStats(DATA_PIPELINE_ROWS), []);

  const filteredRows = useMemo(() => {
    return DATA_PIPELINE_ROWS.filter((row) => {
      if (statFilter === "active" && row.state !== "Active") return false;
      if (statFilter === "paused" && row.state !== "Paused") return false;
      return pipelineMatchesSearch(row, searchQuery);
    });
  }, [searchQuery, statFilter]);

  const statFilterLabel =
    statFilter === "active" ? "Active" : statFilter === "paused" ? "Paused" : null;

  const hasActiveFilters = searchQuery.trim().length > 0 || statFilter != null;

  const handleStatFilterClick = (filter: PipelineStatFilter) => {
    setStatFilter((current) => (current === filter ? null : filter));
  };

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

  const clearFilters = () => {
    onSearchQueryChange("");
    setStatFilter(null);
  };

  const toggleEventLog = (pipelineId: string, logId: string, enabled: boolean) => {
    setEventLogEnabledByPipeline((current) => ({
      ...current,
      [pipelineId]: {
        ...current[pipelineId],
        [logId]: enabled,
      },
    }));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PipelineStatCard
          label="Total Pipelines"
          value={summaryStats.total}
          selected={statFilter == null && !searchQuery.trim()}
          onClick={() => {
            setStatFilter(null);
            onSearchQueryChange("");
          }}
        />
        <PipelineStatCard
          label="Active Pipelines"
          value={summaryStats.active}
          selected={statFilter === "active"}
          onClick={() => handleStatFilterClick("active")}
        />
        <PipelineStatCard
          label="Paused Pipelines"
          value={summaryStats.paused}
          selected={statFilter === "paused"}
          onClick={() => handleStatFilterClick("paused")}
        />
        <PipelineStatCard label="Highest Number of Records" value={summaryStats.highestRecordsLabel} />
      </div>

      <PipelinesTable
        rows={filteredRows}
        tableTool={tableTool}
        onTableToolChange={setTableTool}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onToggleExpandAll={toggleExpandAll}
        statFilterLabel={statFilterLabel}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        eventLogEnabledByPipeline={eventLogEnabledByPipeline}
        onEventLogToggle={toggleEventLog}
      />
    </div>
  );
}
