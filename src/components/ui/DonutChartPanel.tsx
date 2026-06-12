import { useMemo, useRef, useState } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Figma `7671:8959` / donut `7671:9014` — 188px ring, 137px hole. */
export const DONUT_CHART_OUTER_PX = 188;
export const DONUT_CHART_INNER_PX = 137;
const DONUT_CHART_INSET_PX = (DONUT_CHART_OUTER_PX - DONUT_CHART_INNER_PX) / 2;

export type DonutSegment = {
  label: string;
  color: string;
  value: number;
};

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function donutSegmentPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

export type DonutChartPanelProps = {
  segments: readonly DonutSegment[];
  total: number;
  centerLabel: string;
  selectedLabel?: string | null;
  onSegmentClick?: (label: string) => void;
  ariaLabel: string;
};

/** Figma `7671:9014` — interactive donut with legend (Top Findings Detection pattern). */
export function DonutChartPanel({
  segments,
  total,
  centerLabel,
  selectedLabel = null,
  onSegmentClick,
  ariaLabel,
}: DonutChartPanelProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const isChartSegmentDimmed = (label: string) => {
    if (hoveredLabel != null) return hoveredLabel !== label;
    if (selectedLabel != null) return selectedLabel !== label;
    return false;
  };

  const linkClass = (label: string) =>
    cx(
      "flex w-full items-start gap-2.5 rounded-[4px] text-left text-sm font-semibold transition-colors hover:text-interactive-active hover:underline",
      selectedLabel === label ? "text-interactive-active underline" : "text-text-primary",
    );

  const updateTooltipPos = (event: React.MouseEvent) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const clearHover = () => {
    setHoveredLabel(null);
    setTooltipPos(null);
  };

  const sortedSegments = useMemo(() => [...segments].sort((a, b) => b.value - a.value), [segments]);

  const arcs = useMemo(() => {
    const cxPos = DONUT_CHART_OUTER_PX / 2;
    const cyPos = DONUT_CHART_OUTER_PX / 2;
    const outerR = DONUT_CHART_OUTER_PX / 2;
    const innerR = DONUT_CHART_INNER_PX / 2;
    let angle = 0;

    return sortedSegments.map((segment) => {
      const sweep = total > 0 ? (segment.value / total) * 360 : 0;
      const startAngle = angle;
      const endAngle = angle + sweep;
      angle = endAngle;

      return {
        ...segment,
        percent: total > 0 ? Math.round((segment.value / total) * 100) : 0,
        path: donutSegmentPath(cxPos, cyPos, innerR, outerR, startAngle, endAngle),
      };
    });
  }, [sortedSegments, total]);

  const hovered = arcs.find((segment) => segment.label === hoveredLabel);
  const interactive = Boolean(onSegmentClick);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-start">
      <div
        ref={chartRef}
        className="relative shrink-0"
        style={{ width: DONUT_CHART_OUTER_PX, height: DONUT_CHART_OUTER_PX }}
      >
        {hovered && tooltipPos ? (
          <div
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded bg-[#424242] px-2 py-1 text-xs font-semibold text-[#f5f5f5] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            style={{
              left: tooltipPos.x + 12,
              top: tooltipPos.y,
              transform: "translateY(calc(-100% - 8px))",
            }}
          >
            {hovered.percent}% {hovered.label}
          </div>
        ) : null}
        <svg
          width={DONUT_CHART_OUTER_PX}
          height={DONUT_CHART_OUTER_PX}
          viewBox={`0 0 ${DONUT_CHART_OUTER_PX} ${DONUT_CHART_OUTER_PX}`}
          role="img"
          aria-label={ariaLabel}
          onMouseLeave={clearHover}
        >
          {arcs.map((segment) => {
            const selected = selectedLabel === segment.label;

            return (
              <path
                key={segment.label}
                d={segment.path}
                fill={segment.color}
                className={cx(
                  interactive && "cursor-pointer transition-opacity duration-150",
                  isChartSegmentDimmed(segment.label) ? "opacity-60" : "opacity-100",
                )}
                aria-label={interactive ? `Filter by ${segment.label}` : segment.label}
                aria-pressed={interactive ? selected : undefined}
                onMouseEnter={
                  interactive
                    ? (event) => {
                        setHoveredLabel(segment.label);
                        updateTooltipPos(event);
                      }
                    : undefined
                }
                onMouseMove={interactive ? updateTooltipPos : undefined}
                onClick={interactive ? () => onSegmentClick!(segment.label) : undefined}
              />
            );
          })}
        </svg>
        <div
          className="pointer-events-none absolute flex flex-col items-center justify-center rounded-full bg-datavis-card-bg text-center text-text-primary"
          style={{ inset: DONUT_CHART_INSET_PX }}
        >
          <span className="text-2xl font-normal leading-8 tracking-[0.7px] tabular-nums">
            {total.toLocaleString()}
          </span>
          <span className="text-2xl font-normal leading-8 tracking-[0.7px]">{centerLabel}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-3">
        {arcs.map((segment) => (
          <li key={segment.label}>
            {interactive ? (
              <button
                type="button"
                className={linkClass(segment.label)}
                aria-pressed={selectedLabel === segment.label}
                onClick={() => onSegmentClick!(segment.label)}
              >
                <span
                  className="mt-1 size-3.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden
                />
                <span>{segment.label}</span>
              </button>
            ) : (
              <span className="flex w-full items-start gap-2.5 text-sm font-semibold text-text-primary">
                <span
                  className="mt-1 size-3.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden
                />
                <span>{segment.label}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
