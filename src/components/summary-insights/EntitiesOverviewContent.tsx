import { useCallback, useMemo, useState } from "react";
import { useCopilot } from "../../context/CopilotContext";
import {
  buildAggregatedEntitiesFsqlQuery,
  buildCategoryEntitiesFsqlQuery,
} from "../../lib/buildEntitiesFsqlQuery";
import {
  DATA_GRID_ABOVE_SECTION_CLASS,
  DATA_GRID_HEADER_ROW_CLASS,
  DATA_GRID_RESULTS_SEARCH_PLACEHOLDER,
  DATA_GRID_TABLE_CLASS,
  DATA_GRID_TABLE_SCROLL_CLASS,
  DATA_GRID_THEAD_CLASS,
} from "../ui/dataGridTableStyles";
import { Search } from "lucide-react";
import { Checkbox, Icon, type SeverityShapeIconName } from "../../design-system";
import { type TimeframeRange } from "../../context/TimeframeContext";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
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

const ENTITY_BAR_TRACK = "rgba(158, 158, 158, 0.2)";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type DailyEntityChart = {
  xLabels: string[];
  values: number[];
  spikeIndex: number | null;
  spikeLabel: string;
  yMax: number;
  yTicks: number[];
  buckets: HourBucket[];
};

function buildDailyEntityChart(range: TimeframeRange): DailyEntityChart {
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
    const dow = day.getDay();
    const weekdayMultiplier = dow === 0 || dow === 6 ? 0.7 : 1.0 + (dow === 4 ? 0.2 : 0);
    values.push(isSpike ? 61 : Math.max(8, Math.round(14 * weekdayMultiplier * (0.9 + (i % 3) * 0.1))));
  });

  const peak = Math.max(...values, 10);
  const yMax = Math.ceil(peak / 10) * 10;
  const step = yMax / 4;
  const yTicks = [0, step, step * 2, step * 3, yMax];

  const spikeDayLabel = spikeIndex != null ? (xLabels[spikeIndex] ?? "") : "";
  const spikeLabel = `${spikeDayLabel} spike correlates with new cloud resources from Discovery`;

  return { xLabels, values, spikeIndex, spikeLabel, yMax, yTicks, buckets };
}

const ENTITY_TYPE_ROWS = [
  { label: "Devices", value: 2957, color: CHART_CATEGORY_FILL },
  { label: "Users", value: 2041, color: CHART_CATEGORY_FILL },
  { label: "Accounts", value: 1588, color: CHART_CATEGORY_FILL },
  { label: "Cloud", value: 988, color: CHART_CATEGORY_FILL },
  { label: "Processes", value: 655, color: CHART_CATEGORY_FILL },
] as const;

const ENTITY_RISK_ROWS = [
  { label: "Critical", value: 31, color: "#ff604a" },
  { label: "High", value: 94, color: "#f28830" },
  { label: "Medium", value: 212, color: "#fac354" },
  { label: "Low", value: 418, color: "#57969e" },
  { label: "Info", value: 5474, color: "#9b6bac" },
] as const;

const ENTITY_TYPE_ORDER = ENTITY_TYPE_ROWS.map((row) => row.label);
const ENTITY_RISK_CHART_ORDER = ENTITY_RISK_ROWS.map((row) => row.label);

const ENTITY_RISK_CHART_COLORS: Record<(typeof ENTITY_RISK_CHART_ORDER)[number], string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Info: "#9b6bac",
};

function entityTypeChartLabel(type: string): string {
  switch (type) {
    case "User":
      return "Users";
    case "Device":
      return "Devices";
    case "Account":
      return "Accounts";
    case "Cloud Resource":
      return "Cloud";
    case "Process":
      return "Processes";
    default:
      return type;
  }
}

type EntityListItem = {
  label: string;
  value: number;
};

type EntityCategoryCardData = {
  title: string;
  total: string;
  uniqueSeenLabel: string;
  items: EntityListItem[];
  totalCount: number;
};

