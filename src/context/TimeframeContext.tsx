import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type TimeframeRange = {
  from: Date;
  to: Date;
};

const MS_HOUR = 3_600_000;
const MS_DAY = 24 * MS_HOUR;

export type TimeframePreset = {
  id: string;
  label: string;
  durationMs: number;
};

export const TIMEFRAME_PRESETS: readonly TimeframePreset[] = [
  { id: "1h", label: "Last hour", durationMs: MS_HOUR },
  { id: "24h", label: "Last 24 hours", durationMs: 24 * MS_HOUR },
  { id: "7d", label: "Last 7 days", durationMs: 7 * MS_DAY },
  { id: "14d", label: "Last 14 days", durationMs: 14 * MS_DAY },
  { id: "30d", label: "Last 30 days", durationMs: 30 * MS_DAY },
  { id: "60d", label: "Last 60 days", durationMs: 60 * MS_DAY },
] as const;

export const DEFAULT_TIMEFRAME_PRESET = TIMEFRAME_PRESETS.find((preset) => preset.id === "14d")!;

export function createRelativeTimeframeRange(durationMs: number, end: Date = new Date()): TimeframeRange {
  const to = new Date(end);
  const from = new Date(to.getTime() - durationMs);
  return normalizeTimeframeRange(from, to);
}

export function createDefaultTimeframeRange(): TimeframeRange {
  return createRelativeTimeframeRange(DEFAULT_TIMEFRAME_PRESET.durationMs);
}

/** @deprecated Prefer {@link createDefaultTimeframeRange} — fixed at module load when used directly. */
export const DEFAULT_TIMEFRAME_FROM = createDefaultTimeframeRange().from;
/** @deprecated Prefer {@link createDefaultTimeframeRange} — fixed at module load when used directly. */
export const DEFAULT_TIMEFRAME_TO = createDefaultTimeframeRange().to;

export function normalizeTimeframeRange(from: Date, to: Date): TimeframeRange {
  if (from.getTime() <= to.getTime()) return { from, to };
  return { from: to, to: from };
}

export function formatTimeframeLabel(from: Date, to: Date): string {
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

function cloneTimeframeRange(range: TimeframeRange): TimeframeRange {
  return { from: new Date(range.from), to: new Date(range.to) };
}

type TimeframeContextValue = {
  range: TimeframeRange;
  /** Unzoomed range for Federated Analytics — shared across all analytics dashboards. */
  analyticsBaselineRange: TimeframeRange;
  isAnalyticsChartZoomed: boolean;
  setRange: (range: TimeframeRange) => void;
  /** Header timeframe picker — updates range, baseline, and clears chart zoom. */
  commitAnalyticsTimeframe: (range: TimeframeRange) => void;
  applyAnalyticsChartZoom: (range: TimeframeRange) => void;
  resetAnalyticsChartZoom: () => void;
};

const TimeframeContext = createContext<TimeframeContextValue | null>(null);

export function TimeframeProvider({ children }: { children: ReactNode }) {
  const [range, setRangeState] = useState<TimeframeRange>(createDefaultTimeframeRange);
  const [analyticsBaselineRange, setAnalyticsBaselineRange] = useState<TimeframeRange>(createDefaultTimeframeRange);
  const [isAnalyticsChartZoomed, setIsAnalyticsChartZoomed] = useState(false);

  const setRange = useCallback((next: TimeframeRange) => {
    setRangeState(next);
    setIsAnalyticsChartZoomed(false);
  }, []);

  const commitAnalyticsTimeframe = useCallback((next: TimeframeRange) => {
    const normalized = cloneTimeframeRange(next);
    setRangeState(normalized);
    setAnalyticsBaselineRange(normalized);
    setIsAnalyticsChartZoomed(false);
  }, []);

  const applyAnalyticsChartZoom = useCallback((next: TimeframeRange) => {
    setRangeState(cloneTimeframeRange(next));
    setIsAnalyticsChartZoomed(true);
  }, []);

  const resetAnalyticsChartZoom = useCallback(() => {
    setRangeState(cloneTimeframeRange(analyticsBaselineRange));
    setIsAnalyticsChartZoomed(false);
  }, [analyticsBaselineRange]);

  const value = useMemo(
    () => ({
      range,
      analyticsBaselineRange,
      isAnalyticsChartZoomed,
      setRange,
      commitAnalyticsTimeframe,
      applyAnalyticsChartZoom,
      resetAnalyticsChartZoom,
    }),
    [
      range,
      analyticsBaselineRange,
      isAnalyticsChartZoomed,
      setRange,
      commitAnalyticsTimeframe,
      applyAnalyticsChartZoom,
      resetAnalyticsChartZoom,
    ],
  );

  return <TimeframeContext.Provider value={value}>{children}</TimeframeContext.Provider>;
}

export function useTimeframe(): TimeframeContextValue {
  const context = useContext(TimeframeContext);
  if (!context) {
    throw new Error("useTimeframe must be used within a TimeframeProvider");
  }
  return context;
}
