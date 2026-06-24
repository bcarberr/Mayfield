import { useId, useState } from "react";
import { Switch } from "../../design-system";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/shadcn/field";
import { Separator } from "@/components/shadcn/separator";
import {
  DEFAULT_EXPERIMENT_PREFERENCES,
  type ExperimentPreferences,
} from "./settingsData";
import { SettingsSectionTitle } from "./SettingsFormFields";
import { ThemePreferenceSwitch } from "./ThemePreferenceSwitch";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

function ExperimentPreferenceCard({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const switchId = useId();

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[4px] border border-border-container bg-datavis-card-bg shadow-datavis-card">
      <Field orientation="horizontal" className="items-center justify-between gap-4 px-4 py-3">
        <FieldLabel htmlFor={switchId} className="mb-0 text-sm font-semibold text-text-primary">
          {label}
        </FieldLabel>
        <Switch id={switchId} checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
      </Field>
      <Separator className="bg-datavis-gridlines" />
      <FieldDescription className="px-4 py-3 text-sm text-text-tertiary">{description}</FieldDescription>
    </div>
  );
}

export function PreferencesTab() {
  const [experiments, setExperiments] = useState<ExperimentPreferences>(DEFAULT_EXPERIMENT_PREFERENCES);

  const updateExperiment = (key: keyof ExperimentPreferences, checked: boolean) => {
    setExperiments((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <FieldGroup className="max-w-4xl gap-8">
      <section className="flex flex-col gap-3">
        <SettingsSectionTitle>Theme Preference</SettingsSectionTitle>
        <ThemePreferenceSwitch />
      </section>

      <section className="flex flex-col gap-3">
        <SettingsSectionTitle>Experiment Preferences</SettingsSectionTitle>
        <div className={cx("grid grid-cols-1 gap-4", "md:grid-cols-2")}>
          <ExperimentPreferenceCard
            label="Include Raw Data in Search Data"
            description="Combine raw data with OCSF data."
            checked={experiments.includeRawDataInSearch}
            onCheckedChange={(checked) => updateExperiment("includeRawDataInSearch", checked)}
          />
          <ExperimentPreferenceCard
            label="Streaming Incremental Results"
            description="Receive results back from search incrementally instead of all at once."
            checked={experiments.streamingIncrementalResults}
            onCheckedChange={(checked) => updateExperiment("streamingIncrementalResults", checked)}
          />
        </div>
      </section>
    </FieldGroup>
  );
}