const ENTITY_CATEGORY_CARDS: EntityCategoryCardData[] = [
  {
    title: "Top IP Addresses",
    total: "5.6K",
    uniqueSeenLabel: "unique IPs seen",
    totalCount: 25,
    items: [
      { label: "207.32.75.34", value: 1240 },
      { label: "145.27.84.12", value: 985 },
      { label: "168.33.72.10", value: 605 },
      { label: "168.12.89.11", value: 435 },
      { label: "2001:0D88:AC10:FE01", value: 175 },
    ],
  },
  {
    title: "Top Usernames",
    total: "7.6K",
    uniqueSeenLabel: "unique usernames seen",
    totalCount: 25,
    items: [
      { label: "cKopolowski", value: 2654 },
      { label: "kopolowsk", value: 1400 },
      { label: "bonwoncar", value: 1200 },
      { label: "CKopolowski", value: 894 },
      { label: "Slingercar", value: 762 },
    ],
  },
  {
    title: "Top Hostnames",
    total: "2.6K",
    uniqueSeenLabel: "unique hostnames seen",
    totalCount: 25,
    items: [
      { label: "norma-laptop", value: 1240 },
      { label: "https://thisandthat.com", value: 985 },
      { label: "slingerdingerdoodle-pc", value: 605 },
      { label: "https://leaveittobeaver.com", value: 435 },
      { label: "www.facebooksucks.com", value: 175 },
    ],
  },
  {
    title: "Top CVEs",
    total: "2.4K",
    uniqueSeenLabel: "unique CVEs seen",
    totalCount: 25,
    items: [
      { label: "www.normansrestaurant.com", value: 1240 },
      { label: "http://thisandthat.com", value: 985 },
      { label: "slingerdingerdoodles.com", value: 605 },
      { label: "https://leaveittobeaver.com", value: 435 },
      { label: "www.facebooksucks.com", value: 175 },
    ],
  },
  {
    title: "MAC Addresses",
    total: "2.1K",
    uniqueSeenLabel: "unique MAC addresses seen",
    totalCount: 25,
    items: [
      { label: "www.normansrestaurant.com", value: 1240 },
      { label: "http://thisandthat.com", value: 985 },
      { label: "slingerdingerdoodles.com", value: 605 },
      { label: "https://leaveittobeaver.com", value: 435 },
      { label: "www.facebooksucks.com", value: 175 },
    ],
  },
  {
    title: "Top URLs",
    total: "1.9K",
    uniqueSeenLabel: "unique URLs seen",
    totalCount: 25,
    items: [
      { label: "207.32.75.34", value: 1240 },
      { label: "145.27.84.12", value: 985 },
      { label: "168.33.72.10", value: 605 },
      { label: "168.12.89.11", value: 435 },
      { label: "2001:0D88:AC10:FE01", value: 175 },
    ],
  },
];

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function EntityCardHeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-xs" className="p-0 text-text-tertiary hover:text-text-primary" aria-label="Pivot search">
            <Search size={16} strokeWidth={1.5} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Pivot search</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-xs" className="p-0 text-text-tertiary hover:text-text-primary" aria-label="Expand widget">
            <Icon name="nav-expand" size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Expand widget</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" className="p-0 text-text-tertiary hover:text-text-primary" aria-label="Widget options">
            <Icon name="navi-more-vert" size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[9rem] border-border-container bg-surface-modal">
          <DropdownMenuItem>Export widget</DropdownMenuItem>
          <DropdownMenuItem>Pin to dashboard</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EntityAmountBar({ value, maxValue }: { value: number; maxValue: number }) {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 8 : 0) : 0;

  return (
    <div className="relative h-1.5 min-w-[6.5rem] flex-1 max-w-[6.625rem]">
      <div className="absolute inset-0 rounded-sm" style={{ backgroundColor: ENTITY_BAR_TRACK }} aria-hidden />
      <div
        className="absolute inset-y-0 left-0 rounded-sm"
        style={{ width: `${pct}%`, backgroundColor: CHART_CATEGORY_FILL }}
        aria-hidden
      />
    </div>
  );
}

