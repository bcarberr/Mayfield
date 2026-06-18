import { useMemo } from "react";
import { useColumnSort } from "./useColumnSort";
import { useDataGridPagination, type DataGridPaginationConfig } from "./useDataGridPagination";

export function useSortedDataGridPagination<T, SortColumn extends string>(
  rows: readonly T[],
  sortComparators: Record<SortColumn, (a: T, b: T) => number>,
  config?: DataGridPaginationConfig,
) {
  const { sortedRows, getSortProps } = useColumnSort(sortComparators);
  const sorted = useMemo(() => sortedRows(rows), [rows, sortedRows]);
  const pagination = useDataGridPagination(sorted, config);

  return {
    getSortProps,
    displayRows: pagination.pagedItems,
    ...pagination,
  };
}
