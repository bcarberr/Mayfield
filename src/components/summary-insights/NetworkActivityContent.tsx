import { useMemo, useState } from "react";
import { DATA_GRID_ABOVE_SECTION_CLASS, DATA_GRID_HEADER_ROW_CLASS, DATA_GRID_RESULTS_SEARCH_PLACEHOLDER, DATA_GRID_TABLE_CLASS, DATA_GRID_TABLE_SCROLL_CLASS, DATA_GRID_THEAD_CLASS } from "../ui/dataGridTableStyles";
import { Checkbox, Icon, type SeverityShapeIconName } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { compareStrings } from "../ui/useColumnSort";
import { useSortedDataGridPagination } from "../ui/useSortedDataGridPagination";
import { DataGridSection } from "../ui/DataGridSection";
import { DataGridPaginationFooter } from "../ui/DataGridTableLayout";
import { useResizableColumns } from "../ui/useResizableColumns";
import { TruncatedText } from "../ui/TruncatedText";
import { demoTableConnector } from "../connectors/demoTableConnectors";
import { ConnectorTableCell } from "../ui/ConnectorTableCell";
import { cx, InsightCard } from "./datavisCard";
import {
  buildHourlyEventRows,
  ChartZoomHint,
  countByLabel,
  formatAnalyticsRowTime,
  horizontalBarScale,
  rowTimeInTimeframe,
  useFederatedAnalyticsTimeframeZoom,
} from "./federatedAnalyticsZoom";
import { CHART_CATEGORY_FILL, HorizontalBarPanel } from "./horizontalBarPanel";
import { TimeSeriesAreaChart } from "./timeSeriesAreaChart";
import {
  buildHourlyAxisTicks,
  buildHourlyBuckets,
  formatBucketTimeLabel,
  shouldIncludeDateInBucketLabels,
  hourlySeverityValues,
  resolveAnalyticsSpikeIndices,
  SPIKE_CLOCK_HOUR,
} from "./timeframeChartUtils";

type NetworkSeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const SEV_BAR: Record<NetworkSeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const SEV_ICONS: Record<NetworkSeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  Informational: "severity-info",
};

const SEVERITY_ORDER: Record<NetworkSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};

type TrafficActivityType = "DNS" | "Email" | "FTP" | "HTTP" | "SSH";

type NetworkEventType =
  | "HTTP Activity"
  | "DNS Activity"
  | "Email Activity"
  | "FTP Activity"
  | "SSH Activity";

type NetworkActivityRow = {
  id: string;
  severity: NetworkSeverity;
  time: string;
  eventType: NetworkEventType;
  title: string;
  activity: string;
  status: string;
  trafficType: TrafficActivityType;
  sourceIp: string;
  destinationIp: string;
  connector: string;
};

const TRAFFIC_ACTIVITY_ROWS = [
  { label: "DNS", value: 63400, color: CHART_CATEGORY_FILL },
  { label: "Email", value: 5353, color: CHART_CATEGORY_FILL },
  { label: "FTP", value: 3306, color: CHART_CATEGORY_FILL },
  { label: "HTTP", value: 1900, color: CHART_CATEGORY_FILL },
  { label: "SSH", value: 443, color: CHART_CATEGORY_FILL },
] as const;

const SEVERITY_ROWS = [
  { label: "Critical", value: 112, color: SEV_BAR.Critical },
  { label: "High", value: 204, color: SEV_BAR.High },
  { label: "Medium", value: 388, color: SEV_BAR.Medium },
  { label: "Low", value: 512, color: SEV_BAR.Low },
  { label: "Info", value: 820, color: SEV_BAR.Informational },
] as const;

type SourceDestPair = {
  id: string;
  source: string;
  destination: string;
  value: number;
};


const TRAFFIC_ORDER = TRAFFIC_ACTIVITY_ROWS.map((row) => row.label);
const SEVERITY_CHART_ORDER = SEVERITY_ROWS.map((row) => row.label);

