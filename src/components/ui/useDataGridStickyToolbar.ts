import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { dataGridStickySectionStyle } from "./dataGridTableStyles";

/** Measures sticky toolbar height and returns CSS vars for filter rail + thead offsets. */
export function useDataGridStickyToolbar(): {
  toolbarRef: RefObject<HTMLDivElement | null>;
  sectionStyle: CSSProperties;
} {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  useLayoutEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;

    const update = () => setToolbarHeight(el.getBoundingClientRect().height);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { toolbarRef, sectionStyle: dataGridStickySectionStyle(toolbarHeight) };
}
