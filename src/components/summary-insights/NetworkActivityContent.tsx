import { useMemo, useState } from "react";
import { Icon, type SeverityShapeIconName } from "../../design-system";
import { useTimeframe } from "../../context/TimeframeContext";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { compareStrings, useColumnSort } from "../ui/useColumnSort";
import { useResizableColumns } from "../ui/useResizableColumns";
import { TruncatedText } from "../ui/TruncatedText";
import { Checkbox } from "../uiCheckbox";
import { cx, DatavisGridlineRule, InsightCard } from "./datavisCard";
import { CHART_CATEGORY_FILL, HorizontalBarPanel } from "./horizontalBarPanel";
import { TimeSeriesAreaChart } from "./timeSeriesAreaChart";
import {
  buildHourlyAxisTicks,
  buildHourlyBuckets,
  findSpikeBucketIndex,
  formatBucketTimeLabel,
  hourlySeverityValues,
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

function connectorSwatch(connector: string) {
  if (connector.startsWith("BCs")) return "bg-feedback-info";
  if (connector.includes("Athena")) return "bg-interactive-active";
  return "bg-feedback-negative";
}

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

const PAIR_BAR_FILL = "#4a9eff";

const SOURCE_DEST_X_MAX = 1400;
const SOURCE_DEST_X_TICKS = [0, 350, 700, 1050, 1400] as const;

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
    title: "DNS tunneling pattern observed on outbound resolver…",
    activity: "Traffic",
    status: "Failure",
    trafficType: "DNS",
    sourceIp: "10.0.1.44",
    destinationIp: "203.0.113.5",
    connector: "BCs1",
  },
  {
    id: "2",
    severity: "High",
    time: "13:05:41",
    eventType: "HTTP Activity",
    title: "HTTP response handling anomaly on edge gateway…",
    activity: "Update",
    status: "Success",
    trafficType: "HTTP",
    sourceIp: "192.168.10.5",
    destinationIp: "8.8.8.8",
    connector: "BC-CS-Athena",
  },
  {
    id: "3",
    severity: "Medium",
    time: "11:40:12",
    eventType: "Email Activity",
    title: "Unusual SMTP relay volume from internal mail host…",
    activity: "Open",
    status: "Success",
    trafficType: "Email",
    sourceIp: "10.0.2.18",
    destinationIp: "172.16.4.90",
    connector: "BC-CS",
  },
  {
    id: "4",
    severity: "Low",
    time: "09:12:00",
    eventType: "FTP Activity",
    title: "FTP session opened to external file transfer node…",
    activity: "Refuse",
    status: "Failure",
    trafficType: "FTP",
    sourceIp: "203.0.113.12",
    destinationIp: "10.0.3.55",
    connector: "BCs1",
  },
  {
    id: "5",
    severity: "Informational",
    time: "22:18:55",
    eventType: "SSH Activity",
    title: "SSH session established from bastion host…",
    activity: "Traffic",
    status: "Success",
    trafficType: "SSH",
    sourceIp: "10.0.1.44",
    destinationIp: "203.0.113.5",
    connector: "BC-CS-Athena",
  },
  {
    id: "6",
    severity: "High",
    time: "18:00:03",
    eventType: "DNS Activity",
    title: "Repeated NXDOMAIN responses to rare TLD queries…",
    activity: "Traffic",
    status: "Success",
    trafficType: "DNS",
    sourceIp: "192.168.10.5",
    destinationIp: "8.8.8.8",
    connector: "BC-CS",
  },
  {
    id: "7",
    severity: "Critical",
    time: "16:44:19",
    eventType: "HTTP Activity",
    title: "Suspicious POST burst to newly registered domain…",
    activity: "Traffic",
    status: "Failure",
    trafficType: "HTTP",
    sourceIp: "10.0.2.18",
    destinationIp: "172.16.4.90",
    connector: "BCs1",
  },
  {
    id: "8",
    severity: "Medium",
    time: "12:01:47",
    eventType: "HTTP Activity",
    title: "TLS downgrade attempt on internal API endpoint…",
    activity: "Update",
    status: "Success",
    trafficType: "HTTP",
    sourceIp: "203.0.113.12",
    destinationIp: "10.0.3.55",
    connector: "BC-CS-Athena",
  },
  {
    id: "9",
    severity: "Low",
    time: "09:33:22",
    eventType: "Email Activity",
    title: "Outbound message flagged for suspicious attachment…",
    activity: "Open",
    status: "Success",
    trafficType: "Email",
    sourceIp: "10.0.1.44",
    destinationIp: "203.0.113.5",
    connector: "BCs1",
  },
  {
    id: "10",
    severity: "High",
    time: "21:15:08",
    eventType: "FTP Activity",
    title: "Large file upload over cleartext FTP channel…",
    activity: "Traffic",
    status: "Failure",
    trafficType: "FTP",
    sourceIp: "192.168.10.5",
    destinationIp: "8.8.8.8",
    connector: "BC-CS",
  },
];