const SOURCE_DEST_PAIRS: SourceDestPair[] = [
  { id: "10.0.1.44→203.0.113.5", source: "10.0.1.44", destination: "203.0.113.5", value: 1240 },
  { id: "192.168.10.5→8.8.8.8", source: "192.168.10.5", destination: "8.8.8.8", value: 986 },
  { id: "10.0.2.18→172.16.4.90", source: "10.0.2.18", destination: "172.16.4.90", value: 712 },
  { id: "203.0.113.12→10.0.3.55", source: "203.0.113.12", destination: "10.0.3.55", value: 548 },
];

const NETWORK_ACTIVITY_ROWS: NetworkActivityRow[] = [
  {
    id: "1",
    severity: "Critical",
    time: "14:22:08",
    eventType: "DNS Activity",
    title: "DNS tunneling pattern observed on outbound resolver",
    activity: "Traffic",
    status: "Failure",
    trafficType: "DNS",
    sourceIp: "10.0.1.44",
    destinationIp: "203.0.113.5",
    connector: demoTableConnector(0),
  },
  {
    id: "2",
    severity: "High",
    time: "13:05:41",
    eventType: "HTTP Activity",
    title: "HTTP response handling anomaly on edge gateway",
    activity: "Update",
    status: "Success",
    trafficType: "HTTP",
    sourceIp: "192.168.10.5",
    destinationIp: "8.8.8.8",
    connector: demoTableConnector(1),
  },
  {
    id: "3",
    severity: "Medium",
    time: "11:40:12",
    eventType: "Email Activity",
    title: "Unusual SMTP relay volume from internal mail host",
    activity: "Open",
    status: "Success",
    trafficType: "Email",
    sourceIp: "10.0.2.18",
    destinationIp: "172.16.4.90",
    connector: demoTableConnector(2),
  },
  {
    id: "4",
    severity: "Low",
    time: "09:12:00",
    eventType: "FTP Activity",
    title: "FTP session opened to external file transfer node",
    activity: "Refuse",
    status: "Failure",
    trafficType: "FTP",
    sourceIp: "203.0.113.12",
    destinationIp: "10.0.3.55",
    connector: demoTableConnector(3),
  },
  {
    id: "5",
    severity: "Informational",
    time: "22:18:55",
    eventType: "SSH Activity",
    title: "SSH session established from bastion host",
    activity: "Traffic",
    status: "Success",
    trafficType: "SSH",
    sourceIp: "10.0.1.44",
    destinationIp: "203.0.113.5",
    connector: demoTableConnector(4),
  },
  {
    id: "6",
    severity: "High",
    time: "18:00:03",
    eventType: "DNS Activity",
    title: "Repeated NXDOMAIN responses to rare TLD queries",
    activity: "Traffic",
    status: "Success",
    trafficType: "DNS",
    sourceIp: "192.168.10.5",
    destinationIp: "8.8.8.8",
    connector: demoTableConnector(5),
  },
  {
    id: "7",
    severity: "Critical",
    time: "16:44:19",
    eventType: "HTTP Activity",
    title: "Suspicious POST burst to newly registered domain",
    activity: "Traffic",
    status: "Failure",
    trafficType: "HTTP",
    sourceIp: "10.0.2.18",
    destinationIp: "172.16.4.90",
    connector: demoTableConnector(6),
  },
  {
    id: "8",
    severity: "Medium",
    time: "12:01:47",
    eventType: "HTTP Activity",
    title: "TLS downgrade attempt on internal API endpoint",
    activity: "Update",
    status: "Success",
    trafficType: "HTTP",
    sourceIp: "203.0.113.12",
    destinationIp: "10.0.3.55",
    connector: demoTableConnector(7),
  },
  {
    id: "9",
    severity: "Low",
    time: "09:33:22",
    eventType: "Email Activity",
    title: "Outbound message flagged for suspicious attachment",
    activity: "Open",
    status: "Success",
    trafficType: "Email",
    sourceIp: "10.0.1.44",
    destinationIp: "203.0.113.5",
    connector: demoTableConnector(8),
  },
  {
    id: "10",
    severity: "High",
    time: "21:15:08",
    eventType: "FTP Activity",
    title: "Large file upload over cleartext FTP channel",
    activity: "Traffic",
    status: "Failure",
    trafficType: "FTP",
    sourceIp: "192.168.10.5",
    destinationIp: "8.8.8.8",
    connector: demoTableConnector(9),
  },
];

