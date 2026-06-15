import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type TimeSeriesSpikeHighlight = {
  index: number;
  label?: string;
};

export type TimeSeriesBrushSelection = {
  startIndex: number;
  endIndex: number;
};

type TimeSeriesBarChartProps = {
  values: readonly number[];
  xLabels: readonly string[];
  barColor: string;
  /** Per-bar fill override. */
  barColors?: readonly string[];
  yMax?: number;
  yTicks?: readonly number[];
  height?: number;
  ariaLabel: string;
  spikeHighlight?: TimeSeriesSpikeHighlight;
  /** When set, drag on the plot to select a range and zoom in. */
  onBrushCommit?: (selection: TimeSeriesBrushSelection) => void;
};

const MIN_BRUSH_WIDTH_PX = 8;

const PLOT_VIEW_WIDTH = 1000;

/** Vertical bar time-series — datavis gridlines with optional spike callout. */
export function TimeSeriesBarChart({
  values,
  xLabels,
  barColor,
  barColors,
  yMax: yMaxProp,
  yTicks: yTicksProp,
  height = 140,
  ariaLabel,
  spikeHighlight,
  onBrushCommit,
}: TimeSeriesBarChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const brushDragRef = useRef<{ pointerId: number; startX: number; currentX: number } | null>(null);
  const [brushOverlay, setBrushOverlay] = useState<{ startX: number; currentX: number } | null>(null);
  const brushEnabled = onBrushCommit != null;

  const yMax = yMaxProp ?? Math.max(...values, 1);
  const yTicks = yTicksProp ?? [0, Math.round(yMax / 4), Math.round(yMax / 2), Math.round((yMax * 3) / 4), yMax];

  const clientXToPlotX = useCallback((clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    return Math.max(0, Math.min(rect.width, clientX - rect.left));
  }, []);

  const plotXToIndex = useCallback(
    (x: number, edge: "start" | "end") => {
      const rect = plotRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || values.length === 0) return 0;

      const ratio = Math.max(0, Math.min(1, x / rect.width));
      if (edge === "end") {
        if (ratio >= 1) return values.length - 1;
        return Math.min(values.length - 1, Math.max(0, Math.ceil(ratio * values.length) - 1));
      }

      return Math.min(values.length - 1, Math.max(0, Math.floor(ratio * values.length)));
    },
    [values.length],
  );

  const commitBrush = useCallback(
    (brush: { startX: number; currentX: number }) => {
      if (!onBrushCommit) return;
      if (Math.abs(brush.currentX - brush.startX) < MIN_BRUSH_WIDTH_PX) return;

      const left = Math.min(brush.startX, brush.currentX);
      const right = Math.max(brush.startX, brush.currentX);
      const startIndex = plotXToIndex(left, "start");
      const endIndex = plotXToIndex(right, "end");
      onBrushCommit({ startIndex, endIndex: Math.max(startIndex, endIndex) });
    },
    [onBrushCommit, plotXToIndex],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!brushEnabled) return;
    event.preventDefault();
    const x = clientXToPlotX(event.clientX);
    brushDragRef.current = { pointerId: event.pointerId, startX: x, currentX: x };
    setBrushOverlay({ startX: x, currentX: x });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = brushDragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    const x = clientXToPlotX(event.clientX);
    brushDragRef.current = { ...drag, currentX: x };
    setBrushOverlay({ startX: drag.startX, currentX: x });
  };

  const finishBrush = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = brushDragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    brushDragRef.current = null;
    setBrushOverlay(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    commitBrush(drag);
  };

  const bars = useMemo(() => {
    const slotWidth = PLOT_VIEW_WIDTH / Math.max(values.length, 1);
    const barWidth = Math.min(slotWidth * 0.55, 72);

    return values.map((value, index) => {
      const barHeight = (value / yMax) * height;
      const x = index * slotWidth + (slotWidth - barWidth) / 2;
      const y = height - barHeight;

      return { index, value, x, y, width: barWidth, height: barHeight, centerX: x + barWidth / 2 };
    });
  }, [values, yMax, height]);

  const spikeCenterX =
    spikeHighlight != null ? bars[spikeHighlight.index]?.centerX ?? null : null;
  const spikeLabel =
    spikeHighlight != null
      ? (spikeHighlight.label ?? `spike ${xLabels[spikeHighlight.index] ?? ""}`)
      : null;

  const toY = (tick: number) => height - (tick / yMax) * height;

  const barFill = (index: number) => barColors?.[index] ?? barColor;

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col">
      <div className="flex min-h-0 w-full min-w-0 gap-2">
        <div
          className="flex w-7 shrink-0 flex-col justify-between text-right text-base-small text-text-tertiary tabular-nums"
          style={{ height }}
          aria-hidden
        >
          {[...yTicks].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div
          ref={plotRef}
          className={
            brushEnabled
              ? "relative min-h-0 min-w-0 flex-1 cursor-crosshair overflow-hidden touch-none select-none"
              : "relative min-h-0 min-w-0 flex-1 overflow-hidden"
          }
          style={{ height }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishBrush}
          onPointerCancel={() => {
            brushDragRef.current = null;
            setBrushOverlay(null);
          }}
        >
          {brushOverlay ? (
            <div
              className="pointer-events-none absolute inset-y-0 z-10 border border-interactive-active bg-interactive-active/15"
              style={{
                left: Math.min(brushOverlay.startX, brushOverlay.currentX),
                width: Math.abs(brushOverlay.currentX - brushOverlay.startX),
              }}
              aria-hidden
            />
          ) : null}
          <svg
            viewBox={`0 0 ${PLOT_VIEW_WIDTH} ${height}`}
            preserveAspectRatio="none"
            className="pointer-events-none block h-full w-full"
            role="img"
            aria-label={ariaLabel}
          >
            {yTicks.map((tick) => (
              <line
                key={tick}
                x1={0}
                y1={toY(tick)}
                x2={PLOT_VIEW_WIDTH}
                y2={toY(tick)}
                stroke="var(--color-datavis-gridlines)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {spikeCenterX != null ? (
              <rect
                x={spikeCenterX - 36}
                y={0}
                width={72}
                height={height}
                fill="var(--color-feedback-negative)"
                opacity={0.14}
                aria-hidden
              />
            ) : null}

            {bars.map((bar) => (
              <rect
                key={bar.index}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                rx={2}
                fill={barFill(bar.index)}
                className="opacity-95"
              />
            ))}

            {spikeCenterX != null ? (
              <line
                x1={spikeCenterX}
                y1={0}
                x2={spikeCenterX}
                y2={height}
                stroke="var(--color-feedback-negative)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                aria-hidden
              />
            ) : null}
          </svg>
        </div>
      </div>

      <div className="mt-3 shrink-0 pl-9">
        <div className="h-px shrink-0 bg-datavis-gridlines" aria-hidden />
      </div>

      <div className="flex shrink-0 gap-2">
        <div className="w-7 shrink-0" aria-hidden />
        <div className="relative min-w-0 flex-1 pt-2">
          <div className="flex justify-between text-base-small text-text-tertiary">
            {xLabels.map((label) => (
              <span key={label} className="shrink-0 tabular-nums first:text-left last:text-right">
                {label}
              </span>
            ))}
          </div>
          {spikeCenterX != null && spikeLabel ? (
            <p
              className="pointer-events-none absolute top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-base-small font-semibold text-feedback-negative"
              style={{ left: `${((spikeHighlight!.index + 0.5) / Math.max(values.length, 1)) * 100}%` }}
            >
              {spikeLabel}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