function categorySelectionKey(cardTitle: string, label: string): string {
  return `${cardTitle}::${label}`;
}

function EntityCategoryCard({
  data,
  selectedKeys,
  onToggleItem,
}: {
  data: EntityCategoryCardData;
  selectedKeys: ReadonlySet<string>;
  onToggleItem: (cardTitle: string, label: string, checked: boolean) => void;
}) {
  const maxItemValue = data.items[0]?.value ?? 1;

  return (
    <InsightCard title={data.title} headerActions={<EntityCardHeaderActions />}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-1 flex h-[7.875rem] flex-col items-center justify-center gap-1 rounded bg-surface-modal sm:mx-0">
          <p className="text-[3rem] font-black leading-[2.75rem] text-text-primary">{data.total}</p>
          <p className="text-base-small text-text-tertiary">{data.uniqueSeenLabel}</p>
        </div>
        <ol className="mt-3 min-h-0 flex-1 divide-y divide-datavis-gridlines">
          {data.items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2 py-2.5 sm:gap-3">
              <Checkbox
                checked={selectedKeys.has(categorySelectionKey(data.title, item.label))}
                onCheckedChange={(checked) => onToggleItem(data.title, item.label, checked === true)}
                aria-label={`Select ${item.label}`}
              />
              <span className="w-5 shrink-0 text-base-semibold tabular-nums text-text-tertiary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <TruncatedText
                className="text-base-semibold text-text-secondary"
                wrapperClassName="min-w-0 flex-1"
              >
                {item.label}
              </TruncatedText>
              <EntityAmountBar value={item.value} maxValue={maxItemValue} />
              <span className="w-10 shrink-0 text-right text-base-small tabular-nums text-text-secondary">
                {formatCount(item.value)}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex items-center justify-end gap-2 text-base-small text-text-primary">
          <Button variant="ghost" size="icon-xs" className="p-0 text-text-tertiary hover:text-text-primary" aria-label="Previous page">
            <Icon name="navi-chevron-left" size={12} />
          </Button>
          <span className="tabular-nums tracking-[0.4px]">1-5 of {data.totalCount}</span>
          <Button variant="ghost" size="icon-xs" className="p-0 text-text-tertiary hover:text-text-primary" aria-label="Next page">
            <Icon name="navi-chevron-right" size={12} />
          </Button>
        </div>
      </div>
    </InsightCard>
  );
}


type EntitiesDetailTab = "entities" | "aggregated";

const ENTITIES_DETAIL_TABS: readonly { id: EntitiesDetailTab; label: string }[] = [
  { id: "entities", label: "Entities" },
  { id: "aggregated", label: "Entities Aggregated" },
];

type EntityRisk = "Critical" | "High" | "Medium" | "Low";

const ENTITY_RISK_BAR: Record<EntityRisk, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
};

const ENTITY_RISK_ICONS: Record<EntityRisk, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
};

const ENTITY_RISK_ORDER: Record<EntityRisk, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

type AggregatedEntityRow = {
  id: string;
  risk: EntityRisk;
  entity: string;
  type: string;
  lastSeen: string;
  eventCount: number;
  categories: string;
  connector: string;
};

