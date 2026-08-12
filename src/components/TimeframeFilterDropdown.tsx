import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Icon } from "../design-system";
import {
  createRelativeTimeframeRange,
  formatTimeframeLabel,
  normalizeTimeframeRange,
  TIMEFRAME_PRESETS,
  useTimeframe,
} from "../context/TimeframeContext";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "./ui/Input";
import { cn } from "@/lib/utils";

const HEADER_FILTER_TRIGGER_CLASS =
  "h-auto max-w-full gap-1.5 rounded px-0 py-0.5 font-semibold text-interactive-active hover:bg-transparent hover:text-[var(--color-primary-hover)] active:text-[var(--color-primary-pressed)] lg:inline-flex lg:w-auto";

const TIMEFRAME_INPUT_CLASS =
  "mt-1.5 h-8 !border-border-rule !bg-surface-container [&_input]:font-normal [&_input]:text-text-primary [&_input]:[color-scheme:dark] [html[data-theme=light]_&]:[&_input]:[color-scheme:light]";

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

/** Federated Search header control — choose a from/to datetime range. */
export function TimeframeFilterDropdown() {
  const { range, commitAnalyticsTimeframe, isAnalyticsChartZoomed } = useTimeframe();
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(() => toDatetimeLocalValue(range.from));
  const [draftTo, setDraftTo] = useState(() => toDatetimeLocalValue(range.to));

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftFrom(toDatetimeLocalValue(range.from));
      setDraftTo(toDatetimeLocalValue(range.to));
    }
    setOpen(nextOpen);
  };

  const applyRange = (from: Date, to: Date) => {
    commitAnalyticsTimeframe(normalizeTimeframeRange(from, to));
    setOpen(false);
  };

  const applyDraftRange = () => {
    const from = fromDatetimeLocalValue(draftFrom);
    const to = fromDatetimeLocalValue(draftTo);
    if (!from || !to) return;
    applyRange(from, to);
  };

  const applyPreset = (durationMs: number) => {
    const next = createRelativeTimeframeRange(durationMs);
    setDraftFrom(toDatetimeLocalValue(next.from));
    setDraftTo(toDatetimeLocalValue(next.to));
    applyRange(next.from, next.to);
  };

  const draftFromDate = fromDatetimeLocalValue(draftFrom);
  const draftToDate = fromDatetimeLocalValue(draftTo);
  const canApply = draftFromDate != null && draftToDate != null;

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(HEADER_FILTER_TRIGGER_CLASS, "w-full justify-start text-left lg:w-auto")}
          aria-label="Timeframe filter"
        >
          <Icon
            name="action-time"
            size={18.4}
            className="size-[18.4px] shrink-0 text-current [&_svg]:!size-[18.4px]"
            aria-hidden
          />
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
            Timeframe
            <ChevronDown size={14} className="shrink-0 text-current" aria-hidden />
          </span>
          <span
            className={cn(
              "ml-0.5 inline-flex min-w-0 max-w-[12rem] items-center gap-1.5 rounded bg-surface-container px-2 py-1 lg:max-w-none",
              isAnalyticsChartZoomed && "pr-1.5",
            )}
            title={isAnalyticsChartZoomed ? "Chart zoom active — use Reset to restore the full timeframe" : undefined}
          >
            <span className="min-w-0 truncate text-sm font-normal text-text-primary lg:whitespace-nowrap">
              {formatTimeframeLabel(range.from, range.to)}
            </span>
            {isAnalyticsChartZoomed ? (
              <span
                className="size-1.5 shrink-0 rounded-full bg-feedback-caution"
                aria-label="Chart zoom active"
              />
            ) : null}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[min(360px,calc(100vw-2.5rem))] rounded-[4px] border border-border-container bg-surface-modal p-4 text-text-primary shadow-[0_3px_14px_2px_rgba(0,0,0,0.12),0_8px_10px_1px_rgba(0,0,0,0.14),0_5px_5px_-3px_rgba(0,0,0,0.2)] ring-0"
        onCloseAutoFocus={(event) => event.preventDefault()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-3" role="dialog" aria-label="Choose timeframe">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-text-tertiary">Quick ranges</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIMEFRAME_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant="secondary-outline"
                  size="xs"
                  onClick={() => applyPreset(preset.durationMs)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-text-tertiary">Custom range</span>
            <div className="mt-2 space-y-3">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-text-tertiary">From</span>
                <Input
                  type="datetime-local"
                  value={draftFrom}
                  onChange={(event) => setDraftFrom(event.target.value)}
                  className={TIMEFRAME_INPUT_CLASS}
                  aria-label="Timeframe from"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-text-tertiary">To</span>
                <Input
                  type="datetime-local"
                  value={draftTo}
                  onChange={(event) => setDraftTo(event.target.value)}
                  className={TIMEFRAME_INPUT_CLASS}
                  aria-label="Timeframe to"
                />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary-outline" className="h-8" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="default" className="h-8" disabled={!canApply} onClick={applyDraftRange}>
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
