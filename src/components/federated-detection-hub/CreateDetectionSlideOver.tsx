import { useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { Checkbox, Icon, Switch, type SeverityShapeIconName } from "../../design-system";
import { Button } from "../ui/Button";
import { SeverityTableIcon } from "../ui/SeverityTableIcon";
import { SlideOverHeaderBackButton } from "../ui/SlideOver";
import { Snackbar } from "../ui/Snackbar";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const CREATE_DETECTION_TABS = ["Detection Settings", "Detection Logic"] as const;

type CreateDetectionTab = (typeof CREATE_DETECTION_TABS)[number];

type DetectionSeverity = "Critical" | "High" | "Medium" | "Low";

type ScheduledState = "draft" | "active" | "paused";

type OcsfCategory = "" | "process-activity" | "network-activity" | "identity-access" | "discovery";

type QueryLanguage = "FSQL";

type ScheduleFrequency = "Daily" | "Weekly" | "Monthly";

type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

type TimePeriod = "AM" | "PM";

const DEFAULT_DETECTION_QUERY = "SELECT * FROM events WHERE event_type = 'powershell_execution'";

const DEFAULT_ALERT_MESSAGE_TEMPLATE =
  "Alert: Detection {detection_name} triggered with {finding_count} findings.";

const DEFAULT_EMAIL_RECIPIENTS = "soc-team@company.com";

const ALERT_MESSAGE_VARIABLES = [
  "{detection_name}",
  "{finding_count}",
  "{severity}",
  "{run_time}",
  "{link}",
] as const;

type NotificationChannel = "email" | "slack" | "microsoftTeams" | "pagerDuty";

type NotificationChannels = Record<NotificationChannel, boolean>;

type ExpandedChannels = Record<NotificationChannel, boolean>;

const NOTIFICATION_CHANNEL_OPTIONS: readonly { id: NotificationChannel; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "slack", label: "Slack" },
  { id: "pagerDuty", label: "PagerDuty" },
  { id: "microsoftTeams", label: "Microsoft Teams" },
];

const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannels = {
  email: true,
  slack: false,
  microsoftTeams: false,
  pagerDuty: false,
};

const DEFAULT_EXPANDED_CHANNELS: ExpandedChannels = {
  email: true,
  slack: false,
  microsoftTeams: false,
  pagerDuty: false,
};

const CHANNEL_CONFIG_STUBS: Record<
  Exclude<NotificationChannel, "email">,
  { label: string; placeholder: string }
> = {
  slack: { label: "Webhook URL", placeholder: "https://hooks.slack.com/services/..." },
  pagerDuty: { label: "Integration Key", placeholder: "Enter PagerDuty integration key" },
  microsoftTeams: { label: "Webhook URL", placeholder: "https://outlook.office.com/webhook/..." },
};

const SCHEDULE_FREQUENCY_OPTIONS: readonly { id: ScheduleFrequency; label: string }[] = [
  { id: "Daily", label: "Daily" },
  { id: "Weekly", label: "Weekly" },
  { id: "Monthly", label: "Monthly" },
];

const DAY_OF_WEEK_OPTIONS: readonly { id: DayOfWeek; label: string }[] = [
  { id: "Mon", label: "Monday" },
  { id: "Tue", label: "Tuesday" },
  { id: "Wed", label: "Wednesday" },
  { id: "Thu", label: "Thursday" },
  { id: "Fri", label: "Friday" },
  { id: "Sat", label: "Saturday" },
  { id: "Sun", label: "Sunday" },
];

const SCHEDULE_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const hour = String(index + 1);
  return { id: hour, label: hour };
});

const SCHEDULE_MINUTE_OPTIONS: readonly { id: string; label: string }[] = [
  { id: "00", label: "00" },
  { id: "15", label: "15" },
  { id: "30", label: "30" },
  { id: "45", label: "45" },
];

const TIME_PERIOD_OPTIONS: readonly { id: TimePeriod; label: string }[] = [
  { id: "AM", label: "AM" },
  { id: "PM", label: "PM" },
];

const DAY_OF_MONTH_OPTIONS = Array.from({ length: 28 }, (_, index) => {
  const day = String(index + 1);
  return { id: day, label: day };
});

const QUERY_LANGUAGE_OPTIONS: readonly { id: QueryLanguage; label: string }[] = [{ id: "FSQL", label: "FSQL" }];

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

const SEVERITY_OPTIONS: readonly { id: DetectionSeverity; label: string }[] = [
  { id: "Critical", label: "Critical" },
  { id: "High", label: "High" },
  { id: "Medium", label: "Medium" },
  { id: "Low", label: "Low" },
];

const OCSF_CATEGORY_OPTIONS: readonly { id: Exclude<OcsfCategory, "">; label: string }[] = [
  { id: "process-activity", label: "Process Activity" },
  { id: "network-activity", label: "Network Activity" },
  { id: "identity-access", label: "Identity & Access Management" },
  { id: "discovery", label: "Discovery" },
];

const DEFAULT_DETECTION_TAGS = ["lateral-movement", "windows"] as const;

const SCHEDULE_MINUTE_PERIOD_OPTIONS = SCHEDULE_MINUTE_OPTIONS.flatMap((minute) =>
  TIME_PERIOD_OPTIONS.map((period) => ({
    id: `${minute.id}-${period.id}`,
    minute: minute.id,
    period: period.id,
    label: `${minute.label} ${period.label}`,
  })),
);