const AGGREGATED_ENTITY_ROWS: AggregatedEntityRow[] = [
  {
    id: "1",
    risk: "High",
    entity: "j.alvarez",
    type: "User",
    lastSeen: "14:22:08",
    eventCount: 1410,
    categories: "Authentication, Network Activity, Findings",
    connector: demoTableConnector(0),
  },
  {
    id: "2",
    risk: "Critical",
    entity: "WIN-DC01",
    type: "Device",
    lastSeen: "13:05:41",
    eventCount: 3402,
    categories: "System Activity, Account Change, Discovery",
    connector: demoTableConnector(1),
  },
  {
    id: "3",
    risk: "Medium",
    entity: "svc-backup",
    type: "Account",
    lastSeen: "11:40:12",
    eventCount: 2587,
    categories: "Identity & Access, System Activity",
    connector: demoTableConnector(2),
  },
  {
    id: "4",
    risk: "Low",
    entity: "api-prod-04",
    type: "Cloud Resource",
    lastSeen: "09:12:00",
    eventCount: 1994,
    categories: "Network Activity, Discovery",
    connector: demoTableConnector(3),
  },
  {
    id: "5",
    risk: "High",
    entity: "s3-bucket-7f2a",
    type: "Cloud Resource",
    lastSeen: "22:18:55",
    eventCount: 872,
    categories: "Discovery, Findings",
    connector: demoTableConnector(4),
  },
  {
    id: "6",
    risk: "Medium",
    entity: "edge-vm-19",
    type: "Device",
    lastSeen: "18:00:03",
    eventCount: 654,
    categories: "Discovery, System Activity",
    connector: demoTableConnector(5),
  },
  {
    id: "7",
    risk: "Low",
    entity: "t.nguyen",
    type: "User",
    lastSeen: "16:44:19",
    eventCount: 512,
    categories: "Authentication, Identity & Access",
    connector: demoTableConnector(6),
  },
  {
    id: "8",
    risk: "Critical",
    entity: "sql-prod-02",
    type: "Device",
    lastSeen: "12:01:47",
    eventCount: 1188,
    categories: "System Activity, Findings",
    connector: demoTableConnector(7),
  },
  {
    id: "9",
    risk: "Medium",
    entity: "jump-host-01",
    type: "Device",
    lastSeen: "10:33:22",
    eventCount: 743,
    categories: "Network Activity, System Activity",
    connector: demoTableConnector(8),
  },
  {
    id: "10",
    risk: "High",
    entity: "admin",
    type: "User",
    lastSeen: "08:15:09",
    eventCount: 965,
    categories: "Authentication, Account Change",
    connector: demoTableConnector(9),
  },
  {
    id: "11",
    risk: "Low",
    entity: "web-edge-07",
    type: "Device",
    lastSeen: "07:42:18",
    eventCount: 421,
    categories: "Network Activity",
    connector: demoTableConnector(10),
  },
  {
    id: "12",
    risk: "Critical",
    entity: "iam-root-prod",
    type: "Account",
    lastSeen: "06:58:44",
    eventCount: 2104,
    categories: "Identity & Access, Findings",
    connector: demoTableConnector(11),
  },
  {
    id: "13",
    risk: "High",
    entity: "ec2-web-09",
    type: "Cloud Resource",
    lastSeen: "05:21:31",
    eventCount: 1336,
    categories: "Discovery, Network Activity",
    connector: demoTableConnector(12),
  },
  {
    id: "14",
    risk: "Medium",
    entity: "m.chen",
    type: "User",
    lastSeen: "04:09:57",
    eventCount: 588,
    categories: "Authentication, Identity & Access",
    connector: demoTableConnector(13),
  },
  {
    id: "15",
    risk: "Low",
    entity: "lambda-etl-01",
    type: "Cloud Resource",
    lastSeen: "03:44:12",
    eventCount: 302,
    categories: "System Activity",
    connector: demoTableConnector(14),
  },
  {
    id: "16",
    risk: "High",
    entity: "k.patel",
    type: "User",
    lastSeen: "02:18:06",
    eventCount: 877,
    categories: "Authentication, Findings",
    connector: demoTableConnector(15),
  },
  {
    id: "17",
    risk: "Medium",
    entity: "norma-laptop",
    type: "Device",
    lastSeen: "01:55:33",
    eventCount: 467,
    categories: "Discovery, System Activity",
    connector: demoTableConnector(16),
  },
  {
    id: "18",
    risk: "Critical",
    entity: "priv-svc-deploy",
    type: "Account",
    lastSeen: "00:41:28",
    eventCount: 1542,
    categories: "Identity & Access, System Activity, Findings",
    connector: demoTableConnector(17),
  },
  {
    id: "19",
    risk: "Low",
    entity: "staging-db-03",
    type: "Cloud Resource",
    lastSeen: "23:12:04",
    eventCount: 198,
    categories: "Network Activity, Discovery",
    connector: demoTableConnector(18),
  },
  {
    id: "20",
    risk: "Medium",
    entity: "platform-team",
    type: "User",
    lastSeen: "21:07:51",
    eventCount: 629,
    categories: "Account Change, Identity & Access",
    connector: demoTableConnector(19),
  },
];

