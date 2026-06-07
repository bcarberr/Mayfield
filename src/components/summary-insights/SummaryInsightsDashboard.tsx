import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../design-system";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { Input } from "../ui/Input";
import { useResizableColumns } from "../ui/useResizableColumns";
import { Checkbox } from "../uiCheckbox";
import { ROUTES } from "../../app/routes";
import { FederatedAnalyticsBreadcrumb } from "./FederatedAnalyticsBreadcrumb";

/** Figma Framework-Keyframes `4524:35393` — horizontal bar fills (dark datavis). */
const CHART_CATEGORY_FILL = "#6dc6a1";
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

const X_MAX = 500;
const X_TICKS = [0, 100, 200, 300, 400, 500] as const;

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Horizontal rule using Datavis/Gridlines; inset 20px per side by default. */
function DatavisGridlineRule({ inset = true }: { inset?: boolean }) {
  return <div className={cx("h-px shrink-0 bg-datavis-gridlines", inset && "mx-[20px]")} aria-hidden />;
}

type BarRow = { label: string; value: number; color?: string };

function ChartGridLines() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-[20px] right-[20px] flex justify-between"
      aria-hidden
    >
      {X_TICKS.map((t) => (
        <div
          key={t}
          className="flex h-full w-0 justify-center"
          style={{ marginLeft: t === 0 ? 0 : undefined }}
        >
          <div className="h-full w-px bg-datavis-gridlines" />
        </div>
      ))}
    </div>
  );
}

