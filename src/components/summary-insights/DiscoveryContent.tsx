import { useMemo, useState } from "react";
import { DATA_GRID_ABOVE_SECTION_CLASS, DATA_GRID_HEADER_ROW_CLASS, DATA_GRID_RESULTS_SEARCH_PLACEHOLDER, DATA_GRID_TABLE_CLASS, DATA_GRID_TABLE_SCROLL_CLASS, DATA_GRID_THEAD_CLASS } from "../ui/dataGridTableStyles";
import { Checkbox, Icon, type SeverityShapeIconName, withCategoricalColors } from "../../design-system";
import type { TimeframeRange } from "../../context/TimeframeContext";
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
import { DISCOVERY_DATA_GRID_COLUMNS } from "../ui/dataGridColumnCatalog";
import { useDataGridColumnPanel } from "../ui/dataGridColumnTypes";
import {
  dataGridBodyCellClass,
  dataGridHeaderCellClass,
  useDynamicResizableColumns,
} from "../ui/dataGridDynamicTableHelpers";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { Snackbar } from "../ui/Snackbar";
import { useDataGridJsonExport } from "../ui/useDataGridJsonExport";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { compareStrings } from "../ui/useColumnSort";
import { useSortedDataGridPagination } from "../ui/useSortedDataGridPagination";
import { DataGridSection } from "../ui/DataGridSection";
import { DataGridPaginationFooter } from "../ui/DataGridTableLayout";
import { renderDataGridEntityOrEmptyBodyCell } from "../ui/dataGridEntityAttributeCells";
import { TruncatedText } from "../ui/TruncatedText";
import { DataGridTitleLink } from "../ui/DataGridTitleLink";
import { dataGridDetailRowProps } from "../ui/dataGridDetailRowHighlight";
import { ResultsDetailSlideOver, useResultsDetailSlideOver } from "../ui/useResultsDetailSlideOver";
import { useResultsDetailPaginationSync } from "../ui/useResultsDetailPaginationSync";
import { demoTableConnector } from "../connectors/demoTableConnectors";
import { ConnectorTableCell } from "../ui/ConnectorTableCell";
import {
  buildDailyEventRows,
  ChartZoomHint,
  countByLabel,
  formatAnalyticsRowTime,
  horizontalBarScale,
  rowTimeInTimeframe,
  useFederatedAnalyticsTimeframeZoom,
} from "./federatedAnalyticsZoom";
import { CHART_CATEGORY_FILL, HorizontalBarPanel, TIME_SERIES_BAR_FILL } from "./horizontalBarPanel";
import { cx, InsightCard } from "./datavisCard";
import { TimeSeriesBarChart } from "./timeSeriesBarChart";
import { buildDailyBuckets, type HourBucket } from "./timeframeChartUtils";

type DiscoverySeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const SEV_BAR: Record<DiscoverySeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const SEV_ICONS: Record<DiscoverySeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  Informational: "severity-info",
};

const SEVERITY_ORDER: Record<DiscoverySeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};


type DevicePlatform = "Windows" | "macOS" | "Linux" | "Cloud / SaaS" | "Unknown";

type PatchStatus = "Up to date" | "Missing non-crit" | "Missing critical" | "Unknown";

type DiscoveryEventClass =
  | "Device Inventory Info"
  | "Software Inventory Info"
  | "Cloud Resources Inventory Info"
  | "User Inventory Info";

type DiscoveryRow = {
  id: string;
  severity: DiscoverySeverity;
  title: string;
  time: string;
  eventClass: DiscoveryEventClass;
  asset: string;
  owner: string;
  platform: DevicePlatform;
  patchStatus: PatchStatus;
  connector: string;
};

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type DailyDiscoveryChart = {
  xLabels: string[];
  values: number[];
  spikeIndex: number | null;
  spikeLabel: string;
  yMax: number;
  yTicks: number[];
  buckets: HourBucket[];
};

