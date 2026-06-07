import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type UseResizableColumnsOptions = {
  selectColWidth: number;
  colDefaults: readonly number[];
  colMins: readonly number[];
  minTableWidth?: number;
};

export function useResizableColumns({
  selectColWidth,
  colDefaults,
  colMins,
  minTableWidth = 720,
}: UseResizableColumnsOptions) {
  const [colWidths, setColWidths] = useState<number[]>(() => [...colDefaults]);
  const [hasManualWidths, setHasManualWidths] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ columnIndex: number; startX: number; startWidths: number[] } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseTotal = useMemo(
    () => selectColWidth + colWidths.slice(1).reduce((a, b) => a + b, 0),
    [colWidths, selectColWidth],
  );

  const displayWidths = useMemo(() => {
    const resizableWidths = colWidths.slice(1);
    const resizableBaseTotal = resizableWidths.reduce((a, b) => a + b, 0);

    if (hasManualWidths || containerWidth <= 0 || containerWidth <= baseTotal) {
      return [selectColWidth, ...resizableWidths];
    }

    const scale = (containerWidth - selectColWidth) / resizableBaseTotal;
    return [selectColWidth, ...resizableWidths.map((w) => w * scale)];
  }, [colWidths, containerWidth, baseTotal, hasManualWidths, selectColWidth]);

  const tableFillsContainer = !hasManualWidths && containerWidth > 0 && containerWidth >= baseTotal;

  const colStyle = (i: number): CSSProperties => ({
    width: displayWidths[i],
    minWidth: displayWidths[i],
    ...(i === 0 ? { maxWidth: selectColWidth } : {}),
  });

  const onResizePointerDown = (columnIndex: number) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    let startWidths = displayWidths;
    if (!hasManualWidths) {
      const materialized = [selectColWidth, ...displayWidths.slice(1)];
      setColWidths(materialized);
      setHasManualWidths(true);
      startWidths = materialized;
    }

    dragRef.current = { columnIndex, startX: e.clientX, startWidths: [...startWidths] };
    setIsResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onResizePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;

    const delta = e.clientX - d.startX;
    const col = d.columnIndex;
    const lastCol = d.startWidths.length - 1;

    setColWidths((prev) => {
      const next = [...prev];

      if (col === 0) {
        next[1] = Math.max(d.startWidths[1]! - delta, colMins[1]!);
        return next;
      }

      if (col === lastCol) {
        next[col] = Math.max(d.startWidths[col]! + delta, colMins[col]!);
        return next;
      }

      const right = col + 1;
      const minL = colMins[col]!;
      const minR = colMins[right]!;
      const sum = d.startWidths[col]! + d.startWidths[right]!;
      const nextLeft = Math.min(Math.max(d.startWidths[col]! + delta, minL), sum - minR);
      next[col] = nextLeft;
      next[right] = sum - nextLeft;
      return next;
    });
  };

  const endResize = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    setIsResizing(false);
  };

  const resizeHandle = (columnIndex: number) => (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Resize column"
      className={cx(
        "group/resize absolute -right-1.5 top-0 z-10 h-full w-3 cursor-col-resize touch-none border-0 bg-transparent p-0",
        "hover:bg-overlay-subtle active:bg-overlay-subtle",
      )}
      onPointerDown={onResizePointerDown(columnIndex)}
      onPointerMove={onResizePointerMove}
      onPointerUp={endResize}
      onPointerCancel={endResize}
      onLostPointerCapture={() => {
        dragRef.current = null;
        setIsResizing(false);
      }}
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/resize:bg-interactive-active group-active/resize:bg-interactive-active"
        aria-hidden
      />
    </button>
  );

  return {
    containerRef,
    colStyle,
    baseTotal,
    tableFillsContainer,
    isResizing,
    resizeHandle,
    displayWidths,
    minTableWidth,
  };
}