const SCHEDULED_STATE_OPTIONS: readonly { id: ScheduledState; label: string }[] = [
  { id: "active", label: "ACTIVE" },
  { id: "paused", label: "PAUSED" },
  { id: "draft", label: "DRAFT" },
];

const SCHEDULED_STATE_BADGE_CLASS: Record<ScheduledState, string> = {
  active: "bg-feedback-bg-positive",
  paused: "bg-feedback-bg-caution",
  draft: "bg-feedback-bg-neutral",
};

function ScheduledStateBadge({ state }: { state: ScheduledState }) {
  const label = SCHEDULED_STATE_OPTIONS.find((option) => option.id === state)?.label ?? state.toUpperCase();
  return (
    <span
      className={cx(
        "inline-flex shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase leading-4 tracking-[0.4px] text-white",
        "[html[data-theme=light]_&]:text-text-on-primary",
        SCHEDULED_STATE_BADGE_CLASS[state],
      )}
    >
      {label}
    </span>
  );
}

function SettingsSectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-[0.6px] text-text-primary">{children}</h3>
  );
}

function DraftBadge() {
  return <ScheduledStateBadge state="draft" />;
}

function DropdownChevron({ open }: { open: boolean }) {
  return (
    <Icon
      name={open ? "navi-expand-less" : "navi-expand-more"}
      size={16}
      className="shrink-0 text-text-secondary"
      aria-hidden
    />
  );
}

function useDismissibleDropdown() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return { containerRef, open, setOpen };
}

/** Figma Single-line Dropdown-Field on modal (`142:22585` default 40px, `142:22649` hover, `142:22601` focused). */
const OUTLINED_FIELD_VALUE_CLASS = "text-sm font-normal leading-[18px] text-text-primary";

function outlinedFieldShellClass(active: boolean) {
  return cx(
    "group relative flex h-10 w-full min-w-0 items-center gap-2 rounded-[4px] bg-surface-modal px-3 text-left transition-[border-color] focus-visible:outline-none",
    active
      ? "border-2 border-interactive-active hover:border-interactive-active"
      : "border border-border-rule hover:border-text-secondary",
  );
}

function OutlinedFieldLabel({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={cx(
        "pointer-events-none absolute left-3 top-0 z-[1] -translate-y-1/2 bg-surface-modal px-1 text-xs font-semibold leading-4 tracking-[0.4px]",
        active ? "text-interactive-active" : "text-text-tertiary group-focus-within:text-interactive-active",
      )}
    >
      {label}
    </span>
  );
}

function OutlinedFieldShell({
  label,
  active = false,
  children,
}: {
  label: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <OutlinedFieldLabel label={label} active={active} />
      {children}
    </>
  );
}

function OutlinedTextInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label
      className={cx(
        outlinedFieldShellClass(false),
        "focus-within:border-2 focus-within:border-interactive-active focus-within:hover:border-interactive-active",
      )}
    >
      <OutlinedFieldShell label={label}>
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cx(
            "min-w-0 flex-1 truncate bg-transparent px-1 outline-none placeholder:italic placeholder:text-text-tertiary",
            OUTLINED_FIELD_VALUE_CLASS,
          )}
        />
      </OutlinedFieldShell>
    </label>
  );
}

const DROPDOWN_MENU_CLASS =
  "absolute left-0 top-[calc(100%+4px)] z-50 min-w-full overflow-hidden rounded-[4px] border border-border-rule bg-surface-modal py-1 shadow-[0px_5px_5px_-3px_rgba(0,0,0,0.2),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_3px_14px_2px_rgba(0,0,0,0.12)]";

function OutlinedDropdownTrigger({
  label,
  open,
  onClick,
  ariaLabel,
  children,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={open}
      aria-haspopup="listbox"
      onClick={onClick}
      className={outlinedFieldShellClass(open)}
    >
      <OutlinedFieldShell label={label} active={open}>
        {children}
      </OutlinedFieldShell>
    </button>
  );
}

function TextOptionSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  label,
  placeholder,
}: {
  value: T | "";
  onChange: (next: T) => void;
  options: readonly { id: T; label: string }[];
  ariaLabel: string;
  label: string;
  placeholder?: string;
}) {
  const { containerRef, open, setOpen } = useDismissibleDropdown();
  const selectedOption = options.find((option) => option.id === value);
  const displayValue = selectedOption?.label ?? (placeholder && !value ? placeholder : value);

  const selectOption = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <OutlinedDropdownTrigger
        label={label}
        open={open}
        ariaLabel={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={cx(
            "min-w-0 flex-1 truncate px-1",
            OUTLINED_FIELD_VALUE_CLASS,
            !selectedOption && placeholder ? "italic text-text-tertiary" : undefined,
          )}
        >
          {displayValue}
        </span>
        <DropdownChevron open={open} />
      </OutlinedDropdownTrigger>

      {open ? (
        <ul role="listbox" aria-label={ariaLabel} className={DROPDOWN_MENU_CLASS}>
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cx(
                    "flex h-8 w-full min-w-0 items-center gap-2 px-3 text-left text-sm font-normal leading-8 transition-colors focus-visible:bg-interactive-secondary-hover focus-visible:outline-none",
                    isSelected
                      ? "bg-interactive-secondary-hover text-interactive-active"
                      : "text-text-secondary hover:bg-interactive-secondary-hover hover:text-text-primary",
                  )}
                  onClick={() => selectOption(option.id)}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function OcsfCategorySelect({
  value,
  onChange,
}: {
  value: OcsfCategory;
  onChange: (next: OcsfCategory) => void;
}) {
  return (
    <TextOptionSelect
      label="OCSF Category"
      value={value}
      onChange={onChange}
      options={OCSF_CATEGORY_OPTIONS}
      ariaLabel="OCSF category"
      placeholder="Select category"
    />
  );
}

function MinutePeriodSelect({
  minute,
  period,
  onChange,
}: {
  minute: string;
  period: TimePeriod;
  onChange: (minute: string, period: TimePeriod) => void;
}) {
  const compositeValue = `${minute}-${period}`;
  const options = SCHEDULE_MINUTE_PERIOD_OPTIONS.map((option) => ({
    id: option.id,
    label: option.label,
  }));

  return (
    <TextOptionSelect
      label="Minute"
      value={compositeValue}
      onChange={(next) => {
        const match = SCHEDULE_MINUTE_PERIOD_OPTIONS.find((option) => option.id === next);
        if (match) onChange(match.minute, match.period);
      }}
      options={options}
      ariaLabel="Schedule minute and period"
    />
  );
}

function EnableOnSaveField({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className={outlinedFieldShellClass(false)}>
      <OutlinedFieldShell label="Enable on Save">
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
        <span className="text-sm text-text-secondary">
          {checked ? "On — enable when saved" : "Off — save as draft"}
        </span>
      </OutlinedFieldShell>
    </div>
  );
}

function TagsField({ tags, onTagsChange }: { tags: string[]; onTagsChange: (tags: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");

  const handleRemove = (tag: string) => {
    onTagsChange(tags.filter((current) => current !== tag));
  };

  const addTag = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onTagsChange([...tags, trimmed]);
    setInputValue("");
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addTag(inputValue);
  };

  return (
    <label
      className={cx(
        outlinedFieldShellClass(false),
        "h-auto min-h-10 cursor-text flex-wrap items-center gap-2 py-2",
        "focus-within:border-2 focus-within:border-interactive-active focus-within:hover:border-interactive-active",
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <OutlinedFieldLabel label="Tags" />
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex h-6 max-w-full items-center gap-1 rounded-full bg-surface-container px-2.5 text-xs font-semibold text-text-primary ring-1 ring-border-container"
        >
          <span className="truncate">{tag}</span>
          <button
            type="button"
            className="-mr-0.5 flex shrink-0 items-center justify-center rounded-full p-0.5 text-text-secondary transition-colors hover:bg-overlay-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-interactive-active"
            aria-label={`Remove ${tag}`}
            onClick={(event) => {
              event.stopPropagation();
              handleRemove(tag);
            }}
          >
            <Icon name="close" size={14} aria-hidden />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder={tags.length === 0 ? "Type tag and press Enter" : "+ Add tag"}
        aria-label="Add tag"
        className={cx(
          "min-w-[8ch] flex-1 bg-transparent px-1 outline-none placeholder:italic placeholder:text-text-tertiary",
          OUTLINED_FIELD_VALUE_CLASS,
        )}
      />
    </label>
  );
}

function formatScheduleRecurrencePreview({
  frequency,
  dayOfWeek,
  dayOfMonth,
  hour,
  minute,
  period,
}: {
  frequency: ScheduleFrequency;
  dayOfWeek: DayOfWeek;
  dayOfMonth: string;
  hour: string;
  minute: string;
  period: TimePeriod;
}): string {
  const time = `${hour}:${minute} ${period}`;
  const dayLabel = DAY_OF_WEEK_OPTIONS.find((option) => option.id === dayOfWeek)?.label ?? dayOfWeek;

  switch (frequency) {
    case "Daily":
      return `Every day at ${time}`;
    case "Weekly":
      return `Every ${dayLabel} at ${time}`;
    case "Monthly":
      return `Every month on day ${dayOfMonth} at ${time}`;
  }
}

function RecurrencePreviewBanner({ preview }: { preview: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[4px] bg-interactive-selected px-3 py-2.5">
      <Icon name="action-date-range" size={16} className="shrink-0 text-interactive-active" aria-hidden />
      <p className="text-sm">
        <span className="font-semibold text-interactive-active">Recurrence preview: </span>
        <span className="text-text-primary">{preview}</span>
      </p>
    </div>
  );
}

function QueryLanguageSelect({
  value,
  onChange,
}: {
  value: QueryLanguage;
  onChange: (next: QueryLanguage) => void;
}) {
  const { containerRef, open, setOpen } = useDismissibleDropdown();

  const selectOption = (next: QueryLanguage) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <OutlinedDropdownTrigger
        label="Query Language"
        open={open}
        ariaLabel="Query language"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cx("min-w-0 flex-1 truncate px-1", OUTLINED_FIELD_VALUE_CLASS)}>{value}</span>
        <DropdownChevron open={open} />
      </OutlinedDropdownTrigger>

      {open ? (
        <ul role="listbox" aria-label="Query language" className={DROPDOWN_MENU_CLASS}>
          {QUERY_LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.id === value;
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cx(
                    "flex h-8 w-full min-w-0 items-center gap-2 px-3 text-left text-sm font-normal leading-8 transition-colors focus-visible:bg-interactive-secondary-hover focus-visible:outline-none",
                    isSelected
                      ? "bg-interactive-secondary-hover text-interactive-active"
                      : "text-text-secondary hover:bg-interactive-secondary-hover hover:text-text-primary",
                  )}
                  onClick={() => selectOption(option.id)}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function SeveritySelect({
  value,
  onChange,
}: {
  value: DetectionSeverity;
  onChange: (next: DetectionSeverity) => void;
}) {
  const { containerRef, open, setOpen } = useDismissibleDropdown();

  const selectOption = (next: DetectionSeverity) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <OutlinedDropdownTrigger
        label="Severity"
        open={open}
        ariaLabel="Severity"
        onClick={() => setOpen((current) => !current)}
      >
        <SeverityTableIcon name={SEV_ICONS[value]} color={SEV_COLORS[value]} />
        <span className={cx("min-w-0 flex-1 truncate px-1", OUTLINED_FIELD_VALUE_CLASS)}>{value}</span>
        <DropdownChevron open={open} />
      </OutlinedDropdownTrigger>

      {open ? (
        <ul role="listbox" aria-label="Severity" className={DROPDOWN_MENU_CLASS}>
          {SEVERITY_OPTIONS.map((option) => {
            const isSelected = option.id === value;
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cx(
                    "flex h-8 w-full min-w-0 items-center gap-2 px-3 text-left text-sm font-normal leading-8 transition-colors focus-visible:bg-interactive-secondary-hover focus-visible:outline-none",
                    isSelected
                      ? "bg-interactive-secondary-hover text-interactive-active"
                      : "text-text-secondary hover:bg-interactive-secondary-hover hover:text-text-primary",
                  )}
                  onClick={() => selectOption(option.id)}
                >
                  <SeverityTableIcon name={SEV_ICONS[option.id]} color={SEV_COLORS[option.id]} />
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function CreateDetectionTabs({
  active,
  onChange,
}: {
  active: CreateDetectionTab;
  onChange: (tab: CreateDetectionTab) => void;
}) {
  return (
    <nav className="flex shrink-0 gap-6 border-b border-border-rule px-5 pt-5" aria-label="Create detection sections">
      {CREATE_DETECTION_TABS.map((tab) => {
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

function BasicDetectionInformationSection({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  severity,
  onSeverityChange,
  enableOnSave,
  onEnableOnSaveChange,
  ocsfCategory,
  onOcsfCategoryChange,
  mitreTechnique,
  onMitreTechniqueChange,
  tags,
  onTagsChange,
}: {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  severity: DetectionSeverity;
  onSeverityChange: (value: DetectionSeverity) => void;
  enableOnSave: boolean;
  onEnableOnSaveChange: (value: boolean) => void;
  ocsfCategory: OcsfCategory;
  onOcsfCategoryChange: (value: OcsfCategory) => void;
  mitreTechnique: string;
  onMitreTechniqueChange: (value: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}) {
  return (
    <section className="space-y-5">
      <SettingsSectionHeading>Basic Detection Information</SettingsSectionHeading>

      <OutlinedTextInput
        label="Name of Detection"
        value={name}
        onChange={onNameChange}
        placeholder="Enter detection name"
      />

      <OutlinedTextInput
        label="Description"
        value={description}
        onChange={onDescriptionChange}
        placeholder="Describe what this detection identifies and why it matters"
      />

      <div className="grid grid-cols-2 gap-4">
        <SeveritySelect value={severity} onChange={onSeverityChange} />
        <EnableOnSaveField checked={enableOnSave} onCheckedChange={onEnableOnSaveChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <OcsfCategorySelect value={ocsfCategory} onChange={onOcsfCategoryChange} />
        <OutlinedTextInput
          label="MITRE ATT&CK Technique"
          value={mitreTechnique}
          onChange={onMitreTechniqueChange}
          placeholder="e.g. T1078, T1059"
        />
      </div>

      <TagsField tags={tags} onTagsChange={onTagsChange} />
    </section>
  );
}

function DetectionLogicTabContent({
  queryLanguage,
  onQueryLanguageChange,
  detectionQuery,
  onDetectionQueryChange,
  onTestQuery,
}: {
  queryLanguage: QueryLanguage;
  onQueryLanguageChange: (value: QueryLanguage) => void;
  detectionQuery: string;
  onDetectionQueryChange: (value: string) => void;
  onTestQuery: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 py-6 pb-24">
      <h2 className="text-base font-semibold text-text-primary">Detection Logic</h2>

      <QueryLanguageSelect value={queryLanguage} onChange={onQueryLanguageChange} />

      <OutlinedTextInput
        label="Enter your detection query"
        value={detectionQuery}
        onChange={onDetectionQueryChange}
      />

      <div>
        <Button type="button" variant="secondary" onClick={onTestQuery}>
          Test Query
        </Button>
      </div>
    </div>
  );
}

function DetectionScheduleSection({
  frequency,
  onFrequencyChange,
  dayOfWeek,
  onDayOfWeekChange,
  dayOfMonth,
  onDayOfMonthChange,
  hour,
  onHourChange,
  minute,
  onMinuteChange,
  period,
  onPeriodChange,
}: {
  frequency: ScheduleFrequency;
  onFrequencyChange: (value: ScheduleFrequency) => void;
  dayOfWeek: DayOfWeek;
  onDayOfWeekChange: (value: DayOfWeek) => void;
  dayOfMonth: string;
  onDayOfMonthChange: (value: string) => void;
  hour: string;
  onHourChange: (value: string) => void;
  minute: string;
  onMinuteChange: (value: string) => void;
  period: TimePeriod;
  onPeriodChange: (value: TimePeriod) => void;
}) {
  const recurrencePreview = formatScheduleRecurrencePreview({
    frequency,
    dayOfWeek,
    dayOfMonth,
    hour,
    minute,
    period,
  });

  return (
    <section className="space-y-5">
      <SettingsSectionHeading>Detection Schedule</SettingsSectionHeading>

      <TextOptionSelect
        label="Frequency"
        value={frequency}
        onChange={onFrequencyChange}
        options={SCHEDULE_FREQUENCY_OPTIONS}
        ariaLabel="Schedule frequency"
      />

      {frequency === "Monthly" ? (
        <TextOptionSelect
          label="Day of Month"
          value={dayOfMonth}
          onChange={onDayOfMonthChange}
          options={DAY_OF_MONTH_OPTIONS}
          ariaLabel="Day of month"
        />
      ) : null}

      <div
        className={cx(
          "grid gap-4",
          frequency === "Weekly" ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {frequency === "Weekly" ? (
          <TextOptionSelect
            label="Day of Week"
            value={dayOfWeek}
            onChange={onDayOfWeekChange}
            options={DAY_OF_WEEK_OPTIONS}
            ariaLabel="Day of week"
          />
        ) : null}

        <TextOptionSelect
          label="Hour"
          value={hour}
          onChange={onHourChange}
          options={SCHEDULE_HOUR_OPTIONS}
          ariaLabel="Schedule hour"
        />

        <MinutePeriodSelect
          minute={minute}
          period={period}
          onChange={(nextMinute, nextPeriod) => {
            onMinuteChange(nextMinute);
            onPeriodChange(nextPeriod);
          }}
        />
      </div>

      <RecurrencePreviewBanner preview={recurrencePreview} />
    </section>
  );
}

function AlertConfigurationBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[4px] border border-border-rule bg-surface-modal p-4">{children}</div>
  );
}

function AlertThresholdField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const handleChange = (raw: string) => {
    if (raw === "") {
      onChange("");
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) onChange(String(Math.max(1, parsed)));
  };

  return (
    <AlertConfigurationBox>
      <div className="space-y-3">
        <p className="text-xs font-semibold leading-4 tracking-[0.4px] text-text-tertiary">
          Alert when findings exceed
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={cx(
              outlinedFieldShellClass(false),
              "w-[72px] shrink-0 focus-within:border-2 focus-within:border-interactive-active focus-within:hover:border-interactive-active",
            )}
          >
            <input
              type="number"
              min={1}
              step={1}
              value={value}
              onChange={(event) => handleChange(event.target.value)}
              className={cx(
                "min-w-0 flex-1 bg-transparent px-1 text-center outline-none",
                OUTLINED_FIELD_VALUE_CLASS,
              )}
              aria-label="Alert threshold"
            />
          </label>
          <span className="text-sm leading-[18px] text-text-secondary">finding(s) per run</span>
        </div>
      </div>
    </AlertConfigurationBox>
  );
}

function ChannelExpandLink({
  expanded,
  onToggle,
  channelLabel,
}: {
  expanded: boolean;
  onToggle: () => void;
  channelLabel: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-interactive-active transition-colors hover:text-interactive-active/80"
      aria-expanded={expanded}
      aria-label={expanded ? `Collapse ${channelLabel} configuration` : `Expand ${channelLabel} configuration`}
      onClick={onToggle}
    >
      {expanded ? "collapse" : "expand to configure"}
      <Icon
        name={expanded ? "navi-expand-less" : "navi-chevron-right"}
        size={16}
        className="text-interactive-active"
        aria-hidden
      />
    </button>
  );
}

function NotificationChannelsSection({
  channels,
  onChannelsChange,
  emailRecipients,
  onEmailRecipientsChange,
  expandedChannels,
  onExpandedChannelsChange,
}: {
  channels: NotificationChannels;
  onChannelsChange: (channels: NotificationChannels) => void;
  emailRecipients: string;
  onEmailRecipientsChange: (value: string) => void;
  expandedChannels: ExpandedChannels;
  onExpandedChannelsChange: (channels: ExpandedChannels) => void;
}) {
  const toggleChannel = (channel: NotificationChannel, checked: boolean) => {
    onChannelsChange({ ...channels, [channel]: checked });
  };

  const toggleExpanded = (channel: NotificationChannel) => {
    onExpandedChannelsChange({ ...expandedChannels, [channel]: !expandedChannels[channel] });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold leading-[18px] text-text-primary">Notification Channels</h4>
      <div className="space-y-4">
        {NOTIFICATION_CHANNEL_OPTIONS.map((option) => {
          const expanded = expandedChannels[option.id];
          const stub =
            option.id !== "email" ? CHANNEL_CONFIG_STUBS[option.id] : null;

          return (
            <div key={option.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Checkbox
                  checked={channels[option.id]}
                  onCheckedChange={(checked) => toggleChannel(option.id, checked)}
                  label={option.label}
                  labelClassName="text-sm font-semibold leading-[18px] text-text-primary"
                />
                <ChannelExpandLink
                  expanded={expanded}
                  onToggle={() => toggleExpanded(option.id)}
                  channelLabel={option.label}
                />
              </div>

              {expanded ? (
                <div className="pl-6">
                  {option.id === "email" ? (
                    <OutlinedTextInput
                      label="Recipients"
                      value={emailRecipients}
                      onChange={onEmailRecipientsChange}
                      placeholder="soc-team@company.com"
                    />
                  ) : stub ? (
                    <OutlinedTextInput
                      label={stub.label}
                      value=""
                      onChange={() => undefined}
                      placeholder={stub.placeholder}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MessageTemplateVariablePill({
  variable,
  onInsert,
}: {
  variable: string;
  onInsert: (variable: string) => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex rounded bg-interactive-selected px-1.5 py-0.5 text-xs font-semibold leading-4 text-interactive-active transition-colors hover:bg-interactive-secondary-hover"
      onClick={() => onInsert(variable)}
    >
      {variable}
    </button>
  );
}

function CustomMessageTemplateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const insertVariable = (variable: string) => {
    onChange(`${value}${variable}`);
  };

  return (
    <AlertConfigurationBox>
      <div className="space-y-3">
        <OutlinedTextInput
          label="Custom Message Template"
          value={value}
          onChange={onChange}
          placeholder={DEFAULT_ALERT_MESSAGE_TEMPLATE}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold leading-4 text-text-tertiary">Available variables:</span>
          {ALERT_MESSAGE_VARIABLES.map((variable) => (
            <MessageTemplateVariablePill key={variable} variable={variable} onInsert={insertVariable} />
          ))}
        </div>
      </div>
    </AlertConfigurationBox>
  );
}

function AlertConfigurationSection({
  alertThreshold,
  onAlertThresholdChange,
  notificationChannels,
  onNotificationChannelsChange,
  emailRecipients,
  onEmailRecipientsChange,
  expandedChannels,
  onExpandedChannelsChange,
  alertMessageTemplate,
  onAlertMessageTemplateChange,
}: {
  alertThreshold: string;
  onAlertThresholdChange: (value: string) => void;
  notificationChannels: NotificationChannels;
  onNotificationChannelsChange: (channels: NotificationChannels) => void;
  emailRecipients: string;
  onEmailRecipientsChange: (value: string) => void;
  expandedChannels: ExpandedChannels;
  onExpandedChannelsChange: (channels: ExpandedChannels) => void;
  alertMessageTemplate: string;
  onAlertMessageTemplateChange: (value: string) => void;
}) {
  return (
    <section className="space-y-5">
      <SettingsSectionHeading>Alert Configuration</SettingsSectionHeading>

      <AlertThresholdField value={alertThreshold} onChange={onAlertThresholdChange} />

      <NotificationChannelsSection
        channels={notificationChannels}
        onChannelsChange={onNotificationChannelsChange}
        emailRecipients={emailRecipients}
        onEmailRecipientsChange={onEmailRecipientsChange}
        expandedChannels={expandedChannels}
        onExpandedChannelsChange={onExpandedChannelsChange}
      />

      <CustomMessageTemplateField value={alertMessageTemplate} onChange={onAlertMessageTemplateChange} />
    </section>
  );
}

function DetectionSettingsTabContent({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  severity,
  onSeverityChange,
  enableOnSave,
  onEnableOnSaveChange,
  ocsfCategory,
  onOcsfCategoryChange,
  mitreTechnique,
  onMitreTechniqueChange,
  tags,
  onTagsChange,
  frequency,
  onFrequencyChange,
  dayOfWeek,
  onDayOfWeekChange,
  dayOfMonth,
  onDayOfMonthChange,
  hour,
  onHourChange,
  minute,
  onMinuteChange,
  period,
  onPeriodChange,
  alertThreshold,
  onAlertThresholdChange,
  notificationChannels,
  onNotificationChannelsChange,
  emailRecipients,
  onEmailRecipientsChange,
  expandedChannels,
  onExpandedChannelsChange,
  alertMessageTemplate,
  onAlertMessageTemplateChange,
}: {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  severity: DetectionSeverity;
  onSeverityChange: (value: DetectionSeverity) => void;
  enableOnSave: boolean;
  onEnableOnSaveChange: (value: boolean) => void;
  ocsfCategory: OcsfCategory;
  onOcsfCategoryChange: (value: OcsfCategory) => void;
  mitreTechnique: string;
  onMitreTechniqueChange: (value: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  frequency: ScheduleFrequency;
  onFrequencyChange: (value: ScheduleFrequency) => void;
  dayOfWeek: DayOfWeek;
  onDayOfWeekChange: (value: DayOfWeek) => void;
  dayOfMonth: string;
  onDayOfMonthChange: (value: string) => void;
  hour: string;
  onHourChange: (value: string) => void;
  minute: string;
  onMinuteChange: (value: string) => void;
  period: TimePeriod;
  onPeriodChange: (value: TimePeriod) => void;
  alertThreshold: string;
  onAlertThresholdChange: (value: string) => void;
  notificationChannels: NotificationChannels;
  onNotificationChannelsChange: (channels: NotificationChannels) => void;
  emailRecipients: string;
  onEmailRecipientsChange: (value: string) => void;
  expandedChannels: ExpandedChannels;
  onExpandedChannelsChange: (channels: ExpandedChannels) => void;
  alertMessageTemplate: string;
  onAlertMessageTemplateChange: (value: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-6 pb-24">
      <BasicDetectionInformationSection
        name={name}
        onNameChange={onNameChange}
        description={description}
        onDescriptionChange={onDescriptionChange}
        severity={severity}
        onSeverityChange={onSeverityChange}
        enableOnSave={enableOnSave}
        onEnableOnSaveChange={onEnableOnSaveChange}
        ocsfCategory={ocsfCategory}
        onOcsfCategoryChange={onOcsfCategoryChange}
        mitreTechnique={mitreTechnique}
        onMitreTechniqueChange={onMitreTechniqueChange}
        tags={tags}
        onTagsChange={onTagsChange}
      />
      <DetectionScheduleSection
        frequency={frequency}
        onFrequencyChange={onFrequencyChange}
        dayOfWeek={dayOfWeek}
        onDayOfWeekChange={onDayOfWeekChange}
        dayOfMonth={dayOfMonth}
        onDayOfMonthChange={onDayOfMonthChange}
        hour={hour}
        onHourChange={onHourChange}
        minute={minute}
        onMinuteChange={onMinuteChange}
        period={period}
        onPeriodChange={onPeriodChange}
      />
      <AlertConfigurationSection
        alertThreshold={alertThreshold}
        onAlertThresholdChange={onAlertThresholdChange}
        notificationChannels={notificationChannels}
        onNotificationChannelsChange={onNotificationChannelsChange}
        emailRecipients={emailRecipients}
        onEmailRecipientsChange={onEmailRecipientsChange}
        expandedChannels={expandedChannels}
        onExpandedChannelsChange={onExpandedChannelsChange}
        alertMessageTemplate={alertMessageTemplate}
        onAlertMessageTemplateChange={onAlertMessageTemplateChange}
      />
    </div>
  );
}

type SavedSnapshot = {
  name: string;
  description: string;
  severity: DetectionSeverity;
  enableOnSave: boolean;
  ocsfCategory: OcsfCategory;
  mitreTechnique: string;
  tags: string[];
  queryLanguage: QueryLanguage;
  detectionQuery: string;
  scheduleFrequency: ScheduleFrequency;
  scheduleDayOfWeek: DayOfWeek;
  scheduleDayOfMonth: string;
  scheduleHour: string;
  scheduleMinute: string;
  schedulePeriod: TimePeriod;
  alertThreshold: string;
  notificationChannels: NotificationChannels;
  emailRecipients: string;
  expandedChannels: ExpandedChannels;
  alertMessageTemplate: string;
};

export function CreateDetectionSlideOver({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<CreateDetectionTab>("Detection Settings");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<DetectionSeverity>("Critical");
  const [enableOnSave, setEnableOnSave] = useState(false);
  const [ocsfCategory, setOcsfCategory] = useState<OcsfCategory>("");
  const [mitreTechnique, setMitreTechnique] = useState("");
  const [tags, setTags] = useState<string[]>([...DEFAULT_DETECTION_TAGS]);
  const [queryLanguage, setQueryLanguage] = useState<QueryLanguage>("FSQL");
  const [detectionQuery, setDetectionQuery] = useState(DEFAULT_DETECTION_QUERY);
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>("Weekly");
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<DayOfWeek>("Tue");
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState("1");
  const [scheduleHour, setScheduleHour] = useState("12");
  const [scheduleMinute, setScheduleMinute] = useState("00");
  const [schedulePeriod, setSchedulePeriod] = useState<TimePeriod>("AM");
  const [alertThreshold, setAlertThreshold] = useState("1");
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannels>(
    DEFAULT_NOTIFICATION_CHANNELS,
  );
  const [emailRecipients, setEmailRecipients] = useState(DEFAULT_EMAIL_RECIPIENTS);
  const [expandedChannels, setExpandedChannels] = useState<ExpandedChannels>(DEFAULT_EXPANDED_CHANNELS);
  const [alertMessageTemplate, setAlertMessageTemplate] = useState(DEFAULT_ALERT_MESSAGE_TEMPLATE);
  const [hasSaved, setHasSaved] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const tagsMatchSnapshot = (current: string[], saved: string[]) =>
    current.length === saved.length && current.every((tag, index) => tag === saved[index]);

  const canSaveSettingsTab =
    (name.trim().length > 0 || description.trim().length > 0) &&
    scheduleHour.trim().length > 0 &&
    scheduleMinute.trim().length > 0 &&
    alertThreshold.trim().length > 0 &&
    alertMessageTemplate.trim().length > 0 &&
    (!notificationChannels.email || emailRecipients.trim().length > 0);

  const canSave =
    activeTab === "Detection Logic" ? detectionQuery.trim().length > 0 : canSaveSettingsTab;
  const isDirtyAfterSave =
    hasSaved &&
    savedSnapshot !== null &&
    (name !== savedSnapshot.name ||
      description !== savedSnapshot.description ||
      severity !== savedSnapshot.severity ||
      enableOnSave !== savedSnapshot.enableOnSave ||
      ocsfCategory !== savedSnapshot.ocsfCategory ||
      mitreTechnique !== savedSnapshot.mitreTechnique ||
      !tagsMatchSnapshot(tags, savedSnapshot.tags) ||
      queryLanguage !== savedSnapshot.queryLanguage ||
      detectionQuery !== savedSnapshot.detectionQuery ||
      scheduleFrequency !== savedSnapshot.scheduleFrequency ||
      scheduleDayOfWeek !== savedSnapshot.scheduleDayOfWeek ||
      scheduleDayOfMonth !== savedSnapshot.scheduleDayOfMonth ||
      scheduleHour !== savedSnapshot.scheduleHour ||
      scheduleMinute !== savedSnapshot.scheduleMinute ||
      schedulePeriod !== savedSnapshot.schedulePeriod ||
      alertThreshold !== savedSnapshot.alertThreshold ||
      emailRecipients !== savedSnapshot.emailRecipients ||
      alertMessageTemplate !== savedSnapshot.alertMessageTemplate ||
      NOTIFICATION_CHANNEL_OPTIONS.some(
        (option) => notificationChannels[option.id] !== savedSnapshot.notificationChannels[option.id],
      ) ||
      NOTIFICATION_CHANNEL_OPTIONS.some(
        (option) => expandedChannels[option.id] !== savedSnapshot.expandedChannels[option.id],
      ));
  const saveDisabled = !canSave || (hasSaved && !isDirtyAfterSave);
  const activeTabIndex = CREATE_DETECTION_TABS.indexOf(activeTab);
  const canGoNext = activeTabIndex < CREATE_DETECTION_TABS.length - 1;

  const handleSave = () => {
    if (saveDisabled) return;
    setHasSaved(true);
    setSavedSnapshot({
      name,
      description,
      severity,
      enableOnSave,
      ocsfCategory,
      mitreTechnique,
      tags,
      queryLanguage,
      detectionQuery,
      scheduleFrequency,
      scheduleDayOfWeek,
      scheduleDayOfMonth,
      scheduleHour,
      scheduleMinute,
      schedulePeriod,
      alertThreshold,
      notificationChannels,
      emailRecipients,
      expandedChannels,
      alertMessageTemplate,
    });
    setSnackbarOpen(true);
  };

  const handleTestQuery = () => {
    if (!detectionQuery.trim()) return;
  };

  const handleNext = () => {
    if (!canGoNext || !hasSaved) return;
    setActiveTab(CREATE_DETECTION_TABS[activeTabIndex + 1]);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-surface-modal text-text-primary">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-rule px-5 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <SlideOverHeaderBackButton onClose={onClose} className="ring-offset-surface-modal" />
          <h2 className="text-page-title text-text-primary">Create New Detection</h2>
          <DraftBadge />
        </div>
        <Button
          type="button"
          variant="ghost"
          className="shrink-0 p-1 text-text-tertiary hover:text-text-primary"
          aria-label="Close create detection panel"
          onClick={onClose}
        >
          <Icon name="close" size={20} />
        </Button>
      </header>

      <CreateDetectionTabs active={activeTab} onChange={setActiveTab} />

      <div className="min-h-0 flex-1 overflow-y-auto px-6">
        {activeTab === "Detection Settings" ? (
          <DetectionSettingsTabContent
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
            severity={severity}
            onSeverityChange={setSeverity}
            enableOnSave={enableOnSave}
            onEnableOnSaveChange={setEnableOnSave}
            ocsfCategory={ocsfCategory}
            onOcsfCategoryChange={setOcsfCategory}
            mitreTechnique={mitreTechnique}
            onMitreTechniqueChange={setMitreTechnique}
            tags={tags}
            onTagsChange={setTags}
            frequency={scheduleFrequency}
            onFrequencyChange={setScheduleFrequency}
            dayOfWeek={scheduleDayOfWeek}
            onDayOfWeekChange={setScheduleDayOfWeek}
            dayOfMonth={scheduleDayOfMonth}
            onDayOfMonthChange={setScheduleDayOfMonth}
            hour={scheduleHour}
            onHourChange={setScheduleHour}
            minute={scheduleMinute}
            onMinuteChange={setScheduleMinute}
            period={schedulePeriod}
            onPeriodChange={setSchedulePeriod}
            alertThreshold={alertThreshold}
            onAlertThresholdChange={setAlertThreshold}
            notificationChannels={notificationChannels}
            onNotificationChannelsChange={setNotificationChannels}
            emailRecipients={emailRecipients}
            onEmailRecipientsChange={setEmailRecipients}
            expandedChannels={expandedChannels}
            onExpandedChannelsChange={setExpandedChannels}
            alertMessageTemplate={alertMessageTemplate}
            onAlertMessageTemplateChange={setAlertMessageTemplate}
          />
        ) : (
          <DetectionLogicTabContent
            queryLanguage={queryLanguage}
            onQueryLanguageChange={setQueryLanguage}
            detectionQuery={detectionQuery}
            onDetectionQueryChange={setDetectionQuery}
            onTestQuery={handleTestQuery}
          />
        )}
      </div>

      <div className="pointer-events-none absolute bottom-0 right-0 z-20 flex justify-end p-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-tl-lg rounded-bl-lg bg-surface-container/80 px-3 py-2.5 shadow-lg ring-1 ring-border-container backdrop-blur-sm">
          <Button
            type="button"
            variant="tertiary"
            className="text-text-secondary hover:text-text-primary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="button" variant="secondary" disabled={!canGoNext || !hasSaved} onClick={handleNext}>
            {activeTab === "Detection Settings" ? "Next: Detection Logic" : "Next"}
          </Button>
          <Button type="button" variant="primary" disabled={saveDisabled} onClick={handleSave}>
            Save as Draft
          </Button>
        </div>
      </div>

      <Snackbar open={snackbarOpen} message="Draft saved" onClose={() => setSnackbarOpen(false)} />
    </div>
  );
}
