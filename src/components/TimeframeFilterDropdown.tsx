import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../design-system";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toDatetimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTimeframeLabel(from: Date, to: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatter.format(from)} to ${formatter.format(to)}`;
}

const DEFAULT_FROM = new Date(2025, 9, 27, 15, 29);
const DEFAULT_TO = new Date(2025, 9, 28, 15, 29);

type TimeframeRange = {
  from: Date;
  to: Date;
};

function normalizeRange(from: Date, to: Date): TimeframeRange {
  if (from.getTime() <= to.getTime()) return { from, to };
  return { from: to, to: from };
}

/** Federated Search header control — choose a from/to datetime range. */
export function TimeframeFilterDropdown() {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [committed, setCommitted] = useState<TimeframeRange>(() =>
    normalizeRange(DEFAULT_FROM, DEFAULT_TO),
  );
  const [draftFrom, setDraftFrom] = useState(() => toDatetimeLocalValue(DEFAULT_FROM));
  const [draftTo, setDraftTo] = useState(() => toDatetimeLocalValue(DEFAULT_TO));

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

  const openPanel = () => {
    setDraftFrom(toDatetimeLocalValue(committed.from));
    setDraftTo(toDatetimeLocalValue(committed.to));
    setOpen(true);
  };

  const applyRange = () => {
    const from = fromDatetimeLocalValue(draftFrom);
    const to = fromDatetimeLocalValue(draftTo);
    if (!from || !to) return;
    setCommitted(normalizeRange(from, to));
    setOpen(false);
  };

  const draftFromDate = fromDatetimeLocalValue(draftFrom);
  const draftToDate = fromDatetimeLocalValue(draftTo);
  const canApply = draftFromDate != null && draftToDate != null;

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Timeframe filter"
        className="inline-flex max-w-full items-center gap-1.5 rounded py-0.5 text-left transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <Icon name="action-time" size={16} className="shrink-0 text-interactive-active" aria-hidden />
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-interactive-active">
          Timeframe
          <Icon
            name="chevron-down"
            size={16}
            className={cx("shrink-0 text-interactive-active transition-transform duration-150", open && "rotate-180")}
            aria-hidden
          />
        </span>
        <span className="ml-0.5 shrink-0 rounded bg-surface-container px-2 py-1 text-sm font-normal text-text-primary">
          {formatTimeframeLabel(committed.from, committed.to)}
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Choose timeframe"
          className="absolute left-0 top-[calc(100%+4px)] z-50 w-[min(360px,calc(100vw-2.5rem))] rounded-[4px] border border-border-container bg-surface-modal p-4 shadow-[0_3px_14px_2px_rgba(0,0,0,0.12),0_8px_10px_1px_rgba(0,0,0,0.14),0_5px_5px_-3px_rgba(0,0,0,0.2)]"
        >
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-text-tertiary">From</span>
              <Input
                type="datetime-local"
                value={draftFrom}
                onChange={(event) => setDraftFrom(event.target.value)}
                className="mt-1.5 h-8 !bg-surface-container [&_input]:font-normal"
                aria-label="Timeframe from"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-text-tertiary">To</span>
              <Input
                type="datetime-local"
                value={draftTo}
                onChange={(event) => setDraftTo(event.target.value)}
                className="mt-1.5 h-8 !bg-surface-container [&_input]:font-normal"
                aria-label="Timeframe to"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" className="h-8 ring-offset-surface-modal" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="h-8"
              disabled={!canApply}
              onClick={applyRange}
            >
              Apply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
