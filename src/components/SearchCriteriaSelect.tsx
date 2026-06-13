import { useEffect, useRef, useState } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const PANEL_SHADOW =
  "shadow-[0px_5px_5px_-3px_rgba(0,0,0,0.2),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_3px_14px_2px_rgba(0,0,0,0.12)]";

export type SearchCriteriaSelectOption<T extends string = string> = {
  id: T;
  label: string;
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const selectOption = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cx("relative min-w-0", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={cx(
          "flex h-8 w-full min-w-0 items-center gap-2 rounded-[4px] border border-border-rule bg-surface-container px-3 text-left transition-colors focus-visible:outline-none",
          open ? "ring-1 ring-interactive-active" : "hover:bg-overlay-subtle",
        )}
      >
        <span
          className={cx(
            "min-w-0 flex-1 truncate text-sm font-semibold leading-5 tracking-[0.4px]",
            valueClassName,
          )}
        >
          {selected?.label}
        </span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={cx(
            "absolute left-0 top-[calc(100%+4px)] z-50 min-w-full overflow-hidden rounded-[4px] border border-border-rule bg-surface-modal py-1",
            PANEL_SHADOW,
          )}
        >
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cx(
                    "flex h-8 w-full min-w-0 items-center px-3 text-left text-sm font-semibold leading-8 tracking-[0.4px] transition-colors focus-visible:bg-interactive-secondary-hover focus-visible:outline-none",
                    isSelected
                      ? cx("bg-interactive-secondary-hover", selectedOptionClassName)
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