function HorizontalBarPanel({
  rows,
  selectedLabel,
  onBarClick,
}: {
  rows: BarRow[];
  selectedLabel?: SeverityLevel | null;
  onBarClick?: (label: SeverityLevel) => void;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-full">
      <div className="relative flex min-h-[200px] flex-1 flex-col">
        <ChartGridLines />
        <div className="relative flex h-full min-h-0 flex-col justify-between">
          {rows.map((row) => {
            const pct = Math.min(100, Math.max((row.value / X_MAX) * 100, row.value > 0 ? 6 : 0));
            const fill = row.color ?? CHART_CATEGORY_FILL;
            const severityLabel = isSeverityLevel(row.label) ? row.label : null;
            const interactive = Boolean(onBarClick && severityLabel);
            const selected = interactive && selectedLabel === severityLabel;
            const filterActive = interactive && selectedLabel != null;
            const dimmed = filterActive && !selected;

            const rowBody = (
              <>
                <span
                  className={cx(
                    "w-[5.5rem] shrink-0 text-right text-base-small transition-colors sm:w-28",
                    "group-hover:font-semibold group-hover:text-text-primary",
                    selected
                      ? "font-semibold text-text-primary"
                      : dimmed
                        ? "text-text-disabled"
                        : "text-text-tertiary",
                  )}
                >
                  {row.label}
                </span>
                <div className="flex min-h-5 min-w-0 flex-1 items-center gap-[8px]">
                  <div
                    className={cx(
                      "h-5 shrink-0 rounded-sm transition-opacity duration-150",
                      dimmed ? "opacity-35 group-hover:opacity-55" : interactive && !selected && "opacity-90 group-hover:opacity-100",
                    )}
                    style={{
                      width: `min(${pct}%, calc(100% - 3.25rem))`,
                      backgroundColor: fill,
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

            if (interactive && severityLabel) {
              return (
                <button
                  key={row.label}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Filter findings by ${row.label} severity`}
                  className={cx(
                    "group flex min-h-6 w-full shrink-0 items-center gap-2 rounded-sm text-left sm:gap-3",
                    "cursor-pointer transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-datavis-card-bg",
                  )}
                  onClick={() => onBarClick!(severityLabel)}
                >
                  {rowBody}
                </button>
              );
            }

            return (
              <div key={row.label} className="flex min-h-6 shrink-0 items-center gap-2 sm:gap-3">
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
        {X_TICKS.map((t) => (
          <span key={t} className="w-8 shrink-0 text-center tabular-nums first:w-6 first:text-left last:text-right">
            {t}
          </span>
        ))}
      </div>
      <p className="mt-1 shrink-0 text-center text-base-semibold text-text-primary">Findings</p>
    </div>
  );
}

function InsightCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cx(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container lg:h-full",
        "bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2),0_2px_2px_rgba(0,0,0,0.14)]",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 bg-datavis-card-bg px-4 py-3 sm:px-5">
        <h2 className="min-w-0 truncate text-base-semibold text-text-primary">{title}</h2>
        <Button variant="ghost" className="shrink-0 p-1 text-text-tertiary hover:text-text-primary" aria-label="Chart options">
          <Icon name="navi-more-vert" />
        </Button>
      </header>
      <DatavisGridlineRule />
      <div className="flex min-h-0 flex-1 flex-col bg-datavis-card-bg px-3 pb-4 pt-3 sm:px-4">{children}</div>
    </section>
  );
}

type FindingRow = {
  id: string;
  severity: keyof typeof SEV_BAR;
  title: string;
  time: string;
  activity: string;
  status: string;
  eventType: string;
  connector: string;
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

function connectorSwatch(connector: string) {
  if (connector.startsWith("BCs")) return "bg-feedback-info";
  if (connector.includes("Athena")) return "bg-interactive-active";
  return "bg-feedback-negative";
}

function eventTypeIconMeta(eventType: string): { name: "network-activity" | "feedback-info" | "severity-other"; className: string } {
  const t = eventType.toLowerCase();
  if (t.includes("http") || t.includes("activity")) {
    return { name: "network-activity", className: "text-datavis-data-peanut-orange" };
  }
  if (t.includes("vulnerab") || t.includes("incident") || t.includes("detection")) {
    return { name: "feedback-info", className: "text-feedback-positive" };
  }
  return { name: "severity-other", className: "text-text-tertiary" };
}

/** px widths: select, severity, title, time, activity, status, event type, connector, actions */
const FINDING_EVENTS_SELECT_COL_WIDTH = 40;
const FINDING_EVENTS_COL_DEFAULTS: readonly number[] = [
  FINDING_EVENTS_SELECT_COL_WIDTH,
  108,
  260,
  168,
  88,
  112,
  120,
  120,
  56,
];
const FINDING_EVENTS_COL_MINS: readonly number[] = [
  FINDING_EVENTS_SELECT_COL_WIDTH,
  72,
  100,
  120,
  56,
  72,
  80,
  80,
  48,
];

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
        const menu = document.getElementById(`finding-actions-menu-${rowId}`);
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
        aria-label={`Actions for finding ${rowId}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="navi-more-vert" size={16} />
      </Button>
      {open
        ? createPortal(
            <div
              id={`finding-actions-menu-${rowId}`}
              role="menu"
              aria-label={`Actions for finding ${rowId}`}
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

function FindingEventsTable({ rows }: { rows: FindingRow[] }) {
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

  return (
    <div ref={containerRef} className={cx("min-h-0 w-full min-w-0", isResizing && "select-none")}>
      <table
        className="table-fixed border-collapse text-left text-sm"
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
            <ColumnHeaderMenu label="Severity" menuLabel="Severity column options" />
            {resizeHandle(1)}
          </th>
          <th
            scope="col"
            style={colStyle(2)}
            className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
          >
            <ColumnHeaderMenu label="Title" menuLabel="Title column options" />
            {resizeHandle(2)}
          </th>
          <th
            scope="col"
            style={colStyle(3)}
            className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
          >
            <ColumnHeaderMenu label="Time" menuLabel="Time column options" />
            {resizeHandle(3)}
          </th>
          <th
            scope="col"
            style={colStyle(4)}
            className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
          >
            <ColumnHeaderMenu label="Activity" menuLabel="Activity column options" />
            {resizeHandle(4)}
          </th>
          <th
            scope="col"
            style={colStyle(5)}
            className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
          >
            <ColumnHeaderMenu label="Status" menuLabel="Status column options" />
            {resizeHandle(5)}
          </th>
          <th
            scope="col"
            style={colStyle(6)}
            className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
          >
            <ColumnHeaderMenu label="Event type" menuLabel="Event type column options" />
            {resizeHandle(6)}
          </th>
          <th
            scope="col"
            style={colStyle(7)}
            className="relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary"
          >
            <ColumnHeaderMenu label="Connector" menuLabel="Connector column options" />
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
        {rows.map((row) => {
          const et = eventTypeIconMeta(row.eventType);
          return (
            <tr key={row.id} className="h-10 border-b border-datavis-gridlines hover:bg-overlay-subtle">
              <td style={colStyle(0)} className="h-10 px-0 py-0 align-middle">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(c) => toggleRow(row.id, c)}
                    aria-label={`Select finding ${row.id}`}
                  />
                </div>
              </td>
              <td style={colStyle(1)} className="h-10 px-2 py-0 align-middle">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-3 w-2.5 shrink-0 items-center justify-center overflow-hidden [&_svg]:block [&_svg]:!h-3 [&_svg]:!w-2.5">
                    <Icon
                      name={SEVERITY_ICON[row.severity]}
                      size={12}
                      style={{ color: SEV_BAR[row.severity] }}
                      aria-hidden
                    />
                  </span>
                  <span className="text-sm text-text-secondary">{row.severity}</span>
                </span>
              </td>
              <td style={colStyle(2)} className="h-10 min-w-0 px-2 py-0 align-middle">
                <span className="block truncate text-sm text-text-secondary">{row.title}</span>
              </td>
              <td style={colStyle(3)} className="h-10 px-2 py-0 align-middle tabular-nums">
                <span className="text-sm text-text-secondary">{row.time}</span>
              </td>
              <td style={colStyle(4)} className="h-10 px-2 py-0 align-middle">
                <span className="text-sm text-text-secondary">{row.activity}</span>
              </td>
              <td style={colStyle(5)} className="h-10 px-2 py-0 align-middle">
                <span className="text-sm text-text-secondary">{row.status}</span>
              </td>
              <td style={colStyle(6)} className="h-10 px-2 py-0 align-middle">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Icon name={et.name} className={cx("shrink-0", et.className)} aria-hidden />
                  <span className="truncate text-sm text-text-secondary">{row.eventType}</span>
                </span>
              </td>
              <td style={colStyle(7)} className="h-10 px-2 py-0 align-middle">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span
                    className={cx("size-2.5 shrink-0 rounded-sm", connectorSwatch(row.connector))}
                    aria-hidden
                  />
                  <span className="truncate text-sm text-text-secondary">{row.connector}</span>
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

export function SummaryInsightsDashboard() {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | null>(null);
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>(null);
  const categoryRows: BarRow[] = useMemo(
    () => [
      { label: "Vulnerabilities", value: 408 },
      { label: "Compliance", value: 321 },
      { label: "Detections", value: 280 },
      { label: "Incidents", value: 150 },
      { label: "Security", value: 75 },
      { label: "Data Security", value: 75 },
    ],
    [],
  );

  const severityRows: BarRow[] = useMemo(
    () => [
      { label: "Critical", value: 125, color: SEV_BAR.Critical },
      { label: "High", value: 203, color: SEV_BAR.High },
      { label: "Medium", value: 434, color: SEV_BAR.Medium },
      { label: "Low", value: 264, color: SEV_BAR.Low },
      { label: "Informational", value: 456, color: SEV_BAR.Informational },
    ],
    [],
  );

  const tableRows: FindingRow[] = useMemo(
    () => [
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
        eventType: "Detection",
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
        eventType: "Incident",
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
        eventType: "Detection",
        connector: "BC-CS-Athena",
      },
      {
        id: "11",
        severity: "Critical",
        title: "Ransomware-like file encryption activity detected on fil…",
        time: "2024-07-29 17:48:51",
        activity: "Delete",
        status: "Failure",
        eventType: "Incident",
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
        eventType: "Detection",
        connector: "BC-CS",
      },
    ],
    [],
  );

  const filteredTableRows = useMemo(
    () => (severityFilter ? tableRows.filter((row) => row.severity === severityFilter) : tableRows),
    [tableRows, severityFilter],
  );

  const handleSeverityBarClick = (severity: SeverityLevel) => {
    setSeverityFilter((current) => (current === severity ? null : severity));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-page">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
        <FederatedAnalyticsBreadcrumb />
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => void navigate(ROUTES.search)}
        >
          Start a New Search
        </Button>
      </div>
      <DatavisGridlineRule />

      <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 p-4 sm:p-5 lg:grid-cols-2 lg:grid-rows-1">
        <InsightCard title="Categories of Finding Events">
          <HorizontalBarPanel rows={categoryRows} />
        </InsightCard>
        <InsightCard title="Findings Severity ID">
          <HorizontalBarPanel
            rows={severityRows}
            selectedLabel={severityFilter}
            onBarClick={handleSeverityBarClick}
          />
        </InsightCard>
      </div>

      <section className="mx-4 mb-5 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2)] sm:mx-5">
        <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-[20px] pt-3 sm:pl-5">
          <h2 className="text-base-semibold text-text-primary">Finding Events</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="shrink-0 text-base-small text-text-secondary">
              {filteredTableRows.length} of {tableRows.length} Results
              {severityFilter ? ` · ${severityFilter}` : ""}
            </p>
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                className="h-7 !bg-datavis-card-bg"
                aria-label="Search findings"
              />
            </div>
            {severityFilter ? (
              <Button
                type="button"
                variant="ghost"
                className="h-7 shrink-0 px-2 text-base-small text-text-tertiary hover:text-text-primary"
                onClick={() => setSeverityFilter(null)}
              >
                Clear severity filter
              </Button>
            ) : null}
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
            <FindingEventsTable rows={filteredTableRows} />
          </div>
        </div>
      </section>
    </div>
  );
}
