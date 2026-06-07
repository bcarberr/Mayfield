import { useMemo, useState, type ReactNode } from "react";
import { Icon, Switch, type IconName } from "../../design-system";
import { Button } from "../ui/Button";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Figma `7671:7964` — Manage Detections tab content. */
const HUB_TABS = [
  "Manage Detections",
  "Detection Library",
  "Queued For Review",
  "Detection History",
] as const;

type HubTab = (typeof HUB_TABS)[number];

type DetectionSeverity = "Fatal" | "Critical" | "High" | "Medium" | "Low";

type DetectionRow = {
  id: string;
  name: string;
  enabled: boolean;
  severity: DetectionSeverity;
  lastRun: string;
  recurrence: string;
  findings: number | "error" | "none";
};

const SEV_COLORS: Record<DetectionSeverity, string> = {
  Fatal: "#ff604a",
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
};

const SEV_ICONS: Record<DetectionSeverity, IconName> = {
  Fatal: "severity-fatal",
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
};

const DETECTION_ROWS: DetectionRow[] = [
  {
    id: "1",
    name: "Suspicious PowerShell Execution",
    enabled: true,
    severity: "Fatal",
    lastRun: "1 min ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 2,
  },
  {
    id: "2",
    name: "Lateral Movement via SMB",
    enabled: true,
    severity: "Critical",
    lastRun: "22 mins ago",
    recurrence: "Every Tue 12:00 AM",
    findings: "error",
  },
  {
    id: "3",
    name: "Credential Dumping Activity",
    enabled: true,
    severity: "High",
    lastRun: "58 mins ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 5,
  },
  {
    id: "4",
    name: "Unusual Outbound DNS Queries",
    enabled: false,
    severity: "High",
    lastRun: "1 hour 15 mins ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 2,
  },
  {
    id: "5",
    name: "Privilege Escalation Attempts",
    enabled: true,
    severity: "Medium",
    lastRun: "—",
    recurrence: "—",
    findings: "none",
  },
  {
    id: "6",
    name: "Suspicious PowerShell Execution",
    enabled: true,
    severity: "Medium",
    lastRun: "6 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 2,
  },
  {
    id: "7",
    name: "Lateral Movement via SMB",
    enabled: true,
    severity: "Critical",
    lastRun: "7 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 1,
  },
  {
    id: "8",
    name: "Credential Dumping Activity",
    enabled: false,
    severity: "Low",
    lastRun: "8 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 1,
  },
  {
    id: "9",
    name: "Unusual Outbound DNS Queries",
    enabled: true,
    severity: "Medium",
    lastRun: "10 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 2,
  },
  {
    id: "10",
    name: "Privilege Escalation Attempts",
    enabled: true,
    severity: "High",
    lastRun: "18 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 3,
  },
];

function HubCard({
  title,
  titleTrailing,
  children,
  className,
}: {
  title: string;
  titleTrailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-datavis-card",
        className,
      )}
    >
      <header className="flex shrink-0 items-center gap-3 bg-datavis-card-bg px-4 py-3 sm:px-6">
        <h2 className="shrink-0 text-base-semibold text-text-primary">{title}</h2>
        {titleTrailing ? (
          <div className="min-w-0 flex-1 text-right">{titleTrailing}</div>
        ) : (
          <div className="flex-1" aria-hidden />
        )}
        <Button variant="ghost" className="shrink-0 p-1 text-text-tertiary hover:text-text-primary" aria-label="Card options">
          <Icon name="navi-more-vert" size={16} />
        </Button>
      </header>
      <div className="mx-4 h-px shrink-0 bg-datavis-gridlines sm:mx-6" aria-hidden />
      <div className="flex min-h-0 flex-1 flex-col bg-datavis-card-bg p-4 sm:p-6 sm:pt-4">{children}</div>
    </section>
  );
}

function HubTabs({ active, onChange }: { active: HubTab; onChange: (tab: HubTab) => void }) {
  return (
    <nav className="flex shrink-0 gap-6 border-b border-border-rule px-6" aria-label="Detection hub sections">
      {HUB_TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            className={cx(
              "-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors",
              isActive
                ? "border-interactive-active text-text-primary"
                : "border-transparent text-text-tertiary hover:text-text-secondary",
            )}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(tab)}
          >
            {tab}
          </button>
        );
      })}
    </nav>
  );
}

