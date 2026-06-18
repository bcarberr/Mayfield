import type { ReactNode } from "react";
import { DataGridPagination } from "./DataGridPagination";
import { DATA_GRID_FILTER_ROW_CLASS } from "./dataGridTableStyles";
import { useDataGridPagination } from "./useDataGridPagination";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

/** Table body + filter rail row; pagination sits below at full card width. */
export function DataGridTableLayout({
  filterPanel,
  table,
  footer,
  className,
}: {
  filterPanel: ReactNode;
  table: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex min-h-0 flex-col bg-datavis-card-bg", className)}>
      <div className={DATA_GRID_FILTER_ROW_CLASS}>
        {filterPanel}
        <div className="relative min-h-0 min-w-0 flex-1">{table}</div>
      </div>
      {footer ? <div className="relative z-0 shrink-0 bg-datavis-card-bg">{footer}</div> : null}
    </div>
  );
}

export function DataGridPaginationFooter({
  grid,
}: {
  grid: ReturnType<typeof useDataGridPagination>;
}) {
  if (!grid.showPagination) return null;

  return (
    <DataGridPagination
      page={grid.page}
      pageCount={grid.pageCount}
      itemCount={grid.itemCount}
      pageSize={grid.pageSize}
      pageSizeOptions={grid.pageSizeOptions}
      showPageControls={grid.showPageControls}
      onPageChange={grid.setPage}
      onPageSizeChange={grid.setPageSize}
    />
  );
}
