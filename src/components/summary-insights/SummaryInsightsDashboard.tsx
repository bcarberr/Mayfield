import { useCallback, useMemo, useState } from "react";
import {
  DATA_GRID_ABOVE_SECTION_CLASS,
  DATA_GRID_HEADER_ROW_CLASS,
  DATA_GRID_PAGE_SCROLL_INNER_CLASS,
  DATA_GRID_PAGE_SCROLL_OUTER_CLASS,
  DATA_GRID_RESULTS_SEARCH_PLACEHOLDER,
  DATA_GRID_TABLE_CLASS,
  DATA_GRID_TABLE_SCROLL_CLASS,
  DATA_GRID_THEAD_CLASS,
} from "../ui/dataGridTableStyles";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Checkbox, Icon } from "../../design-system";
import { DonutChartPanel } from "../ui/DonutChartPanel";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { Button } from "@/components/shadcn/button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { compareStrings } from "../ui/useColumnSort";
import { useSortedDataGridPagination } from "../ui/useSortedDataGridPagination";
import { DataGridSection } from "../ui/DataGridSection";
import { DataGridPaginationFooter } from "../ui/DataGridTableLayout";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { TruncatedText } from "../ui/TruncatedText";
import { demoTableConnector } from "../connectors/demoTableConnectors";
import { ConnectorTableCell } from "../ui/ConnectorTableCell";
import { useResizableColumns } from "../ui/useResizableColumns";
import { ROUTES } from "../../app/routes";
import { useCopilot } from "../../context/CopilotContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { TooltipProvider } from "@/components/shadcn/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { useTimeframe, type TimeframeRange } from "../../context/TimeframeContext";
import { EntitiesOverviewContent } from "./EntitiesOverviewContent";
import { NetworkActivityContent } from "./NetworkActivityContent";
import { cx, DatavisGridlineRule, InsightCard } from "./datavisCard";
import {
  FEDERATED_ANALYTICS_TABS,
  federatedViewLabel,
  isComingSoonFederatedView,
  readDefaultFederatedView,
  type FederatedViewId,
} from "./FederatedAnalyticsBreadcrumb";
import { CHART_CATEGORY_FILL, HorizontalBarPanel } from "./horizontalBarPanel";
import { ApplicationActivityContent } from "./ApplicationActivityContent";
import { DiscoveryContent } from "./DiscoveryContent";
import { IdentityAccessContent } from "./IdentityAccessContent";
import { RemediationContent } from "./RemediationContent";
import { SystemActivityContent } from "./SystemActivityContent";
import { ChartZoomHint, buildHourlyEventRows } from "./federatedAnalyticsZoom";
import { TimeSeriesAreaChart } from "./timeSeriesAreaChart";
import {
  buildHourlyAxisTicks,
  buildHourlyBuckets,
  formatBucketTimeLabel,
  shouldIncludeDateInBucketLabels,
  hourlySeverityValues,
  resolveAnalyticsSpikeIndices,
  SPIKE_CLOCK_HOUR,
  timeframeFromBucketSelection,
} from "./timeframeChartUtils";

const SEV_BAR: Record<"Critical" | "High" | "Medium" | "Low" | "Informational", string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

type SeverityLevel = keyof typeof SEV_BAR;

function isSeverityLevel(label: string): label is SeverityLevel {
  return label in SEV_BAR;
}

type FindingCategory =
  | "Vulnerabilities"
  | "Compliance"
  | "Detections"
  | "Incidents"
  | "Security"
  | "Data Security";

function isFindingCategory(label: string): label is FindingCategory {
  return (
    label === "Vulnerabilities" ||
    label === "Compliance" ||
    label === "Detections" ||
    label === "Incidents" ||
    label === "Security" ||
    label === "Data Security"
  );
}

type FindingEventType = "HTTP Activity" | "Vulnerability";

type FindingStatus = "New" | "In Progress" | "Resolved" | "Suppressed";

const STATUS_UNKNOWN_FILL = "#717882";

function isFindingStatus(label: string): label is FindingStatus {
  return label === "New" || label === "In Progress" || label === "Resolved" || label === "Suppressed";
}

type FindingRow = {
  id: string;
  severity: keyof typeof SEV_BAR;
  category: FindingCategory;
  title: string;
  description: string;
  time: string;
  activity: string;
  status: string;
  findingStatus: FindingStatus;
  eventType: FindingEventType;
  connector: string;
};

