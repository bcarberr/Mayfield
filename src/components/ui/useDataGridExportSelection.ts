import { useCallback, useState } from "react";

export function useDataGridExportSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [allResultsSelected, setAllResultsSelected] = useState(false);

  const toggleRow = useCallback((id: string, checked: boolean) => {
    setAllResultsSelected(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const togglePage = useCallback((pageIds: readonly string[], checked: boolean) => {
    setAllResultsSelected(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        pageIds.forEach((id) => next.add(id));
      } else {
        pageIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }, []);

  const selectAllResults = useCallback(() => {
    setAllResultsSelected(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setAllResultsSelected(false);
  }, []);

  return {
    selectedIds,
    allResultsSelected,
    toggleRow,
    togglePage,
    selectAllResults,
    clearSelection,
  };
}

export type DataGridExportSelectionSnapshot = {
  hasSelection: boolean;
  showPill: boolean;
  showPageBanner: boolean;
  showAllResultsBanner: boolean;
  exportCount: number;
  allSelectedOnPage: boolean;
  someSelectedOnPage: boolean;
};

export function getDataGridExportSelectionSnapshot(
  selectedIds: Set<string>,
  allResultsSelected: boolean,
  pageIds: readonly string[],
  totalFilteredCount: number,
  pageCount = Math.max(1, Math.ceil(totalFilteredCount / Math.max(pageIds.length, 1))),
): DataGridExportSelectionSnapshot {
  const pageRowCount = pageIds.length;
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id)).length;
  const allSelectedOnPage = pageRowCount > 0 && selectedOnPage === pageRowCount;
  const someSelectedOnPage = selectedOnPage > 0 && !allSelectedOnPage;
  const hasSelection = allResultsSelected || selectedIds.size > 0;
  const exportCount = allResultsSelected ? totalFilteredCount : selectedIds.size;
  const showPill = hasSelection;
  const hasMoreResultsBeyondPage = pageCount > 1 || totalFilteredCount > pageRowCount;
  const showPageBanner =
    allSelectedOnPage && !allResultsSelected && hasMoreResultsBeyondPage;
  const showAllResultsBanner = allResultsSelected;

  return {
    hasSelection,
    showPill,
    showPageBanner,
    showAllResultsBanner,
    exportCount,
    allSelectedOnPage,
    someSelectedOnPage,
  };
}

export function resolveExportRows<T extends { id: string }>(
  rows: readonly T[],
  selectedIds: Set<string>,
  allResultsSelected: boolean,
): T[] {
  if (allResultsSelected) return [...rows];
  if (selectedIds.size > 0) return rows.filter((row) => selectedIds.has(row.id));
  return [...rows];
}
