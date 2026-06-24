import { useId, type ComponentProps } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend } from "@/components/shadcn/field";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";

export const SETTINGS_INPUT_CLASS =
  "h-10 border-border-container bg-surface-modal text-sm font-semibold text-text-primary placeholder:font-semibold placeholder:text-text-tertiary";

export const SETTINGS_FIELD_LABEL_CLASS = "text-xs font-semibold text-text-tertiary";

export function SettingsFormField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: ComponentProps<typeof Input>["type"];
}) {
  const id = useId();

  return (
    <Field>
      <FieldLabel htmlFor={id} className={SETTINGS_FIELD_LABEL_CLASS}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={SETTINGS_INPUT_CLASS}
      />
    </Field>
  );
}

export function SettingsSectionTitle({ children, className }: { children: string; className?: string }) {
  return (
    <FieldLegend
      variant="label"
      className={cn("mb-0 text-sm font-semibold text-text-primary", className)}
    >
      {children}
    </FieldLegend>
  );
}

export { FieldDescription, FieldGroup };
