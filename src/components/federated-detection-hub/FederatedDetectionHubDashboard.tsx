import { Fragment, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon, Switch, type SeverityShapeIconName } from "../../design-system";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { SlideOver } from "../ui/SlideOver";
import { useResizableColumns } from "../ui/useResizableColumns";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function DatavisGridlineRule({ inset = true }: { inset?: boolean }) {
  return <div className={cx("h-px shrink-0 bg-datavis-gridlines", inset && "mx-[20px]")} aria-hidden />;
}

/** Figma `7671:7964` — Manage Detections tab content. */
const HUB_TABS = [
  "Manage Detections",
  "Detection Library",
  "Queued For Review",
  "Detection History",
] as const;

type HubTab = (typeof HUB_TABS)[number];

type DetectionSeverity = "Fatal" | "Critical" | "High" | "Medium" | "Low";

/** Severities shown in the breakdown chart — Fatal rolls up under Critical when filtering. */
type BreakdownSeverity = "Critical" | "High" | "Medium" | "Low";

function rowMatchesSeverityFilter(rowSeverity: DetectionSeverity, filter: BreakdownSeverity) {
  if (filter === "Critical") return rowSeverity === "Critical" || rowSeverity === "Fatal";
  return rowSeverity === filter;
}

function detectionMatchesSearch(row: DetectionRow, query: string, enabled: boolean): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const findings =
    row.findings === "error" ? "error" : row.findings === "none" ? "none" : String(row.findings);

  const haystack = [
    row.name,
    row.description,
    row.severity,
    row.lastRun,
    row.recurrence,
    findings,
    enabled ? "enabled" : "disabled",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

type DetectionRow = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: DetectionSeverity;
  lastRun: string;
  recurrence: string;
  findings: number | "error" | "none";
};

const DETECTION_COLUMN_COUNT = 8;

const SEV_COLORS: Record<DetectionSeverity, string> = {
  Fatal: "#ff604a",
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
};

