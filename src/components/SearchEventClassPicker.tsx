import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../design-system";
import { Button } from "@/components/shadcn/button";
import {
  SEARCH_EVENT_CATEGORIES,
  eventCategoryById,
  searchEventById,
  type SearchEventOption,
} from "../data/searchEntityOptions";
import { cn } from "@/lib/utils";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Matches shadcn dropdown panels (e.g. AI Assisted Mapping). */
const DROPDOWN_PANEL_CLASS =
  "rounded-[4px] border border-border-container bg-surface-modal shadow-[0_3px_14px_2px_rgba(0,0,0,0.12),0_8px_10px_1px_rgba(0,0,0,0.14),0_5px_5px_-3px_rgba(0,0,0,0.2)] ring-0";

export function EventPickerPopover({
  onSelect,
  onClose,
  initialCategoryId,
}: {
  onSelect: (option: SearchEventOption) => void;
  onClose: () => void;
  initialCategoryId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState(
    initialCategoryId ?? SEARCH_EVENT_CATEGORIES[0]!.id,
  );

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const activeCategory =
    SEARCH_EVENT_CATEGORIES.find((category) => category.id === activeCategoryId) ??
    SEARCH_EVENT_CATEGORIES[0]!;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute left-0 top-[calc(100%+4px)] z-50 flex overflow-hidden",
        DROPDOWN_PANEL_CLASS,
      )}
      style={{ width: 560, maxHeight: 400 }}
      role="dialog"
      aria-label="Pick an event"
    >
      <div className="w-44 shrink-0 overflow-y-auto border-r border-border-container">
        <p className="px-4 pt-3 text-xs font-bold uppercase leading-[14px] tracking-[0.4px] text-text-tertiary">
          Event categories
        </p>
        <div className="pb-2 pt-1">
          {SEARCH_EVENT_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant="ghost"
              className={cn(
                "h-9 w-full justify-start gap-2 rounded-none px-4 text-left text-sm font-semibold text-text-primary hover:bg-interactive-secondary-hover",
                category.id === activeCategoryId && "bg-interactive-secondary-hover",
              )}
              onMouseEnter={() => setActiveCategoryId(category.id)}
              onClick={() => setActiveCategoryId(category.id)}
            >
              <Icon name={category.icon} size={16} className={cx("shrink-0", category.iconClassName)} aria-hidden />
              <span className="min-w-0 truncate">{category.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div
          className={cx(
            "grid gap-x-3",
            activeCategory.events.length > 6 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {activeCategory.events.map((event) => (
            <Button
              key={event.id}
              type="button"
              variant="ghost"
              className="h-8 w-full min-w-0 justify-start gap-2 rounded px-1 text-left hover:bg-interactive-secondary-hover"
              onClick={() => {
                onSelect(event);
                onClose();
              }}
            >
              <Icon
                name={event.icon}
                size={16}
                className={cx("shrink-0", activeCategory.iconClassName)}
                aria-hidden
              />
              <span className="min-w-0 truncate text-sm font-semibold text-text-secondary">{event.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export type SearchEventClassPickerProps = {
  value: string;
  onChange: (eventClassId: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function SearchEventClassPicker({
  value,
  onChange,
  disabled = false,
  className,
  "aria-label": ariaLabel = "Event class to map",
}: SearchEventClassPickerProps) {
  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => setOpen(false), []);
  const selected = searchEventById(value);
  const iconClassName =
    selected != null
      ? (eventCategoryById(selected.categoryId)?.iconClassName ?? "text-text-secondary")
      : "text-text-secondary";

  return (
    <div className={cn("relative shrink-0", className)}>
      <Button
        type="button"
        variant="secondary-outline"
        size="sm"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className="h-7 w-60 justify-start gap-1 border-border-rule bg-surface-modal px-3 font-semibold text-text-primary"
        onClick={() => setOpen((current) => !current)}
      >
        {selected ? (
          <Icon
            name={selected.icon}
            size={16}
            className={cx("shrink-0", iconClassName)}
            aria-hidden
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold">
          {selected?.label ?? "Select event class"}
        </span>
        <Icon name="chevron-down" size={16} className="shrink-0 text-text-secondary" aria-hidden />
      </Button>

      {open ? (
        <EventPickerPopover
          initialCategoryId={selected?.categoryId}
          onSelect={(option) => onChange(option.id)}
          onClose={handleClose}
        />
      ) : null}
    </div>
  );
}
