import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { Icon, Switch, type SeverityShapeIconName } from "../../design-system";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
} from "@/components/shadcn/field";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export function SettingsSectionHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <FieldLegend
      variant="label"
      className={cx(
        "mb-0 pb-2 text-xs font-bold uppercase tracking-[0.6px] text-text-primary",
        className,
      )}
    >
      {children}
    </FieldLegend>
  );
}

export function CollapsibleSettingsSection({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <section>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-1 py-1 text-left text-text-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
            aria-expanded={open}
          >
            <Icon
              name="navi-arrow-drop-down"
              size={32}
              className={cx("block shrink-0 transition-transform", open ? "rotate-0" : "-rotate-90")}
              aria-hidden
            />
            <SettingsSectionHeading className="pb-0">{title}</SettingsSectionHeading>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-5 pt-3">{children}</CollapsibleContent>
      </section>
    </Collapsible>
  );
}

export function FormInputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  className,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: ComponentProps<typeof Input>["type"];
  inputMode?: ComponentProps<typeof Input>["inputMode"];
  className?: string;
  readOnly?: boolean;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        className={className}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function FormTextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function FormSelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder,
  renderItem,
  renderValue,
  readOnly = false,
}: {
  label: string;
  value: T | "";
  onChange: (value: T) => void;
  options: readonly { id: T; label: string }[];
  placeholder?: string;
  renderItem?: (option: { id: T; label: string }) => ReactNode;
  renderValue?: (option: { id: T; label: string }) => ReactNode;
  readOnly?: boolean;
}) {
  const id = useId();
  const selected = options.find((option) => option.id === value);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value || undefined} onValueChange={(next) => onChange(next as T)} disabled={readOnly}>
        <SelectTrigger id={id} className="w-full" disabled={readOnly}>
          <SelectValue placeholder={placeholder}>
            {selected ? (renderValue ? renderValue(selected) : selected.label) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {renderItem ? renderItem(option) : option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const SEV_COLORS: Record<string, string> = {
  Critical: "#ff604a",
  High: "#f28830",
  Medium: "#fac354",
  Low: "#57969e",
};

const SEV_ICONS: Record<string, SeverityShapeIconName> = {
  Critical: "severity-critical",
  High: "severity-high",
  Medium: "severity-medium",
  Low: "severity-low",
};

/** 12px severity glyph for select menus — fixed color/size; not affected by item hover styles. */
function SeveritySelectIcon({ severityId }: { severityId: string }) {
  const color = SEV_COLORS[severityId];
  const name = SEV_ICONS[severityId];

  return (
    <span
      aria-hidden
      className="pointer-events-none inline-flex h-3 shrink-0 items-center [&_path]:![fill:var(--severity-color)] [&_svg]:!block [&_svg]:!h-3 [&_svg]:!max-h-3 [&_svg]:!w-auto"
      style={{ ["--severity-color" as string]: color }}
    >
      <Icon name={name} size={12} aria-hidden />
    </span>
  );
}

export function SeveritySelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  readOnly = false,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { id: T; label: string }[];
  readOnly?: boolean;
}) {
  return (
    <FormSelectField
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      readOnly={readOnly}
      renderItem={(option) => (
        <span className="flex items-center gap-2">
          <SeveritySelectIcon severityId={option.id} />
          {option.label}
        </span>
      )}
      renderValue={(option) => (
        <span className="flex items-center gap-2">
          <SeveritySelectIcon severityId={option.id} />
          {option.label}
        </span>
      )}
    />
  );
}

export function EnableOnSaveField({
  checked,
  onCheckedChange,
  readOnly = false,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  readOnly?: boolean;
}) {
  const id = useId();
  return (
    <Field orientation="horizontal" className="items-center justify-between rounded-lg border border-input px-3 py-2 dark:bg-input/30">
      <div className="space-y-0.5">
        <FieldLabel htmlFor={id} className="text-sm font-medium">
          {readOnly ? "Detection State" : "Enable on Save"}
        </FieldLabel>
        <FieldDescription>
          {checked
            ? readOnly
              ? "On — detection is active"
              : "On — detection active when saved"
            : readOnly
              ? "Off — detection is inactive"
              : "Off — detection inactive when saved"}
        </FieldDescription>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={readOnly} />
    </Field>
  );
}

export function TagsField({
  tags,
  onTagsChange,
  readOnly = false,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  readOnly?: boolean;
}) {
  const id = useId();
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
    <Field>
      <FieldLabel htmlFor={id}>Tags</FieldLabel>
      <div
        className="flex min-h-8 flex-wrap items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1.5 dark:bg-input/30"
        onClick={() => !readOnly && inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            {!readOnly ? (
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove tag ${tag}`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemove(tag);
                }}
              >
                <Icon name="close" size={12} aria-hidden />
              </button>
            ) : null}
          </Badge>
        ))}
        {!readOnly ? (
          <Input
            ref={inputRef}
            id={id}
            value={inputValue}
            placeholder={tags.length === 0 ? "Press Enter to add" : ""}
            className="h-7 min-w-[8rem] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={() => addTag(inputValue)}
          />
        ) : null}
      </div>
      {!readOnly ? <FieldDescription>Press Enter to add a tag.</FieldDescription> : null}
    </Field>
  );
}

export function RecurrencePreviewBanner({ preview }: { preview: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <Icon name="action-date-range" size={16} className="shrink-0 text-interactive-active" aria-hidden />
      <p className="text-sm text-text-primary">
        <span className="font-semibold text-muted-foreground">Recurrence preview: </span>
        {preview}
      </p>
    </div>
  );
}

export function AlertConfigurationBox({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-border bg-muted/20 p-4">{children}</div>;
}

export function AlertThresholdField({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const id = useId();

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
      <Field orientation="horizontal" className="flex-wrap items-center gap-2">
        <FieldLabel htmlFor={id} className="w-full text-xs font-semibold text-muted-foreground">
          Alert when findings exceed
        </FieldLabel>
        <Input
          id={id}
          type="number"
          min={1}
          step={1}
          value={value}
          className="w-20 text-center"
          aria-label="Alert threshold"
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(event) => handleChange(event.target.value)}
        />
        <FieldDescription className="mb-0">finding(s) per run</FieldDescription>
      </Field>
    </AlertConfigurationBox>
  );
}

export function MessageTemplateVariablePill({
  variable,
  onInsert,
}: {
  variable: string;
  onInsert: (variable: string) => void;
}) {
  return (
    <Button type="button" variant="secondary-outline" size="sm" onClick={() => onInsert(variable)}>
      {variable}
    </Button>
  );
}

export function CustomMessageTemplateField({
  value,
  onChange,
  variables,
  defaultTemplate,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  variables: readonly string[];
  defaultTemplate: string;
  readOnly?: boolean;
}) {
  const insertVariable = (variable: string) => {
    onChange(`${value}${variable}`);
  };

  return (
    <AlertConfigurationBox>
      <FieldGroup className="gap-3">
        <FormTextareaField
          label="Custom Message Template"
          value={value}
          placeholder={defaultTemplate}
          rows={3}
          onChange={onChange}
          readOnly={readOnly}
        />
        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Available variables:</span>
            {variables.map((variable) => (
              <MessageTemplateVariablePill key={variable} variable={variable} onInsert={insertVariable} />
            ))}
          </div>
        ) : null}
      </FieldGroup>
    </AlertConfigurationBox>
  );
}
