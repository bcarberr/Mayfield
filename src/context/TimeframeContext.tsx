import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

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

type TimeframeContextValue = {
  range: TimeframeRange;
  setRange: (range: TimeframeRange) => void;
};

const TimeframeContext = createContext<TimeframeContextValue | null>(null);

export function TimeframeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<TimeframeRange>(() =>
    normalizeTimeframeRange(DEFAULT_TIMEFRAME_FROM, DEFAULT_TIMEFRAME_TO),
  );

  const value = useMemo(() => ({ range, setRange }), [range]);

  return <TimeframeContext.Provider value={value}>{children}</TimeframeContext.Provider>;
}

export function useTimeframe(): TimeframeContextValue {
  const context = useContext(TimeframeContext);
  if (!context) {
    throw new Error("useTimeframe must be used within a TimeframeProvider");
  }
  return context;
}
