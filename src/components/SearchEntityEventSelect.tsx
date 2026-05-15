import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../design-system";

const OPTIONS = [
  { id: "entity", label: "Entity" },
  { id: "event", label: "Event" },
] as const;

export type SearchEntityEventSelectProps = {
  className?: string;
  /** Accessible name for the combobox trigger. */
  "aria-label"?: string;
};

/**
 * Config-Schema-v2 search scope control — Figma node `7876-102744`.
 * Single-line field: search icon, italic secondary placeholder (“Select an Entity or an Event”), dropdown affordance.
 */
export function SearchEntityEventSelect({
  className = "",
  "aria-label": ariaLabel = "Select Entity or Event",
}: SearchEntityEventSelectProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<(typeof OPTIONS)[number]["id"] | null>(null);

  const selected = OPTIONS.find((o) => o.id === value);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`.trim()}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={ariaLabel}
        className="flex h-8 w-full max-w-[360px] items-center gap-2 rounded-[4px] border border-border-rule bg-surface-container px-3 text-left outline-none transition-colors hover:bg-overlay-subtle focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="search" size={18} className="shrink-0 text-text-primary" aria-hidden />
        <span
          className={
            selected
              ? "min-w-0 flex-1 truncate text-sm font-semibold not-italic leading-5 text-text-primary"
              : "min-w-0 flex-1 truncate text-sm font-normal italic leading-5 text-text-secondary"
          }
        >
          {selected ? selected.label : "Select an Entity or an Event"}
        </span>
        <Icon
          name="chevron-down"
          size={18}
          className={`shrink-0 text-text-primary transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-60 min-w-full max-w-[360px] overflow-auto rounded-[4px] border border-border-rule bg-surface-container py-1 shadow-lg ring-1 ring-border-container"
        >
          {OPTIONS.map((opt) => (
            <li key={opt.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === opt.id}
                className="flex w-full items-center px-3 py-2 text-left text-sm font-semibold leading-5 text-text-primary hover:bg-overlay-subtle focus-visible:bg-overlay-subtle focus-visible:outline-none"
                onClick={() => {
                  setValue(opt.id);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
