import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { CircleX, Plus, Search } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { ACTION_ICON_NAMES } from "../assets/icons/action-icons";
import { NAVI_ICON_NAMES } from "../assets/icons/navi-icons";
import { NAV_ELEMENT_ICON_NAMES } from "../assets/icons/nav-elements-icons";
import { EXTRA_ICON_NAMES } from "../assets/icons/extra-icons";
import { QUERY_DS_ICON_NAMES } from "../assets/icons/query-ds-icons";
import { OBSERVABLE_ENTITY_ICON_NAMES } from "../assets/icons/observable-icons";
import { OCSF_EVENT_ICON_NAMES } from "../assets/icons/ocsf-icons";
import { SEVERITY_SHAPE_ICON_NAMES } from "../assets/icons/severity-icons";
import { CONNECTOR_LARGE_ICON_NAMES } from "../assets/icons/connector-large-icons";
import { MISC_TECHNOLOGY_ICON_NAMES } from "../assets/icons/icons";
import { Badge } from "@/components/shadcn/badge";
import { Input } from "@/components/shadcn/input";
import { Switch } from "@/components/shadcn/switch";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/shadcn/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Snackbar } from "../components/ui/Snackbar";
import { Icon } from "../design-system";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type DSMode = "dark" | "light" | "wireframe";

// ─── Section registry ─────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "form", label: "Form Elements" },
  { id: "badges", label: "Badges" },
  { id: "tabs", label: "Tabs" },
  { id: "separator", label: "Separator" },
  { id: "snackbar", label: "Snackbar" },
  { id: "icons", label: "Icons" },
  { id: "lucide", label: "Lucide Icons" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"] | "all";

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-base font-bold uppercase tracking-widest text-text-tertiary">{children}</h2>
  );
}

function DemoCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("rounded border border-border-container bg-surface-container p-6", className)}>
      {children}
    </div>
  );
}

function ControlBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded border border-border-container bg-surface-table-row-header px-4 py-2.5">
      {children}
    </div>
  );
}

function PropPills<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{label}</span>
      <div className="flex overflow-hidden rounded border border-border-container">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cx(
              "px-2.5 py-1 text-xs font-medium transition-colors",
              opt === value
                ? "bg-interactive-active text-text-on-primary"
                : "text-text-secondary hover:bg-overlay-subtle hover:text-text-primary",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cx(
          "rounded border px-2.5 py-1 text-xs font-medium transition-colors",
          value
            ? "border-interactive-active bg-interactive-active text-text-on-primary"
            : "border-border-container text-text-secondary hover:text-text-primary",
        )}
      >
        {value ? "on" : "off"}
      </button>
    </div>
  );
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const COLOR_GROUPS = [
  {
    group: "Text",
    tokens: [
      { name: "text-primary", var: "--color-text-primary" },
      { name: "text-secondary", var: "--color-text-secondary" },
      { name: "text-tertiary", var: "--color-text-tertiary" },
      { name: "text-disabled", var: "--color-text-disabled" },
      { name: "text-on-primary", var: "--color-text-on-primary" },
    ],
  },
  {
    group: "Surface",
    tokens: [
      { name: "surface-page", var: "--color-surface-page" },
      { name: "surface-container", var: "--color-surface-container" },
      { name: "surface-modal", var: "--color-surface-modal" },
      { name: "surface-table-row-header", var: "--color-surface-table-row-header" },
      { name: "datavis-card-bg", var: "--color-datavis-card-bg" },
    ],
  },
  {
    group: "Border",
    tokens: [
      { name: "border-container", var: "--color-border-container" },
      { name: "border-rule", var: "--color-border-rule" },
      { name: "datavis-gridlines", var: "--color-datavis-gridlines" },
    ],
  },
  {
    group: "Interactive",
    tokens: [
      { name: "interactive-active", var: "--color-interactive-active" },
      { name: "interactive-selected", var: "--color-interactive-selected" },
      { name: "interactive-secondary-hover", var: "--color-interactive-secondary-hover" },
      { name: "overlay-subtle", var: "--color-overlay-subtle" },
    ],
  },
  {
    group: "Feedback",
    tokens: [
      { name: "feedback-positive", var: "--color-feedback-positive" },
      { name: "feedback-negative", var: "--color-feedback-negative" },
      { name: "feedback-caution", var: "--color-feedback-caution" },
      { name: "feedback-info", var: "--color-feedback-info" },
      { name: "feedback-bg-positive", var: "--color-feedback-bg-positive" },
      { name: "feedback-bg-negative", var: "--color-feedback-bg-negative" },
      { name: "feedback-bg-caution", var: "--color-feedback-bg-caution" },
      { name: "feedback-bg-neutral", var: "--color-feedback-bg-neutral" },
    ],
  },
  {
    group: "Datavis",
    tokens: [
      { name: "data-peanut-orange", var: "--color-datavis-data-peanut-orange" },
      { name: "data-smalt-green-20", var: "--color-datavis-data-smalt-green-20" },
      { name: "data-smalt-green-40", var: "--color-datavis-data-smalt-green-40" },
      { name: "data-weak-red-30", var: "--color-datavis-data-weak-red-30" },
      { name: "data-rouge-40", var: "--color-datavis-data-rouge-40" },
      { name: "data-pop-teal-20", var: "--color-datavis-data-pop-teal-20" },
    ],
  },
];

