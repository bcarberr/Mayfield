import type { ReactNode } from "react";
import { DatavisGridlineRule } from "../summary-insights/datavisCard";
import { DataGridTableLayout } from "./DataGridTableLayout";
import {
  DATA_GRID_SECTION_CLASS,
  DATA_GRID_SECTION_HEADER_CLASS,
  DATA_GRID_TOOLBAR_STICKY_CLASS,
} from "./dataGridTableStyles";
import { useDataGridStickyToolbar } from "./useDataGridStickyToolbar";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

/** Section card with sticky title toolbar + filter rail + thead on page scroll. */
export function DataGridSection({
  header,
  selectionBanner,
  filterPanel,
  table,
  footer,
  className,
}: {
  header: ReactNode;
  /** Full-width banner below the header toolbar (e.g. bulk selection state). */
  selectionBanner?: ReactNode;
  filterPanel: ReactNode;
  table: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const { toolbarRef, sectionStyle } = useDataGridStickyToolbar();

  return (
    <section className={cx(DATA_GRID_SECTION_CLASS, className)} style={sectionStyle}>
      <div ref={toolbarRef} className={DATA_GRID_TOOLBAR_STICKY_CLASS}>
        <div className={DATA_GRID_SECTION_HEADER_CLASS}>{header}</div>
        {selectionBanner}
        <DatavisGridlineRule inset={false} />
      </div>
      <DataGridTableLayout filterPanel={filterPanel} table={table} footer={footer} />
    </section>
  );
}
