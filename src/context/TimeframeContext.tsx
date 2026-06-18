import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type TimeframeRange = {
  from: Date;
  to: Date;
};

export const DEFAULT_TIMEFRAME_FROM = new Date(2025, 9, 27, 15, 29);
export const DEFAULT_TIMEFRAME_TO = new Date(2025, 9, 28, 15, 29);

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
  const [range, setRangeState] = useState<TimeframeRange>(() =>
    normalizeTimeframeRange(DEFAULT_TIMEFRAME_FROM, DEFAULT_TIMEFRAME_TO),
  );
  const [analyticsBaselineRange, setAnalyticsBaselineRange] = useState<TimeframeRange>(() =>
    cloneTimeframeRange(normalizeTimeframeRange(DEFAULT_TIMEFRAME_FROM, DEFAULT_TIMEFRAME_TO)),
  );
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