const SEV_ICONS: Record<DetectionSeverity, SeverityShapeIconName> = {
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
    description:
      "Flags encoded or obfuscated PowerShell commands executed outside approved automation accounts, often used for fileless malware staging and credential access.",
    enabled: true,
    severity: "Fatal",
    lastRun: "1 min ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 2,
  },
  {
    id: "2",
    name: "Lateral Movement via SMB",
    description:
      "Correlates unusual SMB session setup and remote service creation patterns that indicate an actor pivoting between hosts after initial compromise.",
    enabled: true,
    severity: "Critical",
    lastRun: "22 mins ago",
    recurrence: "Every Tue 12:00 AM",
    findings: "error",
  },
  {
    id: "3",
    name: "Credential Dumping Activity",
    description:
      "Detects access to LSASS or credential store artifacts consistent with Mimikatz-style tooling and pass-the-hash preparation.",
    enabled: true,
    severity: "High",
    lastRun: "58 mins ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 5,
  },
  {
    id: "4",
    name: "Unusual Outbound DNS Queries",
    description:
      "Surfaces high-entropy subdomain lookups and rare resolver destinations that may indicate DNS tunneling or C2 beaconing.",
    enabled: false,
    severity: "High",
    lastRun: "1 hour 15 mins ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 2,
  },
  {
    id: "5",
    name: "Privilege Escalation Attempts",
    description:
      "Monitors token manipulation, sudo misuse, and local admin group changes on endpoints where escalation is not part of the change window.",
    enabled: true,
    severity: "Medium",
    lastRun: "—",
    recurrence: "—",
    findings: "none",
  },
  {
    id: "6",
    name: "Suspicious PowerShell Execution",
    description:
      "Flags encoded or obfuscated PowerShell commands executed outside approved automation accounts, often used for fileless malware staging and credential access.",
    enabled: true,
    severity: "Medium",
    lastRun: "6 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 2,
  },
  {
    id: "7",
    name: "Lateral Movement via SMB",
    description:
      "Correlates unusual SMB session setup and remote service creation patterns that indicate an actor pivoting between hosts after initial compromise.",
    enabled: true,
    severity: "Critical",
    lastRun: "7 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 1,
  },
  {
    id: "8",
    name: "Credential Dumping Activity",
    description:
      "Detects access to LSASS or credential store artifacts consistent with Mimikatz-style tooling and pass-the-hash preparation.",
    enabled: false,
    severity: "Low",
    lastRun: "8 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 1,
  },
  {
    id: "9",
    name: "Unusual Outbound DNS Queries",
    description:
      "Surfaces high-entropy subdomain lookups and rare resolver destinations that may indicate DNS tunneling or C2 beaconing.",
    enabled: true,
    severity: "Medium",
    lastRun: "10 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 2,
  },
  {
    id: "10",
    name: "Privilege Escalation Attempts",
    description:
      "Monitors token manipulation, sudo misuse, and local admin group changes on endpoints where escalation is not part of the change window.",
    enabled: true,
    severity: "High",
    lastRun: "18 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 3,
  },
  {
    id: "11",
    name: "Ransomware Precursor File Activity",
    description:
      "Identifies mass file rename and encryption extension changes consistent with ransomware staging before payload deployment.",
    enabled: true,
    severity: "Critical",
    lastRun: "20 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 4,
  },
  {
    id: "12",
    name: "Impossible Travel Login",
    description:
      "Flags authentications from geographically distant locations within an implausible time window for the same user account.",
    enabled: true,
    severity: "High",
    lastRun: "1 day ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 7,
  },
  {
    id: "13",
    name: "Cloud Storage Public Exposure",
    description:
      "Detects bucket or container ACL changes that grant anonymous or public read access to sensitive data stores.",
    enabled: false,
    severity: "Medium",
    lastRun: "1 day ago",
    recurrence: "Every Tue 12:00 AM",
    findings: "none",
  },
  {
    id: "14",
    name: "Kerberoasting Anomaly",
    description:
      "Surfaces service ticket requests targeting accounts with weak SPN configurations outside normal service desk activity.",
    enabled: true,
    severity: "High",
    lastRun: "2 days ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 2,
  },
  {
    id: "15",
    name: "Disabled AV Tampering",
    description:
      "Alerts when endpoint protection services are stopped, uninstalled, or excluded paths are added without approved change tickets.",
    enabled: true,
    severity: "Fatal",
    lastRun: "2 days ago",
    recurrence: "Every Tue 12:00 AM",
    findings: "error",
  },
  {
    id: "16",
    name: "Anomalous SaaS OAuth Grant",
    description:
      "Monitors new third-party OAuth applications granted broad mail or directory scopes to high-privilege user accounts.",
    enabled: true,
    severity: "Low",
    lastRun: "3 days ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 1,
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
    <nav className="flex shrink-0 gap-6 px-6" aria-label="Detection hub sections">
      {HUB_TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            className={cx(
              "border-b-2 pb-3 text-sm font-semibold transition-colors",
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

type TopFindingSegment = {
  label: string;
  color: string;
  value: number;
};

const TOP_FINDINGS_SEGMENTS: TopFindingSegment[] = [
  { label: "Suspicious PowerShell Execution", color: "#b4549a", value: 861 },
  { label: "Privilege Escalation Attempts", color: "#817cf6", value: 319 },
  { label: "Credential Dumping Activity", color: "#5fd3f8", value: 209 },
];

const TOP_FINDINGS_TOTAL = TOP_FINDINGS_SEGMENTS.reduce((sum, segment) => sum + segment.value, 0);

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function donutSegmentPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

function topFindingPercent(value: number) {
  return Math.round((value / TOP_FINDINGS_TOTAL) * 100);
}

function TopFindingsCard({
  selectedLabel,
  onSegmentClick,
}: {
  selectedLabel: string | null;
  onSegmentClick: (label: string) => void;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const isDimmed = (label: string) =>
    (hoveredLabel != null && hoveredLabel !== label) || (selectedLabel != null && selectedLabel !== label);

  const updateTooltipPos = (event: React.MouseEvent) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const clearHover = () => {
    setHoveredLabel(null);
    setTooltipPos(null);
  };

  const segments = useMemo(
    () => [...TOP_FINDINGS_SEGMENTS].sort((a, b) => b.value - a.value),
    [],
  );

  const arcs = useMemo(() => {
    const cx = TOP_FINDINGS_DONUT_OUTER_PX / 2;
    const cy = TOP_FINDINGS_DONUT_OUTER_PX / 2;
    const outerR = TOP_FINDINGS_DONUT_OUTER_PX / 2;
    const innerR = TOP_FINDINGS_DONUT_INNER_PX / 2;
    let angle = 0;

    return segments.map((segment) => {
      const sweep = (segment.value / TOP_FINDINGS_TOTAL) * 360;
      const startAngle = angle;
      const endAngle = angle + sweep;
      angle = endAngle;

      return {
        ...segment,
        percent: topFindingPercent(segment.value),
        path: donutSegmentPath(cx, cy, innerR, outerR, startAngle, endAngle),
      };
    });
  }, [segments]);

  const hovered = arcs.find((segment) => segment.label === hoveredLabel);

  return (
    <HubCard className="h-full" title="Top Findings Detection">
      <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div
          ref={chartRef}
          className="relative shrink-0"
          style={{ width: TOP_FINDINGS_DONUT_OUTER_PX, height: TOP_FINDINGS_DONUT_OUTER_PX }}
        >
          {hovered && tooltipPos ? (
            <div
              className="pointer-events-none absolute z-10 whitespace-nowrap rounded bg-[#424242] px-2 py-1 text-xs font-semibold text-[#f5f5f5] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              style={{
                left: tooltipPos.x + 12,
                top: tooltipPos.y,
                transform: "translateY(calc(-100% - 8px))",
              }}
            >
              {hovered.percent}% {hovered.label}
            </div>
          ) : null}
          <svg
            width={TOP_FINDINGS_DONUT_OUTER_PX}
            height={TOP_FINDINGS_DONUT_OUTER_PX}
            viewBox={`0 0 ${TOP_FINDINGS_DONUT_OUTER_PX} ${TOP_FINDINGS_DONUT_OUTER_PX}`}
            role="img"
            aria-label="Top findings by detection"
            onMouseLeave={clearHover}
          >
            {arcs.map((segment) => (
              <path
                key={segment.label}
                d={segment.path}
                fill={segment.color}
                className={cx(
                  "cursor-pointer transition-opacity",
                  isDimmed(segment.label) ? "opacity-60" : "opacity-100",
                  selectedLabel === segment.label && "opacity-100",
                )}
                aria-label={`Filter by ${segment.label}`}
                aria-pressed={selectedLabel === segment.label}
                onMouseEnter={(event) => {
                  setHoveredLabel(segment.label);
                  updateTooltipPos(event);
                }}
                onMouseMove={updateTooltipPos}
                onClick={() => onSegmentClick(segment.label)}
              />
            ))}
          </svg>
          <div
            className="pointer-events-none absolute flex flex-col items-center justify-center rounded-full bg-datavis-card-bg text-center text-text-primary"
            style={{ inset: TOP_FINDINGS_DONUT_INSET_PX }}
          >
            {/* Figma `7671:9022` — markdown-h1: Lato 24 / 32, tracking 0.7px, regular. */}
            <span className="text-2xl font-normal leading-8 tracking-[0.7px] tabular-nums">{TOP_FINDINGS_TOTAL}</span>
            <span className="text-2xl font-normal leading-8 tracking-[0.7px]">Findings</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-3">
          {arcs.map((segment) => (
            <li key={segment.label}>
              <button
                type="button"
                className={cx(
                  "flex w-full items-start gap-2.5 rounded-[4px] text-left text-sm font-semibold transition-colors",
                  selectedLabel === segment.label
                    ? "text-text-primary"
                    : "text-text-primary hover:text-interactive-active",
                  isDimmed(segment.label) && selectedLabel !== segment.label && "opacity-60",
                )}
                aria-pressed={selectedLabel === segment.label}
                onClick={() => onSegmentClick(segment.label)}
              >
                <span
                  className="mt-1 size-3.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden
                />
                <span>{segment.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </HubCard>
  );
}

/** Figma `7671:9039` — Severity breakdown bars. */
function SeverityBreakdownCard({
  selectedSeverity,
  onSeverityClick,
}: {
  selectedSeverity: BreakdownSeverity | null;
  onSeverityClick: (severity: BreakdownSeverity) => void;
}) {
  const rows = useMemo(
    () =>
      [
        { label: "Critical" as const, value: 118, color: SEV_COLORS.Critical },
        { label: "High" as const, value: 337, color: SEV_COLORS.High },
        { label: "Medium" as const, value: 667, color: SEV_COLORS.Medium },
        { label: "Low" as const, value: 267, color: SEV_COLORS.Low },
      ] as const,
    [],
  );
  const max = Math.max(...rows.map((r) => r.value));
  const filterActive = selectedSeverity != null;

  return (
    <HubCard className="h-full" title="Severity Breakdown (Overall 1389 Findings)">
      <div
        className="flex flex-1 flex-col justify-between"
        style={{ minHeight: TOP_FINDINGS_DONUT_OUTER_PX - 24 }}
      >
        {rows.map((row) => {
          const selected = selectedSeverity === row.label;
          const dimmed = filterActive && !selected;

          return (
            <button
              key={row.label}
              type="button"
              aria-pressed={selected}
              aria-label={`Filter detections by ${row.label} severity`}
              className={cx(
                "group flex min-h-[34px] w-full flex-col justify-end gap-1.5 rounded-sm text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-datavis-card-bg",
              )}
              onClick={() => onSeverityClick(row.label)}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={cx(
                    "text-sm font-semibold transition-colors",
                    selected ? "text-text-primary" : dimmed ? "text-text-disabled" : "text-text-primary",
                  )}
                >
                  {row.label}
                </span>
                <span
                  className={cx(
                    "shrink-0 text-sm font-bold tabular-nums transition-colors",
                    dimmed ? "text-text-disabled" : "text-text-primary",
                  )}
                >
                  {row.value}
                </span>
              </div>
              <div className="relative h-3 rounded-sm bg-datavis-gridlines">
                <div
                  className={cx(
                    "absolute inset-y-0 left-0 rounded-sm transition-opacity",
                    dimmed ? "opacity-35 group-hover:opacity-55" : "opacity-100",
                  )}
                  style={{
                    width: `${Math.max(6, (row.value / max) * 100)}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </HubCard>
  );
}

function DetectionActions({ name }: { name: string }) {
  const actionBtn =
    "size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-3 [&_svg]:!h-3 [&_svg]:!w-3";
  const moreBtn =
    "size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4 [&_svg]:!h-4 [&_svg]:!w-4";

  return (
    <div className="flex items-center justify-start gap-0.5">
      <Button type="button" variant="ghost" className={actionBtn} aria-label={`Edit ${name}`}>
        <Icon name="action-edit" size={12} />
      </Button>
      <Button type="button" variant="ghost" className={actionBtn} aria-label={`Copy ${name}`}>
        <Icon name="action-content-copy" size={12} />
      </Button>
      <Button type="button" variant="ghost" className={actionBtn} aria-label={`Delete ${name}`}>
        <Icon name="action-delete" size={12} />
      </Button>
      <Button type="button" variant="ghost" className={moreBtn} aria-label={`More actions for ${name}`}>
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

function DetectionDetailPanel({
  row,
  enabled,
  onClose,
}: {
  row: DetectionRow;
  enabled: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col text-text-primary">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-rule px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">Detection</p>
          <h2 className="mt-1 text-page-title text-text-primary">{row.name}</h2>
        </div>
        <Button type="button" variant="ghost" className="shrink-0 p-1 text-text-tertiary hover:text-text-primary" aria-label="Close detection details" onClick={onClose}>
          <Icon name="close" size={20} />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center gap-2">
          <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_COLORS[row.severity]} />
          <span className="text-sm font-semibold text-text-primary">{row.severity}</span>
          <span className="text-sm text-text-tertiary">·</span>
          <span className="text-sm text-text-secondary">{enabled ? "Enabled" : "Disabled"}</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">{row.description}</p>
        <dl className="mt-6 space-y-3 border-t border-border-rule pt-4 text-sm">
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-text-tertiary">Last run</dt>
            <dd className="text-text-secondary">{row.lastRun}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-text-tertiary">Recurrence</dt>
            <dd className="text-text-secondary">{row.recurrence}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-text-tertiary">Findings</dt>
            <dd>
              <FindingsCell findings={row.findings} />
            </dd>
          </div>
        </dl>
      </div>
      <footer className="flex shrink-0 justify-end gap-2 border-t border-border-rule px-5 py-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button type="button" variant="primary">
          Edit detection
        </Button>
      </footer>
    </div>
  );
}

/** px widths: expand, detections, state, severity, last run, recurrence, findings, actions */
const DETECTION_EXPAND_COL_WIDTH = 40;
const DETECTION_COL_DEFAULTS: readonly number[] = [
  DETECTION_EXPAND_COL_WIDTH,
  250,
  80,
  115,
  115,
  135,
  115,
  135,
];
const DETECTION_COL_MINS: readonly number[] = [
  DETECTION_EXPAND_COL_WIDTH,
  120,
  56,
  72,
  100,
  80,
  80,
  100,
];

function DetectionsTable({
  rows,
  tableTool,
  onTableToolChange,
  expandedIds,
  onToggleExpand,
  onOpenDetection,
  enabledById,
  onEnabledChange,
  detectionNameFilter,
  severityFilter,
  searchQuery,
  onSearchQueryChange,
  totalCount,
  onClearFilters,
}: {
  rows: DetectionRow[];
  tableTool: FilterColumnPanelTool | null;
  onTableToolChange: (tool: FilterColumnPanelTool | null) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onOpenDetection: (id: string) => void;
  enabledById: Record<string, boolean>;
  onEnabledChange: (id: string, enabled: boolean) => void;
  detectionNameFilter: string | null;
  severityFilter: BreakdownSeverity | null;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  totalCount: number;
  onClearFilters: () => void;
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
    selectColWidth: DETECTION_EXPAND_COL_WIDTH,
    colDefaults: DETECTION_COL_DEFAULTS,
    colMins: DETECTION_COL_MINS,
    minTableWidth: 960,
  });

  const thClass =
    "relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary";
  const tdClass = "h-10 px-2 py-0 align-middle text-sm text-text-secondary";
  const hasActiveFilters =
    detectionNameFilter != null || severityFilter != null || searchQuery.trim().length > 0;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-datavis-card">
      <div className="shrink-0 bg-datavis-card-bg pb-3 pl-4 pr-[20px] pt-3 sm:pl-5">
        <h2 className="text-base-semibold text-text-primary">Detections</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="shrink-0 text-base-small text-text-secondary">
            {rows.length} of {totalCount} Results
            {detectionNameFilter ? ` · ${detectionNameFilter}` : ""}
            {searchQuery.trim() ? ` · “${searchQuery.trim()}”` : ""}
            {severityFilter ? ` · ${severityFilter}` : ""}
          </p>
          <div className="w-[300px] shrink-0">
            <Input
              variant="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              className="h-7 !bg-datavis-card-bg"
              aria-label="Search detections"
            />
          </div>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="h-7 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
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
            <caption className="sr-only">Manage detections</caption>
            <colgroup>
              {displayWidths.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <thead>
              <tr className="h-10 border-b border-datavis-gridlines bg-surface-table-row-header">
                <th scope="col" style={colStyle(0)} className={cx(thClass, "px-0")}>
                  {resizeHandle(0)}
                </th>
                <th scope="col" style={colStyle(1)} className={thClass}>
                  <ColumnHeaderMenu label="Detections" menuLabel="Detections column options" />
                  {resizeHandle(1)}
                </th>
                <th scope="col" style={colStyle(2)} className={thClass}>
                  <ColumnHeaderMenu label="State" menuLabel="State column options" />
                  {resizeHandle(2)}
                </th>
                <th scope="col" style={colStyle(3)} className={thClass}>
                  <ColumnHeaderMenu label="Severity" menuLabel="Severity column options" />
                  {resizeHandle(3)}
                </th>
                <th scope="col" style={colStyle(4)} className={thClass}>
                  <ColumnHeaderMenu label="Last Run" menuLabel="Last Run column options" />
                  {resizeHandle(4)}
                </th>
                <th scope="col" style={colStyle(5)} className={thClass}>
                  <ColumnHeaderMenu label="Recurrence" menuLabel="Recurrence column options" />
                  {resizeHandle(5)}
                </th>
                <th scope="col" style={colStyle(6)} className={thClass}>
                  <ColumnHeaderMenu label="Detection Findings" menuLabel="Detection Findings column options" />
                  {resizeHandle(6)}
                </th>
                <th scope="col" style={colStyle(7)} className="relative h-10 px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary">
                  <span className="block translate-y-px truncate">Actions</span>
                  {resizeHandle(7)}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
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
                            aria-label={expanded ? `Collapse description for ${row.name}` : `Expand description for ${row.name}`}
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
                        <button
                          type="button"
                          className="block w-full truncate text-left font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                          onClick={() => onOpenDetection(row.id)}
                        >
                          {row.name}
                        </button>
                      </td>
                      <td style={colStyle(2)} className={tdClass}>
                        <Switch
                          checked={enabledById[row.id] ?? row.enabled}
                          onCheckedChange={(checked) => onEnabledChange(row.id, checked)}
                          aria-label={`Toggle ${row.name}`}
                        />
                      </td>
                      <td style={colStyle(3)} className={tdClass}>
                        <span className="inline-flex items-center gap-2">
                          <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_COLORS[row.severity]} />
                          <span>{row.severity}</span>
                        </span>
                      </td>
                      <td style={colStyle(4)} className={cx(tdClass, "tabular-nums")}>
                        {row.lastRun}
                      </td>
                      <td style={colStyle(5)} className={tdClass}>
                        {row.recurrence}
                      </td>
                      <td style={colStyle(6)} className={tdClass}>
                        <FindingsCell findings={row.findings} />
                      </td>
                      <td style={colStyle(7)} className={tdClass}>
                        <DetectionActions name={row.name} />
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-datavis-gridlines bg-surface-table-row-header">
                        <td colSpan={DETECTION_COLUMN_COUNT} className="px-4 py-3 align-top">
                          <p className="text-sm leading-relaxed text-text-secondary">{row.description}</p>
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

function ManageDetectionsContent() {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>("filter");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [drawerDetectionId, setDrawerDetectionId] = useState<string | null>(null);
  const [detectionNameFilter, setDetectionNameFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<BreakdownSeverity | null>(null);
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DETECTION_ROWS.map((r) => [r.id, r.enabled])),
  );

  const filteredRows = useMemo(
    () =>
      DETECTION_ROWS.filter((row) => {
        if (detectionNameFilter && row.name !== detectionNameFilter) return false;
        if (severityFilter && !rowMatchesSeverityFilter(row.severity, severityFilter)) return false;
        const enabled = enabledById[row.id] ?? row.enabled;
        if (!detectionMatchesSearch(row, searchQuery, enabled)) return false;
        return true;
      }),
    [detectionNameFilter, severityFilter, searchQuery, enabledById],
  );

  const drawerRow = useMemo(
    () => (drawerDetectionId ? DETECTION_ROWS.find((r) => r.id === drawerDetectionId) : undefined),
    [drawerDetectionId],
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSegmentClick = (label: string) => {
    setDetectionNameFilter((current) => (current === label ? null : label));
  };

  const handleSeverityClick = (severity: BreakdownSeverity) => {
    setSeverityFilter((current) => (current === severity ? null : severity));
  };

  return (
    <>
      <div className="grid shrink-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        <SystemHealthCard />
        <TopFindingsCard selectedLabel={detectionNameFilter} onSegmentClick={handleSegmentClick} />
        <SeverityBreakdownCard selectedSeverity={severityFilter} onSeverityClick={handleSeverityClick} />
      </div>
      <DetectionsTable
        rows={filteredRows}
        tableTool={tableTool}
        onTableToolChange={setTableTool}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onOpenDetection={setDrawerDetectionId}
        enabledById={enabledById}
        onEnabledChange={(id, enabled) => setEnabledById((current) => ({ ...current, [id]: enabled }))}
        detectionNameFilter={detectionNameFilter}
        severityFilter={severityFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        totalCount={DETECTION_ROWS.length}
        onClearFilters={() => {
          setDetectionNameFilter(null);
          setSeverityFilter(null);
          setSearchQuery("");
        }}
      />
      {drawerRow ? (
        <SlideOver
          open
          onClose={() => setDrawerDetectionId(null)}
          ariaLabel={`Detection: ${drawerRow.name}`}
          panelClassName="max-w-[480px]"
        >
          <DetectionDetailPanel
            row={drawerRow}
            enabled={enabledById[drawerRow.id] ?? drawerRow.enabled}
            onClose={() => setDrawerDetectionId(null)}
          />
        </SlideOver>
      ) : null}
    </>
  );
}

export function FederatedDetectionHubDashboard() {
  const [activeTab, setActiveTab] = useState<HubTab>("Manage Detections");

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden pt-6">
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