function topEntitiesByEventVolume(rows: readonly AggregatedEntityRow[], limit: number) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.entity, (totals.get(row.entity) ?? 0) + row.eventCount);
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value, color: CHART_CATEGORY_FILL }));
}

function aggregatedMatchesSearch(row: AggregatedEntityRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    row.risk,
    row.entity,
    row.type,
    row.lastSeen,
    String(row.eventCount),
    row.categories,
    row.connector,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

type AggregatedSortColumn =
  | "risk"
  | "entity"
  | "type"
  | "lastSeen"
  | "eventCount"
  | "categories"
  | "connector";

const SELECT_COL_WIDTH = 40;
const AGGREGATED_COL_DEFAULTS: readonly number[] = [
  SELECT_COL_WIDTH,
  108,
  140,
  120,
  96,
  96,
  260,
  120,
];
const AGGREGATED_COL_MINS: readonly number[] = [
  SELECT_COL_WIDTH,
  72,
  96,
  88,
  72,
  72,
  140,
  88,
];

export function useEntitiesAggregatedTableGrid(rows: readonly Parameters<typeof EntitiesAggregatedTable>[0]["displayRows"][number][]) {
  const sortComparators = useMemo(
    (): Record<AggregatedSortColumn, (a: AggregatedEntityRow, b: AggregatedEntityRow) => number> => ({
      risk: (a, b) => ENTITY_RISK_ORDER[a.risk] - ENTITY_RISK_ORDER[b.risk],
      entity: (a, b) => compareStrings(a.entity, b.entity),
      type: (a, b) => compareStrings(a.type, b.type),
      lastSeen: (a, b) => compareStrings(a.lastSeen, b.lastSeen),
      eventCount: (a, b) => a.eventCount - b.eventCount,
      categories: (a, b) => compareStrings(a.categories, b.categories),
      connector: (a, b) => compareStrings(a.connector, b.connector),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators);
}

function EntitiesAggregatedTable({
  displayRows,
  getSortProps,
  selected,
  onSelectedChange,
}: {
  displayRows: AggregatedEntityRow[];
  getSortProps: ReturnType<typeof useEntitiesAggregatedTableGrid>["getSortProps"];
  selected: ReadonlySet<string>;
  onSelectedChange: (next: Set<string>) => void;
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
    selectColWidth: SELECT_COL_WIDTH,
    colDefaults: AGGREGATED_COL_DEFAULTS,
    colMins: AGGREGATED_COL_MINS,
  });

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



  return (
    <div ref={containerRef} className={cx(DATA_GRID_TABLE_SCROLL_CLASS, isResizing && "select-none")}>
      <table
        className={DATA_GRID_TABLE_CLASS}
        style={{
          width: tableFillsContainer ? "100%" : baseTotal,
          minWidth: Math.max(minTableWidth, baseTotal),
        }}
      >
        <caption className="sr-only">Aggregated entities</caption>
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
              <ColumnHeaderMenu label="Risk" menuLabel="Risk column options" {...getSortProps("risk")} />
              {resizeHandle(1)}
            </th>
            <th
              scope="col"
              style={colStyle(2)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Entity" menuLabel="Entity column options" {...getSortProps("entity")} />
              {resizeHandle(2)}
            </th>
            <th
              scope="col"
              style={colStyle(3)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Type" menuLabel="Type column options" {...getSortProps("type")} />
              {resizeHandle(3)}
            </th>
            <th
              scope="col"
              style={colStyle(4)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Last Seen" menuLabel="Last seen column options" {...getSortProps("lastSeen")} />
              {resizeHandle(4)}
            </th>
            <th
              scope="col"
              style={colStyle(5)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="# Events" menuLabel="Events column options" {...getSortProps("eventCount")} />
              {resizeHandle(5)}
            </th>
            <th
              scope="col"
              style={colStyle(6)}
              className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu
                label="Categories Involved"
                menuLabel="Categories involved column options"
                {...getSortProps("categories")}
              />
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
                    aria-label={`Select entity ${row.entity}`}
                  />
                </div>
              </td>
              <td style={colStyle(1)} className="px-2 py-0 align-middle">
                <span className="inline-flex items-center gap-2">
                  <SeverityTableIcon name={ENTITY_RISK_ICONS[row.risk]} color={ENTITY_RISK_BAR[row.risk]} />
                  <span className="text-sm text-text-secondary">{row.risk}</span>
                </span>
              </td>
              <td style={colStyle(2)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText
                  as="button"
                  className="w-full text-left text-sm font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                >
                  {row.entity}
                </TruncatedText>
              </td>
              <td style={colStyle(3)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.type}</TruncatedText>
              </td>
              <td style={colStyle(4)} className="min-w-0 px-2 py-0 align-middle tabular-nums">
                <TruncatedText className="text-sm text-text-secondary">{row.lastSeen}</TruncatedText>
              </td>
              <td style={colStyle(5)} className="min-w-0 px-2 py-0 align-middle tabular-nums">
                <TruncatedText className="text-sm text-text-secondary">{formatCount(row.eventCount)}</TruncatedText>
              </td>
              <td style={colStyle(6)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText className="text-sm text-text-secondary">{row.categories}</TruncatedText>
              </td>
              <td style={colStyle(7)} className="min-w-0 overflow-hidden px-2 py-0 align-middle">
                <ConnectorTableCell
                  name={row.connector}
                  className="w-full"
                  textClassName="w-full text-sm text-text-secondary"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EntitiesDetailTabs({
  active,
  onChange,
}: {
  active: EntitiesDetailTab;
  onChange: (tab: EntitiesDetailTab) => void;
}) {
  return (
    <nav className="relative z-10 flex shrink-0 gap-6" aria-label="Entity detail views">
      {ENTITIES_DETAIL_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            className={cx(
              "border-b-2 pb-3 text-sm font-semibold transition-colors",
              isActive
                ? "border-interactive-active text-text-primary"
                : "border-transparent text-text-tertiary hover:text-text-secondary",
            )}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function EntitiesAggregatedPanel({
  rows,
  selectedIds,
  onSelectedIdsChange,
  onSearchSelected,
}: {
  rows: AggregatedEntityRow[];
  selectedIds: ReadonlySet<string>;
  onSelectedIdsChange: (next: Set<string>) => void;
  onSearchSelected: (rows: AggregatedEntityRow[]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const filteredRows = useMemo(
    () => rows.filter((row) => aggregatedMatchesSearch(row, searchQuery)),
    [rows, searchQuery],
  );
  const tableGrid = useEntitiesAggregatedTableGrid(filteredRows);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.id)),
    [rows, selectedIds],
  );

  const handleSelectedChange = useCallback(
    (next: Set<string>) => {
      onSelectedIdsChange(next);
    },
    [onSelectedIdsChange],
  );

  return (
    <DataGridSection
      header={
        <>
          <h2 className="text-base-semibold text-text-primary">Entities</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="shrink-0 text-base-small text-text-secondary">
              {filteredRows.length} of {rows.length} Results
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
                aria-label="Search aggregated entities"
              />
            </div>
            {searchQuery.trim() ? (
              <Button
                type="button"
                variant="ghost"
                className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
                onClick={() => setSearchQuery("")}
              >
                <Icon name="action-filter-list" size={14} aria-hidden />
                Clear all filters
              </Button>
            ) : null}
            {selectedRows.length > 0 ? (
              <Button
                type="button"
                variant="secondary-outline"
                className="h-8 shrink-0 gap-1.5"
                onClick={() => onSearchSelected(selectedRows)}
              >
                <Search size={14} strokeWidth={1.5} className="size-3.5 shrink-0 text-current" aria-hidden />
                Search {selectedRows.length} selected
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
      table={
        <EntitiesAggregatedTable
          displayRows={tableGrid.displayRows}
          getSortProps={tableGrid.getSortProps}
          selected={selectedIds}
          onSelectedChange={handleSelectedChange}
        />
      }
      footer={<DataGridPaginationFooter grid={tableGrid} />}
    />
  );
}

/** Figma `1595:48982` — Entities Overview body for Federated Analytics. */
export function EntitiesOverviewContent() {
  const { setPendingFsqlSearch } = useCopilot();
  const { timeframe, initialTimeframe, isChartZoomed, handleTimelineBrush, handleChartZoomReset } =
    useFederatedAnalyticsTimeframeZoom("daily");
  const [activeDetailTab, setActiveDetailTab] = useState<EntitiesDetailTab>("entities");
  const [aggregatedSelectedIds, setAggregatedSelectedIds] = useState<Set<string>>(() => new Set());
  const [categorySelectedKeys, setCategorySelectedKeys] = useState<Set<string>>(() => new Set());

  const launchEntitiesFsqlSearch = useCallback(
    (query: string, onLaunched?: () => void) => {
      if (!query.trim()) return;
      setPendingFsqlSearch({ query, autoExecute: true });
      onLaunched?.();
    },
    [setPendingFsqlSearch],
  );

  const handleSearchAggregatedSelection = useCallback(
    (selectedRows: AggregatedEntityRow[]) => {
      const query = buildAggregatedEntitiesFsqlQuery(selectedRows);
      launchEntitiesFsqlSearch(query, () => setAggregatedSelectedIds(new Set()));
    },
    [launchEntitiesFsqlSearch],
  );

  const handleToggleCategoryItem = useCallback((cardTitle: string, label: string, checked: boolean) => {
    const key = categorySelectionKey(cardTitle, label);
    setCategorySelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const handleSearchCategorySelection = useCallback(() => {
    const selections = [...categorySelectedKeys].flatMap((key) => {
      const separator = key.indexOf("::");
      if (separator === -1) return [];
      return [{ cardTitle: key.slice(0, separator), label: key.slice(separator + 2) }];
    });
    const query = buildCategoryEntitiesFsqlQuery(selections);
    launchEntitiesFsqlSearch(query, () => setCategorySelectedKeys(new Set()));
  }, [categorySelectedKeys, launchEntitiesFsqlSearch]);

  const tableRows = useMemo(
    () =>
      buildDailyEventRows(AGGREGATED_ENTITY_ROWS, initialTimeframe, (template, id, eventTime) => ({
        ...template,
        id,
        lastSeen: formatAnalyticsRowTime(eventTime),
      })),
    [initialTimeframe],
  );

  const timeframeScopedRows = useMemo(
    () => tableRows.filter((row) => rowTimeInTimeframe(row.lastSeen, timeframe)),
    [tableRows, timeframe],
  );

  const entityTypeRows = useMemo(
    () =>
      countByLabel(timeframeScopedRows, ENTITY_TYPE_ORDER, (row) => entityTypeChartLabel(row.type)).map(
        (row) => ({
          ...row,
          color: CHART_CATEGORY_FILL,
        }),
      ),
    [timeframeScopedRows],
  );

  const entityTypeBarScale = useMemo(
    () => horizontalBarScale(entityTypeRows.map((row) => row.value)),
    [entityTypeRows],
  );

  const entityRiskRows = useMemo(
    () =>
      countByLabel(timeframeScopedRows, ENTITY_RISK_CHART_ORDER, (row) => row.risk).map((row) => ({
        ...row,
        color: ENTITY_RISK_CHART_COLORS[row.label as (typeof ENTITY_RISK_CHART_ORDER)[number]],
      })),
    [timeframeScopedRows],
  );

  const entityRiskBarScale = useMemo(
    () => horizontalBarScale(entityRiskRows.map((row) => row.value)),
    [entityRiskRows],
  );

  const topEntitiesByVolumeRows = useMemo(
    () => topEntitiesByEventVolume(timeframeScopedRows, 4),
    [timeframeScopedRows],
  );

  const topEntitiesBarScale = useMemo(
    () => horizontalBarScale(topEntitiesByVolumeRows.map((row) => row.value)),
    [topEntitiesByVolumeRows],
  );

  const dailyChart = useMemo(() => buildDailyEntityChart(timeframe), [timeframe]);

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
      <InsightCard title="New Entities Seen Per Day">
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
          ariaLabel="New entities seen per day"
          onBrushCommit={(selection) => handleTimelineBrush(selection, dailyChart.buckets)}
        />
        <p className="mt-1 pl-9 text-base-small text-text-tertiary">
          {dailyChart.spikeLabel}
        </p>
      </InsightCard>

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <InsightCard title="Entity Types" fillHeight>
          <HorizontalBarPanel
            rows={entityTypeRows}
            xMax={entityTypeBarScale.xMax}
            xTicks={entityTypeBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Entity Risk" fillHeight>
          <HorizontalBarPanel
            rows={entityRiskRows}
            xMax={entityRiskBarScale.xMax}
            xTicks={entityRiskBarScale.xTicks}
          />
        </InsightCard>
        <InsightCard title="Top Entities By Event Volume" fillHeight>
          <HorizontalBarPanel
            rows={topEntitiesByVolumeRows}
            xMax={topEntitiesBarScale.xMax}
            xTicks={topEntitiesBarScale.xTicks}
          />
        </InsightCard>
      </div>
      </div>

      <EntitiesDetailTabs active={activeDetailTab} onChange={setActiveDetailTab} />

      {activeDetailTab === "entities" ? (
        <>
          {categorySelectedKeys.size > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-base-small text-text-secondary">
                {categorySelectedKeys.size} entit{categorySelectedKeys.size === 1 ? "y" : "ies"} selected
              </p>
              <Button
                type="button"
                variant="secondary-outline"
                className="h-8 shrink-0 gap-1.5"
                onClick={handleSearchCategorySelection}
              >
                <Search size={14} strokeWidth={1.5} className="size-3.5 shrink-0 text-current" aria-hidden />
                Search selected
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-8 shrink-0 px-2 text-base-small text-text-tertiary hover:text-text-primary"
                onClick={() => setCategorySelectedKeys(new Set())}
              >
                Clear selection
              </Button>
            </div>
          ) : null}
          <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-3">
            {ENTITY_CATEGORY_CARDS.map((card) => (
              <EntityCategoryCard
                key={card.title}
                data={card}
                selectedKeys={categorySelectedKeys}
                onToggleItem={handleToggleCategoryItem}
              />
            ))}
          </div>
        </>
      ) : (
        <EntitiesAggregatedPanel
          rows={timeframeScopedRows}
          selectedIds={aggregatedSelectedIds}
          onSelectedIdsChange={setAggregatedSelectedIds}
          onSearchSelected={handleSearchAggregatedSelection}
        />
      )}
    </div>
  );
}
