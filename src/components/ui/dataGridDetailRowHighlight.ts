const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export const DATA_GRID_DETAIL_ROW_ATTR = "data-grid-detail-row-id";

export function dataGridDetailRowClass(
  highlightedRowId: string | null | undefined,
  rowId: string,
) {
  return cx(
    "border-b border-datavis-gridlines hover:bg-overlay-subtle",
    highlightedRowId === rowId && "data-grid-detail-highlight-row",
  );
}

export function dataGridDetailRowProps(
  highlightedRowId: string | null | undefined,
  rowId: string,
) {
  return {
    className: dataGridDetailRowClass(highlightedRowId, rowId),
    [DATA_GRID_DETAIL_ROW_ATTR]: rowId,
  } as const;
}
