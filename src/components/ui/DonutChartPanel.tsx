import { useMemo, useRef, useState } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Figma `7671:8959` / donut `7671:9014` — 188px ring, 137px hole. */
export const DONUT_CHART_OUTER_PX = 188;
export const DONUT_CHART_INNER_PX = 137;
const DONUT_CHART_COMPACT_OUTER_PX = 148;
const DONUT_CHART_COMPACT_INNER_PX = 108;

export type DonutSegment = {
  label: string;
  color: string;
  value: number;
};

function polarToCartesian(centerX: number, centerY: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: centerX + radius * Math.cos(rad), y: centerY + radius * Math.sin(rad) };
}

function donutSegmentPath(
  centerX: number,
  centerY: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
) {
  const sweep = endAngle - startAngle;
  if (sweep <= 0) return "";

  // SVG arcs cannot draw a full 360° from a point back to itself — split into two halves.
  if (sweep >= 359.999) {
    const midAngle = startAngle + 180;
    const outerStart = polarToCartesian(centerX, centerY, outerR, startAngle);
    const outerMid = polarToCartesian(centerX, centerY, outerR, midAngle);
    const innerStart = polarToCartesian(centerX, centerY, innerR, startAngle);
    const innerMid = polarToCartesian(centerX, centerY, innerR, midAngle);

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 1 1 ${outerMid.x} ${outerMid.y}`,
      `A ${outerR} ${outerR} 0 1 1 ${outerStart.x} ${outerStart.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerR} ${innerR} 0 1 0 ${innerMid.x} ${innerMid.y}`,
      `A ${innerR} ${innerR} 0 1 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  }

  const largeArc = sweep > 180 ? 1 : 0;
  const outerStart = polarToCartesian(centerX, centerY, outerR, startAngle);
  const outerEnd = polarToCartesian(centerX, centerY, outerR, endAngle);
  const innerStart = polarToCartesian(centerX, centerY, innerR, endAngle);
  const innerEnd = polarToCartesian(centerX, centerY, innerR, startAngle);

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
  /** Multi-select highlight; when provided, takes precedence over `selectedLabel`. */
  selectedLabels?: readonly string[] | null;
  onSegmentClick?: (label: string) => void;
  ariaLabel: string;
  size?: "default" | "compact";
};

/** Figma `7671:9014` — interactive donut with legend (Top Findings Detection pattern). */
export function DonutChartPanel({
  segments,
  total,
  centerLabel,
  selectedLabel = null,
  selectedLabels,
  onSegmentClick,
  ariaLabel,
  size = "default",
}: DonutChartPanelProps) {
  const compact = size === "compact";
  const outerPx = compact ? DONUT_CHART_COMPACT_OUTER_PX : DONUT_CHART_OUTER_PX;
  const innerPx = compact ? DONUT_CHART_COMPACT_INNER_PX : DONUT_CHART_INNER_PX;
  const insetPx = (outerPx - innerPx) / 2;
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const selectedSet =
    selectedLabels != null
      ? new Set(selectedLabels)
      : selectedLabel != null
        ? new Set([selectedLabel])
        : null;

  const isSelected = (label: string) => selectedSet != null && selectedSet.has(label);

  const isChartSegmentDimmed = (label: string) => {
    if (hoveredLabel != null) return hoveredLabel !== label;
    if (selectedSet != null && selectedSet.size > 0) return !selectedSet.has(label);
    return false;
  };

  const linkClass = (label: string) =>
    cx(
      "flex w-full items-start gap-2.5 rounded-[4px] text-left text-sm font-semibold transition-colors hover:text-interactive-active hover:underline",
      isSelected(label) ? "text-interactive-active underline" : "text-text-primary",
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

  const sortedSegments = useMemo(
    () => [...segments].filter((segment) => segment.value > 0).sort((a, b) => b.value - a.value),
    [segments],
  );

  const arcs = useMemo(() => {
    const cxPos = outerPx / 2;
    const cyPos = outerPx / 2;
    const outerR = outerPx / 2;
    const innerR = innerPx / 2;
    // Always fill 360° from visible segments (top-N totals can be < center `total`).
    const segmentTotal = sortedSegments.reduce((sum, segment) => sum + segment.value, 0);
    let angle = 0;

    return sortedSegments.map((segment, index) => {
      const isLast = index === sortedSegments.length - 1;
      const startAngle = angle;
      // Snap the final segment to 360 so float error never leaves a visible gap.
      const endAngle =
        isLast && segmentTotal > 0
          ? 360
          : angle + (segmentTotal > 0 ? (segment.value / segmentTotal) * 360 : 0);
      angle = endAngle;

      return {
        ...segment,
        path: donutSegmentPath(cxPos, cyPos, innerR, outerR, startAngle, endAngle),
      };
    });
  }, [sortedSegments, outerPx, innerPx]);

  const hovered = arcs.find((segment) => segment.label === hoveredLabel);
  const interactive = Boolean(onSegmentClick);

  return (
    <div className={cx("flex flex-col items-center sm:flex-row sm:items-start", compact ? "gap-4" : "gap-6")}>
      <div
        ref={chartRef}
        className="relative shrink-0"
        style={{ width: outerPx, height: outerPx }}
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
            {hovered.value.toLocaleString()} {hovered.label}
          </div>
        ) : null}
        <svg
          width={outerPx}
          height={outerPx}
          viewBox={`0 0 ${outerPx} ${outerPx}`}
          role="img"
          aria-label={ariaLabel}
          onMouseLeave={clearHover}
        >
          {arcs.map((segment) => {
            const selected = isSelected(segment.label);

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
          style={{ inset: insetPx }}
        >
          <span
            className={cx(
              "font-normal tabular-nums tracking-[0.7px]",
              compact ? "text-xl leading-7" : "text-2xl leading-8",
            )}
          >
            {total.toLocaleString()}
          </span>
          <span className={cx("font-normal tracking-[0.7px]", compact ? "text-xl leading-7" : "text-2xl leading-8")}>
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className={cx("min-w-0 flex-1", compact ? "space-y-2" : "space-y-3")}>
        {arcs.map((segment) => (
          <li key={segment.label}>
            {interactive ? (
              <button
                type="button"
                className={linkClass(segment.label)}
                aria-pressed={isSelected(segment.label)}
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
