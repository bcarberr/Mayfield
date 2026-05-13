import { useMemo, useState } from "react";
import { Icon } from "../design-system";
import { Button } from "../components/ui/Button";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { Input } from "../components/ui/Input";
import { ThemeToggle } from "../components/ThemeToggle";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const BASIC_MODE_CALLOUT =
  "To get started, use Basic Mode. Basic Mode has one required field: Event Time. You then can map any Entity to any field. Some other recommended fields may also be helpful to get started: activity, message, severity, and status. You can switch to Advanced Mode or Basic Mode anytime and not lose any mappings.";

function Switch({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className={cx(
          "relative h-[18px] w-9 shrink-0 rounded-full transition-colors",
          on ? "bg-interactive-active" : "border border-border-container bg-transparent",
        )}
      >
        <span
          className={cx(
            "absolute top-[3px] size-3 rounded-full transition-[left]",
            on ? "left-[21px] bg-text-on-primary" : "left-1 bg-border-container",
          )}
        />
      </button>
      <span className="text-sm font-semibold leading-[18px] text-text-tertiary">{label}</span>
    </div>
  );
}

function ProgressStepper() {
  return (
    <div className="relative flex flex-wrap items-end justify-center gap-4 px-6 pb-4 pt-2">
      <div className="relative flex max-w-[632px] flex-1 items-start justify-between">
        <div className="absolute top-5 right-[52px] left-[52px] h-0.5 bg-border-rule" aria-hidden />
        <div className="absolute top-5 left-[52px] h-0.5 w-[calc(33%-20px)] bg-interactive-active" aria-hidden />
        <div className="absolute top-5 left-[calc(33%+20px)] h-0.5 w-[calc(33%-40px)] bg-border-rule" aria-hidden />
        <div className="relative z-10 flex w-[110px] flex-col items-center gap-1 text-center">
          <div className="flex h-10 w-10 items-center justify-center">
            <Icon name="check-circle" size={28} className="text-interactive-active" />
          </div>
          <span className="text-sm leading-[18px] text-text-secondary">1. Connector Info</span>
        </div>
        <div className="relative z-10 flex w-[130px] flex-col items-center gap-1 text-center">
          <div className="flex h-10 w-10 items-center justify-center">
            <Icon name="check-circle-outline" size={28} className="text-interactive-active" />
          </div>
          <span className="text-sm leading-[18px] text-text-primary">2. Preview/Import Fields</span>
        </div>
        <div className="relative z-10 flex w-[130px] flex-col items-center gap-1 text-center">
          <div className="flex h-10 w-10 items-center justify-center">
            <Icon name="circle" size={22} className="text-text-tertiary" />
          </div>
          <span className="text-sm leading-[18px] text-text-secondary">3. Map & Review Data</span>
        </div>
      </div>
    </div>
  );
}

type MappingRow = {
  source: string;
  sample: string;
  mapped: boolean;
  tags?: string[];
};

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

function SideNav() {
  const item = "flex size-10 items-center justify-center text-text-secondary/80 hover:bg-overlay-subtle";
  return (
    <aside className="flex w-10 shrink-0 flex-col items-center border-r border-black/30 bg-nav-bg py-2">
      <div className={cx(item, "mb-1 text-interactive-active")} title="Home">
        <span className="text-[11px] font-bold tracking-tight">M</span>
      </div>
      <button type="button" className={item} title="Summary">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 19V5M10 19V9M16 19v-6M22 19V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <button type="button" className={item} title="Search">
        <Icon name="search" size={20} className="text-current" />
      </button>
      <button type="button" className={cx(item, "bg-nav-highlight/60 text-text-primary")} title="Connectors">
        <Icon name="connectors" size={20} />
      </button>
      <button type="button" className={item} title="Detections">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
    </aside>
  );
}

