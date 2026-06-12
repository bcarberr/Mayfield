import { useMemo } from "react";
import { cx } from "./datavisCard";

type TimeSeriesSpikeHighlight = {
  index: number;
  label?: string;
};

type TimeSeriesBarChartProps = {
  values: readonly number[];
  xLabels: readonly string[];
  barColor: string;
  yMax?: number;
  yTicks?: readonly number[];
  height?: number;
  ariaLabel: string;
  spikeHighlight?: TimeSeriesSpikeHighlight;
};

const PLOT_VIEW_WIDTH = 1000;

/** Vertical bar time-series — datavis gridlines with optional spike callout. */
export function TimeSeriesBarChart({
  values,
  xLabels,
  barColor,
  yMax: yMaxProp,
  yTicks: yTicksProp,
  height = 140,
  ariaLabel,
  spikeHighlight,
}: TimeSeriesBarChartProps) {
  const yMax = yMaxProp ?? Math.max(...values, 1);
  const yTicks = yTicksProp ?? [0, Math.round(yMax / 4), Math.round(yMax / 2), Math.round((yMax * 3) / 4), yMax];

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

        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden" style={{ height }}>
          <svg
            viewBox={`0 0 ${PLOT_VIEW_WIDTH} ${height}`}
            preserveAspectRatio="none"
            className="block h-full w-full"
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
                fill={barColor}
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
            {xLabels.map((label, index) => (
              <span
                key={label}
                className={cx(
                  "shrink-0 tabular-nums first:text-left last:text-right",
                  spikeHighlight?.index === index && "font-semibold text-interactive-active",
                )}
              >
                {label}
              </span>
            ))}
          </div>
          {spikeCenterX != null && spikeLabel ? (
            <p
              className="pointer-events-none absolute top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-base-small font-semibold text-interactive-active"
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
