import { Fragment, useEffect, useMemo, useState } from "react";
import { Checkbox, Icon, Switch, type SeverityShapeIconName } from "../../design-system";
import { Button } from "../ui/Button";
import { ColumnHeaderMenu } from "../ui/ColumnHeaderMenu";
import {
  compareBooleans,
  compareFindings,
  compareStrings,
  useColumnSort,
} from "../ui/useColumnSort";
import { FilterColumnPanel, type FilterColumnPanelTool } from "../ui/FilterColumnPanel";
import { Input } from "../ui/Input";
import { DataGridExportButton } from "../ui/DataGridExportButton";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { Modal } from "../ui/Modal";
import { type ContentAreaSlideOverState } from "../ui/SlideOver";
import { TruncatedText } from "../ui/TruncatedText";
import { DonutChartPanel } from "../ui/DonutChartPanel";
import { useResizableColumns } from "../ui/useResizableColumns";
import { InsightCard } from "../summary-insights/datavisCard";
import { HorizontalBarPanel } from "../summary-insights/horizontalBarPanel";
import { DetectionHistoryContent } from "./DetectionHistoryContent";
import { DetectionLibraryContent } from "./DetectionLibraryContent";
import { QueuedForReviewContent } from "./QueuedForReviewContent";

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

type DetectionSeverity = "Critical" | "High" | "Medium" | "Low";

type BreakdownSeverity = "Critical" | "High" | "Medium" | "Low";

function rowMatchesSeverityFilter(rowSeverity: DetectionSeverity, filter: BreakdownSeverity) {
  return rowSeverity === filter;
}

function detectionNeedsAttention(row: DetectionRow): boolean {
  return row.findings === "error";
}

type SystemHealthFilter = "running-normally" | "need-attention" | "inactive";

const SYSTEM_HEALTH_FILTER_LABELS: Record<SystemHealthFilter, string> = {
  "running-normally": "Running normally",
  "need-attention": "Need attention",
  inactive: "Inactive",
};

function detectionIsEnabled(row: DetectionRow, enabledById: Record<string, boolean>): boolean {
  return enabledById[row.id] ?? row.enabled;
}

function detectionRunsNormally(row: DetectionRow, enabledById: Record<string, boolean>): boolean {
  return detectionIsEnabled(row, enabledById) && !detectionNeedsAttention(row);
}

function detectionIsInactive(row: DetectionRow, enabledById: Record<string, boolean>): boolean {
  return !detectionIsEnabled(row, enabledById);
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

const DETECTION_COLUMN_COUNT = 9;

const SEV_COLORS: Record<DetectionSeverity, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
};

const SEV_ICONS: Record<DetectionSeverity, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
};

const OVERALL_FINDINGS_COUNT = 1389;

const SEVERITY_BREAKDOWN_ROWS = [
  { label: "Critical", value: 118, color: SEV_COLORS.Critical },
  { label: "High", value: 337, color: SEV_COLORS.High },
  { label: "Medium", value: 667, color: SEV_COLORS.Medium },
  { label: "Low", value: 267, color: SEV_COLORS.Low },
] as const;

const SEVERITY_BREAKDOWN_X_MAX = 700;
const SEVERITY_BREAKDOWN_X_TICKS = [0, 175, 350, 525, 700] as const;

