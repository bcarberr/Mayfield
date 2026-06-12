import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Icon, type SeverityShapeIconName } from "../../design-system";
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
import { SourceEndpointsSankeyChart } from "./SourceEndpointsSankeyChart";

type NetworkSeverity = "Critical" | "High" | "Medium" | "Low" | "Informational";

const NETWORK_SEV_COLORS: Record<NetworkSeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
  Informational: "#9b6bac",
};

const NETWORK_SEV_ICONS: Record<NetworkSeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
  Informational: "severity-info",
};

const NETWORK_SEVERITY_ORDER: Record<NetworkSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};

type NetworkEventType = "HTTP Activity" | "Vulnerability";

const EVENT_TYPE_ICON: Record<NetworkEventType, { name: "network-activity" | "ocsf-findings"; className: string }> = {
  "HTTP Activity": {
    name: "network-activity",
    className: "text-datavis-data-peanut-orange",
  },
  Vulnerability: {
    name: "ocsf-findings",
    className: "text-datavis-data-smalt-green-40",
  },
};

function connectorSwatch(connector: string) {
  if (connector.startsWith("BCs")) return "bg-feedback-info";
  if (connector.includes("Athena")) return "bg-interactive-active";
  return "bg-feedback-negative";
}

type NetworkActivityRow = {
  id: string;
  severity: NetworkSeverity;
  title: string;
  time: string;
  activity: string;
  status: string;
  eventType: NetworkEventType;
  connector: string;
};