const NETWORK_SECONDARY_SPIKE_ROWS: NetworkActivityRow[] = [
  {
    id: "s1",
    severity: "Critical",
    time: "21:30:08",
    eventType: "HTTP Activity",
    title: "HTTPS beaconing to newly registered domain after business hours",
    activity: "Traffic",
    status: "Success",
    trafficType: "HTTP",
    sourceIp: "10.0.4.92",
    destinationIp: "185.220.101.44",
    connector: demoTableConnector(0),
  },
  {
    id: "s2",
    severity: "Critical",
    time: "21:30:18",
    eventType: "DNS Activity",
    title: "High-entropy DNS queries to rare TLD suggest tunneling from finance subnet",
    activity: "Traffic",
    status: "Success",
    trafficType: "DNS",
    sourceIp: "10.0.8.14",
    destinationIp: "8.8.8.8",
    connector: demoTableConnector(1),
  },
  {
    id: "s3",
    severity: "High",
    time: "21:30:28",
    eventType: "SSH Activity",
    title: "Lateral SSH movement from workstation to domain controller subnet",
    activity: "Traffic",
    status: "Failure",
    trafficType: "SSH",
    sourceIp: "10.0.2.55",
    destinationIp: "10.0.0.12",
    connector: demoTableConnector(2),
  },
];

function isTrafficActivityType(label: string): label is TrafficActivityType {
  return label === "DNS" || label === "Email" || label === "FTP" || label === "HTTP" || label === "SSH";
}

function isNetworkSeverity(label: string): label is NetworkSeverity {
  return label in SEV_BAR;
}

function severityMatchesFilter(rowSeverity: NetworkSeverity, filter: string): boolean {
  if (filter === "Info") return rowSeverity === "Informational";
  return rowSeverity === filter;
}