const DETECTION_ROWS: DetectionRow[] = [
  {
    id: "1",
    name: "Suspicious PowerShell Execution",
    description:
      "Flags encoded or obfuscated PowerShell commands executed outside approved automation accounts, often used for fileless malware staging and credential access.",
    enabled: true,
    severity: "High",
    lastRun: "1 min ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 861,
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
    findings: 209,
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
    findings: 87,
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
    findings: 24,
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
    findings: 319,
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
    findings: 11,
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
    findings: 56,
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
    findings: 33,
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
    findings: 42,
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
    findings: "error",
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
    findings: 72,
  },
  {
    id: "15",
    name: "Disabled AV Tampering",
    description:
      "Alerts when endpoint protection services are stopped, uninstalled, or excluded paths are added without approved change tickets.",
    enabled: true,
    severity: "High",
    lastRun: "2 days ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 18,
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
    findings: 9,
  },
];

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
function SystemHealthCard({
  runningNormallyCount,
  totalCount,
  needAttentionCount,
  inactiveCount,
  selectedFilter,
  onFilterClick,
}: {
  runningNormallyCount: number;
  totalCount: number;
  needAttentionCount: number;
  inactiveCount: number;
  selectedFilter: SystemHealthFilter | null;
  onFilterClick: (filter: SystemHealthFilter) => void;
}) {
  const linkClass = (filter: SystemHealthFilter) =>
    cx(
      "text-left text-sm font-semibold transition-colors hover:text-interactive-active hover:underline",
      selectedFilter === filter ? "text-interactive-active underline" : "text-text-primary",
    );

  return (
    <InsightCard
      title="System Health"
      compact
      stretch
      headerActions={
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-base-small text-text-tertiary">Last evaluated: 18h ago</span>
          <Button variant="ghost" className="shrink-0 p-1 text-text-tertiary hover:text-text-primary" aria-label="Chart options">
            <Icon name="navi-more-vert" />
          </Button>
        </div>
      }
    >
      <div className="flex h-full flex-col justify-start pt-1">
        <div className="grid grid-cols-[27px_minmax(0,1fr)] gap-x-3 gap-y-2">
        <Icon
          name="action-check"
          size={20}
          className="inline-flex h-5 w-[27px] shrink-0 self-start text-feedback-positive [&>svg]:!h-5 [&>svg]:!w-[27px]"
          aria-hidden
        />
        <span className="text-xl font-bold tracking-wide text-text-primary">System Healthy</span>
        <ul className="col-start-2 space-y-1.5">
          <li className="flex items-baseline gap-3">
            <span className="w-14 shrink-0 text-xl font-bold tabular-nums text-text-primary">
              {runningNormallyCount}/{totalCount}
            </span>
            <button
              type="button"
              aria-pressed={selectedFilter === "running-normally"}
              className={linkClass("running-normally")}
              onClick={() => onFilterClick("running-normally")}
            >
              Detections running normally
            </button>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="flex w-14 shrink-0 items-center gap-1">
              <span className="text-xl font-bold tabular-nums text-text-primary">{needAttentionCount}</span>
              <Icon name="error-outline" size={16} className="shrink-0 text-feedback-negative" aria-hidden />
            </span>
            <button
              type="button"
              aria-pressed={selectedFilter === "need-attention"}
              className={linkClass("need-attention")}
              onClick={() => onFilterClick("need-attention")}
            >
              Detections need attention
            </button>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-14 shrink-0 text-xl font-bold tabular-nums text-text-primary">{inactiveCount}</span>
            <button
              type="button"
              aria-pressed={selectedFilter === "inactive"}
              className={linkClass("inactive")}
              onClick={() => onFilterClick("inactive")}
            >
              Detections are inactive
            </button>
          </li>
        </ul>
        </div>
      </div>
    </InsightCard>
  );
}

const TOP_FINDINGS_SEGMENTS = [
  { label: "Suspicious PowerShell Execution", color: "#b4549a", value: 861 },
  { label: "Privilege Escalation Attempts", color: "#817cf6", value: 319 },
  { label: "Credential Dumping Activity", color: "#5fd3f8", value: 209 },
] as const;

