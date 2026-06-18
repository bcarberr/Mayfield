import { useState, useCallback, useMemo, useId } from "react";
import { Icon, Switch } from "../../design-system";
import { SlideOverHeaderBackButton, SLIDE_OVER_FLOATING_FOOTER_PANEL_CLASS, SLIDE_OVER_FLOATING_FOOTER_WRAPPER_CLASS, SLIDE_OVER_FOOTER_BUTTON_CLASS, SLIDE_OVER_FOOTER_GHOST_BUTTON_CLASS } from "../ui/SlideOver";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible";
import { Field, FieldLabel } from "@/components/shadcn/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  AlertThresholdField,
  CustomMessageTemplateField,
  EnableOnSaveField,
  FormInputField,
  FormSelectField,
  FormTextareaField,
  CollapsibleSettingsSection,
  RecurrencePreviewBanner,
  SeveritySelectField,
  TagsField,
} from "./createDetectionFormFields";
import {
  DetectionConnectorsRunPanel,
  getLastRunConnectorsForDetection,
  pickRandomConnectors,
  type DetectionConnector,
} from "./detectionRunConnectors";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const CREATE_DETECTION_TABS = ["Detection Settings", "Detection Logic"] as const;

const DETECTION_FORM_SECTION_IDS = {
  basicInformation: "basic-information",
  detectionSchedule: "detection-schedule",
  alertConfiguration: "alert-configuration",
  detectionLogic: "detection-logic",
} as const;

const ALL_DETECTION_FORM_SECTION_IDS = Object.values(DETECTION_FORM_SECTION_IDS);

function createExpandedSectionsState(expanded: boolean) {
  return Object.fromEntries(ALL_DETECTION_FORM_SECTION_IDS.map((id) => [id, expanded]));
}

type CreateDetectionTab = (typeof CREATE_DETECTION_TABS)[number];

type DetectionSeverity = "Critical" | "High" | "Medium" | "Low";

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
  readOnly = false,
  sectionOpen,
  onSectionOpenChange,
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
  readOnly?: boolean;
  sectionOpen: boolean;
  onSectionOpenChange: (open: boolean) => void;
}) {
  return (
    <CollapsibleSettingsSection
      title="Basic Detection Information"
      open={sectionOpen}
      onOpenChange={onSectionOpenChange}
    >
      <FormInputField
        label="Name of Detection"
        value={name}
        onChange={onNameChange}
        placeholder="Enter detection name"
        readOnly={readOnly}
      />

      <FormTextareaField
        label="Description"
        value={description}
        onChange={onDescriptionChange}
        placeholder="Describe what this detection identifies and why it matters"
        rows={3}
        readOnly={readOnly}
      />

      <SeveritySelectField
        label="Severity"
        value={severity}
        onChange={onSeverityChange}
        options={SEVERITY_OPTIONS}
        readOnly={readOnly}
      />

      <EnableOnSaveField checked={enableOnSave} onCheckedChange={onEnableOnSaveChange} readOnly={readOnly} />

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          label="OCSF Category"
          value={ocsfCategory}
          onChange={onOcsfCategoryChange}
          options={OCSF_CATEGORY_OPTIONS}
          placeholder="Select category"
          readOnly={readOnly}
        />
        <FormInputField
          label="MITRE ATT&CK Technique"
          value={mitreTechnique}
          onChange={onMitreTechniqueChange}
          placeholder="e.g. T1078, T1059"
          readOnly={readOnly}
        />
      </div>

      <TagsField tags={tags} onTagsChange={onTagsChange} readOnly={readOnly} />
    </CollapsibleSettingsSection>
  );
}

type TestState = "idle" | "running" | "success";