function ColorsSection() {
  return (
    <section className="flex flex-col gap-6">
      <SectionTitle>Colors</SectionTitle>
      {COLOR_GROUPS.map(({ group, tokens }) => (
        <div key={group} className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-text-secondary">{group}</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {tokens.map(({ name, var: cssVar }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div
                  className="h-9 w-full rounded border border-black/10"
                  style={{ backgroundColor: `var(${cssVar})` }}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold leading-none text-text-primary">{name}</span>
                  <code className="text-[10px] leading-none text-text-tertiary">{cssVar}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// ─── Typography ───────────────────────────────────────────────────────────────

function TypographySection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>Typography</SectionTitle>
      <DemoCard className="flex flex-col divide-y divide-border-rule text-text-primary">
        {[
          { label: "text-page-title text-text-primary", className: "text-page-title text-text-primary", sample: "Page Title — Lato 20 bold" },
          { label: "text-base-semibold text-text-primary", className: "text-base-semibold text-text-primary", sample: "Base Semibold — Lato 14 semibold" },
          { label: "text-sm font-bold text-text-primary", className: "text-sm font-bold text-text-primary", sample: "Table heading — Lato 14 bold" },
          { label: "text-tbl-head uppercase tracking-wide text-text-primary", className: "text-tbl-head uppercase tracking-wide text-text-primary", sample: "TBL HEAD — LATO 12 BOLD" },
          { label: "text-sm text-text-primary", className: "text-sm text-text-primary", sample: "Body — Lato 14 regular" },
          { label: "text-base-small text-text-primary", className: "text-base-small text-text-primary", sample: "Small — Lato 12 regular" },
          { label: "text-xs text-text-tertiary", className: "text-xs text-text-tertiary", sample: "Caption — Lato 12 regular" },
        ].map(({ label, className, sample }) => (
          <div key={label} className="flex items-baseline gap-4 py-3 first:pt-0 last:pb-0">
            <code className="w-60 shrink-0 text-[10px] text-text-tertiary">{label}</code>
            <span className={className}>{sample}</span>
          </div>
        ))}
      </DemoCard>
    </section>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

type BtnVariant = "default" | "secondary-outline" | "ghost" | "outline" | "destructive" | "link";
type BtnSize = "default" | "sm" | "lg" | "xs" | "icon" | "icon-sm" | "icon-xs" | "icon-lg";

function ButtonsSection() {
  const [variant, setVariant] = useState<BtnVariant>("default");
  const [size, setSize] = useState<BtnSize>("default");
  const [disabled, setDisabled] = useState(false);
  const [withIcon, setWithIcon] = useState(false);

  const isIconSize = size.startsWith("icon");

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Buttons</SectionTitle>
      <ControlBar>
        <PropPills
          label="variant"
          options={["default", "secondary-outline", "ghost", "outline", "destructive", "link"] as const}
          value={variant}
          onChange={setVariant}
        />
        <PropPills
          label="size"
          options={["default", "sm", "xs", "lg", "icon", "icon-sm", "icon-xs", "icon-lg"] as const}
          value={size}
          onChange={setSize}
        />
        <Toggle label="disabled" value={disabled} onChange={setDisabled} />
        <Toggle label="icon" value={withIcon} onChange={setWithIcon} />
      </ControlBar>
      <DemoCard className="flex flex-wrap items-center gap-4">
        <Button variant={variant} size={size} disabled={disabled}>
          {(withIcon || isIconSize) && <Plus size={14} strokeWidth={1.5} />}
          {!isIconSize && "Button"}
        </Button>
        {!isIconSize && (
          <Button variant={variant} size={size} disabled={disabled}>
            {withIcon && <Plus size={14} strokeWidth={1.5} />}
            With trailing
            <Icon name="navi-chevron-right" size={16} />
          </Button>
        )}
      </DemoCard>

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-text-secondary">All variants — default size</h3>
        <DemoCard className="flex flex-wrap items-center gap-3">
          {(["default", "secondary-outline", "ghost", "outline", "destructive", "link"] as BtnVariant[]).map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
        </DemoCard>

        <h3 className="text-xs font-semibold text-text-secondary">Disabled</h3>
        <DemoCard className="flex flex-wrap items-center gap-3">
          {(["default", "secondary-outline", "ghost", "outline", "destructive"] as BtnVariant[]).map((v) => (
            <Button key={v} variant={v} disabled>{v}</Button>
          ))}
        </DemoCard>

        <h3 className="text-xs font-semibold text-text-secondary">Sizes — default variant</h3>
        <DemoCard className="flex flex-wrap items-end gap-3">
          {(["lg", "default", "sm", "xs"] as BtnSize[]).map((s) => (
            <Button key={s} size={s}>{s}</Button>
          ))}
          {(["icon-lg", "icon", "icon-sm", "icon-xs"] as BtnSize[]).map((s) => (
            <Button key={s} size={s} aria-label={s}>
              <Plus size={s === "icon-xs" ? 12 : s === "icon-sm" ? 14 : 16} strokeWidth={1.5} />
            </Button>
          ))}
        </DemoCard>

        <h3 className="text-xs font-semibold text-text-secondary">With icons</h3>
        <DemoCard className="flex flex-wrap items-center gap-3">
          <Button variant="default">
            <Plus size={14} strokeWidth={1.5} /> Add item
          </Button>
          <Button variant="secondary-outline">
            <Icon name="action-filter-list" size={16} /> Filter
          </Button>
          <Button variant="ghost">
            <Search size={16} strokeWidth={1.5} /> Search
          </Button>
          <Button variant="destructive">
            <Icon name="action-delete" size={16} /> Delete
          </Button>
        </DemoCard>
      </div>
    </section>
  );
}

// ─── Form Elements ────────────────────────────────────────────────────────────

function FormSection() {
  const [switched, setSwitched] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [invalid, setInvalid] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Form Elements</SectionTitle>
      <ControlBar>
        <Toggle label="disabled" value={disabled} onChange={setDisabled} />
        <Toggle label="invalid" value={invalid} onChange={setInvalid} />
      </ControlBar>
      <DemoCard className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">Input</label>
          <Input placeholder="Type something…" disabled={disabled} aria-invalid={invalid || undefined} />
          <Input defaultValue="Filled value" disabled={disabled} aria-invalid={invalid || undefined} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">Textarea</label>
          <textarea
            className="min-h-[72px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-interactive-active disabled:opacity-50"
            placeholder="Multi-line input…"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-text-secondary">Checkbox</label>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
              <Checkbox defaultChecked={false} disabled={disabled} />
              Unchecked
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
              <Checkbox defaultChecked disabled={disabled} />
              Checked
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-text-secondary">Switch</label>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
              <Switch checked={switched} onCheckedChange={setSwitched} disabled={disabled} />
              {switched ? "On" : "Off"}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
              <Switch defaultChecked disabled={disabled} />
              Always on
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">Select</label>
          <Select disabled={disabled}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pick an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alpha">Alpha</SelectItem>
              <SelectItem value="beta">Beta</SelectItem>
              <SelectItem value="gamma">Gamma</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">Search input</label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-2 text-text-tertiary">
              <Search size={16} strokeWidth={1.5} />
            </span>
            <Input placeholder="Search…" disabled={disabled} className="pl-7" />
          </div>
        </div>
      </DemoCard>
    </section>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";

function BadgesSection() {
  const [variant, setVariant] = useState<BadgeVariant>("default");

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Badges</SectionTitle>
      <ControlBar>
        <PropPills
          label="variant"
          options={["default", "secondary", "destructive", "outline", "ghost"] as const}
          value={variant}
          onChange={setVariant}
        />
      </ControlBar>
      <DemoCard className="flex flex-wrap items-center gap-3">
        <Badge variant={variant}>Badge</Badge>
        <Badge variant={variant}>
          <Icon name="action-filter-list" size={10} />
          With icon
        </Badge>
        <Badge variant={variant}>42</Badge>
      </DemoCard>
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-text-secondary">All variants</h3>
        <DemoCard className="flex flex-wrap items-center gap-2">
          {(["default", "secondary", "destructive", "outline", "ghost"] as BadgeVariant[]).map((v) => (
            <Badge key={v} variant={v}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Badge>
          ))}
        </DemoCard>
      </div>
    </section>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function TabsSection() {
  const [tabVariant, setTabVariant] = useState<"default" | "line">("default");

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Tabs</SectionTitle>
      <ControlBar>
        <PropPills
          label="variant"
          options={["default", "line"] as const}
          value={tabVariant}
          onChange={setTabVariant}
        />
      </ControlBar>
      <DemoCard>
        <Tabs defaultValue="one">
          <TabsList variant={tabVariant}>
            <TabsTrigger value="one">Overview</TabsTrigger>
            <TabsTrigger value="two">Details</TabsTrigger>
            <TabsTrigger value="three">Activity</TabsTrigger>
            <TabsTrigger value="four" disabled>
              Disabled
            </TabsTrigger>
          </TabsList>
          <TabsContent value="one">
            <p className="mt-4 text-sm text-text-secondary">Overview tab content.</p>
          </TabsContent>
          <TabsContent value="two">
            <p className="mt-4 text-sm text-text-secondary">Details tab content.</p>
          </TabsContent>
          <TabsContent value="three">
            <p className="mt-4 text-sm text-text-secondary">Activity tab content.</p>
          </TabsContent>
        </Tabs>
      </DemoCard>
    </section>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

function SeparatorSection() {
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Separator</SectionTitle>
      <DemoCard className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-text-tertiary">Horizontal — border-rule</span>
          <Separator className="bg-border-rule" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-text-tertiary">Horizontal — border-container</span>
          <Separator className="bg-border-container" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-text-tertiary">Vertical</span>
          <div className="flex h-8 items-center gap-4">
            <span className="text-sm text-text-primary">Left</span>
            <Separator orientation="vertical" className="h-full bg-border-rule" />
            <span className="text-sm text-text-primary">Right</span>
          </div>
        </div>
      </DemoCard>
    </section>
  );
}

// ─── Snackbar ─────────────────────────────────────────────────────────────────

type SnackVariant = "neutral" | "positive" | "negative" | "caution";

const SNACK_STYLES: Record<SnackVariant, { bg: string; text: string; border: string; label: string }> = {
  neutral: { bg: "bg-surface-modal", text: "text-text-primary", border: "border-border-rule", label: "Action completed." },
  positive: { bg: "bg-feedback-bg-positive", text: "text-feedback-positive", border: "border-feedback-positive/30", label: "Saved successfully." },
  negative: { bg: "bg-feedback-bg-negative", text: "text-feedback-negative", border: "border-feedback-negative/30", label: "Something went wrong." },
  caution: { bg: "bg-feedback-bg-caution", text: "text-feedback-caution", border: "border-feedback-caution/30", label: "Proceed with caution." },
};

function SnackbarSection() {
  const [variant, setVariant] = useState<SnackVariant>("neutral");
  const [open, setOpen] = useState(false);
  const style = SNACK_STYLES[variant];

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Snackbar</SectionTitle>
      <ControlBar>
        <PropPills
          label="variant"
          options={["neutral", "positive", "negative", "caution"] as const}
          value={variant}
          onChange={setVariant}
        />
      </ControlBar>
      <DemoCard className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(SNACK_STYLES) as SnackVariant[]).map((v) => {
            const s = SNACK_STYLES[v];
            return (
              <div
                key={v}
                className={cx(
                  "flex items-center gap-2 rounded border px-4 py-2.5 text-sm font-semibold shadow-sm",
                  s.bg, s.text, s.border,
                )}
              >
                {s.label}
              </div>
            );
          })}
        </div>
        <Separator className="bg-border-rule" />
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Show {variant} snackbar
          </Button>
          <span className="text-xs text-text-tertiary">Auto-dismisses after 4s</span>
        </div>
      </DemoCard>
      <Snackbar
        open={open}
        onClose={() => setOpen(false)}
        message={
          <span className={cx(style.text)}>{style.label}</span>
        }
      />
    </section>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICON_CATEGORIES: { label: string; names: readonly string[]; defaultSize: number }[] = [
  { label: "Action", names: ACTION_ICON_NAMES, defaultSize: 18 },
  { label: "Navigation", names: NAVI_ICON_NAMES, defaultSize: 18 },
  { label: "Nav Elements", names: NAV_ELEMENT_ICON_NAMES, defaultSize: 18 },
  { label: "Extra", names: EXTRA_ICON_NAMES, defaultSize: 18 },
  { label: "Query DS", names: QUERY_DS_ICON_NAMES, defaultSize: 18 },
  { label: "Observable Entity", names: OBSERVABLE_ENTITY_ICON_NAMES, defaultSize: 18 },
  { label: "OCSF Events", names: OCSF_EVENT_ICON_NAMES, defaultSize: 18 },
  { label: "Severity", names: SEVERITY_SHAPE_ICON_NAMES, defaultSize: 18 },
  { label: "Connector Logos", names: CONNECTOR_LARGE_ICON_NAMES, defaultSize: 32 },
  { label: "Misc Technology", names: MISC_TECHNOLOGY_ICON_NAMES, defaultSize: 20 },
];

const ICON_SIZES = [12, 14, 16, 18, 20, 24, 32] as const;
type IconSize = (typeof ICON_SIZES)[number];

function IconsSection() {
  const [search, setSearch] = useState("");
  const [size, setSize] = useState<IconSize>(18);
  const [copied, setCopied] = useState<string | null>(null);

  const query = search.toLowerCase().trim();

  function copyName(name: string) {
    navigator.clipboard.writeText(name).catch(() => {});
    setCopied(name);
    setTimeout(() => setCopied(null), 1500);
  }

  const filteredCategories = ICON_CATEGORIES.map((cat) => ({
    ...cat,
    names: query ? cat.names.filter((n) => n.toLowerCase().includes(query)) : cat.names,
  })).filter((cat) => cat.names.length > 0);

  const totalVisible = filteredCategories.reduce((sum, c) => sum + c.names.length, 0);

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>Icons</SectionTitle>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex min-w-0 flex-1 items-center">
          <span className="pointer-events-none absolute left-2 text-text-tertiary">
            <Search size={16} strokeWidth={1.5} />
          </span>
          <Input
            placeholder="Search icons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7"
          />
        </div>
        <PropPills
          label="size"
          options={ICON_SIZES}
          value={size}
          onChange={setSize}
        />
        <span className="text-xs text-text-tertiary">{totalVisible} icons</span>
      </div>

      <div className="flex flex-col gap-8">
        {filteredCategories.map(({ label, names }) => (
          <div key={label} className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-text-secondary">
              {label} <span className="font-normal text-text-tertiary">({names.length})</span>
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-px rounded border border-border-container overflow-hidden">
              {names.map((name) => (
                <button
                  key={name}
                  type="button"
                  title={`Click to copy: ${name}`}
                  onClick={() => copyName(name)}
                  className={cx(
                    "flex flex-col items-center gap-2 bg-surface-container px-2 py-3 text-center transition-colors hover:bg-interactive-selected",
                    copied === name && "bg-interactive-active text-text-on-primary",
                  )}
                >
                  <span className={cx(copied === name ? "text-text-on-primary" : "text-text-primary")}>
                    <Icon name={name as Parameters<typeof Icon>[0]["name"]} size={size} />
                  </span>
                  <span
                    className={cx(
                      "w-full truncate text-[9px] leading-none",
                      copied === name ? "text-text-on-primary" : "text-text-tertiary",
                    )}
                  >
                    {copied === name ? "copied!" : name.replace(/^[^-]+-/, "")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Lucide Icons ─────────────────────────────────────────────────────────────

type LucideComponent = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const LUCIDE_ENTRIES: { name: string; Comp: LucideComponent }[] = (
  Object.entries(LucideIcons) as [string, unknown][]
)
  .filter(([name, val]) =>
    val !== null &&
    typeof val === "object" &&
    /^[A-Z]/.test(name) &&
    !name.endsWith("Icon"),
  )
  .map(([name, Comp]) => ({ name, Comp: Comp as LucideComponent }))
  .sort((a, b) => a.name.localeCompare(b.name));

function LucideIconsSection() {
  const [search, setSearch] = useState("");
  const [size, setSize] = useState<IconSize>(18);
  const [strokeWidth, setStrokeWidth] = useState<1 | 1.5 | 2 | 2.5>(1.5);
  const [copied, setCopied] = useState<string | null>(null);

  const query = search.toLowerCase().replace(/[-_\s]+/g, "").trim();
  const filtered = useMemo(
    () => query ? LUCIDE_ENTRIES.filter(({ name }) => name.toLowerCase().includes(query)) : LUCIDE_ENTRIES,
    [query],
  );

  function copyName(name: string) {
    navigator.clipboard.writeText(name).catch(() => {});
    setCopied(name);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>Lucide Icons</SectionTitle>
      <p className="text-sm text-text-tertiary">
        {LUCIDE_ENTRIES.length} icons from{" "}
        <a
          href="https://lucide.dev"
          target="_blank"
          rel="noreferrer"
          className="text-interactive-active underline underline-offset-2 hover:opacity-80"
        >
          lucide.dev
        </a>{" "}
        — click to copy the component name.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex min-w-0 flex-1 items-center">
          <span className="pointer-events-none absolute left-2 text-text-tertiary">
            <Search size={16} strokeWidth={1.5} />
          </span>
          <Input
            placeholder="Search Lucide icons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cx("pl-7", search && "pr-7")}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 flex items-center text-text-tertiary hover:text-text-primary"
              aria-label="Clear search"
            >
              <CircleX size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
        <PropPills label="size" options={ICON_SIZES} value={size} onChange={setSize} />
        <PropPills label="stroke" options={[1, 1.5, 2, 2.5] as const} value={strokeWidth} onChange={setStrokeWidth} />
        <span className="text-xs text-text-tertiary">
          {query ? `${filtered.length} of ${LUCIDE_ENTRIES.length}` : `${LUCIDE_ENTRIES.length} icons`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded border border-border-container py-16 text-sm text-text-tertiary">
          No icons match &ldquo;{search}&rdquo;
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-px overflow-hidden rounded border border-border-container">
          {filtered.map(({ name, Comp }) => (
            <button
              key={name}
              type="button"
              title={`Click to copy: ${name}`}
              onClick={() => copyName(name)}
              className={cx(
                "flex flex-col items-center gap-2 bg-surface-container px-2 py-3 text-center transition-colors hover:bg-interactive-selected",
                copied === name && "bg-interactive-active",
              )}
            >
              <span className={cx("flex items-center justify-center", copied === name ? "text-text-on-primary" : "text-text-primary")}>
                <Comp size={size} strokeWidth={strokeWidth} />
              </span>
              <span className={cx("w-full truncate text-[9px] leading-none", copied === name ? "text-text-on-primary" : "text-text-tertiary")}>
                {copied === name ? "copied!" : name}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Left nav ─────────────────────────────────────────────────────────────────

function DSNav({
  active,
  onChange,
}: {
  active: SectionId;
  onChange: (id: SectionId) => void;
}) {
  return (
    <nav className="flex w-44 shrink-0 flex-col overflow-y-auto border-r border-border-container bg-surface-container py-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cx(
          "mx-2 rounded px-3 py-1.5 text-left text-sm font-semibold transition-colors",
          active === "all"
            ? "bg-interactive-selected text-text-primary"
            : "text-text-secondary hover:bg-overlay-subtle hover:text-text-primary",
        )}
      >
        All
      </button>
      <div className="mx-3 my-2 h-px bg-border-rule" />
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={cx(
            "mx-2 rounded px-3 py-1.5 text-left text-sm transition-colors",
            active === s.id
              ? "bg-interactive-selected font-semibold text-text-primary"
              : "text-text-secondary hover:bg-overlay-subtle hover:text-text-primary",
          )}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Mode switcher ────────────────────────────────────────────────────────────

function ModeSwitcher({ mode, onChange }: { mode: DSMode; onChange: (m: DSMode) => void }) {
  return (
    <div className="flex overflow-hidden rounded border border-border-container">
      {(["dark", "light", "wireframe"] as DSMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cx(
            "px-3 py-1.5 text-xs font-semibold transition-colors",
            m === mode
              ? "bg-interactive-active text-text-on-primary"
              : "text-text-secondary hover:bg-overlay-subtle hover:text-text-primary",
          )}
        >
          {m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function SectionContent({ id }: { id: SectionId }) {
  if (id === "all") {
    return (
      <>
        <ColorsSection />
        <TypographySection />
        <ButtonsSection />
        <FormSection />
        <BadgesSection />
        <TabsSection />
        <SeparatorSection />
        <SnackbarSection />
        <IconsSection />
        <LucideIconsSection />
      </>
    );
  }
  switch (id) {
    case "colors": return <ColorsSection />;
    case "typography": return <TypographySection />;
    case "buttons": return <ButtonsSection />;
    case "form": return <FormSection />;
    case "badges": return <BadgesSection />;
    case "tabs": return <TabsSection />;
    case "separator": return <SeparatorSection />;
    case "snackbar": return <SnackbarSection />;
    case "icons": return <IconsSection />;
    case "lucide": return <LucideIconsSection />;
  }
}

export function DesignSystemPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<DSMode>("dark");
  const [activeSection, setActiveSection] = useState<SectionId>("all");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header — always uses the outer app theme */}
      <header className="flex shrink-0 items-center justify-between border-b border-border-container bg-surface-container px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded p-1 text-text-tertiary transition-colors hover:bg-overlay-subtle hover:text-text-primary"
            aria-label="Go back"
          >
            <Icon name="navi-chevron-left" size={18} />
          </button>
          <span className="text-base-semibold text-text-primary">Design System</span>
        </div>
        <ModeSwitcher mode={mode} onChange={setMode} />
      </header>

      {/* Body — scoped to DS mode */}
      <div data-theme={mode} className="flex min-h-0 flex-1 overflow-hidden bg-surface-page text-text-primary">
        <DSNav active={activeSection} onChange={setActiveSection} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-4xl flex-col gap-12 px-8 py-10">
            <SectionContent id={activeSection} />
          </div>
        </div>
      </div>
    </div>
  );
}