const EVENT_TYPE_ICON: Record<FindingEventType, { name: "network-activity" | "ocsf-findings"; className: string }> = {
  "HTTP Activity": {
    name: "network-activity",
    className: "text-datavis-data-peanut-orange",
  },
  Vulnerability: {
    name: "ocsf-findings",
    className: "text-datavis-data-smalt-green-40",
  },
};

const SEVERITY_ICON: Record<
  FindingRow["severity"],
  "severity-critical" | "severity-high" | "severity-medium" | "severity-low" | "severity-info"
> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  Informational: "severity-info",
};

function findingMatchesSearch(row: FindingRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.title,
    row.description,
    row.severity,
    row.category,
    row.time,
    row.activity,
    row.status,
    row.eventType,
    row.connector,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function formatFindingRowTime(date: Date): string {
  const pad2 = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function parseFindingRowTime(time: string): Date | null {
  const match = time.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]);
}

function findingRowInTimeframe(row: FindingRow, range: TimeframeRange): boolean {
  const eventTime = parseFindingRowTime(row.time);
  if (!eventTime) return true;
  return eventTime.getTime() >= range.from.getTime() && eventTime.getTime() <= range.to.getTime();
}

function buildFindingRowsForTimeframe(templates: FindingRow[], range: TimeframeRange): FindingRow[] {
  return buildHourlyEventRows(
    templates,
    range,
    (template, id, eventTime) => ({
      ...template,
      id,
      time: formatFindingRowTime(eventTime),
    }),
    { secondarySpikeTemplates: FINDINGS_SECONDARY_SPIKE_TEMPLATES },
  );
}

const FINDINGS_SECONDARY_SPIKE_TEMPLATES: FindingRow[] = [
  {
    id: "s1",
    severity: "Critical",
    category: "Incidents",
    title: "Coordinated after-hours spike across identity, network, and endpoint detections",
    description:
      "Multiple high-severity detections clustered around 21:30 UTC across identity, network, and endpoint telemetry, matching a coordinated intrusion correlation rule.",
    time: "2024-10-27 21:30:08",
    activity: "Post",
    status: "Failure",
    findingStatus: "New",
    eventType: "HTTP Activity",
    connector: demoTableConnector(0),
  },
  {
    id: "s2",
    severity: "Critical",
    category: "Detections",
    title: "Ransomware precursor behaviors clustered in evening activity window",
    description:
      "Shadow copy deletion, suspicious service creation, and outbound beaconing occurred within the same ten-minute window, consistent with pre-encryption staging.",
    time: "2024-10-27 21:30:18",
    activity: "Delete",
    status: "Failure",
    findingStatus: "New",
    eventType: "Vulnerability",
    connector: demoTableConnector(1),
  },
  {
    id: "s3",
    severity: "High",
    category: "Security",
    title: "Privilege escalation chain matched correlation rule after business hours",
    description:
      "A standard user account escalated to admin-equivalent roles through three discrete steps within minutes, with no linked change ticket.",
    time: "2024-10-27 21:30:28",
    activity: "Update",
    status: "Unknown",
    findingStatus: "New",
    eventType: "HTTP Activity",
    connector: demoTableConnector(2),
  },
];

const FINDING_CATEGORY_ORDER: FindingCategory[] = [
  "Vulnerabilities",
  "Compliance",
  "Detections",
  "Incidents",
  "Security",
  "Data Security",
];

const FINDING_SEVERITY_CHART_ORDER: SeverityLevel[] = ["Critical", "High", "Medium", "Low", "Informational"];

const FINDING_STATUS_ORDER: FindingStatus[] = ["New", "In Progress", "Resolved", "Suppressed"];

const FINDING_STATUS_COLORS: Record<FindingStatus, string> = {
  New: SEV_BAR.Critical,
  "In Progress": SEV_BAR.High,
  Resolved: CHART_CATEGORY_FILL,
  Suppressed: STATUS_UNKNOWN_FILL,
};

function horizontalBarScale(values: readonly number[]) {
  const peak = Math.max(...values, 1);
  const xMax = Math.max(5, Math.ceil(peak / 5) * 5);
  const step = xMax / 5;
  const xTicks = [0, step, step * 2, step * 3, step * 4, xMax].map((tick) => Math.round(tick));
  return { xMax, xTicks };
}