function TopFindingsCard({
  selectedLabel,
  onSegmentClick,
}: {
  selectedLabel: string | null;
  onSegmentClick: (label: string) => void;
}) {
  return (
    <InsightCard title="Top Findings Detection" compact stretch>
      <div className="flex h-full items-start pt-1">
        <DonutChartPanel
          segments={TOP_FINDINGS_SEGMENTS}
          total={OVERALL_FINDINGS_COUNT}
          centerLabel="findings"
          selectedLabel={selectedLabel}
          onSegmentClick={onSegmentClick}
          ariaLabel="Top findings by detection"
          size="compact"
        />
      </div>
    </InsightCard>
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
  return (
    <InsightCard title="Severity ID" compact stretch>
      <HorizontalBarPanel
        rows={SEVERITY_BREAKDOWN_ROWS}
        selectedLabel={selectedSeverity}
        onBarClick={(label) => onSeverityClick(label as BreakdownSeverity)}
        filterAriaLabel={(label) => `Filter detections by ${label} severity`}
        xMax={SEVERITY_BREAKDOWN_X_MAX}
        xTicks={SEVERITY_BREAKDOWN_X_TICKS}
        axisLabel="Findings"
        dense
        denseRowGap={16}
      />
    </InsightCard>
  );
}

function defaultCopyDetectionName(name: string): string {
  return `${name} copy`;
}

function nextDetectionId(rows: DetectionRow[]): string {
  const numericIds = rows.map((row) => Number.parseInt(row.id, 10)).filter((id) => !Number.isNaN(id));
  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return String(maxId + 1);
}

function DuplicateDetectionModal({
  open,
  name,
  onNameChange,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const trimmedName = name.trim();

  return (
    <Modal
      open={open}
      title="Duplicate Detection"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled={!trimmedName} onClick={onConfirm}>
            Duplicate
          </Button>
        </div>
      }
    >
      <label className="block">
        <span className="text-sm font-semibold text-text-primary">Detection name</span>
        <Input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="mt-2"
          autoFocus
        />
      </label>
    </Modal>
  );
}

function DetectionActions({
  name,
  onEdit,
  onCopy,
  onDelete,
}: {
  name: string;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const actionBtn =
    "size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-3 [&_svg]:!h-3 [&_svg]:!w-3";
  const moreBtn =
    "size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4 [&_svg]:!h-4 [&_svg]:!w-4";

  return (
    <div className="flex items-center justify-start gap-0.5">
      <Button type="button" variant="ghost" className={actionBtn} aria-label={`Edit ${name}`} onClick={onEdit}>
        <Icon name="action-edit" size={12} />
      </Button>
      <Button type="button" variant="ghost" className={actionBtn} aria-label={`Copy ${name}`} onClick={onCopy}>
        <Icon name="action-content-copy" size={12} />
      </Button>
      <Button type="button" variant="ghost" className={actionBtn} aria-label={`Delete ${name}`} onClick={onDelete}>
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
  mode,
  onClose,
}: {
  row: DetectionRow;
  enabled: boolean;
  mode: "view" | "edit";
  onClose: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col text-text-primary">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-rule px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
            {mode === "edit" ? "Edit detection" : "Detection"}
          </p>
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

/** px widths: select, expand, detections, state, severity, last run, recurrence, findings, actions */
const DETECTION_SEVERITY_ORDER: Record<DetectionSeverity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

type DetectionSortColumn = "name" | "state" | "severity" | "lastRun" | "recurrence" | "findings";

const DETECTION_SELECT_COL_WIDTH = 40;
const DETECTION_EXPAND_COL_WIDTH = 40;
const DETECTION_COL_DEFAULTS: readonly number[] = [
  DETECTION_SELECT_COL_WIDTH,
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
  DETECTION_SELECT_COL_WIDTH,
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
  onToggleExpandAll,
  onOpenDetection,
  onEditDetection,
  onCopyDetection,
  onDeleteDetection,
  enabledById,
  onEnabledChange,
  detectionNameFilter,
  severityFilter,
  systemHealthFilter,
  searchQuery,
  onSearchQueryChange,
  showOnlyActive,
  onShowOnlyActiveChange,
  totalCount,
  onClearFilters,
}: {
  rows: DetectionRow[];
  tableTool: FilterColumnPanelTool | null;
  onTableToolChange: (tool: FilterColumnPanelTool | null) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleExpandAll: () => void;
  onOpenDetection: (id: string) => void;
  onEditDetection: (id: string) => void;
  onCopyDetection: (id: string) => void;
  onDeleteDetection: (id: string) => void;
  enabledById: Record<string, boolean>;
  onEnabledChange: (id: string, enabled: boolean) => void;
  detectionNameFilter: string | null;
  severityFilter: BreakdownSeverity | null;
  systemHealthFilter: SystemHealthFilter | null;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  showOnlyActive: boolean;
  onShowOnlyActiveChange: (checked: boolean) => void;
  totalCount: number;
  onClearFilters: () => void;
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
    selectColWidth: DETECTION_SELECT_COL_WIDTH,
    colDefaults: DETECTION_COL_DEFAULTS,
    colMins: DETECTION_COL_MINS,
    minTableWidth: 960,
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

  const thClass =
    "relative h-10 border-r border-datavis-gridlines px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary";
  const tdClass = "h-10 px-2 py-0 align-middle text-sm text-text-secondary";
  const hasActiveFilters =
    detectionNameFilter != null ||
    severityFilter != null ||
    systemHealthFilter != null ||
    showOnlyActive ||
    searchQuery.trim().length > 0;
  const allExpanded = rows.length > 0 && rows.every((row) => expandedIds.has(row.id));
  const sortComparators = useMemo(
    (): Record<DetectionSortColumn, (a: DetectionRow, b: DetectionRow) => number> => ({
      name: (a, b) => compareStrings(a.name, b.name),
      state: (a, b) =>
        compareBooleans(enabledById[a.id] ?? a.enabled, enabledById[b.id] ?? b.enabled),
      severity: (a, b) => DETECTION_SEVERITY_ORDER[a.severity] - DETECTION_SEVERITY_ORDER[b.severity],
      lastRun: (a, b) => compareStrings(a.lastRun, b.lastRun),
      recurrence: (a, b) => compareStrings(a.recurrence, b.recurrence),
      findings: (a, b) => compareFindings(a.findings, b.findings),
    }),
    [enabledById],
  );
  const { sortedRows, getSortProps } = useColumnSort(sortComparators);
  const displayRows = sortedRows(rows);

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
            {systemHealthFilter ? ` · ${SYSTEM_HEALTH_FILTER_LABELS[systemHealthFilter]}` : ""}
            {showOnlyActive ? " · Enabled only" : ""}
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                className="!bg-datavis-card-bg"
                aria-label="Search detections"
              />
            </div>
            <Checkbox
              checked={showOnlyActive}
              onCheckedChange={onShowOnlyActiveChange}
              label="Show only enabled detections"
              className="shrink-0"
            />
          </div>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="h-8 shrink-0 gap-1.5 px-2 text-base-small text-text-tertiary hover:text-text-primary [&_svg]:!h-2 [&_svg]:!w-3"
              onClick={onClearFilters}
            >
              <Icon name="action-filter-list" size={12} aria-hidden />
              Clear all filters
            </Button>
          ) : null}
          <DataGridExportButton />
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
                <th scope="col" style={colStyle(1)} className={cx(thClass, "px-0")}>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      className="inline-flex items-center p-0 text-text-tertiary hover:text-text-primary"
                      aria-expanded={allExpanded}
                      aria-label={
                        allExpanded ? "Collapse all detection descriptions" : "Expand all detection descriptions"
                      }
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
                  {resizeHandle(1)}
                </th>
                <th scope="col" style={colStyle(2)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Detections"
                    menuLabel="Detections column options"
                    {...getSortProps("name")}
                  />
                  {resizeHandle(2)}
                </th>
                <th scope="col" style={colStyle(3)} className={thClass}>
                  <ColumnHeaderMenu label="State" menuLabel="State column options" {...getSortProps("state")} />
                  {resizeHandle(3)}
                </th>
                <th scope="col" style={colStyle(4)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Severity"
                    menuLabel="Severity column options"
                    {...getSortProps("severity")}
                  />
                  {resizeHandle(4)}
                </th>
                <th scope="col" style={colStyle(5)} className={thClass}>
                  <ColumnHeaderMenu label="Last Run" menuLabel="Last Run column options" {...getSortProps("lastRun")} />
                  {resizeHandle(5)}
                </th>
                <th scope="col" style={colStyle(6)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Recurrence"
                    menuLabel="Recurrence column options"
                    {...getSortProps("recurrence")}
                  />
                  {resizeHandle(6)}
                </th>
                <th scope="col" style={colStyle(7)} className={thClass}>
                  <ColumnHeaderMenu
                    label="Detection Findings"
                    menuLabel="Detection Findings column options"
                    {...getSortProps("findings")}
                  />
                  {resizeHandle(7)}
                </th>
                <th scope="col" style={colStyle(8)} className="relative h-10 px-2 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary">
                  <span className="block translate-y-px truncate">Actions</span>
                  {resizeHandle(8)}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => {
                const expanded = expandedIds.has(row.id);
                const enabled = enabledById[row.id] ?? row.enabled;
                return (
                  <Fragment key={row.id}>
                    <tr
                      className={cx(
                        "h-10 border-b border-datavis-gridlines hover:bg-overlay-subtle",
                        !enabled && "opacity-70",
                      )}
                    >
                      <td style={colStyle(0)} className="h-10 px-0 py-0 align-middle">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selected.has(row.id)}
                            onCheckedChange={(checked) => toggleRow(row.id, checked)}
                            aria-label={`Select ${row.name}`}
                          />
                        </div>
                      </td>
                      <td style={colStyle(1)} className="h-10 px-0 py-0 align-middle">
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
                      <td style={colStyle(2)} className={cx(tdClass, "min-w-0")}>
                        <TruncatedText
                          as="button"
                          className="w-full text-left font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                          onClick={() => onOpenDetection(row.id)}
                        >
                          {row.name}
                        </TruncatedText>
                      </td>
                      <td style={colStyle(3)} className={tdClass}>
                        <Switch
                          checked={enabledById[row.id] ?? row.enabled}
                          onCheckedChange={(checked) => onEnabledChange(row.id, checked)}
                          aria-label={`Toggle ${row.name}`}
                        />
                      </td>
                      <td style={colStyle(4)} className={tdClass}>
                        <span className="inline-flex items-center gap-2">
                          <SeverityTableIcon name={SEV_ICONS[row.severity]} color={SEV_COLORS[row.severity]} />
                          <span>{row.severity}</span>
                        </span>
                      </td>
                      <td style={colStyle(5)} className={cx(tdClass, "tabular-nums")}>
                        {row.lastRun}
                      </td>
                      <td style={colStyle(6)} className={tdClass}>
                        {row.recurrence}
                      </td>
                      <td style={colStyle(7)} className={tdClass}>
                        <FindingsCell findings={row.findings} />
                      </td>
                      <td style={colStyle(8)} className={tdClass}>
                        <DetectionActions
                          name={row.name}
                          onEdit={() => onEditDetection(row.id)}
                          onCopy={() => onCopyDetection(row.id)}
                          onDelete={() => onDeleteDetection(row.id)}
                        />
                      </td>
                    </tr>
                    {expanded ? (
                      <tr
                        className={cx(
                          "border-b border-datavis-gridlines bg-surface-table-row-header",
                          !enabled && "opacity-70",
                        )}
                      >
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

function ManageDetectionsContent({ onSlideOverChange }: { onSlideOverChange: (state: ContentAreaSlideOverState | null) => void }) {
  const [tableTool, setTableTool] = useState<FilterColumnPanelTool | null>("filter");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [detectionRows, setDetectionRows] = useState<DetectionRow[]>(() => [...DETECTION_ROWS]);
  const [drawerDetectionId, setDrawerDetectionId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view");
  const [detectionNameFilter, setDetectionNameFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<BreakdownSeverity | null>(null);
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DETECTION_ROWS.map((r) => [r.id, r.enabled])),
  );
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [systemHealthFilter, setSystemHealthFilter] = useState<SystemHealthFilter | null>(null);
  const [copySourceId, setCopySourceId] = useState<string | null>(null);
  const [copyName, setCopyName] = useState("");

  const openDetectionPanel = (id: string, mode: "view" | "edit") => {
    setDrawerDetectionId(id);
    setDrawerMode(mode);
  };

  const handleDeleteDetection = (id: string) => {
    setDetectionRows((rows) => rows.filter((row) => row.id !== id));
    setDrawerDetectionId((current) => (current === id ? null : current));
    setExpandedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const handleOpenCopyDetection = (id: string) => {
    const source = detectionRows.find((row) => row.id === id);
    if (!source) return;
    setCopySourceId(id);
    setCopyName(defaultCopyDetectionName(source.name));
  };

  const handleCloseCopyDetection = () => {
    setCopySourceId(null);
    setCopyName("");
  };

  const handleConfirmCopyDetection = () => {
    const trimmedName = copyName.trim();
    if (!copySourceId || !trimmedName) return;

    const source = detectionRows.find((row) => row.id === copySourceId);
    if (!source) {
      handleCloseCopyDetection();
      return;
    }

    const newId = nextDetectionId(detectionRows);
    const duplicate: DetectionRow = {
      ...source,
      id: newId,
      name: trimmedName,
    };

    setDetectionRows((rows) => {
      const sourceIndex = rows.findIndex((row) => row.id === copySourceId);
      if (sourceIndex === -1) return [...rows, duplicate];
      const next = [...rows];
      next.splice(sourceIndex + 1, 0, duplicate);
      return next;
    });
    setEnabledById((current) => ({
      ...current,
      [newId]: source.enabled,
    }));
    handleCloseCopyDetection();
  };

  const systemHealthCounts = useMemo(() => {
    const inactive = detectionRows.filter((row) => detectionIsInactive(row, enabledById)).length;
    const needAttention = detectionRows.filter(detectionNeedsAttention).length;
    const runningNormally = detectionRows.filter((row) => detectionRunsNormally(row, enabledById)).length;
    return {
      inactive,
      needAttention,
      runningNormally,
      total: detectionRows.length,
    };
  }, [detectionRows, enabledById]);

  const filteredRows = useMemo(
    () =>
      detectionRows.filter((row) => {
        if (detectionNameFilter && row.name !== detectionNameFilter) return false;
        if (severityFilter && !rowMatchesSeverityFilter(row.severity, severityFilter)) return false;
        if (systemHealthFilter === "need-attention" && !detectionNeedsAttention(row)) return false;
        if (systemHealthFilter === "inactive" && !detectionIsInactive(row, enabledById)) return false;
        if (systemHealthFilter === "running-normally" && !detectionRunsNormally(row, enabledById)) return false;
        const enabled = enabledById[row.id] ?? row.enabled;
        if (showOnlyActive && !enabled) return false;
        if (!detectionMatchesSearch(row, searchQuery, enabled)) return false;
        return true;
      }),
    [detectionRows, detectionNameFilter, severityFilter, systemHealthFilter, searchQuery, enabledById, showOnlyActive],
  );

  const drawerRow = useMemo(
    () => (drawerDetectionId ? detectionRows.find((r) => r.id === drawerDetectionId) : undefined),
    [detectionRows, drawerDetectionId],
  );

  useEffect(() => {
    onSlideOverChange(
      drawerRow
        ? {
            ariaLabel: `Detection: ${drawerRow.name}`,
            onClose: () => setDrawerDetectionId(null),
            panel: (
              <DetectionDetailPanel
                row={drawerRow}
                enabled={enabledById[drawerRow.id] ?? drawerRow.enabled}
                mode={drawerMode}
                onClose={() => setDrawerDetectionId(null)}
              />
            ),
          }
        : null,
    );
    return () => onSlideOverChange(null);
  }, [drawerRow, drawerMode, enabledById, onSlideOverChange]);

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

  const handleSegmentClick = (label: string) => {
    setDetectionNameFilter((current) => (current === label ? null : label));
    setSystemHealthFilter(null);
  };

  const handleSeverityClick = (severity: BreakdownSeverity) => {
    setSeverityFilter((current) => (current === severity ? null : severity));
    setSystemHealthFilter(null);
  };

  const handleSystemHealthFilterClick = (filter: SystemHealthFilter) => {
    setSystemHealthFilter((current) => (current === filter ? null : filter));
    setDetectionNameFilter(null);
    setSeverityFilter(null);
  };

  return (
    <>
      <div className="grid shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <SystemHealthCard
          runningNormallyCount={systemHealthCounts.runningNormally}
          totalCount={systemHealthCounts.total}
          needAttentionCount={systemHealthCounts.needAttention}
          inactiveCount={systemHealthCounts.inactive}
          selectedFilter={systemHealthFilter}
          onFilterClick={handleSystemHealthFilterClick}
        />
        <TopFindingsCard selectedLabel={detectionNameFilter} onSegmentClick={handleSegmentClick} />
        <SeverityBreakdownCard selectedSeverity={severityFilter} onSeverityClick={handleSeverityClick} />
      </div>
      <DetectionsTable
        rows={filteredRows}
        tableTool={tableTool}
        onTableToolChange={setTableTool}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onToggleExpandAll={toggleExpandAll}
        onOpenDetection={(id) => openDetectionPanel(id, "view")}
        onEditDetection={(id) => openDetectionPanel(id, "edit")}
        onCopyDetection={handleOpenCopyDetection}
        onDeleteDetection={handleDeleteDetection}
        enabledById={enabledById}
        onEnabledChange={(id, enabled) => setEnabledById((current) => ({ ...current, [id]: enabled }))}
        detectionNameFilter={detectionNameFilter}
        severityFilter={severityFilter}
        systemHealthFilter={systemHealthFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        showOnlyActive={showOnlyActive}
        onShowOnlyActiveChange={setShowOnlyActive}
        totalCount={detectionRows.length}
        onClearFilters={() => {
          setDetectionNameFilter(null);
          setSeverityFilter(null);
          setSystemHealthFilter(null);
          setShowOnlyActive(false);
          setSearchQuery("");
        }}
      />
      <DuplicateDetectionModal
        open={copySourceId != null}
        name={copyName}
        onNameChange={setCopyName}
        onClose={handleCloseCopyDetection}
        onConfirm={handleConfirmCopyDetection}
      />
    </>
  );
}

export function FederatedDetectionHubDashboard({
  onSlideOverChange,
}: {
  onSlideOverChange: (state: ContentAreaSlideOverState | null) => void;
}) {
  const [activeTab, setActiveTab] = useState<HubTab>("Manage Detections");

  useEffect(() => {
    onSlideOverChange(null);
  }, [activeTab, onSlideOverChange]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-6">
      <HubTabs active={activeTab} onChange={setActiveTab} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4 sm:py-5">
        {activeTab === "Manage Detections" ? (
          <ManageDetectionsContent onSlideOverChange={onSlideOverChange} />
        ) : activeTab === "Detection Library" ? (
          <DetectionLibraryContent onSlideOverChange={onSlideOverChange} />
        ) : activeTab === "Queued For Review" ? (
          <QueuedForReviewContent onSlideOverChange={onSlideOverChange} />
        ) : activeTab === "Detection History" ? (
          <DetectionHistoryContent />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-[4px] border border-border-container bg-datavis-card-bg p-12 text-center shadow-datavis-card">
            <p className="text-sm text-text-tertiary">{activeTab} — content coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
