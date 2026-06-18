import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { cn } from "@/lib/utils";

export type SearchCriteriaSelectOption<T extends string = string> = {
  id: T;
  label: string;
};

const SELECT_TRIGGER_CLASS =
  "h-8 w-full min-w-0 rounded-[4px] border-border-rule bg-surface-container px-3 shadow-none hover:bg-overlay-subtle focus:ring-1 focus:ring-interactive-active [&_svg]:size-4 [&_svg]:text-text-tertiary";

const SELECT_CONTENT_CLASS =
  "rounded-[4px] border-border-rule bg-surface-modal shadow-[0px_5px_5px_-3px_rgba(0,0,0,0.2),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_3px_14px_2px_rgba(0,0,0,0.12)] ring-0";

const SELECT_ITEM_CLASS =
  "h-8 cursor-pointer text-sm font-semibold tracking-[0.4px] text-text-secondary focus:bg-interactive-secondary-hover focus:text-text-primary";

export function SearchCriteriaSelect<T extends string>({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
  valueClassName = "text-text-primary",
  selectedOptionClassName = "text-interactive-active",
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly SearchCriteriaSelectOption<T>[];
  className?: string;
  "aria-label"?: string;
  /** Trigger label color — e.g. `text-datavis-data-peanut-orange` for operator fields. */
  valueClassName?: string;
  /** Selected menu option label color — defaults to `text-interactive-active`. */
  selectedOptionClassName?: string;
}) {
  const placeholderOption = options.find((option) => option.id === "");
  const selectableOptions = options.filter((option) => option.id !== "");
  const selected = options.find((option) => option.id === value);
  const hasValue = Boolean(selected?.id);

  return (
    <Select value={hasValue ? value : undefined} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger aria-label={ariaLabel} className={cn(SELECT_TRIGGER_CLASS, className)}>
        <SelectValue placeholder={placeholderOption?.label}>
          {hasValue && selected ? (
            <span className={cn("truncate font-semibold tracking-[0.4px]", valueClassName)}>
              {selected.label}
            </span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={SELECT_CONTENT_CLASS} position="popper">
        {selectableOptions.map((option) => {
          const isSelected = option.id === value;
          return (
            <SelectItem
              key={option.id}
              value={option.id}
              className={cn(SELECT_ITEM_CLASS, isSelected && selectedOptionClassName)}
            >
              {option.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
