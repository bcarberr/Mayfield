import { useId, useMemo, useState, type ReactNode } from "react";
import { Checkbox, Icon } from "../design-system";
import { Button } from "../components/ui/Button";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { Input } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import { ThemeToggle } from "../components/ThemeToggle";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const ADVANCED_MODE_CALLOUT =
  "Advanced Mode allows mapping of more details and will give more context for investigations and threat hunting.";

type StepIndex = 1 | 2 | 3;

function StepIndicator({ status }: { status: "complete" | "current" | "upcoming" }) {
  if (status === "complete") {
    return (
      <div
        className="box-border flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-interactive-active bg-transparent text-interactive-active"
        aria-hidden
      >
        <svg width="12" height="9" viewBox="0 0 14 10" fill="none" aria-hidden className="shrink-0">
          <path
            d="M1 5L5 9L13 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  if (status === "current") {
    return <div className="size-6 shrink-0 rounded-full bg-interactive-active" aria-hidden />;
  }
  return (
    <div
      className="box-border size-6 shrink-0 rounded-full border-2 border-border-rule bg-transparent"
      aria-hidden
    />
  );
}

function stepStatus(step: StepIndex, currentStep: StepIndex): "complete" | "current" | "upcoming" {
  if (step < currentStep) return "complete";
  if (step === currentStep) return "current";
  return "upcoming";
}

function ProgressStepper({ currentStep }: { currentStep: StepIndex }) {
  const seg1Teal = currentStep >= 2;
  const seg2Teal = currentStep >= 3;

  return (
    <nav
      className="flex w-full max-w-[632px] shrink-0 flex-col justify-end px-0 py-0"
      aria-label="Connector setup progress"
    >
      <div className="flex w-full flex-col">
        <div className="flex w-full items-center gap-0">
          <div
            className="relative z-[1] flex w-[110px] shrink-0 flex-col items-center"
            aria-current={currentStep === 1 ? "step" : undefined}
          >
            <div className="flex h-6 w-full items-center justify-center">
              <StepIndicator status={stepStatus(1, currentStep)} />
            </div>
          </div>
          <div className="relative z-0 flex h-6 min-h-6 min-w-0 flex-1 items-center self-center ml-[calc((24px-110px)/2)] mr-[calc((24px-130px)/2)]">
            <div
              className={cx("h-0.5 w-full rounded-full", seg1Teal ? "bg-interactive-active" : "bg-border-rule")}
              aria-hidden
            />
          </div>
          <div
            className="relative z-[1] flex w-[130px] shrink-0 flex-col items-center"
            aria-current={currentStep === 2 ? "step" : undefined}
          >
            <div className="flex h-6 w-full items-center justify-center">
              <StepIndicator status={stepStatus(2, currentStep)} />
            </div>
          </div>
          <div className="relative z-0 flex h-6 min-h-6 min-w-0 flex-1 items-center self-center mx-[calc((24px-130px)/2)]">
            <div
              className={cx("h-0.5 w-full rounded-full", seg2Teal ? "bg-interactive-active" : "bg-border-rule")}
              aria-hidden
            />
          </div>
          <div
            className="relative z-[1] flex w-[130px] shrink-0 flex-col items-center"
            aria-current={currentStep === 3 ? "step" : undefined}
          >
            <div className="flex h-6 w-full items-center justify-center">
              <StepIndicator status={stepStatus(3, currentStep)} />
            </div>
          </div>
        </div>
        <div className="mt-1 flex w-full items-start">
          <p className="w-[110px] shrink-0 text-center text-sm leading-[18px] text-text-primary">1. Connector Info</p>
          <div className="min-w-0 flex-1" aria-hidden />
          <p className="w-[130px] shrink-0 text-center text-sm leading-[18px] text-text-primary">2. Preview/Import Fields</p>
          <div className="min-w-0 flex-1" aria-hidden />
          <p className="w-[130px] shrink-0 text-center text-sm leading-[18px] text-text-primary">3. Map & Review Data</p>
        </div>
      </div>
    </nav>
  );
}

function ConnectionTitleLink() {
  return (
    <div className="flex min-w-0 max-w-md flex-1 flex-col items-end justify-end pb-0.5 text-right">
      <a
        href="https://docs.aws.amazon.com/athena/"
        target="_blank"
        rel="noreferrer"
        className="inline-flex flex-wrap items-center justify-end gap-1 text-sm leading-[18px] text-text-tertiary hover:text-text-secondary"
      >
        <span>Search and manage Amazon Athena Data Base.</span>
        <span className="inline-flex shrink-0 items-center gap-1 font-normal whitespace-nowrap text-interactive-active">
          Learn more
          <Icon name="external" size={14} className="text-interactive-active" />
        </span>
      </a>
    </div>
  );
}

type MappingRow = {
  source: string;
  sample: string;
  mapped: boolean;
  tags?: string[];
};

/** Matches target column: mapped only when there is at least one tag. */
function isMappedRow(r: MappingRow): boolean {
  return Boolean(r.mapped && r.tags?.length);
}

/** Trimode: all rows | only unmapped (hide mapped) | only mapped (hide unmapped). */
type MapVisibilityMode = "all" | "hideMapped" | "hideUnmapped";

function MapVisibilityTrimode({
  value,
  onChange,
}: {
  value: MapVisibilityMode;
  onChange: (next: MapVisibilityMode) => void;
}) {
  const gid = useId().replace(/:/g, "");
  const leftRadioId = `${gid}-radio-left`;
  const midRadioId = `${gid}-radio-mid`;
  const rightRadioId = `${gid}-radio-right`;

  return (
    <div
      role="radiogroup"
      aria-label="Filter rows by mapping status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      <label
        htmlFor={leftRadioId}
        className={cx(
          "cursor-pointer select-none text-sm font-semibold leading-[18px] underline-offset-2",
          value === "hideMapped" ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary",
        )}
      >
        Hide Mapped
      </label>

      <div
        className={cx(
          "relative h-[18px] w-12 shrink-0 overflow-hidden rounded-full px-[3px] transition-colors duration-150 ease-out",
          value === "all" && "border border-solid border-border-rule bg-transparent",
          (value === "hideMapped" || value === "hideUnmapped") &&
            "border-0 bg-interactive-active hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-pressed)]",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "pointer-events-none absolute top-1/2 z-0 size-3 rounded-full transition-[left,transform,background-color] duration-200 ease-out",
            value === "all" && "bg-border-container",
            (value === "hideMapped" || value === "hideUnmapped") && "bg-text-on-primary",
            value === "hideMapped" && "left-[3px] -translate-y-1/2",
            value === "all" && "left-1/2 -translate-x-1/2 -translate-y-1/2",
            value === "hideUnmapped" && "left-[calc(100%-15px)] -translate-y-1/2",
          )}
        />
        <button
          id={leftRadioId}
          type="button"
          role="radio"
          aria-checked={value === "hideMapped"}
          aria-label="Show only unmapped fields"
          tabIndex={0}
          onClick={() => onChange("hideMapped")}
          className="absolute inset-y-0 left-0 z-[1] w-1/3 cursor-pointer rounded-l-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal"
        />
        <button
          id={midRadioId}
          type="button"
          role="radio"
          aria-checked={value === "all"}
          aria-label="Show all rows"
          tabIndex={0}
          onClick={() => onChange("all")}
          className="absolute inset-y-0 left-1/3 z-[1] w-1/3 cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal"
        />
        <button
          id={rightRadioId}
          type="button"
          role="radio"
          aria-checked={value === "hideUnmapped"}
          aria-label="Show only mapped fields"
          tabIndex={0}
          onClick={() => onChange("hideUnmapped")}
          className="absolute inset-y-0 left-2/3 z-[1] w-1/3 cursor-pointer rounded-r-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal"
        />
      </div>

      <label
        htmlFor={rightRadioId}
        className={cx(
          "cursor-pointer select-none text-sm font-semibold leading-[18px] underline-offset-2",
          value === "hideUnmapped" ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary",
        )}
      >
        Hide Unmapped
      </label>
    </div>
  );
}

const INITIAL_ROWS: MappingRow[] = [
  { source: "action", sample: "allow_st*", mapped: false },
  { source: "appclass", sample: "gostringsam*", mapped: false },
  { source: "appname", sample: "thisApp_name*", mapped: true, tags: ["app_name"] },
  { source: "bwclassname", sample: "thbwe_junk_classname*", mapped: false },
  { source: "bytes_in", sample: "1024", mapped: false },
  { source: "bytes_out", sample: "2048", mapped: false },
  { source: "client_ip", sample: "10.0.0.1", mapped: true, tags: ["load_balancer.ip"] },
  { source: "dest_port", sample: "443", mapped: false },
  { source: "duration_ms", sample: "42", mapped: false },
  { source: "hostname", sample: "web-01.internal", mapped: false },
  { source: "http_method", sample: "GET", mapped: false },
  { source: "http_status", sample: "200", mapped: false },
  { source: "protocol", sample: "HTTPS", mapped: false },
  { source: "request_path", sample: "/api/v1/health", mapped: false },
  { source: "user_agent", sample: "Mozilla/5.0…", mapped: false },
];

/** Source / target columns mirror FieldMappingBar grid + `gap-x-6` (3rem between 1fr tracks); actions stay 4rem. */
const MAPPING_FIELD_COLGROUP = (
  <colgroup>
    <col style={{ width: "calc((100% - 4rem - 3rem) / 2)" }} />
    <col style={{ width: "3rem" }} />
    <col style={{ width: "calc((100% - 4rem - 3rem) / 2)" }} />
    <col style={{ width: "4rem" }} />
  </colgroup>
);

function Tag({ children }: { children: string }) {
  return (
    <span className="inline-flex h-5 max-w-full items-center gap-1 rounded bg-surface-container px-1.5 text-[11px] font-semibold text-text-secondary ring-1 ring-border-container">
      <span className="truncate">{children}</span>
      <button
        type="button"
        className="shrink-0 text-text-tertiary hover:text-text-primary"
        aria-label={`Remove ${children}`}
      >
        <Icon name="close" size={12} />
      </button>
    </span>
  );
}

/** Map Schema right-rail entity list — Config-Schema-v2 Figma `7990:109471` (Variant29). */
const MAP_SCHEMA_ENTITY_GROUPS: string[] = ["Account ID", "Account Name"];

const MAP_SCHEMA_ENTITY_FIELDS: string[] = [
  "Command Line",
  "Country",
  "Credential ID",
  "CVE ID",
  "CDW ID",
  "Email Address",
  "File Hash",
  "Filename",
  "Group ID",
  "Group Name",
  "Hostname",
  "IP Address",
  "MAC Address",
  "Port",
  "Process ID",
  "Process Name",
  "Script Content",
  "Serial Number",
  "Subnet",
  "URL",
  "User Agent",
  "User ID",
  "User Name",
];

type MapSchemaRecommendedRow =
  | { kind: "field"; name: string; enum?: boolean; info?: boolean }
  | { kind: "plain"; name: string };

const MAP_SCHEMA_RECOMMENDED: MapSchemaRecommendedRow[] = [
  { kind: "field", name: "activity_id", enum: true, info: true },
  { kind: "plain", name: "activity_name" },
  { kind: "field", name: "category_uid", enum: true, info: true },
  { kind: "plain", name: "category_name" },
  { kind: "field", name: "severity_id", enum: true, info: true },
  { kind: "plain", name: "severity" },
  { kind: "field", name: "type_id", enum: true, info: true },
  { kind: "plain", name: "type_name" },
];

/** Info + drag handle — same pattern as `time* required` row. */
function MapSchemaRowInfoDragCluster({ title }: { title: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-[8px] text-text-tertiary">
      <Icon name="feedback-info-outline" size={16} className="shrink-0" title={title} />
      <Icon
        name="action-drag-indicator"
        className="shrink-0"
        style={{ width: 8, height: 12.8 }}
        aria-hidden
      />
    </span>
  );
}

function MapSchemaEntityRowChevron() {
  return (
    <span className="flex h-2.5 w-2.5 shrink-0 items-center justify-center text-text-primary" aria-hidden>
      <Icon name="chevron-down" size={12} className="-rotate-90 block" />
    </span>
  );
}

function MapSchemaEntityGroupRow({ label }: { label: string }) {
  return (
    <div className="flex h-7 w-full items-center gap-2 py-1">
      <Icon name="feedback-info-outline" size={16} className="shrink-0 text-text-tertiary" title={`About ${label}`} />
      <MapSchemaEntityRowChevron />
      <span className="truncate text-xs font-semibold leading-4 tracking-[0.4px] text-text-primary">{label}</span>
    </div>
  );
}

function MapSchemaEntityFieldRow({ label }: { label: string }) {
  return (
    <div className="flex h-7 w-full min-w-0 items-center gap-2 py-1">
      <Icon name="feedback-info-outline" size={16} className="shrink-0 text-text-tertiary" title={`About ${label}`} />
      <MapSchemaEntityRowChevron />
      <span className="min-w-0 truncate text-xs font-semibold leading-4 tracking-[0.4px] text-text-secondary">{label}</span>
    </div>
  );
}

function MapSchemaRecommendedFieldRow({ row }: { row: MapSchemaRecommendedRow }) {
  const infoTitle = `About ${row.name}`;
  if (row.kind === "plain") {
    return (
      <div className="flex h-7 w-full min-w-0 items-center gap-2 py-1">
        <MapSchemaRowInfoDragCluster title={infoTitle} />
        <span className="min-w-0 truncate text-xs font-semibold leading-4 tracking-[0.4px] text-text-secondary">{row.name}</span>
      </div>
    );
  }
  return (
    <div className="flex h-7 w-full min-w-0 items-center gap-2 py-1">
      <MapSchemaRowInfoDragCluster title={infoTitle} />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold leading-4 tracking-[0.4px] text-text-secondary">
        <span>{row.name} </span>
        {row.enum ? <span className="font-semibold italic text-[#b4b0ff]">enum</span> : null}
      </span>
    </div>
  );
}

/** Bordered MAP SCHEMA panel — aligned with event-class toolbar row; content through search + schema hints. */
function MapSchemaOverviewCard() {
  const [treeView, setTreeView] = useState(false);
  const [entitiesOpen, setEntitiesOpen] = useState(true);
  const [recommendedOpen, setRecommendedOpen] = useState(true);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded border border-border-rule bg-surface-modal px-4 pt-2 pb-3">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0">
          <div className="flex shrink-0 items-center gap-2">
            <p className="shrink-0 text-[12px] font-bold uppercase leading-[14px] tracking-[0.4px] text-text-tertiary">
              MAP Schema
            </p>
            <button
              type="button"
              aria-label="Map schema mode: Basic Mode"
              className={cx(
                "flex h-7 min-w-0 flex-1 items-center justify-between gap-2 rounded-full border px-3 text-left transition-colors",
                "border-border-container bg-surface-container text-text-secondary hover:text-text-primary",
              )}
            >
              <span className="min-w-0 truncate text-[14px] font-bold leading-5 tracking-[0.4px]">Basic Mode</span>
              <Icon name="chevron-down" size={20} className="shrink-0" />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-left text-[14px] font-bold leading-5 tracking-[0.4px] text-text-primary">HTTP Activity</p>
          </div>
          <div className="mt-3 border-t border-border-rule pt-3">
            <Input
              variant="search"
              readOnly
              tabIndex={-1}
              startAdornment={<Icon name="search" />}
              placeholder="Search"
              className="h-7 w-full border-border-rule px-1.5 py-0"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-base-small">
            <MapSchemaRowInfoDragCluster title="About required fields" />
            <span className="font-semibold text-text-primary">time*</span>
            <span className="font-semibold italic text-accent-required">required</span>
          </div>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-px">
            <div className="flex h-7 w-full min-h-7 flex-wrap items-center gap-2 py-1">
              <button
                type="button"
                onClick={() => setEntitiesOpen((v) => !v)}
                aria-expanded={entitiesOpen}
                className="flex min-w-0 shrink-0 items-center gap-2 rounded py-0.5 pr-1 text-left text-text-primary hover:bg-overlay-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive-active"
              >
                <Icon
                  name="chevron-down"
                  size={12}
                  className={cx("shrink-0 transition-transform duration-150", !entitiesOpen && "-rotate-90")}
                  aria-hidden
                />
                <span className="text-xs font-semibold uppercase leading-4 tracking-[0.4px]">Entities</span>
              </button>
              <span className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 pl-2">
                <Checkbox
                  checked={treeView}
                  onCheckedChange={setTreeView}
                  label="Show As Tree View"
                  labelClassName="text-base-small text-text-secondary"
                />
              </span>
            </div>

            {entitiesOpen ? (
              <>
                {MAP_SCHEMA_ENTITY_GROUPS.map((label) => (
                  <MapSchemaEntityGroupRow key={label} label={label} />
                ))}
                {MAP_SCHEMA_ENTITY_FIELDS.map((label) => (
                  <MapSchemaEntityFieldRow key={label} label={label} />
                ))}
              </>
            ) : null}

            <div className="flex h-7 w-full min-h-7 items-center gap-2 py-1">
              <button
                type="button"
                onClick={() => setRecommendedOpen((v) => !v)}
                aria-expanded={recommendedOpen}
                className="flex min-w-0 items-center gap-2 rounded py-0.5 pr-1 text-left text-text-primary hover:bg-overlay-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive-active"
              >
                <Icon
                  name="chevron-down"
                  size={12}
                  className={cx("shrink-0 transition-transform duration-150", !recommendedOpen && "-rotate-90")}
                  aria-hidden
                />
                <span className="text-xs font-semibold uppercase leading-4 tracking-[0.4px]">Recommended</span>
              </button>
            </div>
            {recommendedOpen
              ? MAP_SCHEMA_RECOMMENDED.map((row, i) => (
                  <MapSchemaRecommendedFieldRow key={`${row.kind}-${"name" in row ? row.name : i}`} row={row} />
                ))
              : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="pointer-events-none absolute bottom-0 right-0 z-20 flex justify-end p-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-tl-lg rounded-bl-lg bg-surface-container/80 px-3 py-2.5 shadow-lg ring-1 ring-border-container backdrop-blur-sm">
        <Button type="button" variant="tertiary" className="text-text-secondary hover:text-text-primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="tertiary" className="text-text-secondary hover:text-text-primary">
          Preview JSON
        </Button>
        <Button variant="secondary">Back</Button>
        <Button variant="primary">Next</Button>
      </div>
    </div>
  );
}

function CopilotMark() {
  const uid = useId().replace(/:/g, "");
  const ga = `${uid}-spark-a`;
  const gb = `${uid}-spark-b`;

  return (
    <div className="-ml-[10px] flex shrink-0 items-center gap-3">
      <div className="flex items-center gap-0">
        <svg width="44.8" height="35.2" viewBox="0 0 44.8 35.2" fill="none" className="shrink-0" aria-hidden>
          <defs>
            <linearGradient id={ga} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1ec1dd" />
              <stop offset="100%" stopColor="#7fe8ff" />
            </linearGradient>
            <linearGradient id={gb} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff8200" />
              <stop offset="100%" stopColor="#fac354" />
            </linearGradient>
          </defs>
          <svg x="0" y="0" width="35.2" height="35.2" viewBox="0 0 24 24">
            <path
              d="M12 3l1.2 4.2L17 8.5l-3.8 1.3L12 14l-1.2-4.2L7 8.5l3.8-1.3L12 3Z"
              fill={`url(#${ga})`}
            />
          </svg>
          <svg x="22.4" y="3.2" width="22.4" height="22.4" viewBox="0 0 24 24">
            <path
              d="M12 3l1.2 4.2L17 8.5l-3.8 1.3L12 14l-1.2-4.2L7 8.5l3.8-1.3L12 3Z"
              fill={`url(#${gb})`}
            />
          </svg>
        </svg>
        <span className="-ml-0.5 text-base font-semibold leading-6 text-text-primary">Copilot</span>
      </div>
      <span className="rounded bg-beta px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-beta-text">
        BETA
      </span>
    </div>
  );
}

function MappingToolbarV2() {
  const [allowAutosave, setAllowAutosave] = useState(true);

  return (
    <div className="bg-surface-modal">
      <p className="text-base-semibold text-text-primary">Event Class to Map</p>
      <div className="mt-2 flex min-h-[32px] flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="button"
            className="flex h-7 w-60 shrink-0 items-center gap-1 rounded border border-border-rule bg-surface-modal px-3 text-left hover:bg-overlay-subtle"
          >
            <Icon
              name="network-activity"
              size={16}
              className="shrink-0 text-datavis-data-peanut-orange"
              title="Network activity"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">HTTP Activity</span>
            <Icon name="chevron-down" className="shrink-0 text-text-secondary" />
          </button>
          <button
            type="button"
            className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-secondary"
            aria-label="About event class"
          >
            <Icon name="feedback-info-outline" />
          </button>
          <CopilotMark />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2">
          <Switch checked={allowAutosave} onCheckedChange={setAllowAutosave} label="Allow Autosave" />
          <Button variant="tertiary" className="gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary">
            <Icon name="close" />
            Clear All Mappings
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldMappingBar({
  rows,
  mapVisibility,
  onMapVisibilityChange,
  table,
}: {
  rows: MappingRow[];
  mapVisibility: MapVisibilityMode;
  onMapVisibilityChange: (next: MapVisibilityMode) => void;
  table: ReactNode;
}) {
  const mapped = rows.filter(isMappedRow).length;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-modal px-0 py-4">
      <div className="shrink-0">
        <p className="mb-3 text-sm font-semibold text-text-secondary">
          Mapped Fields: <span className="text-text-primary">{mapped}</span>
        </p>
        <div className="grid w-full min-w-0 grid-cols-1 gap-y-3 md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)_4rem] md:gap-x-0">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-[16px] md:min-w-0">
            <p className="min-w-0 text-sm font-semibold leading-[18px]">
              <span className="text-text-primary">Source: </span>
              <span className="text-text-secondary">sample-securitystuff-schema-this-long</span>
            </p>
            <p className="shrink-0 text-xs font-semibold italic leading-[18px] tracking-wide text-text-tertiary">
              Sample data shown*
            </p>
          </div>
          <div className="hidden md:block" aria-hidden />
          <div className="flex min-w-0 flex-wrap items-center justify-start gap-2">
            <p className="text-sm font-semibold leading-[18px]">
              <span className="text-text-primary">Target: </span>
              <span className="text-text-secondary">Query Data Model</span>
            </p>
            <Icon name="feedback-info-outline" className="shrink-0 text-text-tertiary" />
          </div>
          <div className="hidden md:block" aria-hidden />

          <div className="flex min-w-0 w-full flex-col gap-2 md:min-w-0">
            <Input
              variant="search"
              readOnly
              tabIndex={-1}
              startAdornment={<Icon name="search" />}
              placeholder="Search source fields"
              className="h-7 w-full min-w-0 py-0"
            />
            <Switch checked={false} disabled label="Show Hidden Fields" />
          </div>
          <div className="hidden md:block" aria-hidden />
          <div className="flex min-w-0 items-center justify-start">
            <MapVisibilityTrimode value={mapVisibility} onChange={onMapVisibilityChange} />
          </div>
          <div className="hidden md:block" aria-hidden />
        </div>
      </div>
      <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto px-0 pb-28 pt-2">{table}</div>
    </div>
  );
}

export type ConnectorSetupPanelProps = {
  onClose: () => void;
  /** Connector being configured — from `?setup=` on the connectors route. */
  connectorId?: string;
};

/** 3-step connector setup wizard (schema mapping). Shown in a slide-over from `ConnectorsPage`. */
export function ConnectorSetupPanel({ onClose }: ConnectorSetupPanelProps) {
  const [rows] = useState(INITIAL_ROWS);
  const [mapVisibility, setMapVisibility] = useState<MapVisibilityMode>("all");
  const [connectorEnabled, setConnectorEnabled] = useState(true);

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      const mapped = isMappedRow(r);
      if (mapVisibility === "hideMapped" && mapped) return false;
      if (mapVisibility === "hideUnmapped" && !mapped) return false;
      return true;
    });
  }, [rows, mapVisibility]);

  const columns: DataTableColumn<MappingRow>[] = useMemo(
    () => [
      {
        id: "source",
        header: "Source",
        className: "min-w-0 py-2 pl-0 pr-2 align-middle",
        cell: (r) => (
          <div className="flex min-h-7 w-full min-w-0 items-center gap-2 rounded border border-border-rule bg-surface-modal px-3 py-1">
            <p className="min-w-0 flex-1 truncate text-xs font-semibold tracking-[0.4px]">
              <span className="text-text-primary">{r.source}</span>
              <span className="whitespace-pre"> </span>
              <span className="font-semibold italic text-text-tertiary">{r.sample}</span>
            </p>
            <Icon name="visibility" size={20} className="shrink-0 text-text-tertiary" />
          </div>
        ),
      },
      {
        id: "_barGap",
        header: "",
        className: "p-0 align-middle",
        cell: () => null,
      },
      {
        id: "target",
        header: "Target",
        className: "min-w-0 py-2 pl-0 pr-2 align-middle",
        cell: (r) => (
          <div className="flex min-h-7 w-full min-w-0 items-center gap-1 rounded border border-border-rule bg-surface-modal px-3 py-1">
            {isMappedRow(r) ? (
              <div className="flex min-w-0 w-full flex-wrap gap-1">
                {(r.tags ?? []).map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            ) : (
              <span className="min-w-0 flex-1 truncate px-1 text-xs font-semibold italic tracking-[0.4px] text-text-tertiary">
                Unmapped
              </span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        className: "w-16 min-w-[4rem] max-w-[4rem] shrink-0 py-2 pl-4 pr-2 text-end align-middle",
        cell: () => (
          <div className="flex w-full justify-end">
            <Button variant="ghost" className="text-text-tertiary hover:text-text-primary" aria-label="Clear row">
              <Icon name="close" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-surface-modal px-5 text-text-primary">
      <header className="shrink-0 bg-surface-modal">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-rule px-0 pt-5 pb-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <Button variant="ghost" className="shrink-0 p-1" aria-label="Back" onClick={onClose}>
              <Icon name="chevron-down" size={20} className="rotate-90 text-text-primary" />
            </Button>
            <Icon name="aws-athena" size={24} className="shrink-0" title="Amazon Athena" />
            <h1 className="truncate text-page-title text-text-primary">Amazon Athena</h1>
            <Switch checked={connectorEnabled} onCheckedChange={setConnectorEnabled} label="Connector Enabled" />
            <span className="shrink-0 rounded bg-badge-muted px-2 py-1.5 text-xs font-semibold leading-4 tracking-[0.4px] text-white [html[data-theme=light]_&]:text-text-on-primary">
              DYNAMIC SCHEMA
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-1 text-base leading-6 tracking-[0.5px] text-text-primary">
              <Button variant="ghost" className="p-1" aria-label="Previous step">
                <Icon name="chevron-down" size={20} className="rotate-90 text-text-primary" />
              </Button>
              <span className="min-w-[96px] text-center text-base font-normal leading-6">Step 3 of 3</span>
              <Button variant="ghost" className="p-1" aria-label="Next step">
                <Icon name="chevron-down" size={20} className="-rotate-90 text-text-primary" />
              </Button>
            </div>
            <Button variant="ghost" className="rounded-2xl p-1" aria-label="Close" title="Close" onClick={onClose}>
              <Icon name="close" size={24} />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border-rule px-0 py-4">
          <ProgressStepper currentStep={3} />
          <ConnectionTitleLink />
        </div>

        <p className="py-3 text-base-semibold italic text-text-tertiary">{ADVANCED_MODE_CALLOUT}</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-surface-modal md:flex-row md:items-stretch">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border-rule px-0 py-4">
              <MappingToolbarV2 />
            </div>
            <FieldMappingBar
              rows={rows}
              mapVisibility={mapVisibility}
              onMapVisibilityChange={setMapVisibility}
              table={
                <DataTable<MappingRow>
                  caption="Map source fields from the security schema to the query data model."
                  colgroup={MAPPING_FIELD_COLGROUP}
                  hideHeader
                  className="w-full min-w-0"
                  rowKey={(r) => r.source}
                  rows={visibleRows}
                  columns={columns}
                />
              }
            />
          </div>

          <div className="flex min-h-0 w-full flex-1 flex-col border-t border-border-rule py-4 md:w-[300px] md:flex-none md:border-t-0 md:py-4 md:pl-4">
            <MapSchemaOverviewCard />
          </div>
        </div>

      <FloatingActions onCancel={onClose} />
    </div>
  );
}