/** Figma `7671:8909` — System Health widget. */
function SystemHealthCard() {
  return (
    <HubCard
      className="h-full"
      title="System Health"
      titleTrailing={<span className="text-sm font-semibold text-text-tertiary">Last evaluated: 18h ago</span>}
    >
      <div className="grid grid-cols-[27px_minmax(0,1fr)] gap-x-3 gap-y-4">
        <Icon
          name="action-check"
          size={20}
          className="inline-flex h-5 w-[27px] shrink-0 self-center text-text-primary [&>svg]:!h-5 [&>svg]:!w-[27px]"
          aria-hidden
        />
        <span className="text-2xl font-bold tracking-wide text-text-primary">System Healthy</span>
        <ul className="col-start-2 space-y-3">
          <li className="flex items-baseline gap-3">
            <span className="w-16 shrink-0 text-2xl font-bold tabular-nums text-text-primary">65/79</span>
            <span className="text-sm font-semibold text-text-primary">Detections running normally</span>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="flex w-16 shrink-0 items-center gap-1">
              <span className="text-2xl font-bold tabular-nums text-text-primary">9</span>
              <Icon name="warning" size={18} className="text-feedback-negative" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-text-primary">Detections need attention</span>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-16 shrink-0 text-2xl font-bold tabular-nums text-text-primary">5</span>
            <span className="text-sm font-semibold text-text-primary">Detections are inactive</span>
          </li>
        </ul>
        <div className="col-start-2 flex justify-end pt-1">
          <Button type="button" variant="secondary" size="small">
            View detections need attentions
          </Button>
        </div>
      </div>
    </HubCard>
  );
}

/** Figma `7671:8959` / donut `7671:9014` — 188px ring, 137px hole. */
const TOP_FINDINGS_DONUT_OUTER_PX = 188;
const TOP_FINDINGS_DONUT_INNER_PX = 137;
const TOP_FINDINGS_DONUT_INSET_PX = (TOP_FINDINGS_DONUT_OUTER_PX - TOP_FINDINGS_DONUT_INNER_PX) / 2;