function DetectionLogicTabContent({
  queryLanguage,
  onQueryLanguageChange,
  detectionQuery,
  onDetectionQueryChange,
  readOnly = false,
  detectionId,
  lastRun,
  connectorsActive,
  connectorsTotal,
  sectionOpen,
  onSectionOpenChange,
}: {
  queryLanguage: QueryLanguage;
  onQueryLanguageChange: (value: QueryLanguage) => void;
  detectionQuery: string;
  onDetectionQueryChange: (value: string) => void;
  readOnly?: boolean;
  detectionId?: string;
  lastRun?: string;
  connectorsActive?: number;
  connectorsTotal?: number;
  sectionOpen: boolean;
  onSectionOpenChange: (open: boolean) => void;
}) {
  const [testState, setTestState] = useState<TestState>("idle");
  const [testedConnectors, setTestedConnectors] = useState<DetectionConnector[]>([]);

  const handleQueryChange = (value: string) => {
    onDetectionQueryChange(value);
    if (testState !== "idle") setTestState("idle");
  };

  const handleTestQuery = () => {
    if (!detectionQuery.trim() || testState === "running") return;
    setTestState("running");
    const picked = pickRandomConnectors();
    setTimeout(() => {
      setTestedConnectors(picked);
      setTestState("success");
    }, 2000);
  };

  const lastRunConnectorOptions =
    readOnly && connectorsActive != null && connectorsTotal != null
      ? { connectorsActive, connectorsTotal }
      : undefined;

  const lastRunConnectors =
    readOnly && detectionId
      ? getLastRunConnectorsForDetection(detectionId, lastRun, lastRunConnectorOptions)
      : [];

  return (
    <div className="mx-auto w-full max-w-2xl pt-4 pb-24">
      <CollapsibleSettingsSection
        title="Detection Logic"
        open={sectionOpen}
        onOpenChange={onSectionOpenChange}
      >
      <FormSelectField
        label="Query Language"
        value={queryLanguage}
        onChange={onQueryLanguageChange}
        options={QUERY_LANGUAGE_OPTIONS}
        readOnly={readOnly}
      />

      <FormTextareaField
        label="Enter your detection query"
        value={detectionQuery}
        onChange={handleQueryChange}
        rows={4}
        readOnly={readOnly}
      />

      {readOnly ? (
        lastRunConnectors.length > 0 ? (
          <DetectionConnectorsRunPanel
            connectors={lastRunConnectors}
            variant="last-run"
            connectorsActive={connectorsActive}
            connectorsTotal={connectorsTotal}
          />
        ) : null
      ) : (
        <div className="space-y-4">
          <div>
            <Button
              type="button"
              variant="secondary-outline"
              disabled={!detectionQuery.trim() || testState === "running"}
              onClick={handleTestQuery}
            >
              {testState === "running" && <Spinner />}
              Test Query
            </Button>
          </div>

          {testState !== "idle" && (
            <div className="rounded border border-border bg-muted/20 p-4">
              {testState === "running" ? (
                <p className="text-sm text-text-tertiary">Running query across connectors…</p>
              ) : (
                <DetectionConnectorsRunPanel connectors={testedConnectors} variant="test-success" />
              )}
            </div>
          )}
        </div>
      )}
      </CollapsibleSettingsSection>
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
  readOnly = false,
  recurrenceOverride,
  sectionOpen,
  onSectionOpenChange,
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
  readOnly?: boolean;
  recurrenceOverride?: string;
  sectionOpen: boolean;
  onSectionOpenChange: (open: boolean) => void;
}) {
  const recurrencePreview = formatScheduleRecurrencePreview({
    frequency,
    dayOfWeek,
    dayOfMonth,
    hour,
    minute,
    period,
  });

  if (readOnly && recurrenceOverride) {
    return (
      <CollapsibleSettingsSection
        title="Detection Schedule"
        open={sectionOpen}
        onOpenChange={onSectionOpenChange}
      >
        <RecurrencePreviewBanner preview={recurrenceOverride} />
      </CollapsibleSettingsSection>
    );
  }

  return (
    <CollapsibleSettingsSection
      title="Detection Schedule"
      open={sectionOpen}
      onOpenChange={onSectionOpenChange}
    >
      <FormSelectField
        label="Frequency"
        value={frequency}
        onChange={onFrequencyChange}
        options={SCHEDULE_FREQUENCY_OPTIONS}
        readOnly={readOnly}
      />

      {frequency === "Monthly" ? (
        <FormSelectField
          label="Day of Month"
          value={dayOfMonth}
          onChange={onDayOfMonthChange}
          options={DAY_OF_MONTH_OPTIONS}
          readOnly={readOnly}
        />
      ) : null}

      <div
        className={cx(
          "grid gap-4",
          frequency === "Weekly" ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {frequency === "Weekly" ? (
          <FormSelectField
            label="Day of Week"
            value={dayOfWeek}
            onChange={onDayOfWeekChange}
            options={DAY_OF_WEEK_OPTIONS}
            readOnly={readOnly}
          />
        ) : null}

        <FormSelectField
          label="Hour"
          value={hour}
          onChange={onHourChange}
          options={SCHEDULE_HOUR_OPTIONS}
          readOnly={readOnly}
        />

        <FormSelectField
          label="Minute"
          value={`${minute}-${period}`}
          onChange={(next) => {
            const match = SCHEDULE_MINUTE_PERIOD_OPTIONS.find((option) => option.id === next);
            if (match) {
              onMinuteChange(match.minute);
              onPeriodChange(match.period);
            }
          }}
          options={SCHEDULE_MINUTE_PERIOD_OPTIONS.map((option) => ({
            id: option.id,
            label: option.label,
          }))}
          readOnly={readOnly}
        />
      </div>

      <RecurrencePreviewBanner preview={recurrencePreview} />
    </CollapsibleSettingsSection>
  );
}

function NotificationChannelsSection({
  channels,
  onChannelsChange,
  emailRecipients,
  onEmailRecipientsChange,
  expandedChannels,
  onExpandedChannelsChange,
  readOnly = false,
}: {
  channels: NotificationChannels;
  onChannelsChange: (channels: NotificationChannels) => void;
  emailRecipients: string;
  onEmailRecipientsChange: (value: string) => void;
  expandedChannels: ExpandedChannels;
  onExpandedChannelsChange: (channels: ExpandedChannels) => void;
  readOnly?: boolean;
}) {
  const toggleChannel = (channel: NotificationChannel, checked: boolean) => {
    onChannelsChange({ ...channels, [channel]: checked });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold leading-[18px] text-text-primary">Notification Channels</h4>
      <div className="space-y-4">
        {NOTIFICATION_CHANNEL_OPTIONS.map((option) => {
          const expanded = expandedChannels[option.id];
          const stub = option.id !== "email" ? CHANNEL_CONFIG_STUBS[option.id] : null;
          const checkboxId = `notification-channel-${option.id}`;

          return (
            <Collapsible
              key={option.id}
              open={expanded}
              onOpenChange={(open) => {
                if (readOnly) return;
                onExpandedChannelsChange({ ...expandedChannels, [option.id]: open });
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <Field orientation="horizontal" className="items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={channels[option.id]}
                    disabled={readOnly}
                    onCheckedChange={(checked) => toggleChannel(option.id, checked === true)}
                  />
                  <FieldLabel htmlFor={checkboxId} className="text-sm font-semibold">
                    {option.label}
                  </FieldLabel>
                </Field>
                {!readOnly ? (
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-interactive-active hover:text-interactive-active/80"
                    >
                      {expanded ? "collapse" : "expand to configure"}
                      <Icon
                        name={expanded ? "navi-expand-less" : "navi-chevron-right"}
                        size={16}
                        className="text-interactive-active"
                        aria-hidden
                      />
                    </Button>
                  </CollapsibleTrigger>
                ) : null}
              </div>

              <CollapsibleContent className="space-y-3 pl-6 pt-3">
                {option.id === "email" ? (
                  <FormInputField
                    label="Recipients"
                    value={emailRecipients}
                    onChange={onEmailRecipientsChange}
                    placeholder="soc-team@company.com"
                    readOnly={readOnly}
                  />
                ) : stub ? (
                  <FormInputField
                    label={stub.label}
                    value=""
                    onChange={() => undefined}
                    placeholder={stub.placeholder}
                    readOnly={readOnly}
                  />
                ) : null}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
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
  readOnly = false,
  sectionOpen,
  onSectionOpenChange,
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
  readOnly?: boolean;
  sectionOpen: boolean;
  onSectionOpenChange: (open: boolean) => void;
}) {
  return (
    <CollapsibleSettingsSection
      title="Alert Configuration"
      open={sectionOpen}
      onOpenChange={onSectionOpenChange}
    >
      <AlertThresholdField value={alertThreshold} onChange={onAlertThresholdChange} readOnly={readOnly} />

      <NotificationChannelsSection
        channels={notificationChannels}
        onChannelsChange={onNotificationChannelsChange}
        emailRecipients={emailRecipients}
        onEmailRecipientsChange={onEmailRecipientsChange}
        expandedChannels={expandedChannels}
        onExpandedChannelsChange={onExpandedChannelsChange}
        readOnly={readOnly}
      />

      <CustomMessageTemplateField
        value={alertMessageTemplate}
        onChange={onAlertMessageTemplateChange}
        variables={ALERT_MESSAGE_VARIABLES}
        defaultTemplate={DEFAULT_ALERT_MESSAGE_TEMPLATE}
        readOnly={readOnly}
      />
    </CollapsibleSettingsSection>
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
  readOnly = false,
  recurrenceOverride,
  expandedSections,
  onSectionOpenChange,
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
  readOnly?: boolean;
  recurrenceOverride?: string;
  expandedSections: Record<string, boolean>;
  onSectionOpenChange: (sectionId: string, open: boolean) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pt-4 pb-24">
      {readOnly ? (
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm text-text-secondary">
          Pre-configured from the Query library. This detection is read-only — create a copy to customize.
        </div>
      ) : null}
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
        readOnly={readOnly}
        sectionOpen={expandedSections[DETECTION_FORM_SECTION_IDS.basicInformation] ?? true}
        onSectionOpenChange={(open) => onSectionOpenChange(DETECTION_FORM_SECTION_IDS.basicInformation, open)}
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
        readOnly={readOnly}
        recurrenceOverride={recurrenceOverride}
        sectionOpen={expandedSections[DETECTION_FORM_SECTION_IDS.detectionSchedule] ?? true}
        onSectionOpenChange={(open) => onSectionOpenChange(DETECTION_FORM_SECTION_IDS.detectionSchedule, open)}
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
        readOnly={readOnly}
        sectionOpen={expandedSections[DETECTION_FORM_SECTION_IDS.alertConfiguration] ?? true}
        onSectionOpenChange={(open) => onSectionOpenChange(DETECTION_FORM_SECTION_IDS.alertConfiguration, open)}
      />
    </div>
  );
}

function Spinner() {
  return (
    <svg className="size-3 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export type NewDetectionPayload = {
  /** Present when editing an existing detection; absent for new creations. */
  id?: string;
  name: string;
  description: string;
  severity: DetectionSeverity;
  enabled: boolean;
  recurrence: string;
};

export type DetectionEditValues = {
  id: string;
  name: string;
  description: string;
  severity: DetectionSeverity;
  enabled: boolean;
  recurrence?: string;
  lastRun?: string;
  connectorsActive?: number;
  connectorsTotal?: number;
};

function defaultCopyDetectionName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Untitled Detection copy";
  return `${trimmed} copy`;
}

type DetectionFormSnapshot = {
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
  alertMessageTemplate: string;
};

const LIBRARY_VIEW_PRESETS: Partial<Record<string, Partial<DetectionFormSnapshot>>> = {
  "managed-lib-1": {
    ocsfCategory: "network-activity",
    mitreTechnique: "T1071.004",
    tags: ["apt28", "dns-tunneling", "c2"],
    detectionQuery:
      "SELECT dns_query, src_ip, dest_ip, timestamp FROM network_events WHERE dns_entropy > 4.5 AND query_length > 50",
    alertThreshold: "5",
  },
  "lib-1": {
    ocsfCategory: "network-activity",
    mitreTechnique: "T1071.004",
    tags: ["apt28", "dns-tunneling", "c2"],
    detectionQuery:
      "SELECT dns_query, src_ip, dest_ip, timestamp FROM network_events WHERE dns_entropy > 4.5 AND query_length > 50",
    alertThreshold: "5",
  },
  "managed-lib-2": {
    ocsfCategory: "identity-access",
    mitreTechnique: "T1558.001",
    tags: ["kerberos", "golden-ticket", "credential-access"],
    detectionQuery:
      "SELECT user, service, encryption_type, timestamp FROM auth_events WHERE event_type = 'kerberos_tgt' AND encryption_type = 0x17",
    alertThreshold: "1",
  },
  "lib-2": {
    ocsfCategory: "identity-access",
    mitreTechnique: "T1558.001",
    tags: ["kerberos", "golden-ticket", "credential-access"],
    detectionQuery:
      "SELECT user, service, encryption_type, timestamp FROM auth_events WHERE event_type = 'kerberos_tgt' AND encryption_type = 0x17",
    alertThreshold: "1",
  },
};

function buildInitialFormSnapshot(
  editValues?: DetectionEditValues,
  mode?: "copy" | "view",
): DetectionFormSnapshot {
  const base: DetectionFormSnapshot = {
    name:
      mode === "copy" && editValues?.name
        ? defaultCopyDetectionName(editValues.name)
        : editValues?.name ?? "",
    description: editValues?.description ?? "",
    severity: editValues?.severity ?? "Critical",
    enableOnSave: editValues?.enabled ?? false,
    ocsfCategory: "",
    mitreTechnique: "",
    tags: [...DEFAULT_DETECTION_TAGS],
    queryLanguage: "FSQL",
    detectionQuery: DEFAULT_DETECTION_QUERY,
    scheduleFrequency: "Weekly",
    scheduleDayOfWeek: "Tue",
    scheduleDayOfMonth: "1",
    scheduleHour: "12",
    scheduleMinute: "00",
    schedulePeriod: "AM",
    alertThreshold: "1",
    notificationChannels: { ...DEFAULT_NOTIFICATION_CHANNELS },
    emailRecipients: DEFAULT_EMAIL_RECIPIENTS,
    alertMessageTemplate: DEFAULT_ALERT_MESSAGE_TEMPLATE,
  };

  if (mode === "view" && editValues?.id) {
    const preset = LIBRARY_VIEW_PRESETS[editValues.id];
    if (preset) return { ...base, ...preset };
  }

  return base;
}

function formSnapshotsEqual(a: DetectionFormSnapshot, b: DetectionFormSnapshot): boolean {
  return (
    a.name === b.name &&
    a.description === b.description &&
    a.severity === b.severity &&
    a.enableOnSave === b.enableOnSave &&
    a.ocsfCategory === b.ocsfCategory &&
    a.mitreTechnique === b.mitreTechnique &&
    a.tags.length === b.tags.length &&
    a.tags.every((tag, index) => tag === b.tags[index]) &&
    a.queryLanguage === b.queryLanguage &&
    a.detectionQuery === b.detectionQuery &&
    a.scheduleFrequency === b.scheduleFrequency &&
    a.scheduleDayOfWeek === b.scheduleDayOfWeek &&
    a.scheduleDayOfMonth === b.scheduleDayOfMonth &&
    a.scheduleHour === b.scheduleHour &&
    a.scheduleMinute === b.scheduleMinute &&
    a.schedulePeriod === b.schedulePeriod &&
    a.alertThreshold === b.alertThreshold &&
    a.emailRecipients === b.emailRecipients &&
    a.alertMessageTemplate === b.alertMessageTemplate &&
    a.notificationChannels.email === b.notificationChannels.email &&
    a.notificationChannels.slack === b.notificationChannels.slack &&
    a.notificationChannels.microsoftTeams === b.notificationChannels.microsoftTeams &&
    a.notificationChannels.pagerDuty === b.notificationChannels.pagerDuty
  );
}

export function CreateDetectionSlideOver({
  onClose,
  onSave,
  editValues,
  mode,
  onCopy,
}: {
  onClose: () => void;
  onSave?: (payload: NewDetectionPayload) => void;
  editValues?: DetectionEditValues;
  mode?: "copy" | "view";
  onCopy?: () => void;
}) {
  const isViewMode = mode === "view";
  const readOnly = isViewMode;
  const isEditing = editValues != null && !isViewMode;
  const isEditMode = isEditing && mode !== "copy";
  const [initialFormState] = useState(() => buildInitialFormSnapshot(editValues, mode));
  const [activeTab, setActiveTab] = useState<CreateDetectionTab>("Detection Settings");
  const expandAllSwitchId = useId();
  const [expandAll, setExpandAll] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    createExpandedSectionsState(true),
  );

  const handleExpandAllChange = useCallback((checked: boolean) => {
    setExpandAll(checked);
    setExpandedSections(createExpandedSectionsState(checked));
  }, []);

  const handleSectionOpenChange = useCallback((sectionId: string, open: boolean) => {
    setExpandedSections((prev) => {
      const next = { ...prev, [sectionId]: open };
      setExpandAll(ALL_DETECTION_FORM_SECTION_IDS.every((id) => next[id]));
      return next;
    });
  }, []);

  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [severity, setSeverity] = useState<DetectionSeverity>(initialFormState.severity);
  const [enableOnSave, setEnableOnSave] = useState(initialFormState.enableOnSave);
  const [ocsfCategory, setOcsfCategory] = useState<OcsfCategory>(initialFormState.ocsfCategory);
  const [mitreTechnique, setMitreTechnique] = useState(initialFormState.mitreTechnique);
  const [tags, setTags] = useState<string[]>(initialFormState.tags);
  const [queryLanguage, setQueryLanguage] = useState<QueryLanguage>(initialFormState.queryLanguage);
  const [detectionQuery, setDetectionQuery] = useState(initialFormState.detectionQuery);
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>(initialFormState.scheduleFrequency);
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<DayOfWeek>(initialFormState.scheduleDayOfWeek);
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(initialFormState.scheduleDayOfMonth);
  const [scheduleHour, setScheduleHour] = useState(initialFormState.scheduleHour);
  const [scheduleMinute, setScheduleMinute] = useState(initialFormState.scheduleMinute);
  const [schedulePeriod, setSchedulePeriod] = useState<TimePeriod>(initialFormState.schedulePeriod);
  const [alertThreshold, setAlertThreshold] = useState(initialFormState.alertThreshold);
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannels>(
    initialFormState.notificationChannels,
  );
  const [emailRecipients, setEmailRecipients] = useState(initialFormState.emailRecipients);
  const [expandedChannels, setExpandedChannels] = useState<ExpandedChannels>(DEFAULT_EXPANDED_CHANNELS);
  const [alertMessageTemplate, setAlertMessageTemplate] = useState(initialFormState.alertMessageTemplate);
  const canSaveSettingsTab =
    (name.trim().length > 0 || description.trim().length > 0) &&
    scheduleHour.trim().length > 0 &&
    scheduleMinute.trim().length > 0 &&
    alertThreshold.trim().length > 0 &&
    alertMessageTemplate.trim().length > 0 &&
    (!notificationChannels.email || emailRecipients.trim().length > 0);

  const canSave =
    activeTab === "Detection Logic" ? detectionQuery.trim().length > 0 : canSaveSettingsTab;
  const isLogicTab = activeTab === "Detection Logic";
  const activeTabIndex = CREATE_DETECTION_TABS.indexOf(activeTab);
  const canGoNext = activeTabIndex < CREATE_DETECTION_TABS.length - 1;
  const [isSaving, setIsSaving] = useState(false);

  const currentFormState = useMemo(
    (): DetectionFormSnapshot => ({
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
      alertMessageTemplate,
    }),
    [
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
      alertMessageTemplate,
    ],
  );

  const isDirty = !isEditMode || !formSnapshotsEqual(currentFormState, initialFormState);
  const showSaveButton = isEditMode ? isDirty : isLogicTab;
  const canSaveAction = isEditMode
    ? isDirty && (isLogicTab ? detectionQuery.trim().length > 0 : canSaveSettingsTab)
    : canSave;

  const buildPayload = useCallback((enabled: boolean): NewDetectionPayload => ({
    ...(isEditing && mode !== "copy" ? { id: editValues!.id } : {}),
    name: name.trim() || "Untitled Detection",
    description,
    severity,
    enabled,
    recurrence: formatScheduleRecurrencePreview({
      frequency: scheduleFrequency,
      dayOfWeek: scheduleDayOfWeek,
      dayOfMonth: scheduleDayOfMonth,
      hour: scheduleHour,
      minute: scheduleMinute,
      period: schedulePeriod,
    }),
  }), [isEditing, mode, editValues, name, description, severity, scheduleFrequency, scheduleDayOfWeek, scheduleDayOfMonth, scheduleHour, scheduleMinute, schedulePeriod]);

  const handleSaveDetection = () => {
    if (!canSaveAction || isSaving) return;
    setIsSaving(true);
    setTimeout(() => {
      onSave?.(buildPayload(enableOnSave));
      setIsSaving(false);
    }, 1000);
  };

  const handleNext = () => {
    if (!canGoNext || !canSaveSettingsTab) return;
    setActiveTab(CREATE_DETECTION_TABS[activeTabIndex + 1]);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-surface-modal text-text-primary">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-rule px-5 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <SlideOverHeaderBackButton onClose={onClose} className="ring-offset-surface-modal" />
          <h2 className="text-page-title text-text-primary">
            {isViewMode
              ? "View Detection"
              : mode === "copy"
                ? "Copy Detection"
                : isEditing
                  ? "Edit Detection"
                  : "Create New Detection"}
          </h2>
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

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as CreateDetectionTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex shrink-0 items-end justify-between gap-4 px-6 pt-4 pb-0">
          <TabsList
            variant="line"
            className="h-auto w-auto shrink-0 justify-start gap-6 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto"
            aria-label="Create detection sections"
          >
            {CREATE_DETECTION_TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="h-auto flex-none rounded-none border-0 px-0 pb-3 text-sm font-semibold text-text-tertiary transition-colors hover:text-text-secondary [&::after]:hidden before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:bg-transparent before:transition-colors data-active:!bg-transparent data-active:before:bg-interactive-active data-active:text-text-primary data-active:shadow-none"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          <Field orientation="horizontal" className="mb-3 w-auto shrink-0 items-center gap-2">
            <Switch
              id={expandAllSwitchId}
              checked={expandAll}
              onCheckedChange={handleExpandAllChange}
              aria-label="Expand all sections"
            />
            <FieldLabel htmlFor={expandAllSwitchId} className="mb-0 text-sm font-medium whitespace-nowrap">
              Expand all
            </FieldLabel>
          </Field>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <TabsContent value="Detection Settings" className="mt-0">
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
              readOnly={readOnly}
              recurrenceOverride={isViewMode ? editValues?.recurrence : undefined}
              expandedSections={expandedSections}
              onSectionOpenChange={handleSectionOpenChange}
            />
          </TabsContent>
          <TabsContent value="Detection Logic" className="mt-0">
            <DetectionLogicTabContent
              queryLanguage={queryLanguage}
              onQueryLanguageChange={setQueryLanguage}
              detectionQuery={detectionQuery}
              onDetectionQueryChange={setDetectionQuery}
              readOnly={readOnly}
              detectionId={isViewMode ? editValues?.id : undefined}
              lastRun={isViewMode ? editValues?.lastRun : undefined}
              connectorsActive={isViewMode ? editValues?.connectorsActive : undefined}
              connectorsTotal={isViewMode ? editValues?.connectorsTotal : undefined}
              sectionOpen={expandedSections[DETECTION_FORM_SECTION_IDS.detectionLogic] ?? true}
              onSectionOpenChange={(open) =>
                handleSectionOpenChange(DETECTION_FORM_SECTION_IDS.detectionLogic, open)
              }
            />
          </TabsContent>
        </div>
      </Tabs>

      <div className={SLIDE_OVER_FLOATING_FOOTER_WRAPPER_CLASS}>
        <div className={SLIDE_OVER_FLOATING_FOOTER_PANEL_CLASS}>
          {isViewMode ? (
            <>
              <Button
                type="button"
                variant="ghost"
                className={SLIDE_OVER_FOOTER_GHOST_BUTTON_CLASS}
                onClick={onClose}
              >
                Close
              </Button>
              <Button type="button" variant="default" className={SLIDE_OVER_FOOTER_BUTTON_CLASS} onClick={onCopy}>
                Create copy
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                className={SLIDE_OVER_FOOTER_GHOST_BUTTON_CLASS}
                onClick={onClose}
              >
                Cancel
              </Button>
              {!isLogicTab && canGoNext && (
                <Button
                  type="button"
                  variant="secondary-outline"
                  className={SLIDE_OVER_FOOTER_BUTTON_CLASS}
                  disabled={!canSaveSettingsTab}
                  onClick={handleNext}
                >
                  Next: Detection Logic
                </Button>
              )}
              {showSaveButton && (
                <Button
                  type="button"
                  variant="default"
                  className={SLIDE_OVER_FOOTER_BUTTON_CLASS}
                  disabled={!canSaveAction || isSaving}
                  onClick={handleSaveDetection}
                >
                  {isSaving ? <Spinner /> : null}
                  Save
                </Button>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
