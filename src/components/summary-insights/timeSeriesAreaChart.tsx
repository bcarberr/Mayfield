import { useCallback, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { SeverityShapeIconName } from "../../design-system";
import { cx } from "./datavisCard";
import {
  formatTimeSeriesHoverLabel,
  nearestTimeSeriesIndex,
  seriesForHoverLegend,
  timeSeriesCrosshairPercent,
  TimeSeriesHoverRow,
  TimeSeriesHoverTooltip,
} from "./timeSeriesChartHover";
import { buildDayBoundaryMarkers, buildDayLabelPositions, niceIntegerYTicks } from "./timeframeChartUtils";
import type { TimeSeriesBrushSelection } from "./timeSeriesBarChart";

export type TimeSeriesSeries = {
  id: string;
  label: string;
  color: string;
  icon?: SeverityShapeIconName;
  values: readonly number[];
};

type TimeSeriesSpikeHighlight = {
  /** Hour index in `xLabels` where the spike occurs. */
  index: number;
  /** Defaults to `spike ~{xLabels[index]}`. */
  label?: string;
};

type TimeSeriesAreaChartProps = {
  series: readonly TimeSeriesSeries[];
  xLabels: readonly string[];
  /** Max Y-axis value; defaults to stacked peak across all points. */
  yMax?: number;
  yTicks?: readonly number[];
  /** Plot area height in px; axis labels and legend sit outside this. */
  height?: number;
  ariaLabel: string;
  /** @deprecated Prefer `selectedSeriesIds` for multi-select legend filters. */
  selectedSeriesId?: string | null;
  /** Active legend filters; empty/omitted shows all series. Supports multi-select. */
  selectedSeriesIds?: readonly string[] | null;
  onSeriesClick?: (seriesId: string) => void;
  /** Vertical band + x-axis callout for an anomalous peak. */
  spikeHighlight?: TimeSeriesSpikeHighlight;
  /** Override default x-axis tick indices (e.g. `[0, 6, 12, 18, 23]`). */
  xTickIndices?: readonly number[];
  /** Labels paired with `xTickIndices`; falls back to `xLabels[index]`. */
  xTickLabels?: readonly string[];
  /** Bucket start timestamps — enables midnight day-boundary markers. */
  bucketStarts?: readonly Date[];
  /** When set, drag on the plot to select a range and zoom in. */
  onBrushCommit?: (selection: TimeSeriesBrushSelection) => void;
  /** Stacked bar (default for severity timelines) or stacked area. */
  mode?: "stacked-bar" | "area";
};

const MIN_BRUSH_WIDTH_PX = 8;

const PLOT_VIEW_WIDTH = 1000;

function buildAreaPath(
  topValues: readonly number[],
  bottomValues: readonly number[],
  plotWidth: number,
  plotHeight: number,
  yMax: number,
): string {
  if (topValues.length === 0) return "";

  const xStep = plotWidth / Math.max(topValues.length - 1, 1);
  const toY = (v: number) => plotHeight - (v / yMax) * plotHeight;

  const topPoints = topValues.map((v, i) => {
    const x = i * xStep;
    return `${x},${toY(v)}`;
  });
  const bottomPoints = bottomValues
    .map((v, i) => {
      const x = i * xStep;
      return `${x},${toY(v)}`;
    })
    .reverse();

  return `M ${topPoints.join(" L ")} L ${bottomPoints.join(" L ")} Z`;
}

/** Stacked area time-series — datavis gridlines and severity-friendly series. */
function plotX(index: number, pointCount: number, plotWidth = PLOT_VIEW_WIDTH) {
  return (index / Math.max(pointCount - 1, 1)) * plotWidth;
}

export function TimeSeriesAreaChart({
  series,
  xLabels,
  yMax: yMaxProp,
  yTicks: yTicksProp,
  height = 140,
  ariaLabel,
  selectedSeriesId = null,
  selectedSeriesIds = null,
  onSeriesClick,
  spikeHighlight,
  xTickIndices: xTickIndicesProp,
  xTickLabels,
  bucketStarts,
  onBrushCommit,
  mode = "stacked-bar",
}: TimeSeriesAreaChartProps) {
  const gradientId = useId();
  const plotRef = useRef<HTMLDivElement>(null);
  const brushDragRef = useRef<{ pointerId: number; startX: number; currentX: number } | null>(null);
  const [brushOverlay, setBrushOverlay] = useState<{ startX: number; currentX: number } | null>(null);
  const [hover, setHover] = useState<{ index: number; plotX: number } | null>(null);
  const brushEnabled = onBrushCommit != null;
  const bucketCount = xLabels.length;
  const hoverMode = mode === "stacked-bar" ? "bar" : "area";
  const isStackedBar = mode === "stacked-bar";
  const dayBoundaryMarkers = useMemo(
    () => (bucketStarts ? buildDayBoundaryMarkers(bucketStarts.map((start) => ({ start }))) : []),
    [bucketStarts],
  );
  const dayLabelPositions = useMemo(
    () => buildDayLabelPositions(dayBoundaryMarkers, bucketCount),
    [dayBoundaryMarkers, bucketCount],
  );
  const multiDayAxis = dayLabelPositions.length > 0;

  const bucketBoundaryX = useCallback(
    (index: number) => (index / Math.max(bucketCount, 1)) * PLOT_VIEW_WIDTH,
    [bucketCount],
  );

  const clientXToPlotX = useCallback((clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    return Math.max(0, Math.min(rect.width, clientX - rect.left));
  }, []);

  const plotXToIndex = useCallback(
    (x: number, edge: "start" | "end") => {
      const rect = plotRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || bucketCount === 0) return 0;

      const ratio = Math.max(0, Math.min(1, x / rect.width));
      if (edge === "end") {
        if (ratio >= 1) return bucketCount - 1;
        return Math.min(bucketCount - 1, Math.max(0, Math.ceil(ratio * bucketCount) - 1));
      }

      return Math.min(bucketCount - 1, Math.max(0, Math.floor(ratio * bucketCount)));
    },
    [bucketCount],
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

  const updateHover = useCallback((clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover(nearestTimeSeriesIndex(clientX, rect, bucketCount, hoverMode));
  }, [bucketCount, hoverMode]);

  const clearHover = useCallback(() => setHover(null), []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!brushEnabled) return;
    event.preventDefault();
    clearHover();
    const x = clientXToPlotX(event.clientX);
    brushDragRef.current = { pointerId: event.pointerId, startX: x, currentX: x };
    setBrushOverlay({ startX: x, currentX: x });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = brushDragRef.current;
    if (drag && event.pointerId === drag.pointerId) {
      const x = clientXToPlotX(event.clientX);
      brushDragRef.current = { ...drag, currentX: x };
      setBrushOverlay({ startX: drag.startX, currentX: x });
      return;
    }

    updateHover(event.clientX);
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

  const selectedIdSet = useMemo(() => {
    if (selectedSeriesIds != null) return new Set(selectedSeriesIds);
    if (selectedSeriesId != null) return new Set([selectedSeriesId]);
    return new Set<string>();
  }, [selectedSeriesIds, selectedSeriesId]);

  const visibleSeries = useMemo(
    () => (selectedIdSet.size > 0 ? series.filter((s) => selectedIdSet.has(s.id)) : series),
    [series, selectedIdSet],
  );

  const stackedTotals = useMemo(() => {
    const len = xLabels.length;
    return Array.from({ length: len }, (_, i) =>
      visibleSeries.reduce((sum, s) => sum + (s.values[i] ?? 0), 0),
    );
  }, [visibleSeries, xLabels.length]);

  const legendSeries = useMemo(() => seriesForHoverLegend(series), [series]);
  const hoverLegendSeries = useMemo(() => seriesForHoverLegend(visibleSeries), [visibleSeries]);

  const stackedPeak = Math.max(...stackedTotals, 1);
  const autoScale = niceIntegerYTicks(stackedPeak);
  const yMax = yMaxProp ?? autoScale.yMax;
  const yTicks = yTicksProp ?? (yMaxProp != null ? niceIntegerYTicks(yMaxProp).yTicks : autoScale.yTicks);

  const layers = useMemo(() => {
    const cumulative: number[] = new Array(xLabels.length).fill(0);

    return visibleSeries.map((s) => {
      const bottom = [...cumulative];
      const top = s.values.map((v, i) => {
        cumulative[i] += v;
        return cumulative[i];
      });
      return { ...s, bottom, top };
    });
  }, [visibleSeries, xLabels.length]);

  const xTickIndices = useMemo(() => {
    if (xTickIndicesProp) return xTickIndicesProp;
    if (xLabels.length <= 7) return xLabels.map((_, i) => i);
    const step = Math.floor((xLabels.length - 1) / 6);
    return Array.from({ length: 7 }, (_, i) => Math.min(i * step, xLabels.length - 1));
  }, [xLabels.length, xTickIndicesProp]);

  const spikeX = spikeHighlight
    ? isStackedBar
      ? ((spikeHighlight.index + 0.5) / Math.max(bucketCount, 1)) * PLOT_VIEW_WIDTH
      : plotX(spikeHighlight.index, xLabels.length)
    : null;
  const spikeLabel =
    spikeHighlight != null
      ? (spikeHighlight.label ?? `spike ~${xLabels[spikeHighlight.index] ?? ""}`)
      : null;

  const legendInteractive = Boolean(onSeriesClick);
  const filterActive = selectedIdSet.size > 0;

  const hoverIndex = hover?.index ?? null;
  const hoverCrosshairX =
    hoverIndex != null
      ? (timeSeriesCrosshairPercent(hoverIndex, bucketCount, hoverMode) / 100) * PLOT_VIEW_WIDTH
      : null;

  const legendItemClass = (seriesId: string) => {
    const selected = selectedIdSet.has(seriesId);
    const dimmed = filterActive && !selected;

    return cx(
      "inline-flex items-center gap-1.5 rounded-sm text-base-small transition-colors",
      legendInteractive && "group",
      selected
        ? "font-semibold text-text-primary"
        : dimmed
          ? "text-text-disabled group-hover:font-semibold group-hover:text-text-primary"
          : "text-text-tertiary group-hover:font-semibold group-hover:text-text-primary",
    );
  };

  return (
    <div className="flex min-h-0 w-full min-w-0 shrink-0 flex-col pb-2">
      <div className="flex min-h-0 w-full min-w-0 gap-2">
        <div
          className="flex w-7 shrink-0 flex-col justify-between text-right text-base-small text-text-tertiary tabular-nums"
          style={{ height }}
          aria-hidden
        >
          {[...yTicks].reverse().map((tick, index) => (
            <span key={`y-${tick}-${index}`}>{tick}</span>
          ))}
        </div>

        <div
          ref={plotRef}
          className={
            brushEnabled
              ? "relative min-h-0 min-w-0 flex-1 cursor-crosshair overflow-hidden touch-none select-none"
              : "relative min-h-0 min-w-0 flex-1 cursor-crosshair overflow-hidden"
          }
          style={{ height }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishBrush}
          onPointerLeave={clearHover}
          onPointerCancel={() => {
            brushDragRef.current = null;
            setBrushOverlay(null);
            clearHover();
          }}
        >
          {hover && !brushOverlay ? (
            <TimeSeriesHoverTooltip
              plotX={hover.plotX}
              timeLabel={formatTimeSeriesHoverLabel(hover.index, xLabels, bucketStarts)}
            >
              {hoverLegendSeries.map((s) => (
                <TimeSeriesHoverRow
                  key={s.id}
                  label={s.label}
                  value={s.values[hover.index] ?? 0}
                  color={s.color}
                />
              ))}
            </TimeSeriesHoverTooltip>
          ) : null}
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
            <defs>
              {!isStackedBar
                ? layers.map((layer) => (
                    <linearGradient key={layer.id} id={`${gradientId}-${layer.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={layer.color} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={layer.color} stopOpacity={0.12} />
                    </linearGradient>
                  ))
                : null}
            </defs>

            {yTicks.map((tick, index) => {
              const y = height - (tick / yMax) * height;
              return (
                <line
                  key={`grid-${tick}-${index}`}
                  x1={0}
                  y1={y}
                  x2={PLOT_VIEW_WIDTH}
                  y2={y}
                  stroke="var(--color-datavis-gridlines)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {dayBoundaryMarkers.map((marker) => (
              <line
                key={`day-${marker.index}`}
                x1={bucketBoundaryX(marker.index)}
                y1={0}
                x2={bucketBoundaryX(marker.index)}
                y2={height}
                stroke="var(--color-datavis-gridlines)"
                strokeWidth={1}
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
                aria-hidden
              />
            ))}

            {spikeX != null ? (
              <rect
                x={
                  isStackedBar
                    ? spikeX - PLOT_VIEW_WIDTH / Math.max(bucketCount, 1) / 2
                    : spikeX - 18
                }
                y={0}
                width={isStackedBar ? PLOT_VIEW_WIDTH / Math.max(bucketCount, 1) : 36}
                height={height}
                fill="var(--color-feedback-negative)"
                opacity={0.14}
                aria-hidden
              />
            ) : null}

            {isStackedBar
              ? Array.from({ length: bucketCount }, (_, bucketIndex) => {
                  const slotWidth = PLOT_VIEW_WIDTH / Math.max(bucketCount, 1);
                  const barWidth = slotWidth * 0.72;
                  const barX = bucketIndex * slotWidth + (slotWidth - barWidth) / 2;

                  return layers.map((layer) => {
                    const value = layer.values[bucketIndex] ?? 0;
                    if (value <= 0) return null;
                    const stackedBottom = layer.bottom[bucketIndex] ?? 0;
                    const stackedTop = layer.top[bucketIndex] ?? 0;
                    const yTop = height - (stackedTop / yMax) * height;
                    const yBottom = height - (stackedBottom / yMax) * height;
                    const barHeight = Math.max(0, yBottom - yTop);

                    return (
                      <rect
                        key={`${layer.id}-${bucketIndex}`}
                        x={barX}
                        y={yTop}
                        width={barWidth}
                        height={barHeight}
                        fill={layer.color}
                      />
                    );
                  });
                })
              : layers.map((layer) => (
                  <path
                    key={layer.id}
                    d={buildAreaPath(layer.top, layer.bottom, PLOT_VIEW_WIDTH, height, yMax)}
                    fill={`url(#${gradientId}-${layer.id})`}
                    stroke={layer.color}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}

            {hoverCrosshairX != null ? (
              <line
                x1={hoverCrosshairX}
                y1={0}
                x2={hoverCrosshairX}
                y2={height}
                stroke="var(--color-text-primary)"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.45}
                vectorEffect="non-scaling-stroke"
                aria-hidden
              />
            ) : null}

            {hoverIndex != null
              ? layers.map((layer) => {
                  const value = layer.values[hoverIndex] ?? 0;
                  if (value <= 0) return null;
                  const stackedBottom = layer.bottom[hoverIndex] ?? 0;
                  const stackedTop = layer.top[hoverIndex] ?? 0;
                  const markerY = height - ((stackedBottom + (stackedTop - stackedBottom) / 2) / yMax) * height;
                  return (
                    <circle
                      key={`hover-${layer.id}`}
                      cx={hoverCrosshairX ?? 0}
                      cy={markerY}
                      r={3}
                      fill={layer.color}
                      stroke="var(--color-surface-container)"
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                      aria-hidden
                    />
                  );
                })
              : null}

            {spikeX != null ? (
              <line
                x1={spikeX}
                y1={0}
                x2={spikeX}
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
          {multiDayAxis ? (
            <>
              <div className="relative mb-1 h-4">
                {dayLabelPositions.map((dayLabel) => (
                  <span
                    key={`day-label-${dayLabel.label}-${dayLabel.centerPercent}`}
                    className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap text-base-small text-text-tertiary"
                    style={{ left: `${dayLabel.centerPercent}%` }}
                  >
                    {dayLabel.label}
                  </span>
                ))}
              </div>
              <div className="flex justify-between text-base-small text-text-tertiary">
                {xTickIndices.map((i, tickIdx) => (
                  <span key={i} className="shrink-0 tabular-nums first:text-left last:text-right">
                    {xTickLabels?.[tickIdx] ?? xLabels[i]}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex justify-between text-base-small text-text-tertiary">
              {xTickIndices.map((i, tickIdx) => (
                <span key={i} className="shrink-0 tabular-nums first:text-left last:text-right">
                  {xTickLabels?.[tickIdx] ?? xLabels[i]}
                </span>
              ))}
            </div>
          )}
          {spikeX != null && spikeLabel ? (
            <p
              className="pointer-events-none absolute top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-base-small font-semibold text-feedback-negative"
              style={{
                left: `${
                  isStackedBar
                    ? ((spikeHighlight!.index + 0.5) / Math.max(bucketCount, 1)) * 100
                    : (spikeHighlight!.index / Math.max(xLabels.length - 1, 1)) * 100
                }%`,
              }}
            >
              {spikeLabel}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="mt-5 flex shrink-0 flex-wrap gap-x-3 gap-y-1 pl-9">
        {legendSeries.map((s) => {
          const marker = (
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
          );

          return (
            <li key={s.id}>
              {legendInteractive ? (
                <button
                  type="button"
                  aria-pressed={selectedIdSet.has(s.id)}
                  className={legendItemClass(s.id)}
                  onClick={() => onSeriesClick!(s.id)}
                >
                  {marker}
                  {s.label}
                </button>
              ) : (
                <span className={legendItemClass(s.id)}>
                  {marker}
                  {s.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
