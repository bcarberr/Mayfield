import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefCallback,
} from "react";

export type ExpandableColumnWidgetsApi<T extends string> = {
  expandedIds: readonly T[];
  collapsedIds: readonly T[];
  isExpanded: (id: T) => boolean;
  toggle: (id: T) => void;
  setRef: (id: T, node: HTMLDivElement | null) => void;
  heightStyle: (id: T, expanded: boolean) => CSSProperties | undefined;
};

/** Multi-expand column widgets: lock height, stack full-width under the timeline in order. */
export function useExpandableColumnWidgets<T extends string>(
  order: readonly T[],
): ExpandableColumnWidgetsApi<T> {
  const [expanded, setExpanded] = useState<ReadonlySet<T>>(() => new Set());
  const [heights, setHeights] = useState<Partial<Record<T, number>>>({});
  const refs = useRef<Partial<Record<T, HTMLDivElement | null>>>({});

  const toggle = useCallback(
    (id: T) => {
      if (expanded.has(id)) {
        setExpanded((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        setHeights((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        return;
      }
      const height = refs.current[id]?.getBoundingClientRect().height;
      setExpanded((current) => new Set(current).add(id));
      setHeights((current) => ({
        ...current,
        [id]: height != null && height > 0 ? Math.round(height) : current[id],
      }));
    },
    [expanded],
  );

  const setRef = useCallback((id: T, node: HTMLDivElement | null) => {
    refs.current[id] = node;
  }, []);

  const heightStyle = useCallback(
    (id: T, isExpanded: boolean): CSSProperties | undefined => {
      if (!isExpanded) return undefined;
      const height = heights[id];
      return height != null ? { height } : undefined;
    },
    [heights],
  );

  return {
    expandedIds: order.filter((id) => expanded.has(id)),
    collapsedIds: order.filter((id) => !expanded.has(id)),
    isExpanded: (id) => expanded.has(id),
    toggle,
    setRef,
    heightStyle,
  };
}

export function ExpandableColumnWidgetShell<T extends string>({
  id,
  expanded,
  api,
  children,
}: {
  id: T;
  expanded: boolean;
  api: Pick<ExpandableColumnWidgetsApi<T>, "setRef" | "heightStyle">;
  children: ReactNode;
}) {
  const setRef = api.setRef;
  const ref = useCallback<RefCallback<HTMLDivElement>>(
    (node) => {
      setRef(id, node);
    },
    [setRef, id],
  );

  return (
    <div ref={ref} className="flex min-h-0 min-w-0 flex-col" style={api.heightStyle(id, expanded)}>
      {children}
    </div>
  );
}

export function ExpandableColumnWidgetLayout<T extends string>({
  expandedIds,
  collapsedIds,
  renderWidget,
}: {
  expandedIds: readonly T[];
  collapsedIds: readonly T[];
  renderWidget: (id: T, expanded: boolean) => ReactNode;
}) {
  return (
    <>
      {expandedIds.length > 0 ? (
        <div className="flex min-h-0 shrink-0 flex-col gap-4">
          {expandedIds.map((id) => renderWidget(id, true))}
        </div>
      ) : null}
      {collapsedIds.length > 0 ? (
        <div className="grid min-h-0 shrink-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          {collapsedIds.map((id) => renderWidget(id, false))}
        </div>
      ) : null}
    </>
  );
}