function buildDailyDiscoveryChart(range: TimeframeRange): DailyDiscoveryChart {
  const buckets = buildDailyBuckets(range);
  const useDate = buckets.length > 7;
  const endDayMs = new Date(range.to);
  endDayMs.setHours(0, 0, 0, 0);

  const xLabels: string[] = [];
  const values: number[] = [];
  let spikeIndex: number | null = null;

  buckets.forEach((bucket, i) => {
    const day = bucket.start;
    if (useDate) {
      xLabels.push(new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(day));
    } else {
      xLabels.push(WEEKDAY_SHORT[day.getDay()]);
    }

    const isSpike = day.getTime() === endDayMs.getTime();
    if (isSpike) spikeIndex = i;
    const base = 12;
    const dow = day.getDay();
    const weekdayMultiplier = dow === 0 || dow === 6 ? 0.7 : 1.0 + (dow === 4 ? 0.2 : 0);
    const value = isSpike ? 38 : Math.max(8, Math.round(base * weekdayMultiplier * (0.9 + (i % 3) * 0.1)));
    values.push(value);
  });

  const peak = Math.max(...values, 10);
  const yMax = Math.ceil(peak / 10) * 10;
  const step = yMax / 4;
  const yTicks = [0, step, step * 2, step * 3, yMax];

  const spikeDayOfWeek = spikeIndex != null ? WEEKDAY_SHORT[endDayMs.getDay()] : "Thu";
  const spikeLabel = `${spikeDayOfWeek} spike: ${values[spikeIndex ?? 0] ?? 38} new cloud resources in us-east-2, no IaC tag`;

  return { xLabels, values, spikeIndex, spikeLabel, yMax, yTicks, buckets };
}

const PLATFORM_ORDER = ["Windows", "macOS", "Linux", "Cloud / SaaS", "Unknown"] as const;
const SEVERITY_CHART_ORDER = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Informational",
] as const satisfies readonly DiscoverySeverity[];
const PATCH_STATUS_ORDER = [
  "Up to date",
  "Missing non-crit",
  "Missing critical",
  "Unknown",
] as const satisfies readonly PatchStatus[];

const DISCOVERY_ROWS: DiscoveryRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "Internet-facing host running EOL OS detected",
    time: "14:22:08",
    eventClass: "Device Inventory Info",
    asset: "edge-vm-19",
    owner: "unassigned",
    platform: "Linux",
    patchStatus: "Missing critical",
    connector: demoTableConnector(0),
  },
  {
    id: "2",
    severity: "High",
    title: "Vulnerable OpenSSL version found on production API host",
    time: "13:05:41",
    eventClass: "Software Inventory Info",
    asset: "api-prod-04",
    owner: "platform-team",
    platform: "Linux",
    patchStatus: "Missing non-crit",
    connector: demoTableConnector(1),
  },
  {
    id: "3",
    severity: "High",
    title: "Unmanaged S3 bucket exposed with public read ACL",
    time: "11:40:12",
    eventClass: "Cloud Resources Inventory Info",
    asset: "s3-bucket-7f2a",
    owner: "j.alvarez",
    platform: "Cloud / SaaS",
    patchStatus: "Unknown",
    connector: demoTableConnector(2),
  },
  {
    id: "4",
    severity: "Medium",
    title: "Stale service account discovered without MFA enrollment",
    time: "09:12:00",
    eventClass: "User Inventory Info",
    asset: "svc-analytics",
    owner: "it-ops",
    platform: "Cloud / SaaS",
    patchStatus: "Up to date",
    connector: demoTableConnector(3),
  },
  {
    id: "5",
    severity: "Medium",
    title: "Workstation missing endpoint protection agent",
    time: "22:18:55",
    eventClass: "Device Inventory Info",
    asset: "ws-finance-12",
    owner: "unassigned",
    platform: "Windows",
    patchStatus: "Missing non-crit",
    connector: demoTableConnector(4),
  },
  {
    id: "6",
    severity: "Low",
    title: "New macOS laptop enrolled outside standard build image",
    time: "18:00:03",
    eventClass: "Device Inventory Info",
    asset: "mbp-design-03",
    owner: "design-team",
    platform: "macOS",
    patchStatus: "Up to date",
    connector: demoTableConnector(5),
  },
  {
    id: "7",
    severity: "Informational",
    title: "Cloud VM tagged with owner and environment metadata",
    time: "16:44:19",
    eventClass: "Cloud Resources Inventory Info",
    asset: "ec2-web-09",
    owner: "platform-team",
    platform: "Cloud / SaaS",
    patchStatus: "Up to date",
    connector: demoTableConnector(6),
  },
  {
    id: "8",
    severity: "Informational",
    title: "Installed package inventory refreshed for jump host",
    time: "12:01:47",
    eventClass: "Software Inventory Info",
    asset: "jump-host-01",
    owner: "it-ops",
    platform: "Windows",
    patchStatus: "Up to date",
    connector: demoTableConnector(7),
  },
  {
    id: "9",
    severity: "High",
    title: "Unknown device observed on corporate VLAN segment",
    time: "09:33:22",
    eventClass: "Device Inventory Info",
    asset: "unknown-iot-02",
    owner: "unassigned",
    platform: "Unknown",
    patchStatus: "Unknown",
    connector: demoTableConnector(8),
  },
  {
    id: "10",
    severity: "Medium",
    title: "Contractor account discovered in privileged AD group",
    time: "21:15:08",
    eventClass: "User Inventory Info",
    asset: "c.morgan",
    owner: "security-team",
    platform: "Windows",
    patchStatus: "Missing critical",
    connector: demoTableConnector(9),
  },
];

