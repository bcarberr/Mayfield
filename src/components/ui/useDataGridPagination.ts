import { useEffect, useMemo, useState } from "react";
import {
  DATA_GRID_DEFAULT_PAGE_SIZE,
  DATA_GRID_PAGE_SIZE_OPTIONS,
} from "./dataGridPaginationConfig";
import {
  getInitialDataGridPageSize,
  useDataGridPageSizePreference,
} from "./useDataGridPageSizePreference";

export {
  DATA_GRID_DEFAULT_PAGE_SIZE,
  DATA_GRID_MAX_PAGE_SIZE,
  DATA_GRID_MIN_PAGE_SIZE,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  DATA_GRID_PAGE_SIZE_STEP,
} from "./dataGridPaginationConfig";

export type DataGridPaginationConfig = {
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[];
  /** When set, page index is controlled externally (e.g. session-persisted search results). */
  page?: number;
  onPageChange?: (page: number) => void;
};

export function useDataGridPagination<T>(
  items: readonly T[],
  config?: DataGridPaginationConfig,
) {
  const pageSizeOptions = config?.pageSizeOptions ?? DATA_GRID_PAGE_SIZE_OPTIONS;
  const defaultPageSize = config?.defaultPageSize ?? DATA_GRID_DEFAULT_PAGE_SIZE;
  const resolvedDefault = pageSizeOptions.includes(defaultPageSize)
    ? defaultPageSize
    : pageSizeOptions[0];

  const { syncAllGrids, globalPageSize, setGlobalPageSize } = useDataGridPageSizePreference();

  const [internalPage, setInternalPage] = useState(0);
  const pageControlled = config?.page !== undefined && config.onPageChange !== undefined;
  const page = pageControlled ? config.page! : internalPage;
  const setPage = pageControlled ? config.onPageChange! : setInternalPage;
  const [pageSize, setPageSize] = useState(() => getInitialDataGridPageSize(resolvedDefault));
  const itemCount = items.length;

  useEffect(() => {
    if (syncAllGrids) {
      setPageSize(globalPageSize);
    }
  }, [syncAllGrids, globalPageSize]);

  useEffect(() => {
    setPage(0);
  }, [itemCount, pageSize]);

  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageStart = safePage * pageSize;
  const pagedItems = useMemo(
    () => items.slice(pageStart, pageStart + pageSize),
    [items, pageStart, pageSize],
  );

  const handlePageSizeChange = (nextPageSize: number) => {
    if (!pageSizeOptions.includes(nextPageSize)) return;
    setPageSize(nextPageSize);
    if (syncAllGrids) {
      setGlobalPageSize(nextPageSize);
    }
  };

  return {
    page: safePage,
    setPage,
    pageCount,
    pagedItems,
    pageSize,
    setPageSize: handlePageSizeChange,
    pageSizeOptions,
    showPagination: itemCount > 0,
    showPageControls: pageCount > 1,
    itemCount,
  };
}