function SchemaPanel() {
  const [advOpen, setAdvOpen] = useState(true);
  const profiles = ["Cloud", "Container", "Host", "Incident", "Network", "Process", "User", "Web"];

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-border-rule bg-surface-modal">
      <div className="border-b border-border-rule px-4 pt-2 pb-3">
        <p className="text-[12px] font-bold uppercase leading-[14px] tracking-[0.4px] text-text-tertiary">MAP Schema</p>
        <div className="relative mt-2 flex h-7 w-[150px] items-center rounded-full bg-surface-container">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[calc(100%-28px)] rounded-full bg-black" aria-hidden />
          <span className="relative z-[1] pl-2.5 text-[14px] font-bold leading-5 tracking-[0.4px] text-text-primary">
            Basic Mode
          </span>
          <span className="relative z-[1] ml-auto pr-0.5">
            <Icon name="chevron-down" size={20} className="text-text-primary" />
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-[14px] font-bold leading-5 tracking-[0.4px] text-text-primary">HTTP Activity</p>
          <button type="button" className="rounded p-0.5 text-text-primary hover:bg-overlay-subtle" aria-label="Open menu">
            <Icon name="chevron-down" size={24} />
          </button>
        </div>
        <div className="mt-3">
          <Input
            variant="search"
            readOnly
            tabIndex={-1}
            startAdornment={<Icon name="search" size={18} />}
            placeholder="Search classification attributes"
            className="h-7 border-border-rule px-1.5 py-0"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <button
          type="button"
          onClick={() => setAdvOpen((v) => !v)}
          className="flex w-full items-center gap-1 py-2 text-left text-xs font-semibold text-text-tertiary"
        >
          <Icon name="chevron-down" size={18} className={cx("transition-transform", !advOpen && "-rotate-90")} />
          Advanced Options
        </button>
        {advOpen && (
          <>
            <p className="mb-2 mt-1 text-xs font-semibold tracking-wide text-text-tertiary">Include Extensions</p>
            <label className="flex cursor-pointer items-center gap-2 py-1 text-xs font-semibold text-text-secondary">
              <input type="checkbox" defaultChecked className="accent-interactive-active" />
              Linux (1) v1.4.0
            </label>
            <label className="flex cursor-pointer items-center gap-2 py-1 text-xs font-semibold text-text-secondary">
              <input type="checkbox" defaultChecked className="accent-interactive-active" />
              Windows (2) v1.4.0
            </label>
            <p className="mb-2 mt-4 text-xs font-semibold tracking-wide text-text-tertiary">Include Profiles</p>
            <div className="flex flex-col gap-1">
              {profiles.map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-2 py-0.5 text-xs text-text-secondary">
                  <input type="checkbox" defaultChecked className="accent-interactive-active" />
                  {p}
                </label>
              ))}
            </div>
            <div className="my-3 h-px bg-border-rule/60" />
            <ul className="space-y-0.5">
              {(
                [
                  ["Event Time*", true],
                  ["Entities", false],
                  ["activity_id", true],
                  ["activity_name", false],
                  ["message", false],
                  ["severity_id", true],
                  ["severity", false],
                  ["status_id", true],
                  ["status", false],
                ] as const
              ).map(([label, en]) => (
                <li
                  key={label}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-container"
                >
                  <span className="text-border-rule">◇</span>
                  <span className="flex-1 truncate">
                    {label}
                    {en ? <span className="ml-1 font-semibold italic text-accent-enum">enum</span> : null}
                  </span>
                  <button
                    type="button"
                    className="flex size-6 shrink-0 items-center justify-center rounded text-interactive-active hover:bg-interactive-active/10"
                    aria-label={`Add ${label}`}
                  >
                    +
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="h-3 w-3 shrink-0 cursor-col-resize self-start border-r border-border-rule bg-border-rule/20" aria-hidden />
    </aside>
  );
}

function FloatingActions() {
  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-20 flex justify-end p-6">
      <div className="pointer-events-auto flex items-center gap-2 rounded-tl-lg rounded-bl-lg bg-surface-container/80 px-3 py-2.5 shadow-lg ring-1 ring-border-container backdrop-blur-sm">
        <Button variant="tertiary" className="text-text-secondary hover:text-text-primary">
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

function MappingToolbarV2() {
  return (
    <div className="shrink-0 border-b border-border-rule bg-surface-modal px-6 py-3">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="mb-1 text-base font-semibold leading-[18px] text-text-primary">Event Class to Map</p>
          <div className="flex h-7 w-60 items-center gap-1 rounded border border-border-rule bg-surface-modal px-3">
            <Icon name="connectors" size={16} className="text-text-secondary" />
            <span className="flex-1 truncate text-sm font-semibold text-text-primary">HTTP Activity</span>
            <Icon name="chevron-down" size={18} className="text-text-secondary" />
          </div>
        </div>
        <Icon name="feedback-info-outline" size={18} className="mb-0.5 text-text-tertiary" />
        <Button variant="tertiary" className="mb-0.5 gap-1 text-text-secondary hover:text-text-primary">
          <span className="text-text-secondary" aria-hidden>
            ✎
          </span>
          Import Template
        </Button>
        <div className="mb-0.5 flex items-center gap-2">
          <Icon name="sparkle" size={16} className="text-text-primary" />
          <span className="text-base font-semibold text-text-primary">Copilot</span>
          <span className="rounded bg-beta px-1 py-0.5 text-xs font-bold uppercase tracking-wide text-beta-text">
            Beta
          </span>
        </div>
        <div className="mb-0.5 ml-auto flex flex-wrap items-center gap-6">
          <Switch on label="Allow Autosave" />
          <Button variant="tertiary" className="gap-1 text-text-secondary hover:text-text-primary">
            <Icon name="close" size={18} />
            Clear All Mappings
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldMappingBar({ rows }: { rows: MappingRow[] }) {
  const mapped = rows.filter((r) => r.mapped).length;
  return (
    <div className="shrink-0 border-b border-border-rule bg-surface-modal px-6 py-4">
      <p className="mb-3 text-sm font-semibold text-text-secondary">
        Mapped Fields: <span className="text-text-primary">{mapped}</span>
      </p>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-[18px]">
            <span className="text-text-primary">Source: </span>
            <span className="text-text-secondary">sample-securitystuff-schema-this-long</span>
          </p>
          <div className="mt-3 max-w-60">
            <Input
              variant="search"
              readOnly
              tabIndex={-1}
              startAdornment={<Icon name="search" size={18} />}
              placeholder="Search source fields"
              className="h-7 py-0"
            />
          </div>
        </div>
        <p className="text-sm font-semibold italic tracking-wide text-text-tertiary">Sample data shown*</p>
        <Switch on={false} label="Show Hidden Fields" />
        <div className="flex w-full flex-col gap-3 border-t border-border-rule/50 pt-3 min-[900px]:ml-auto min-[900px]:w-auto min-[900px]:border-t-0 min-[900px]:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">
              <span className="text-text-primary">Target: </span>
              <span className="text-text-secondary">Query Data Model</span>
            </p>
            <Icon name="feedback-info-outline" size={18} className="text-text-tertiary" />
          </div>
          <div className="flex flex-wrap items-center gap-8">
            <Switch on={false} label="Hide Mapped" />
            <Switch on={false} label="Hide Unmapped" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfigSchemaMapPage() {
  const [rows] = useState(INITIAL_ROWS);

  const columns: DataTableColumn<MappingRow>[] = useMemo(
    () => [
      {
        id: "source",
        header: "Source",
        className: "min-w-[220px] p-1 align-middle",
        cell: (r) => (
          <div className="flex min-h-7 items-center gap-2 rounded border border-border-rule bg-surface-modal px-3 py-1">
            <p className="min-w-0 flex-1 text-xs font-semibold tracking-[0.4px]">
              <span className="text-text-primary">{r.source}</span>
              <span className="whitespace-pre"> </span>
              <span className="font-semibold italic text-text-tertiary">{r.sample}</span>
            </p>
            <Icon name="visibility" size={20} className="shrink-0 text-text-tertiary" />
          </div>
        ),
      },
      {
        id: "target",
        header: "Target",
        className: "min-w-[220px] p-1 align-middle",
        cell: (r) => (
          <div className="flex min-h-7 items-center gap-1 rounded border border-border-rule bg-surface-modal px-3 py-1">
            {r.mapped && r.tags?.length ? (
              <div className="flex min-w-0 flex-wrap gap-1">
                {r.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            ) : (
              <span className="flex-1 px-1 text-xs font-semibold italic tracking-[0.4px] text-text-tertiary">Unmapped</span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        className: "w-14 p-1 text-center align-middle",
        cell: () => (
          <Button variant="ghost" className="mx-auto text-text-tertiary hover:text-text-primary" aria-label="Clear row">
            <Icon name="close" size={18} />
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <SideNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 bg-surface-modal">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-rule px-6 pt-5 pb-0">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <button
                type="button"
                className="mt-1 shrink-0 text-text-secondary hover:text-text-primary"
                aria-label="Back"
              >
                <Icon name="chevron-down" size={18} className="rotate-90" />
              </button>
              <Icon name="connectors" size={24} className="mt-0.5 shrink-0 text-interactive-active" />
              <h1 className="text-xl font-bold leading-6 tracking-[0.6px] text-text-primary">Amazon Athena</h1>
              <span className="rounded bg-badge-muted px-2 py-1 text-xs font-semibold tracking-[0.4px] text-text-primary">
                DYNAMIC SCHEMA
              </span>
              <Switch on label="Connector Enabled" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <div className="flex items-center gap-1 text-base tracking-[0.5px] text-text-primary">
                <Button variant="ghost" className="p-1" aria-label="Previous step">
                  <Icon name="chevron-down" size={20} className="rotate-90 text-text-primary" />
                </Button>
                <span className="min-w-[96px] text-center text-base font-normal leading-6">Step 2 of 3</span>
                <Button variant="ghost" className="p-1" aria-label="Next step">
                  <Icon name="chevron-down" size={20} className="-rotate-90 text-text-primary" />
                </Button>
              </div>
              <Button variant="ghost" className="rounded-2xl p-1" aria-label="Close" title="Close">
                <Icon name="close" size={24} />
              </Button>
            </div>
          </div>

          <ProgressStepper />

          <div className="px-6 pb-3">
            <a
              href="https://docs.aws.amazon.com/athena/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-wrap items-center gap-1 text-sm leading-[18px] text-text-tertiary hover:text-text-secondary"
            >
              Search and manage Amazon Athena Data Base.{" "}
              <span className="inline-flex items-center gap-1 font-normal text-interactive-active">
                Learn more
                <Icon name="external" size={14} />
              </span>
            </a>
          </div>

          <div className="h-px bg-border-rule" />

          <p className="px-6 py-3 text-sm font-semibold leading-[18px] tracking-wide text-text-primary">{BASIC_MODE_CALLOUT}</p>
        </header>

        <MappingToolbarV2 />

        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-modal">
            <div className="flex shrink-0 flex-wrap items-center gap-6 border-b border-border-rule px-6 py-2.5 text-xs font-semibold tracking-[0.4px] text-text-secondary">
              <span>Mapped Fields:</span>
              <span>0 of 873</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="error" size={20} className="text-text-secondary" />
                Errors: 0
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="warning" size={20} className="text-text-secondary" />
                Warnings: 0
              </span>
              <Button variant="tertiary" className="ml-auto gap-1 text-sm text-text-tertiary hover:text-text-secondary">
                <Icon name="close" size={18} />
                Clear all mappings
              </Button>
            </div>

            <FieldMappingBar rows={rows} />

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-28 pt-2">
              <DataTable<MappingRow>
                caption="Map source fields from the security schema to the query data model."
                hideHeader
                className="mx-auto max-w-[1072px]"
                rowKey={(r) => r.source}
                rows={rows}
                columns={columns}
              />
            </div>
          </div>

          <SchemaPanel />
        </div>
      </div>

      <FloatingActions />
    </div>
  );
}
