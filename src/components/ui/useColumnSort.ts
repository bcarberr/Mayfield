import { useCallback, useMemo, useState } from "react";

export type ColumnSortDirection = "asc" | "desc";

export type ColumnSortState<ColumnId extends string> = {
  column: ColumnId;
  direction: ColumnSortDirection;
} | null;

export function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function compareNumbers(a: number, b: number): number {
  return a - b;
}

export function compareBooleans(a: boolean, b: boolean): number {
  return Number(a) - Number(b);
}

export function compareByOrder<T>(getValue: (row: T) => string, order: Record<string, number>) {
  return (a: T, b: T) => (order[getValue(a)] ?? 99) - (order[getValue(b)] ?? 99);
}

export function compareFindings(a: number | "error" | "none", b: number | "error" | "none"): number {
  const value = (findings: number | "error" | "none") => {
    if (findings === "error") return Number.MAX_SAFE_INTEGER;
    if (findings === "none") return -1;
    return findings;
  };
  return value(a) - value(b);
}

export function useColumnSort<Row, ColumnId extends string>(
  comparators: Record<ColumnId, (a: Row, b: Row) => number>,
) {
  const [sort, setSort] = useState<ColumnSortState<ColumnId> | null>(null);

  const sortedRows = useCallback(
    (rows: readonly Row[]) => {
      if (!sort) return [...rows];
      const compare = comparators[sort.column];
      const multiplier = sort.direction === "asc" ? 1 : -1;
      return [...rows].sort((a, b) => compare(a, b) * multiplier);
    },
    [sort, comparators],
  );

  const getSortProps = useCallback(
    (column: ColumnId) => ({
      sortable: true as const,
      sortDirection: (sort?.column === column ? sort.direction : null) as ColumnSortDirection | null,
      onSortToggle: () =>
        setSort((current) => {
          if (current?.column !== column) return { column, direction: "asc" };
          if (current.direction === "asc") return { column, direction: "desc" };
          return null;
        }),
    }),
    [sort],
  );

  const clearSort = useCallback(() => setSort(null), []);

  return useMemo(
    () => ({ sort, sortedRows, getSortProps, clearSort }),
    [sort, sortedRows, getSortProps, clearSort],
  );
}