function networkMatchesSearch(row: NetworkActivityRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    row.severity,
    row.time,
    row.eventType,
    row.title,
    row.activity,
    row.status,
    row.trafficType,
    row.sourceIp,
    row.destinationIp,
    row.connector,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

type SourceDestinationPairsPanelProps = {
  rows: readonly SourceDestPair[];
  selectedId?: string | null;
  onPairClick?: (id: string) => void;
};

function SourceDestinationPairsPanel({ rows, selectedId = null, onPairClick }: SourceDestinationPairsPanelProps) {
  const interactive = Boolean(onPairClick);
  const filterActive = selectedId != null;
  const { xMax, xTicks } = horizontalBarScale(rows.map((row) => row.value));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-full">
      <div className="relative flex min-h-[200px] flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-y-0 left-[20px] right-[20px] flex justify-between"
          aria-hidden
        >
          {xTicks.map((t) => (
            <div key={t} className="flex h-full w-0 justify-center">
              <div className="h-full w-px bg-datavis-gridlines" />
            </div>
          ))}
        </div>
        <div className="relative flex h-full min-h-0 flex-col justify-between">
          {rows.map((row) => {
            const pct = Math.min(
              100,
              Math.max((row.value / xMax) * 100, row.value > 0 ? 6 : 0),
            );
            const selected = interactive && selectedId === row.id;
            const dimmed = filterActive && !selected;

            const labelClasses = cx(
              "text-base-small transition-colors",
              "group-hover:font-semibold group-hover:text-text-primary",
              selected ? "font-semibold text-text-primary" : dimmed ? "text-text-disabled" : "text-text-tertiary",
            );

            const rowBody = (
              <>
                <div className="flex w-[7.5rem] min-w-0 shrink-0 items-center justify-end gap-0.5 sm:w-36 sm:gap-1">
                  <TruncatedText className={labelClasses} wrapperClassName="min-w-0 max-w-[3.25rem] sm:max-w-[4.5rem]">
                    {row.source}
                  </TruncatedText>
                  <span className={cx("shrink-0 text-base-small", labelClasses)} aria-hidden>
                    →
                  </span>
                  <TruncatedText className={labelClasses} wrapperClassName="min-w-0 max-w-[3.25rem] sm:max-w-[4.5rem]">
                    {row.destination}
                  </TruncatedText>
                </div>
                <div className="flex min-h-5 min-w-0 flex-1 items-center gap-[8px]">
                  <div
                    className={cx(
                      "h-5 shrink-0 rounded-sm transition-opacity duration-150",
                      dimmed ? "opacity-35 group-hover:opacity-55" : interactive && !selected && "opacity-90 group-hover:opacity-100",
                    )}
                    style={{
                      width: `min(${pct}%, calc(100% - 3.25rem))`,
                      backgroundColor: CHART_CATEGORY_FILL,
                    }}
                  />
                  <span
                    className={cx(
                      "shrink-0 text-xs font-bold tabular-nums transition-colors",
                      "group-hover:text-text-primary",
                      dimmed ? "text-text-disabled" : "text-text-primary",
                    )}
                  >
                    {row.value}
                  </span>
                </div>
              </>
            );

            if (interactive) {
              return (
                <button
                  key={row.id}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Filter network events for ${row.source} to ${row.destination}`}
                  className={cx(
                    "group flex min-h-6 w-full shrink-0 items-center gap-2 rounded-sm text-left sm:gap-3",
                    "cursor-pointer transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-datavis-card-bg",
                  )}
                  onClick={() => onPairClick!(row.id)}
                >
                  {rowBody}
                </button>
              );
            }

            return (
              <div key={row.id} className="flex min-h-6 shrink-0 items-center gap-2 sm:gap-3">
                {rowBody}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type NetworkSortColumn = "severity" | "title" | "time" | "activity" | "eventClass" | "status" | "connector";

const SELECT_COL_WIDTH = 40;
const COL_DEFAULTS: readonly number[] = [SELECT_COL_WIDTH, 108, 280, 96, 88, 96, 140, 120];
const COL_MINS: readonly number[] = [SELECT_COL_WIDTH, 72, 120, 72, 56, 72, 96, 80];

export function useNetworkActivityTableGrid(rows: readonly Parameters<typeof NetworkActivityTable>[0]["displayRows"][number][]) {
  const sortComparators = useMemo(
    (): Record<NetworkSortColumn, (a: NetworkActivityRow, b: NetworkActivityRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      eventClass: (a, b) => compareStrings(a.eventType, b.eventType),
      status: (a, b) => compareStrings(a.status, b.status),
      connector: (a, b) => compareStrings(a.connector, b.connector),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators);
}

function NetworkActivityTable({ displayRows, getSortProps }: { displayRows: NetworkActivityRow[]; getSortProps: ReturnType<typeof useNetworkActivityTableGrid>["getSortProps"] }) {
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



  return (
    <div ref={containerRef} className={cx(DATA_GRID_TABLE_SCROLL_CLASS, isResizing && "select-none")}>
      <table
        className={DATA_GRID_TABLE_CLASS}
        style={{
          width: tableFillsContainer ? "100%" : baseTotal,
          minWidth: Math.max(minTableWidth, baseTotal),
        }}
      >
        <caption className="sr-only">Network activity events</caption>
        <colgroup>
          {displayWidths.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead className={DATA_GRID_THEAD_CLASS}>
          <tr className={DATA_GRID_HEADER_ROW_CLASS}>
            <th scope="col" style={colStyle(0)} className="relative border-r border-datavis-gridlines px-0 py-0 align-middle">
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
            <th
              scope="col"
              style={colStyle(1)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Severity" menuLabel="Severity column options" {...getSortProps("severity")} />
              {resizeHandle(1)}
            </th>
            <th
              scope="col"
              style={colStyle(2)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Title" menuLabel="Title column options" {...getSortProps("title")} />
              {resizeHandle(2)}
            </th>
            <th
              scope="col"
              style={colStyle(3)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Time" menuLabel="Time column options" {...getSortProps("time")} />
              {resizeHandle(3)}
            </th>
            <th
              scope="col"
              style={colStyle(4)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Activity" menuLabel="Activity column options" {...getSortProps("activity")} />
              {resizeHandle(4)}
            </th>
            <th
              scope="col"
              style={colStyle(5)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Status" menuLabel="Status column options" {...getSortProps("status")} />
              {resizeHandle(5)}
            </th>
            <th
              scope="col"
              style={colStyle(6)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Class" menuLabel="Class column options" {...getSortProps("eventClass")} />
              {resizeHandle(6)}
            </th>
            <th
              scope="col"
              style={colStyle(7)}
              className="relative px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Connectors" menuLabel="Connectors column options" {...getSortProps("connector")} />
              {resizeHandle(7)}
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.id} className="border-b border-datavis-gridlines hover:bg-overlay-subtle">
              <td style={colStyle(0)} className="px-0 py-0 align-middle">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(c) => toggleRow(row.id, c)}
                    aria-label={`Select network event ${row.id}`}
                  />
                </div>
              </td>
              <td style={colStyle(1)} className="px-2 py-0 align-middle">
                <span className="inline-flex items-center gap-2">
                  <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_BAR[row.severity]} />
                  <span className="text-sm text-text-secondary">{row.severity}</span>
                </span>
              </td>
              <td style={colStyle(2)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText
                  as="button"
                  className="w-full text-left text-sm font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                >
                  {row.title}
                </TruncatedText>
              </td>
              <td style={colStyle(3)} className="min-w-0 px-2 py-0 align-middle tabular-nums">
                <TruncatedText className="text-sm text-text-secondary">{row.time}</TruncatedText>
              </td>
              <td style={colStyle(4)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.activity}</TruncatedText>
              </td>
              <td style={colStyle(5)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.status}</TruncatedText>
              </td>
              <td style={colStyle(6)} className="min-w-0 overflow-hidden px-2 py-0 align-middle">
                <span className="flex w-full min-w-0 items-center gap-2">
                  <Icon
                    name="ocsf-network-activity"
                    size={16}
                    className="size-4 shrink-0 text-datavis-data-peanut-orange [&_svg]:!size-4"
                    aria-hidden
                  />
                  <TruncatedText className="w-full text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                    {row.eventType}
                  </TruncatedText>
                </span>
              </td>
              <td style={colStyle(7)} className="min-w-0 px-2 py-0 align-middle">
                <ConnectorTableCell name={row.connector} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Figma concept — Network Activity body for Federated Analytics. */
export function NetworkActivityContent() {
  const { timeframe, initialTimeframe, isChartZoomed, handleTimelineBrush, handleChartZoomReset } =
    useFederatedAnalyticsTimeframeZoom("hourly");
  const [trafficFilter, setTrafficFilter] = useState<TrafficActivityType | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [pairFilter, setPairFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const tableRows = useMemo(
    () =>
      buildHourlyEventRows(
        NETWORK_ACTIVITY_ROWS,
        initialTimeframe,
        (template, id, eventTime) => ({
          ...template,
          id,
          time: formatAnalyticsRowTime(eventTime),
        }),
        { secondarySpikeTemplates: NETWORK_SECONDARY_SPIKE_ROWS },
      ),
    [initialTimeframe],
  );

  const timeframeScopedRows = useMemo(
    () => tableRows.filter((row) => rowTimeInTimeframe(row.time, timeframe)),
    [tableRows, timeframe],
  );

  const trafficChartRows = useMemo(
    () =>
      countByLabel(timeframeScopedRows, TRAFFIC_ORDER, (row) => row.trafficType).map((row) => ({
        ...row,
        color: CHART_CATEGORY_FILL,
      })),
    [timeframeScopedRows],
  );

  const trafficBarScale = useMemo(
    () => horizontalBarScale(trafficChartRows.map((row) => row.value)),
    [trafficChartRows],
  );

  const severityChartRows = useMemo(
    () =>
      SEVERITY_CHART_ORDER.map((label) => {
        const severityKey: NetworkSeverity = label === "Info" ? "Informational" : (label as NetworkSeverity);
        const value = timeframeScopedRows.filter((row) => row.severity === severityKey).length;
        return {
          label,
          value,
          color: SEV_BAR[severityKey],
        };
      }),
    [timeframeScopedRows],
  );

  const severityBarScale = useMemo(
    () => horizontalBarScale(severityChartRows.map((row) => row.value)),
    [severityChartRows],
  );

  const sourceDestPairRows = useMemo(
    () =>
      SOURCE_DEST_PAIRS.map((pair) => ({
        ...pair,
        value: timeframeScopedRows.filter(
          (row) => row.sourceIp === pair.source && row.destinationIp === pair.destination,
        ).length,
      })),
    [timeframeScopedRows],
  );

  const filteredRows = useMemo(
    () =>
      timeframeScopedRows.filter((row) => {
        if (trafficFilter && row.trafficType !== trafficFilter) return false;
        if (severityFilter && !severityMatchesFilter(row.severity, severityFilter)) return false;
        if (pairFilter) {
          const pair = SOURCE_DEST_PAIRS.find((item) => item.id === pairFilter);
          if (pair && (row.sourceIp !== pair.source || row.destinationIp !== pair.destination)) return false;
        }
        if (!networkMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [timeframeScopedRows, trafficFilter, severityFilter, pairFilter, searchQuery],
  );

  const tableGrid = useNetworkActivityTableGrid(filteredRows);

  const hasActiveFilters =
    trafficFilter != null ||
    severityFilter != null ||
    pairFilter != null;

  const handleTrafficClick = (label: string) => {
    if (!isTrafficActivityType(label)) return;
    setTrafficFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (label: string) => {
    if (label !== "Info" && !isNetworkSeverity(label)) return;
    setSeverityFilter((current) => (current === label ? null : label));
  };

  const handlePairClick = (id: string) => {
    setPairFilter((current) => (current === id ? null : id));
  };

  const handleChartSeverityClick = (seriesId: string) => {
    if (!isNetworkSeverity(seriesId)) return;
    setSeverityFilter((current) => (current === seriesId ? null : seriesId));
  };

  const eventsPerHourChart = useMemo(() => {
    const buckets = buildHourlyBuckets(timeframe);
    const { spikeIndex, secondarySpikeIndex } = resolveAnalyticsSpikeIndices(buckets, timeframe.to);
    const includeDate = shouldIncludeDateInBucketLabels(timeframe);
    const xLabels = buckets.map((bucket) => formatBucketTimeLabel(bucket.start, includeDate));
    const { indices: xTickIndices, labels: xTickLabels } = buildHourlyAxisTicks(buckets, timeframe);

    const series = [
      {
        id: "Medium",
        label: "Medium",
        color: SEV_BAR.Medium,
        icon: SEV_ICONS.Medium,
        values: hourlySeverityValues(14, buckets, spikeIndex, secondarySpikeIndex),
      },
      {
        id: "High",
        label: "High",
        color: SEV_BAR.High,
        icon: SEV_ICONS.High,
        values: hourlySeverityValues(10, buckets, spikeIndex, secondarySpikeIndex),
      },
      {
        id: "Critical",
        label: "Critical",
        color: SEV_BAR.Critical,
        icon: SEV_ICONS.Critical,
        values: hourlySeverityValues(4, buckets, spikeIndex, secondarySpikeIndex),
      },
    ] as const;

    const spikeHighlight =
      spikeIndex != null
        ? { index: spikeIndex, label: `spike ~${SPIKE_CLOCK_HOUR}:00` }
        : undefined;

    return { series, xLabels, xTickIndices, xTickLabels, spikeHighlight, buckets };
  }, [timeframe]);

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
      <InsightCard title="Network Events Per Hour By Severity">
        <ChartZoomHint unit="Hours" isChartZoomed={isChartZoomed} onReset={handleChartZoomReset} />
        <TimeSeriesAreaChart
          series={eventsPerHourChart.series}
          xLabels={eventsPerHourChart.xLabels}
          xTickIndices={eventsPerHourChart.xTickIndices}
          xTickLabels={eventsPerHourChart.xTickLabels}
          bucketStarts={eventsPerHourChart.buckets.map((bucket) => bucket.start)}
          spikeHighlight={eventsPerHourChart.spikeHighlight}
          ariaLabel="Network events per hour by severity"
          selectedSeriesId={severityFilter && isNetworkSeverity(severityFilter) ? severityFilter : null}
          onSeriesClick={handleChartSeverityClick}
          onBrushCommit={(selection) => handleTimelineBrush(selection, eventsPerHourChart.buckets)}
        />
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Traffic By Activity Type" fillHeight>
          <HorizontalBarPanel
            rows={trafficChartRows}
            selectedLabel={trafficFilter}
            onBarClick={handleTrafficClick}
            filterAriaLabel={(label) => `Filter network events by ${label} traffic`}
            xMax={trafficBarScale.xMax}
            xTicks={trafficBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Severity ID" fillHeight>
          <HorizontalBarPanel
            rows={severityChartRows}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityClick}
            filterAriaLabel={(label) => `Filter network events by ${label} severity`}
            xMax={severityBarScale.xMax}
            xTicks={severityBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Top Source → Destination Pairs" fillHeight>
          <SourceDestinationPairsPanel
            rows={sourceDestPairRows}
            selectedId={pairFilter}
            onPairClick={handlePairClick}
          />
        </InsightCard>
      </div>
      </div>

      <DataGridSection
        header={
          <>
            <h2 className="text-base-semibold text-text-primary">Network Activity Events</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="shrink-0 text-base-small text-text-secondary">
                {filteredRows.length} of {timeframeScopedRows.length} Results
                {trafficFilter ? ` · ${trafficFilter}` : ""}
                {severityFilter ? ` · ${severityFilter}` : ""}
                {pairFilter ? ` · ${pairFilter.replace("→", " → ")}` : ""}
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
                  aria-label="Search network activity events"
                />
              </div>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
                  onClick={() => {
                    setTrafficFilter(null);
                    setSeverityFilter(null);
                    setPairFilter(null);
                    setSearchQuery("");
                  }}
                >
                  <Icon name="action-filter-list" size={14} aria-hidden />
                  Clear all filters
                </Button>
              ) : null}
              <DataGridExportButton />
            </div>
          </>
        }
        filterPanel={
          <FilterColumnPanel
            active={tableTool}
            onFilterClick={() => setTableTool(tableTool === "filter" ? null : "filter")}
            onColumnsClick={() => setTableTool(tableTool === "columns" ? null : "columns")}
          />
        }
        table={<NetworkActivityTable displayRows={tableGrid.displayRows} getSortProps={tableGrid.getSortProps} />}
        footer={<DataGridPaginationFooter grid={tableGrid} />}
      />
    </div>
  );
}