/** Same titles and column values as the Findings datagrid in SummaryInsightsDashboard. */
const NETWORK_ACTIVITY_ROWS: NetworkActivityRow[] = [
  {
    id: "1",
    severity: "Critical",
    title: "This and that happened over cat r…",
    time: "2024-07-31 14:22:08",
    activity: "Post",
    status: "Failure",
    eventType: "HTTP Activity",
    connector: "BCs1",
  },
  {
    id: "2",
    severity: "High",
    title: "Multiple failed logins from unusual region and follow-on…",
    time: "2024-07-31 13:05:41",
    activity: "Put",
    status: "Unknown",
    eventType: "HTTP Activity",
    connector: "BC-CS-Athena",
  },
  {
    id: "3",
    severity: "High",
    title: "Policy violation: privileged container launch detected in…",
    time: "2024-07-31 11:40:12",
    activity: "Delete",
    status: "Other",
    eventType: "Vulnerability",
    connector: "BC-CS",
  },
  {
    id: "4",
    severity: "Medium",
    title: "Scheduled scan completed with warnings on production cl…",
    time: "2024-07-31 09:12:00",
    activity: "Connect",
    status: "New",
    eventType: "HTTP Activity",
    connector: "BCs1",
  },
  {
    id: "5",
    severity: "Low",
    title: "Certificate renewal reminder for edge gateway cluster…",
    time: "2024-07-30 22:18:55",
    activity: "Create",
    status: "In Progress",
    eventType: "Vulnerability",
    connector: "BC-CS-Athena",
  },
  {
    id: "6",
    severity: "Informational",
    title: "Connector health check succeeded across all regions…",
    time: "2024-07-30 18:00:03",
    activity: "Update",
    status: "Suppressed",
    eventType: "Vulnerability",
    connector: "BCs1",
  },
  {
    id: "7",
    severity: "Critical",
    title: "Anomalous outbound DNS tunneling pattern observed…",
    time: "2024-07-30 16:44:19",
    activity: "Post",
    status: "Failure",
    eventType: "HTTP Activity",
    connector: "BC-CS-Athena",
  },
  {
    id: "8",
    severity: "High",
    title: "Service principal credential rotation outside change win…",
    time: "2024-07-30 12:01:47",
    activity: "Put",
    status: "Unknown",
    eventType: "Vulnerability",
    connector: "BC-CS",
  },
  {
    id: "9",
    severity: "Medium",
    title: "Unusual API call volume from service account in staging…",
    time: "2024-07-30 09:33:22",
    activity: "Post",
    status: "New",
    eventType: "HTTP Activity",
    connector: "BCs1",
  },
  {
    id: "10",
    severity: "Low",
    title: "Deprecated TLS version negotiated on internal load balanc…",
    time: "2024-07-29 21:15:08",
    activity: "Connect",
    status: "In Progress",
    eventType: "Vulnerability",
    connector: "BC-CS-Athena",
  },
  {
    id: "11",
    severity: "Critical",
    title: "Ransomware-like file encryption activity detected on fil…",
    time: "2024-07-29 17:48:51",
    activity: "Delete",
    status: "Failure",
    eventType: "Vulnerability",
    connector: "BC-CS",
  },
  {
    id: "12",
    severity: "Informational",
    title: "Weekly compliance report generated for SOC 2 controls…",
    time: "2024-07-29 14:00:00",
    activity: "Create",
    status: "Suppressed",
    eventType: "Vulnerability",
    connector: "BCs1",
  },
  {
    id: "13",
    severity: "High",
    title: "Impossible travel login attempt from two continents…",
    time: "2024-07-29 08:27:36",
    activity: "Post",
    status: "Unknown",
    eventType: "HTTP Activity",
    connector: "BC-CS-Athena",
  },
  {
    id: "14",
    severity: "Medium",
    title: "S3 bucket policy changed to allow public read access…",
    time: "2024-07-28 23:59:14",
    activity: "Update",
    status: "Other",
    eventType: "HTTP Activity",
    connector: "BC-CS",
  },
  {
    id: "15",
    severity: "Critical",
    title: "This and that happened over cat r…",
    time: "2024-07-31 14:22:08",
    activity: "Post",
    status: "Failure",
    eventType: "HTTP Activity",
    connector: "BCs1",
  },
  {
    id: "16",
    severity: "High",
    title: "Multiple failed logins from unusual region and follow-on…",
    time: "2024-07-31 13:05:41",
    activity: "Put",
    status: "Unknown",
    eventType: "HTTP Activity",
    connector: "BC-CS-Athena",
  },
  {
    id: "17",
    severity: "High",
    title: "Policy violation: privileged container launch detected in…",
    time: "2024-07-31 11:40:12",
    activity: "Delete",
    status: "Other",
    eventType: "Vulnerability",
    connector: "BC-CS",
  },
  {
    id: "18",
    severity: "Medium",
    title: "Scheduled scan completed with warnings on production cl…",
    time: "2024-07-31 09:12:00",
    activity: "Connect",
    status: "New",
    eventType: "HTTP Activity",
    connector: "BCs1",
  },
  {
    id: "19",
    severity: "Low",
    title: "Certificate renewal reminder for edge gateway cluster…",
    time: "2024-07-30 22:18:55",
    activity: "Create",
    status: "In Progress",
    eventType: "Vulnerability",
    connector: "BC-CS-Athena",
  },
  {
    id: "20",
    severity: "Informational",
    title: "Connector health check succeeded across all regions…",
    time: "2024-07-30 18:00:03",
    activity: "Update",
    status: "Suppressed",
    eventType: "Vulnerability",
    connector: "BCs1",
  },
];

const TOTAL_NETWORK_RESULTS = 1384;

const ROW_ACTION_ITEMS = ["Action one", "Action two", "Action three"] as const;