function isDevicePlatform(label: string): label is DevicePlatform {
  return (
    label === "Windows" ||
    label === "macOS" ||
    label === "Linux" ||
    label === "Cloud / SaaS" ||
    label === "Unknown"
  );
}

function isDiscoverySeverity(label: string): label is DiscoverySeverity {
  return label in SEV_BAR;
}

function isPatchStatus(label: string): label is PatchStatus {
  return (
    label === "Up to date" ||
    label === "Missing non-crit" ||
    label === "Missing critical" ||
    label === "Unknown"
  );
}

function discoveryMatchesSearch(row: DiscoveryRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.severity,
    row.title,
    row.time,
    row.eventClass,
    row.asset,
    row.owner,
    row.platform,
    row.patchStatus,
    row.connector,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

type DiscoverySortColumn =
  | "severity"
  | "title"
  | "time"
  | "patchStatus"
  | "eventClass"
  | "asset"
  | "owner"
  | "connector";

const SORTABLE_COLUMN_LABELS: Record<DiscoverySortColumn, string> = {
  severity: "Severity",
  title: "Title",
  time: "Time",
  patchStatus: "Patch Compliance",
  eventClass: "Event Class",
  asset: "Asset",
  owner: "Owner",
  connector: "Connectors",
};

export function useDiscoveryEventsTableGrid(rows: readonly Parameters<typeof DiscoveryEventsTable>[0]["displayRows"][number][]) {
  const sortComparators = useMemo(
    (): Record<DiscoverySortColumn, (a: DiscoveryRow, b: DiscoveryRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      patchStatus: (a, b) => compareStrings(a.patchStatus, b.patchStatus),
      eventClass: (a, b) => compareStrings(a.eventClass, b.eventClass),
      asset: (a, b) => compareStrings(a.asset, b.asset),
      owner: (a, b) => compareStrings(a.owner, b.owner),
      connector: (a, b) => compareStrings(a.connector, b.connector),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators);
}

function DiscoveryEventsTable({
  displayRows,
  getSortProps,
  tableColumnIds,
  onOpenDetail,
  highlightedRowId,
}: {
  displayRows: DiscoveryRow[];
  getSortProps: ReturnType<typeof useDiscoveryEventsTableGrid>["getSortProps"];
  tableColumnIds: readonly string[];
  onOpenDetail: (id: string) => void;
  highlightedRowId?: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
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

  const renderHeaderCell = (columnId: string, colIndex: number) => {
    const headerClass = dataGridHeaderCellClass(colIndex, tableColumnIds.length, columnId);

    if (columnId === "select") {
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
    }

    if (columnId in SORTABLE_COLUMN_LABELS) {
      const sortKey = columnId as DiscoverySortColumn;
      const label = SORTABLE_COLUMN_LABELS[sortKey];
      return (
        <th key={columnId} scope="col" style={colStyle(colIndex)} className={headerClass}>
          <ColumnHeaderMenu label={label} menuLabel={`${label} column options`} {...getSortProps(sortKey)} />
          {resizeHandle(colIndex)}
        </th>
      );
    }

    return (
      <th key={columnId} scope="col" style={colStyle(colIndex)} className={headerClass}>
        <span className="block translate-y-px truncate">
          {DISCOVERY_DATA_GRID_COLUMNS.find((col) => col.id === columnId)?.label ?? columnId}
        </span>
        {resizeHandle(colIndex)}
      </th>
    );
  };

  const renderBodyCell = (columnId: string, row: DiscoveryRow, colIndex: number) => {
    const cellClass = dataGridBodyCellClass(columnId);

    switch (columnId) {
      case "select":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cellClass}>
            <div className="flex items-center justify-center">
              <Checkbox
                checked={selected.has(row.id)}
                onCheckedChange={(c) => toggleRow(row.id, c)}
                aria-label={`Select discovery event ${row.id}`}
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
      case "patchStatus":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">{row.patchStatus}</TruncatedText>
          </td>
        );
      case "eventClass":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0 overflow-hidden")}>
            <span className="flex w-full min-w-0 items-center gap-2">
              <Icon
                name="ocsf-discovery"
                size={16}
                className="size-4 shrink-0 text-datavis-data-weak-red-30 [&_svg]:!size-4"
                aria-hidden
              />
              <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                {row.eventClass}
              </TruncatedText>
            </span>
          </td>
        );
      case "asset":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">{row.asset}</TruncatedText>
          </td>
        );
      case "owner":
        return (
          <td key={columnId} style={colStyle(colIndex)} className={cx(cellClass, "min-w-0")}>
            <TruncatedText className="text-sm text-text-secondary">{row.owner}</TruncatedText>
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
        <caption className="sr-only">Discovery events</caption>
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

/** Figma concept — Discovery body for Federated Analytics. */
export function DiscoveryContent() {
  const { timeframe, initialTimeframe, isChartZoomed, handleTimelineBrush, handleChartZoomReset } =
    useFederatedAnalyticsTimeframeZoom("daily");
  const [platformFilter, setPlatformFilter] = useState<DevicePlatform | null>(null);
  const [severityFilter, setSeverityFilter] = useState<DiscoverySeverity | null>(null);
  const [patchFilter, setPatchFilter] = useState<PatchStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);
  const [facetSelections, setFacetSelections] = useState<DataGridFacetSelections>({});
  const { tableColumnIds, filterColumnPanelColumnProps } = useDataGridColumnPanel(DISCOVERY_DATA_GRID_COLUMNS);

  const facetDefs = useMemo(
    () =>
      eventGridFacetDefinitions<DiscoveryRow>({
        severity: (row) => row.severity,
        eventClass: (row) => row.eventClass,
        patchStatus: (row) => row.patchStatus,
        connector: (row) => row.connector,
        asset: (row) => row.asset,
        owner: (row) => row.owner,
      }),
    [],
  );

  const tableRows = useMemo(
    () =>
      buildDailyEventRows(DISCOVERY_ROWS, initialTimeframe, (template, id, eventTime) => ({
        ...template,
        id,
        time: formatAnalyticsRowTime(eventTime),
      })),
    [initialTimeframe],
  );

  const timeframeScopedRows = useMemo(
    () => tableRows.filter((row) => rowTimeInTimeframe(row.time, timeframe)),
    [tableRows, timeframe],
  );

  const facets = useMemo(
    () => buildDataGridFacets(timeframeScopedRows, facetDefs),
    [timeframeScopedRows, facetDefs],
  );

  const platformRows = useMemo(
    () =>
      countByLabel(timeframeScopedRows, PLATFORM_ORDER, (row) => row.platform).map((row) => ({
        ...row,
        color: CHART_CATEGORY_FILL,
      })),
    [timeframeScopedRows],
  );

  const platformBarScale = useMemo(
    () => horizontalBarScale(platformRows.map((row) => row.value)),
    [platformRows],
  );

  const severityChartRows = useMemo(
    () =>
      countByLabel(timeframeScopedRows, SEVERITY_CHART_ORDER, (row) => row.severity).map((row) => ({
        ...row,
        color: SEV_BAR[row.label as DiscoverySeverity],
      })),
    [timeframeScopedRows],
  );

  const severityBarScale = useMemo(
    () => horizontalBarScale(severityChartRows.map((row) => row.value)),
    [severityChartRows],
  );

  const patchSegments = useMemo(
    () =>
      withCategoricalColors(
        countByLabel(timeframeScopedRows, PATCH_STATUS_ORDER, (row) => row.patchStatus),
      ),
    [timeframeScopedRows],
  );

  const patchDeviceTotal = useMemo(
    () => patchSegments.reduce((sum, segment) => sum + segment.value, 0),
    [patchSegments],
  );

  const filteredRows = useMemo(() => {
    const chartFiltered = timeframeScopedRows.filter((row) => {
      if (platformFilter && row.platform !== platformFilter) return false;
      if (severityFilter && row.severity !== severityFilter) return false;
      if (patchFilter && row.patchStatus !== patchFilter) return false;
      return true;
    });

    return applyDataGridFacetFilters(chartFiltered, facetSelections, facetDefs).filter((row) =>
      discoveryMatchesSearch(row, searchQuery),
    );
  }, [timeframeScopedRows, platformFilter, severityFilter, patchFilter, facetSelections, facetDefs, searchQuery]);
  const tableGrid = useDiscoveryEventsTableGrid(filteredRows);
  const resultsDetail = useResultsDetailSlideOver(filteredRows);
  useResultsDetailPaginationSync({
    activeId: resultsDetail.activeId,
    isOpen: resultsDetail.isOpen,
    rows: filteredRows,
    page: tableGrid.page,
    setPage: tableGrid.setPage,
    pageSize: tableGrid.pageSize,
  });
  const { exportAll, snackbarProps } = useDataGridJsonExport(filteredRows, "discovery-events");

  const hasActiveFilters =
    platformFilter != null ||
    severityFilter != null ||
    patchFilter != null ||
    hasDataGridFacetSelections(facetSelections);

  const dailyChart = useMemo(() => buildDailyDiscoveryChart(timeframe), [timeframe]);

  const handlePlatformClick = (label: string) => {
    if (!isDevicePlatform(label)) return;
    setPlatformFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (label: string) => {
    if (!isDiscoverySeverity(label)) return;
    setSeverityFilter((current) => (current === label ? null : label));
  };

  const handlePatchClick = (label: string) => {
    if (!isPatchStatus(label)) return;
    setPatchFilter((current) => (current === label ? null : label));
  };

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
      <InsightCard title="New Assets Discovered Over Time">
        <ChartZoomHint unit="Days" isChartZoomed={isChartZoomed} onReset={handleChartZoomReset} />
        <TimeSeriesBarChart
          values={dailyChart.values}
          xLabels={dailyChart.xLabels}
          barColor={TIME_SERIES_BAR_FILL}
          spikeHighlight={
            dailyChart.spikeIndex != null
              ? { index: dailyChart.spikeIndex, label: `spike ${dailyChart.xLabels[dailyChart.spikeIndex]}` }
              : undefined
          }
          yMax={dailyChart.yMax}
          yTicks={dailyChart.yTicks}
          ariaLabel="New assets discovered over time by day"
          onBrushCommit={(selection) => handleTimelineBrush(selection, dailyChart.buckets)}
        />
        <p className="mt-1 pl-9 text-base-small text-text-tertiary">
          {dailyChart.spikeLabel}
        </p>
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Devices By Platform" fillHeight>
          <HorizontalBarPanel
            rows={platformRows}
            selectedLabel={platformFilter}
            onBarClick={handlePlatformClick}
            filterAriaLabel={(label) => `Filter discovery events by platform ${label}`}
            xMax={platformBarScale.xMax}
            xTicks={platformBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Severity ID" fillHeight>
          <HorizontalBarPanel
            rows={severityChartRows}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityClick}
            filterAriaLabel={(label) => `Filter discovery events by ${label} severity`}
            xMax={severityBarScale.xMax}
            xTicks={severityBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Patch Compliance" fillHeight>
          <DonutChartPanel
            segments={patchSegments}
            total={patchDeviceTotal}
            centerLabel="devices"
            selectedLabel={patchFilter}
            onSegmentClick={handlePatchClick}
            ariaLabel="Patch compliance by status"
          />
        </InsightCard>
      </div>
      </div>

      <DataGridSection
        header={
          <>
            <h2 className="text-base-semibold text-text-primary">Discovery Events</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="shrink-0 text-base-small text-text-secondary">
                {filteredRows.length} of {timeframeScopedRows.length} Results
                {platformFilter ? ` · ${platformFilter}` : ""}
                {severityFilter ? ` · ${severityFilter}` : ""}
                {patchFilter ? ` · ${patchFilter}` : ""}
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
                  aria-label="Search discovery events"
                />
              </div>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
                  onClick={() => {
                    setPlatformFilter(null);
                    setSeverityFilter(null);
                    setPatchFilter(null);
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
          <DiscoveryEventsTable
            displayRows={tableGrid.displayRows}
            getSortProps={tableGrid.getSortProps}
            tableColumnIds={tableColumnIds}
            onOpenDetail={resultsDetail.open}
            highlightedRowId={resultsDetail.isOpen ? resultsDetail.activeId : null}
          />
        }
        footer={<DataGridPaginationFooter grid={tableGrid} />}
      />
      <Snackbar {...snackbarProps} />
      <ResultsDetailSlideOver {...resultsDetail} />
    </div>
  );
}