function TopFindingsCard() {
  const segments = [
    { label: "Suspicious PowerShell Execution", color: "#b4549a" },
    { label: "Privilege Escalation Attempts", color: "#817cf6" },
    { label: "Credential Dumping Activity", color: "#5fd3f8" },
  ] as const;

  const gradient = "conic-gradient(#b4549a 0% 38%, #817cf6 38% 70%, #5fd3f8 70% 100%)";

  return (
    <HubCard className="h-full" title="Top Findings Detection">
      <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div
          className="relative shrink-0 rounded-full"
          style={{ width: TOP_FINDINGS_DONUT_OUTER_PX, height: TOP_FINDINGS_DONUT_OUTER_PX, background: gradient }}
          aria-hidden
        >
          <div
            className="absolute flex flex-col items-center justify-center rounded-full bg-datavis-card-bg text-center text-text-primary"
            style={{ inset: TOP_FINDINGS_DONUT_INSET_PX }}
          >
            {/* Figma `7671:9022` — markdown-h1: Lato 24 / 32, tracking 0.7px, regular. */}
            <span className="text-2xl font-normal leading-8 tracking-[0.7px] tabular-nums">1389</span>
            <span className="text-2xl font-normal leading-8 tracking-[0.7px]">Findings</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-3">
          {segments.map((s) => (
            <li key={s.label} className="flex items-start gap-2.5 text-sm font-semibold text-text-primary">
              <span
                className="mt-1 size-3.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </HubCard>
  );
}

/** Figma `7671:9039` — Severity breakdown bars. */
function SeverityBreakdownCard() {
  const rows = useMemo(
    () => [
      { label: "Critical", value: 118, color: SEV_COLORS.Critical },
      { label: "High", value: 337, color: SEV_COLORS.High },
      { label: "Medium", value: 667, color: SEV_COLORS.Medium },
      { label: "Low", value: 267, color: SEV_COLORS.Low },
    ],
    [],
  );
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <HubCard className="h-full" title="Severity Breakdown (Overall 1389 Findings)">
      <div
        className="flex flex-1 flex-col justify-between"
        style={{ minHeight: TOP_FINDINGS_DONUT_OUTER_PX - 24 }}
      >
        {rows.map((row) => (
          <div key={row.label} className="flex min-h-[34px] flex-col justify-end gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-text-primary">{row.label}</span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-text-primary">{row.value}</span>
            </div>
            <div className="relative h-3 rounded-sm bg-datavis-gridlines">
              <div
                className="absolute inset-y-0 left-0 rounded-sm"
                style={{
                  width: `${Math.max(6, (row.value / max) * 100)}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </HubCard>
  );
}

function DetectionActions({ name }: { name: string }) {
  const btn = "size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4";

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button type="button" variant="ghost" className={btn} aria-label={`Edit ${name}`}>
        <Icon name="action-edit" size={16} />
      </Button>
      <Button type="button" variant="ghost" className={btn} aria-label={`Copy ${name}`}>
        <Icon name="action-content-copy" size={16} />
      </Button>
      <Button type="button" variant="ghost" className={btn} aria-label={`Delete ${name}`}>
        <Icon name="action-delete" size={16} />
      </Button>
      <Button type="button" variant="ghost" className={btn} aria-label={`More actions for ${name}`}>
        <Icon name="navi-more-vert" size={16} />
      </Button>
    </div>
  );
}

function FindingsCell({ findings }: { findings: DetectionRow["findings"] }) {
  if (findings === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-feedback-negative">
        <Icon name="error-outline" size={16} aria-hidden />
        Error
      </span>
    );
  }
  if (findings === "none") {
    return <span className="text-sm text-text-secondary">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
      <Icon name="search" size={14} className="text-text-tertiary" aria-hidden />
      <span className="tabular-nums">{findings}</span>
    </span>
  );
}

function DetectionsTable({
  rows,
  tableTool,
  onTableToolChange,
}: {
  rows: DetectionRow[];
  tableTool: FilterColumnPanelTool | null;
  onTableToolChange: (tool: FilterColumnPanelTool | null) => void;
}) {
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.enabled])),
  );

  const thClass =
    "h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary last:border-r-0";
  const tdClass = "h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-sm text-text-secondary last:border-r-0";

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-datavis-card">
      <div className="flex shrink-0 items-center gap-2 border-b border-datavis-gridlines px-4 py-2 sm:px-5">
        <Button
          type="button"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-sm text-text-tertiary hover:text-text-primary [&_svg]:!size-4"
        >
          <Icon name="action-filter-list" size={16} aria-hidden />
          Clear All Filters
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 overflow-auto">
        <FilterColumnPanel
          active={tableTool}
          onFilterClick={() => onTableToolChange(tableTool === "filter" ? null : "filter")}
          onColumnsClick={() => onTableToolChange(tableTool === "columns" ? null : "columns")}
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-x-auto pb-3">
          <table className="w-full min-w-[960px] table-fixed border-collapse text-left">
            <caption className="sr-only">Manage detections</caption>
            <thead>
              <tr className="border-b border-datavis-gridlines bg-surface-table-row-header">
                <th scope="col" className={cx(thClass, "w-8 px-0")} />
                <th scope="col" className={cx(thClass, "w-[26%]")}>
                  Detections
                </th>
                <th scope="col" className={cx(thClass, "w-[8%]")}>
                  State
                </th>
                <th scope="col" className={cx(thClass, "w-[12%]")}>
                  Severity
                </th>
                <th scope="col" className={cx(thClass, "w-[12%]")}>
                  Last Run
                </th>
                <th scope="col" className={cx(thClass, "w-[14%]")}>
                  Recurrence
                </th>
                <th scope="col" className={cx(thClass, "w-[12%]")}>
                  Detection Findings
                </th>
                <th scope="col" className={cx(thClass, "w-[14%] px-0 text-center")}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="h-10 border-b border-datavis-gridlines hover:bg-overlay-subtle">
                  <td className={cx(tdClass, "px-0")}>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="p-1 text-text-tertiary hover:text-text-primary"
                        aria-label={`Expand ${row.name}`}
                      >
                        <Icon name="navi-chevron-right" size={16} />
                      </button>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <span className="block truncate font-semibold text-text-primary">{row.name}</span>
                  </td>
                  <td className={tdClass}>
                    <Switch
                      checked={enabledById[row.id] ?? row.enabled}
                      onCheckedChange={(checked) =>
                        setEnabledById((current) => ({ ...current, [row.id]: checked }))
                      }
                      aria-label={`Toggle ${row.name}`}
                    />
                  </td>
                  <td className={tdClass}>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex size-3 shrink-0 items-center justify-center">
                        <Icon
                          name={SEV_ICONS[row.severity]}
                          size={12}
                          style={{ color: SEV_COLORS[row.severity] }}
                          aria-hidden
                        />
                      </span>
                      <span>{row.severity}</span>
                    </span>
                  </td>
                  <td className={cx(tdClass, "tabular-nums")}>{row.lastRun}</td>
                  <td className={tdClass}>{row.recurrence}</td>
                  <td className={tdClass}>
                    <FindingsCell findings={row.findings} />
                  </td>
                  <td className={cx(tdClass, "px-0")}>
                    <DetectionActions name={row.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ManageDetectionsContent() {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>("filter");

  return (
    <>
      <div className="grid shrink-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        <SystemHealthCard />
        <TopFindingsCard />
        <SeverityBreakdownCard />
      </div>
      <DetectionsTable rows={DETECTION_ROWS} tableTool={tableTool} onTableToolChange={setTableTool} />
    </>
  );
}

export function FederatedDetectionHubDashboard() {
  const [activeTab, setActiveTab] = useState<HubTab>("Manage Detections");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-6">
      <HubTabs active={activeTab} onChange={setActiveTab} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4 sm:py-5">
        {activeTab === "Manage Detections" ? (
          <ManageDetectionsContent />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-[4px] border border-border-container bg-datavis-card-bg p-12 text-center shadow-datavis-card">
            <p className="text-sm text-text-tertiary">{activeTab} — content coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