function RowActionsMenu({ rowId }: { rowId: string }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.right,
        transform: "translateX(-100%)",
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        const menu = document.getElementById(`network-actions-menu-${rowId}`);
        if (menu && menu.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, rowId]);

  return (
    <div className="relative flex justify-start">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        className="size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4"
        aria-label={`Actions for network event ${rowId}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="navi-more-vert" size={16} />
      </Button>
      {open
        ? createPortal(
            <div
              id={`network-actions-menu-${rowId}`}
              role="menu"
              aria-label={`Actions for network event ${rowId}`}
              style={menuStyle}
              className="z-50 min-w-[9rem] rounded border border-border-container bg-surface-modal py-1 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
            >
              {ROW_ACTION_ITEMS.map((label) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left text-sm text-text-secondary transition-colors hover:bg-overlay-subtle hover:text-text-primary"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

type NetworkSortColumn = "severity" | "title" | "time" | "activity" | "status" | "eventType" | "connector";

/** px widths: select, severity, title, time, activity, status, event type, connector, actions */
const NETWORK_SELECT_COL_WIDTH = 40;
const NETWORK_COL_DEFAULTS: readonly number[] = [
  NETWORK_SELECT_COL_WIDTH,
  108,
  260,
  168,
  88,
  112,
  120,
  120,
  56,
];
const NETWORK_COL_MINS: readonly number[] = [
  NETWORK_SELECT_COL_WIDTH,
  72,
  100,
  120,
  56,
  72,
  80,
  80,
  48,
];

function networkMatchesSearch(row: NetworkActivityRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.severity,
    row.title,
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
    selectColWidth: NETWORK_SELECT_COL_WIDTH,
    colDefaults: NETWORK_COL_DEFAULTS,
    colMins: NETWORK_COL_MINS,
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
      severity: (a, b) => NETWORK_SEVERITY_ORDER[a.severity] - NETWORK_SEVERITY_ORDER[b.severity],
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
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Title" menuLabel="Title column options" {...getSortProps("title")} />
              {resizeHandle(2)}
            </th>
            <th
              scope="col"
              style={colStyle(3)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Time" menuLabel="Time column options" {...getSortProps("time")} />
              {resizeHandle(3)}
            </th>
            <th
              scope="col"
              style={colStyle(4)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Activity" menuLabel="Activity column options" {...getSortProps("activity")} />
              {resizeHandle(4)}
            </th>
            <th
              scope="col"
              style={colStyle(5)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Status" menuLabel="Status column options" {...getSortProps("status")} />
              {resizeHandle(5)}
            </th>
            <th
              scope="col"
              style={colStyle(6)}
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
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
              className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <ColumnHeaderMenu label="Connector" menuLabel="Connector column options" {...getSortProps("connector")} />
              {resizeHandle(7)}
            </th>
            <th
              scope="col"
              style={colStyle(8)}
              className="relative h-10 px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
            >
              <span className="block translate-y-px truncate">Actions</span>
              {resizeHandle(8)}
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => {
            const et = EVENT_TYPE_ICON[row.eventType];
            return (
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
                    <SeverityTableIcon
                      name={NETWORK_SEV_ICONS[row.severity]}
                      color={NETWORK_SEV_COLORS[row.severity]}
                    />
                    <span className="text-sm text-text-secondary">{row.severity}</span>
                  </span>
                </td>
                <td style={colStyle(2)} className="h-10 min-w-0 px-2 py-0 align-middle">
                  <TruncatedText
                    as="button"
                    className="w-full text-left text-sm font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                  >
                    {row.title}
                  </TruncatedText>
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
                <td style={colStyle(8)} className="h-10 px-2 py-0 align-middle">
                  <RowActionsMenu rowId={row.id} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Figma `9680:18627` — Network Activity body for Federated Analytics. */
export function NetworkActivityContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);

  const filteredRows = useMemo(
    () => NETWORK_ACTIVITY_ROWS.filter((row) => networkMatchesSearch(row, searchQuery)),
    [searchQuery],
  );

  const hasActiveFilters = searchQuery.trim().length > 0;

  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <InsightCard title="Top 15 Source Endpoints">
        <div className="-mx-3 -mt-3 sm:-mx-4 sm:-mt-3">
          <SourceEndpointsSankeyChart />
        </div>
      </InsightCard>

      <section className="mx-0 mb-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2)]">
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-6 pt-3 sm:pl-5">
          <h2 className="text-base-semibold text-text-primary">Network Activity</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="shrink-0 text-base-small text-text-secondary">
              {filteredRows.length} of {TOTAL_NETWORK_RESULTS} Results
              {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            </p>
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="!bg-datavis-card-bg"
                aria-label="Search network activity"
              />
            </div>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
                onClick={() => setSearchQuery("")}
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