const TOTAL_NETWORK_RESULTS = 2036;

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

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-full">
      <div className="relative flex min-h-[200px] flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-y-0 left-[20px] right-[20px] flex justify-between"
          aria-hidden
        >
          {SOURCE_DEST_X_TICKS.map((t) => (
            <div key={t} className="flex h-full w-0 justify-center">
              <div className="h-full w-px bg-datavis-gridlines" />
            </div>
          ))}
        </div>
        <div className="relative flex h-full min-h-0 flex-col justify-between">
          {rows.map((row) => {
            const pct = Math.min(
              100,
              Math.max((row.value / SOURCE_DEST_X_MAX) * 100, row.value > 0 ? 6 : 0),
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
                      backgroundColor: PAIR_BAR_FILL,
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
      <div className="mt-4 shrink-0 px-[20px]">
        <div className="h-px shrink-0 bg-datavis-gridlines" aria-hidden />
      </div>
      <div className="flex shrink-0 justify-between px-[20px] pt-2 text-base-small text-text-tertiary">
        {SOURCE_DEST_X_TICKS.map((t) => (
          <span key={t} className="w-8 shrink-0 text-center tabular-nums first:w-6 first:text-left last:text-right">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

type NetworkSortColumn = "severity" | "time" | "eventType" | "title" | "activity" | "status" | "connector";

const SELECT_COL_WIDTH = 40;
const COL_DEFAULTS: readonly number[] = [SELECT_COL_WIDTH, 108, 96, 140, 280, 88, 96, 120];
const COL_MINS: readonly number[] = [SELECT_COL_WIDTH, 72, 72, 96, 120, 56, 72, 80];

function NetworkActivityTable({ rows }: { rows: NetworkActivityRow[] }) {
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

  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
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
    (): Record<NetworkSortColumn, (a: NetworkActivityRow, b: NetworkActivityRow) => number> => ({
      severity: (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      time: (a, b) => compareStrings(a.time, b.time),
      eventType: (a, b) => compareStrings(a.eventType, b.eventType),
      title: (a, b) => compareStrings(a.title, b.title),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      status: (a, b) => compareStrings(a.status, b.status),
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
        <caption className="sr-only">Network activity events</caption>
        <colgroup>
          {displayWidths.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr className="h-10 border-b border-datavis-gridlines bg-surface-table-row-header">
            <th scope="col" style={colStyle(0)} className="relative h-10 border-r border-datavis-gridlines px-0 py-0 align-middle">
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
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Severity" menuLabel="Severity column options" {...getSortProps("severity")} />
              {resizeHandle(1)}
            </th>
            <th
              scope="col"
              style={colStyle(2)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Time" menuLabel="Time column options" {...getSortProps("time")} />
              {resizeHandle(2)}
            </th>
            <th
              scope="col"
              style={colStyle(3)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Type" menuLabel="Type column options" {...getSortProps("eventType")} />
              {resizeHandle(3)}
            </th>
            <th
              scope="col"
              style={colStyle(4)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Title" menuLabel="Title column options" {...getSortProps("title")} />
              {resizeHandle(4)}
            </th>
            <th
              scope="col"
              style={colStyle(5)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Activity" menuLabel="Activity column options" {...getSortProps("activity")} />
              {resizeHandle(5)}
            </th>
            <th
              scope="col"
              style={colStyle(6)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Status" menuLabel="Status column options" {...getSortProps("status")} />
              {resizeHandle(6)}
            </th>
            <th
              scope="col"
              style={colStyle(7)}
              className="relative h-10 px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Connectors" menuLabel="Connectors column options" {...getSortProps("connector")} />
              {resizeHandle(7)}
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.id} className="h-10 border-b border-datavis-gridlines hover:bg-overlay-subtle">
              <td style={colStyle(0)} className="h-10 px-0 py-0 align-middle">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(c) => toggleRow(row.id, c)}
                    aria-label={`Select network event ${row.id}`}
                  />
                </div>
              </td>
              <td style={colStyle(1)} className="h-10 px-2 py-0 align-middle">
                <span className="inline-flex items-center gap-2">
                  <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_BAR[row.severity]} />
                  <span className="text-sm text-text-secondary">{row.severity}</span>
                </span>
              </td>
              <td style={colStyle(2)} className="h-10 min-w-0 px-2 py-0 align-middle tabular-nums">
                <TruncatedText className="text-sm text-text-secondary">{row.time}</TruncatedText>
              </td>
              <td style={colStyle(3)} className="h-10 min-w-0 overflow-hidden px-2 py-0 align-middle">
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
              <td style={colStyle(4)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText
                  as="button"
                  className="w-full text-left text-sm font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                >
                  {row.title}
                </TruncatedText>
              </td>
              <td style={colStyle(5)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.activity}</TruncatedText>
              </td>
              <td style={colStyle(6)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.status}</TruncatedText>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Figma concept — Network Activity body for Federated Analytics. */
export function NetworkActivityContent() {
  const { range: timeframe } = useTimeframe();
  const [trafficFilter, setTrafficFilter] = useState<TrafficActivityType | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [pairFilter, setPairFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const filteredRows = useMemo(
    () =>
      NETWORK_ACTIVITY_ROWS.filter((row) => {
        if (trafficFilter && row.trafficType !== trafficFilter) return false;
        if (severityFilter && !severityMatchesFilter(row.severity, severityFilter)) return false;
        if (pairFilter) {
          const pair = SOURCE_DEST_PAIRS.find((item) => item.id === pairFilter);
          if (pair && (row.sourceIp !== pair.source || row.destinationIp !== pair.destination)) return false;
        }
        if (!networkMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [trafficFilter, severityFilter, pairFilter, searchQuery],
  );

  const hasActiveFilters =
    trafficFilter != null ||
    severityFilter != null ||
    pairFilter != null ||
    searchQuery.trim().length > 0;

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
    const spikeIndex = findSpikeBucketIndex(buckets, timeframe.to);
    const includeDate = timeframe.to.getTime() - timeframe.from.getTime() > 36 * 3_600_000;
    const xLabels = buckets.map((bucket) => formatBucketTimeLabel(bucket.start, includeDate));
    const { indices: xTickIndices, labels: xTickLabels } = buildHourlyAxisTicks(buckets, timeframe);

    const series = [
      {
        id: "Medium",
        label: "Medium",
        color: SEV_BAR.Medium,
        icon: SEV_ICONS.Medium,
        values: hourlySeverityValues(14, buckets, spikeIndex),
      },
      {
        id: "High",
        label: "High",
        color: SEV_BAR.High,
        icon: SEV_ICONS.High,
        values: hourlySeverityValues(10, buckets, spikeIndex),
      },
      {
        id: "Critical",
        label: "Critical",
        color: SEV_BAR.Critical,
        icon: SEV_ICONS.Critical,
        values: hourlySeverityValues(4, buckets, spikeIndex),
      },
    ] as const;

    const spikeHighlight =
      spikeIndex != null
        ? { index: spikeIndex, label: `spike ~${SPIKE_CLOCK_HOUR}:00` }
        : undefined;

    return { series, xLabels, xTickIndices, xTickLabels, spikeHighlight };
  }, [timeframe]);

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <InsightCard title="Network Events Per Hour By Severity">
        <TimeSeriesAreaChart
          series={eventsPerHourChart.series}
          xLabels={eventsPerHourChart.xLabels}
          xTickIndices={eventsPerHourChart.xTickIndices}
          xTickLabels={eventsPerHourChart.xTickLabels}
          spikeHighlight={eventsPerHourChart.spikeHighlight}
          ariaLabel="Network events per hour by severity"
          selectedSeriesId={severityFilter && isNetworkSeverity(severityFilter) ? severityFilter : null}
          onSeriesClick={handleChartSeverityClick}
        />
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Traffic By Activity Type" fillHeight>
          <HorizontalBarPanel
            rows={TRAFFIC_ACTIVITY_ROWS}
            selectedLabel={trafficFilter}
            onBarClick={handleTrafficClick}
            filterAriaLabel={(label) => `Filter network events by ${label} traffic`}
            xMax={70000}
            xTicks={[0, 17500, 35000, 52500, 70000]}
          />
        </InsightCard>
        <InsightCard title="Severity ID" fillHeight>
          <HorizontalBarPanel
            rows={SEVERITY_ROWS}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityClick}
            filterAriaLabel={(label) => `Filter network events by ${label} severity`}
            xMax={900}
            xTicks={[0, 225, 450, 675, 900]}
          />
        </InsightCard>
        <InsightCard title="Top Source → Destination Pairs" fillHeight>
          <SourceDestinationPairsPanel
            rows={SOURCE_DEST_PAIRS}
            selectedId={pairFilter}
            onPairClick={handlePairClick}
          />
        </InsightCard>
      </div>

      <section className="mx-0 mb-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2)]">
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-6 pt-3 sm:pl-5">
          <h2 className="text-base-semibold text-text-primary">Network Activity Events</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="shrink-0 text-base-small text-text-secondary">
              {filteredRows.length} of {TOTAL_NETWORK_RESULTS} Results
              {trafficFilter ? ` · ${trafficFilter}` : ""}
              {severityFilter ? ` · ${severityFilter}` : ""}
              {pairFilter ? ` · ${pairFilter.replace("→", " → ")}` : ""}
              {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            </p>
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
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
                <Icon name="action-filter-list" size={12} aria-hidden />
                Clear all filters
              </Button>
            ) : null}
            <Button type="button" variant="secondary" className="ml-auto shrink-0 gap-1.5 px-3">
              <Icon name="action-file-download" size={18} aria-hidden />
              Export All
            </Button>
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
            <NetworkActivityTable rows={filteredRows} />
          </div>
        </div>
      </section>
    </div>
  );
}