const FINDING_SEVERITY_ORDER: Record<keyof typeof SEV_BAR, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};

type FindingSortColumn = "severity" | "title" | "time" | "activity" | "status" | "eventType" | "connector";

/** px widths: select, severity, title, time, activity, status, event type, actions, connector */
const FINDING_EVENTS_SELECT_COL_WIDTH = 40;
const FINDING_EVENTS_COL_DEFAULTS: readonly number[] = [
  FINDING_EVENTS_SELECT_COL_WIDTH,
  108,
  260,
  168,
  88,
  112,
  120,
  56,
  120,
];
const FINDING_EVENTS_COL_MINS: readonly number[] = [
  FINDING_EVENTS_SELECT_COL_WIDTH,
  72,
  100,
  120,
  56,
  72,
  80,
  48,
  80,
];

const ROW_ACTION_ITEMS = ["Action one", "Action two", "Action three"] as const;

const ANALYTICS_TAB_CONTENT_CLASS = "mt-0 min-h-0 flex-1 focus-visible:outline-none";

function RowActionsMenu({ rowId }: { rowId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4"
          aria-label={`Actions for finding ${rowId}`}
        >
          <Icon name="navi-more-vert" size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[9rem] rounded border border-border-container bg-surface-modal py-1 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
      >
        {ROW_ACTION_ITEMS.map((label) => (
          <DropdownMenuItem key={label} className="cursor-pointer text-text-secondary focus:bg-overlay-subtle focus:text-text-primary">
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FindingDetailDialog({
  row,
  open,
  onClose,
}: {
  row: FindingRow | undefined;
  open: boolean;
  onClose: () => void;
}) {
  if (!row) return null;

  const eventType = EVENT_TYPE_ICON[row.eventType];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col gap-0 overflow-hidden border border-border-rule bg-surface-modal p-0 text-text-primary ring-0 shadow-xl"
      >
        <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-border-rule px-5 py-4">
          <div className="min-w-0 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">Finding</p>
            <DialogTitle className="mt-1 text-left text-page-title font-bold text-text-primary">{row.title}</DialogTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-auto shrink-0 p-1 text-text-tertiary hover:text-text-primary"
            aria-label="Close finding details"
            onClick={onClose}
          >
            <Icon name="close" size={20} />
          </Button>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityTableIcon name={SEVERITY_ICON[row.severity]} color={SEV_BAR[row.severity]} />
            <span className="text-sm font-semibold text-text-primary">{row.severity}</span>
            <span className="text-sm text-text-tertiary">·</span>
            <Icon
              name={eventType.name}
              size={16}
              className={cx("size-4 shrink-0 [&_svg]:!size-4", eventType.className)}
              aria-hidden
            />
            <span className="text-sm text-text-secondary">{row.eventType}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">{row.description}</p>
          <dl className="mt-6 space-y-3 border-t border-border-rule pt-4 text-sm">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-text-tertiary">Time</dt>
              <dd className="text-text-secondary">{row.time}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-text-tertiary">Activity</dt>
              <dd className="text-text-secondary">{row.activity}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-text-tertiary">Status</dt>
              <dd className="text-text-secondary">{row.status}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-text-tertiary">Connector</dt>
              <dd className="text-text-secondary">{row.connector}</dd>
            </div>
          </dl>
        </div>
        <DialogFooter className="mx-0 mb-0 shrink-0 gap-2 rounded-none border-t border-border-rule bg-transparent px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary-outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="default">
            View event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useFindingEventsTableGrid(rows: readonly Parameters<typeof FindingEventsTable>[0]["displayRows"][number][]) {
  const sortComparators = useMemo(
    (): Record<FindingSortColumn, (a: FindingRow, b: FindingRow) => number> => ({
      severity: (a, b) => FINDING_SEVERITY_ORDER[a.severity] - FINDING_SEVERITY_ORDER[b.severity],
      title: (a, b) => compareStrings(a.title, b.title),
      time: (a, b) => compareStrings(a.time, b.time),
      activity: (a, b) => compareStrings(a.activity, b.activity),
      status: (a, b) => compareStrings(a.status, b.status),
      eventType: (a, b) => compareStrings(a.eventType, b.eventType),
      connector: (a, b) => compareStrings(a.connector, b.connector),
    }),
    [],
  );
  return useSortedDataGridPagination(rows, sortComparators);
}

function FindingEventsTable({
  displayRows,
  getSortProps,
  onOpenFinding,
}: {
  displayRows: FindingRow[];
  getSortProps: ReturnType<typeof useFindingEventsTableGrid>["getSortProps"];
  onOpenFinding: (id: string) => void;
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
    selectColWidth: FINDING_EVENTS_SELECT_COL_WIDTH,
    colDefaults: FINDING_EVENTS_COL_DEFAULTS,
    colMins: FINDING_EVENTS_COL_MINS,
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
      <caption className="sr-only">Finding events</caption>
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
            <ColumnHeaderMenu
              label="Severity"
              menuLabel="Severity column options"
              {...getSortProps("severity")}
            />
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
            <ColumnHeaderMenu
              label="Event type"
              menuLabel="Event type column options"
              {...getSortProps("eventType")}
            />
            {resizeHandle(6)}
          </th>
          <th
            scope="col"
            style={colStyle(7)}
            className="relative border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
          >
            <span className="block translate-y-px truncate">Actions</span>
            {resizeHandle(7)}
          </th>
          <th
            scope="col"
            style={colStyle(8)}
            className="relative px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
          >
            <ColumnHeaderMenu label="Connectors" menuLabel="Connectors column options" {...getSortProps("connector")} />
            {resizeHandle(8)}
          </th>
        </tr>
      </thead>
      <tbody>
        {displayRows.map((row) => {
          const et = EVENT_TYPE_ICON[row.eventType];
          return (
            <tr key={row.id} className="border-b border-datavis-gridlines hover:bg-overlay-subtle">
              <td style={colStyle(0)} className="px-0 py-0 align-middle">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(c) => toggleRow(row.id, c)}
                    aria-label={`Select finding ${row.id}`}
                  />
                </div>
              </td>
              <td style={colStyle(1)} className="px-2 py-0 align-middle">
                <span className="inline-flex items-center gap-2">
                  <SeverityTableIcon name={SEVERITY_ICON[row.severity]} color={SEV_BAR[row.severity]} />
                  <span className="text-sm text-text-secondary">{row.severity}</span>
                </span>
              </td>
              <td style={colStyle(2)} className="min-w-0 px-2 py-0 align-middle">
                <TruncatedText
                  as="button"
                  className="w-full text-left text-sm font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                  onClick={() => onOpenFinding(row.id)}
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
              <td style={colStyle(6)} className="min-w-0 px-2 py-0 align-middle">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Icon
                    name={et.name}
                    size={16}
                    className={cx("size-4 shrink-0 [&_svg]:!size-4", et.className)}
                    aria-hidden
                  />
                  <TruncatedText className="text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
                    {row.eventType}
                  </TruncatedText>
                </span>
              </td>
              <td style={colStyle(7)} className="px-2 py-0 align-middle">
                <RowActionsMenu rowId={row.id} />
              </td>
              <td style={colStyle(8)} className="min-w-0 px-2 py-0 align-middle">
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

function FederatedAnalyticsComingSoon({ view }: { view: FederatedViewId }) {
  return (
    <main className="flex min-h-[320px] shrink-0 flex-col items-center justify-center gap-1 px-6 py-16">
      <p className="text-base-semibold text-text-primary">{federatedViewLabel(view)}</p>
      <p className="text-sm text-text-tertiary">Coming soon</p>
    </main>
  );
}

export function SummaryInsightsDashboard() {
  const navigate = useNavigate();
  const { setPendingFsqlSearch } = useCopilot();
  const {
    range: timeframe,
    analyticsBaselineRange,
    isAnalyticsChartZoomed,
    applyAnalyticsChartZoom,
    resetAnalyticsChartZoom,
  } = useTimeframe();
  const [activeView, setActiveView] = useState<FederatedViewId>(readDefaultFederatedView);
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<FindingCategory | null>(null);
  const [statusFilter, setStatusFilter] = useState<FindingStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);
  const [drawerFindingId, setDrawerFindingId] = useState<string | null>(null);
  const findingRowTemplates: FindingRow[] = useMemo(
    () => [
      {
        id: "1",
        severity: "Critical",
        category: "Detections",
        title: "Repeated POST requests to catalog service exceeded baseline volume",
        description:
          "Repeated POST requests to an internal catalog service exceeded baseline volume during peak traffic, indicating potential data exfiltration or misconfigured automation.",
        time: "2024-07-31 14:22:08",
        activity: "Post",
        status: "Failure",
        findingStatus: "New",
        eventType: "HTTP Activity",
        connector: demoTableConnector(0),
      },
      {
        id: "2",
        severity: "High",
        category: "Incidents",
        title: "Multiple failed logins from unusual region and follow-on activity",
        description:
          "Fifteen failed authentication attempts originated from an atypical geography, followed by a successful login from the same source within ten minutes.",
        time: "2024-07-31 13:05:41",
        activity: "Put",
        status: "Unknown",
        findingStatus: "New",
        eventType: "HTTP Activity",
        connector: demoTableConnector(1),
      },
      {
        id: "3",
        severity: "High",
        category: "Vulnerabilities",
        title: "Policy violation: privileged container launch detected in production",
        description:
          "A workload in the production namespace launched with privileged security context, violating the cluster hardening policy for non-system namespaces.",
        time: "2024-07-31 11:40:12",
        activity: "Delete",
        status: "Other",
        findingStatus: "In Progress",
        eventType: "Vulnerability",
        connector: demoTableConnector(2),
      },
      {
        id: "4",
        severity: "Medium",
        category: "Compliance",
        title: "Scheduled scan completed with warnings on production cluster",
        description:
          "The nightly vulnerability scan finished with warnings on three production cluster nodes where agent versions were out of compliance.",
        time: "2024-07-31 09:12:00",
        activity: "Connect",
        status: "New",
        findingStatus: "New",
        eventType: "HTTP Activity",
        connector: demoTableConnector(3),
      },
      {
        id: "5",
        severity: "Low",
        category: "Vulnerabilities",
        title: "Certificate renewal reminder for edge gateway cluster",
        description:
          "TLS certificates on the edge gateway cluster expire within fourteen days; automated renewal has not yet been confirmed for two ingress hosts.",
        time: "2024-07-30 22:18:55",
        activity: "Create",
        status: "In Progress",
        findingStatus: "In Progress",
        eventType: "Vulnerability",
        connector: demoTableConnector(4),
      },
      {
        id: "6",
        severity: "Informational",
        category: "Security",
        title: "Connector health check succeeded across all regions",
        description:
          "All configured connectors reported healthy heartbeat and ingestion latency within SLA across US, EU, and APAC regions.",
        time: "2024-07-30 18:00:03",
        activity: "Update",
        status: "Suppressed",
        findingStatus: "Suppressed",
        eventType: "Vulnerability",
        connector: demoTableConnector(5),
      },
      {
        id: "7",
        severity: "Critical",
        category: "Detections",
        title: "Anomalous outbound DNS tunneling pattern observed",
        description:
          "High-entropy DNS queries to a newly registered domain suggest possible DNS tunneling from a compromised host in the analytics subnet.",
        time: "2024-07-30 16:44:19",
        activity: "Post",
        status: "Failure",
        findingStatus: "New",
        eventType: "HTTP Activity",
        connector: demoTableConnector(6),
      },
      {
        id: "8",
        severity: "High",
        category: "Incidents",
        title: "Service principal credential rotation outside change window",
        description:
          "A service principal credential was rotated outside the approved change window without a linked change ticket in the ITSM system.",
        time: "2024-07-30 12:01:47",
        activity: "Put",
        status: "Unknown",
        findingStatus: "In Progress",
        eventType: "Vulnerability",
        connector: demoTableConnector(7),
      },
      {
        id: "9",
        severity: "Medium",
        category: "Detections",
        title: "Unusual API call volume from service account in staging",
        description:
          "A staging service account issued four times its normal API call volume over one hour, primarily against storage list endpoints.",
        time: "2024-07-30 09:33:22",
        activity: "Post",
        status: "New",
        findingStatus: "New",
        eventType: "HTTP Activity",
        connector: demoTableConnector(8),
      },
      {
        id: "10",
        severity: "Low",
        category: "Data Security",
        title: "Deprecated TLS version negotiated on internal load balancer",
        description:
          "An internal load balancer accepted TLS 1.0 during a health probe from a legacy monitoring agent that has not yet been upgraded.",
        time: "2024-07-29 21:15:08",
        activity: "Connect",
        status: "In Progress",
        findingStatus: "In Progress",
        eventType: "Vulnerability",
        connector: demoTableConnector(9),
      },
      {
        id: "11",
        severity: "Critical",
        category: "Vulnerabilities",
        title: "Ransomware-like file encryption activity detected on file server",
        description:
          "Rapid mass file renames and entropy spikes on a file server share match ransomware behavior patterns and require immediate containment.",
        time: "2024-07-29 17:48:51",
        activity: "Delete",
        status: "Failure",
        findingStatus: "New",
        eventType: "Vulnerability",
        connector: demoTableConnector(10),
      },
      {
        id: "12",
        severity: "Informational",
        category: "Compliance",
        title: "Weekly compliance report generated for SOC 2 controls",
        description:
          "The automated SOC 2 compliance report was generated successfully with no new control failures since the previous weekly run.",
        time: "2024-07-29 14:00:00",
        activity: "Create",
        status: "Suppressed",
        findingStatus: "Suppressed",
        eventType: "Vulnerability",
        connector: demoTableConnector(11),
      },
      {
        id: "13",
        severity: "High",
        category: "Incidents",
        title: "Impossible travel login attempt from two continents",
        description:
          "The same user account authenticated from North America and Europe within a thirty-minute window, exceeding plausible travel velocity.",
        time: "2024-07-29 08:27:36",
        activity: "Post",
        status: "Unknown",
        findingStatus: "New",
        eventType: "HTTP Activity",
        connector: demoTableConnector(12),
      },
      {
        id: "14",
        severity: "Medium",
        category: "Data Security",
        title: "S3 bucket policy changed to allow public read access",
        description:
          "An object storage bucket policy was modified to grant public read access to all objects, diverging from the organization baseline.",
        time: "2024-07-28 23:59:14",
        activity: "Update",
        status: "Other",
        findingStatus: "Resolved",
        eventType: "HTTP Activity",
        connector: demoTableConnector(13),
      },
    ],
    [],
  );


  const tableRows = useMemo(() => {
    return buildFindingRowsForTimeframe(findingRowTemplates, analyticsBaselineRange);
  }, [findingRowTemplates, analyticsBaselineRange]);

  const timeframeScopedRows = useMemo(
    () => tableRows.filter((row) => findingRowInTimeframe(row, timeframe)),
    [tableRows, timeframe],
  );

  const categoryRows = useMemo(() => {
    const counts = new Map<FindingCategory, number>();
    for (const row of timeframeScopedRows) {
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    }
    return FINDING_CATEGORY_ORDER.map((label) => ({
      label,
      value: counts.get(label) ?? 0,
    }));
  }, [timeframeScopedRows]);

  const categoryBarScale = useMemo(
    () => horizontalBarScale(categoryRows.map((row) => row.value)),
    [categoryRows],
  );

  const severityRows = useMemo(() => {
    const counts = new Map<SeverityLevel, number>();
    for (const row of timeframeScopedRows) {
      counts.set(row.severity, (counts.get(row.severity) ?? 0) + 1);
    }
    return FINDING_SEVERITY_CHART_ORDER.map((label) => ({
      label,
      value: counts.get(label) ?? 0,
      color: SEV_BAR[label],
    }));
  }, [timeframeScopedRows]);

  const severityBarScale = useMemo(
    () => horizontalBarScale(severityRows.map((row) => row.value)),
    [severityRows],
  );

  const findingStatusSegments = useMemo(() => {
    const counts = new Map<FindingStatus, number>();
    for (const row of timeframeScopedRows) {
      counts.set(row.findingStatus, (counts.get(row.findingStatus) ?? 0) + 1);
    }
    return FINDING_STATUS_ORDER.map((label) => ({
      label,
      color: FINDING_STATUS_COLORS[label],
      value: counts.get(label) ?? 0,
    }));
  }, [timeframeScopedRows]);

    const filteredTableRows = useMemo(
    () =>
      timeframeScopedRows.filter((row) => {
        if (categoryFilter && row.category !== categoryFilter) return false;
        if (severityFilter && row.severity !== severityFilter) return false;
        if (statusFilter && row.findingStatus !== statusFilter) return false;
        if (!findingMatchesSearch(row, searchQuery)) return false;
        return true;
      }),
    [timeframeScopedRows, categoryFilter, severityFilter, statusFilter, searchQuery],
  );
  const tableGrid = useFindingEventsTableGrid(filteredTableRows);

  const hasActiveFilters =
    categoryFilter != null || severityFilter != null || statusFilter != null;

  const drawerRow = useMemo(
    () => (drawerFindingId ? tableRows.find((row) => row.id === drawerFindingId) : undefined),
    [drawerFindingId, tableRows],
  );

  const handleCategoryBarClick = (label: string) => {
    if (!isFindingCategory(label)) return;
    setCategoryFilter((current) => (current === label ? null : label));
  };

  const handleSeverityBarClick = (label: string) => {
    if (!isSeverityLevel(label)) return;
    setSeverityFilter((current) => (current === label ? null : label));
  };

  const handleStatusClick = (label: string) => {
    if (!isFindingStatus(label)) return;
    setStatusFilter((current) => (current === label ? null : label));
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
        icon: SEVERITY_ICON.Medium,
        values: hourlySeverityValues(11, buckets, spikeIndex, secondarySpikeIndex),
      },
      {
        id: "High",
        label: "High",
        color: SEV_BAR.High,
        icon: SEVERITY_ICON.High,
        values: hourlySeverityValues(9, buckets, spikeIndex, secondarySpikeIndex),
      },
      {
        id: "Critical",
        label: "Critical",
        color: SEV_BAR.Critical,
        icon: SEVERITY_ICON.Critical,
        values: hourlySeverityValues(3, buckets, spikeIndex, secondarySpikeIndex),
      },
    ] as const;

    const spikeHighlight =
      spikeIndex != null
        ? { index: spikeIndex, label: `spike ~${SPIKE_CLOCK_HOUR}:00` }
        : undefined;

    return { series, xLabels, xTickIndices, xTickLabels, spikeHighlight, buckets };
  }, [timeframe]);

  const handleFindingsTimelineBrush = useCallback(
    ({ startIndex, endIndex }: { startIndex: number; endIndex: number }) => {
      const nextRange = timeframeFromBucketSelection(
        timeframe,
        eventsPerHourChart.buckets,
        startIndex,
        endIndex,
      );
      if (!nextRange) return;
      applyAnalyticsChartZoom(nextRange);
    },
    [timeframe, eventsPerHourChart.buckets, applyAnalyticsChartZoom],
  );

  return (
    <TooltipProvider>
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as FederatedViewId)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="sticky top-0 z-20 flex shrink-0 items-end justify-between gap-4 bg-surface-page px-6 pt-4">
          <TabsList
            variant="line"
            className="h-auto w-auto gap-6 rounded-none bg-transparent p-0"
            aria-label="Federated analytics views"
          >
            {FEDERATED_ANALYTICS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-auto flex-none rounded-none border-0 px-0 pb-3 text-sm font-semibold text-text-tertiary transition-colors hover:text-text-secondary [&::after]:hidden before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:bg-transparent before:transition-colors data-active:!bg-transparent data-active:before:bg-interactive-active data-active:text-text-primary data-active:shadow-none"
              >
                {tab.tabLabel}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            type="button"
            variant="secondary-outline"
            className="mb-3 h-8 shrink-0 ring-offset-surface-page"
            onClick={() => {
              setPendingFsqlSearch({ query: "" });
              void navigate(ROUTES.search);
            }}
          >
            <Search size={14} strokeWidth={1.5} className="size-3.5 shrink-0 text-current" aria-hidden />
            Start a New Search
          </Button>
        </div>

        <div className={cx(DATA_GRID_PAGE_SCROLL_OUTER_CLASS, "bg-surface-page")}>
          <div className={cx(DATA_GRID_PAGE_SCROLL_INNER_CLASS)}>
          <DatavisGridlineRule />

          <TabsContent value="entities-overview" className={ANALYTICS_TAB_CONTENT_CLASS}>
            <EntitiesOverviewContent />
          </TabsContent>
          <TabsContent value="system-activity" className={ANALYTICS_TAB_CONTENT_CLASS}>
            <SystemActivityContent />
          </TabsContent>
          <TabsContent value="identity-access" className={ANALYTICS_TAB_CONTENT_CLASS}>
            <IdentityAccessContent />
          </TabsContent>
          <TabsContent value="network-activity" className={ANALYTICS_TAB_CONTENT_CLASS}>
            <NetworkActivityContent />
          </TabsContent>
          <TabsContent value="discovery" className={ANALYTICS_TAB_CONTENT_CLASS}>
            <DiscoveryContent />
          </TabsContent>
          <TabsContent value="application-activity" className={ANALYTICS_TAB_CONTENT_CLASS}>
            <ApplicationActivityContent />
          </TabsContent>
          <TabsContent value="remediation" className={ANALYTICS_TAB_CONTENT_CLASS}>
            <RemediationContent />
          </TabsContent>
          <TabsContent value="findings" className={ANALYTICS_TAB_CONTENT_CLASS}>
            {isComingSoonFederatedView("findings") ? (
              <FederatedAnalyticsComingSoon view="findings" />
            ) : (
              <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
                <div className={DATA_GRID_ABOVE_SECTION_CLASS}>
                <InsightCard title="Finding Events Per Hour By Severity">
                  <ChartZoomHint
                    unit="Hours"
                    isChartZoomed={isAnalyticsChartZoomed}
                    onReset={resetAnalyticsChartZoom}
                  />
                  <TimeSeriesAreaChart
                    series={eventsPerHourChart.series}
                    xLabels={eventsPerHourChart.xLabels}
                    xTickIndices={eventsPerHourChart.xTickIndices}
                    xTickLabels={eventsPerHourChart.xTickLabels}
                    bucketStarts={eventsPerHourChart.buckets.map((bucket) => bucket.start)}
                    spikeHighlight={eventsPerHourChart.spikeHighlight}
                    ariaLabel="Finding events per hour by severity"
                    selectedSeriesId={severityFilter}
                    onSeriesClick={handleSeverityBarClick}
                    onBrushCommit={handleFindingsTimelineBrush}
                  />
                </InsightCard>

                <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
                  <InsightCard title="Finding Event Classes" fillHeight>
                    <HorizontalBarPanel
                      rows={categoryRows}
                      selectedLabel={categoryFilter}
                      onBarClick={handleCategoryBarClick}
                      filterAriaLabel={(label) => `Filter findings by ${label}`}
                      xMax={categoryBarScale.xMax}
                      xTicks={categoryBarScale.xTicks}
                    />
                  </InsightCard>
                  <InsightCard title="Findings Severity ID" fillHeight>
                    <HorizontalBarPanel
                      rows={severityRows}
                      selectedLabel={severityFilter}
                      onBarClick={handleSeverityBarClick}
                      filterAriaLabel={(label) => `Filter findings by ${label} severity`}
                      xMax={severityBarScale.xMax}
                      xTicks={severityBarScale.xTicks}
                    />
                  </InsightCard>
                  <InsightCard title="Findings By Status" fillHeight>
                    <DonutChartPanel
                      segments={findingStatusSegments}
                      total={timeframeScopedRows.length}
                      centerLabel="findings"
                      selectedLabel={statusFilter}
                      onSegmentClick={handleStatusClick}
                      ariaLabel="Findings by status"
                    />
                  </InsightCard>
                </div>
                </div>

                <DataGridSection
                  header={
                    <>
                      <h2 className="text-base-semibold text-text-primary">Finding Events</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <p className="shrink-0 text-base-small text-text-secondary">
                          {filteredTableRows.length} of {timeframeScopedRows.length} Results
                          {categoryFilter ? ` · ${categoryFilter}` : ""}
                          {severityFilter ? ` · ${severityFilter}` : ""}
                          {statusFilter ? ` · ${statusFilter}` : ""}
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
                            aria-label="Search findings"
                          />
                        </div>
                        {hasActiveFilters ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
                            onClick={() => {
                              setCategoryFilter(null);
                              setSeverityFilter(null);
                              setStatusFilter(null);
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
                  table={
                    <FindingEventsTable
                      displayRows={tableGrid.displayRows}
                      getSortProps={tableGrid.getSortProps}
                      onOpenFinding={setDrawerFindingId}
                    />
                  }
                  footer={<DataGridPaginationFooter grid={tableGrid} />}
                />
              </div>
            )}
          </TabsContent>
          </div>
        </div>
      </Tabs>

      <FindingDetailDialog
        row={drawerRow}
        open={drawerFindingId != null && activeView === "findings"}
        onClose={() => setDrawerFindingId(null)}
      />
    </div>
    </TooltipProvider>
  );
}
