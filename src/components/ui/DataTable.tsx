import { type ReactNode } from "react";

export type DataTableColumn<Row> = {
  id: string;
  header: ReactNode;
  className?: string;
  cell: (row: Row) => ReactNode;
};

export type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Applied to wrapper */
  className?: string;
  /** Screen reader description of the table */
  caption?: string;
  /** Hide column header row (still announced via caption) */
  hideHeader?: boolean;
  /** Optional column sizing (e.g. colgroup for fixed layouts) */
  colgroup?: ReactNode;
  /** Grow rows to content height; cells stretch to match siblings in the row. */
  autoHeight?: boolean;
};

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  className = "",
  caption,
  hideHeader,
  colgroup,
  autoHeight = false,
}: DataTableProps<Row>) {
  const rowClass = autoHeight
    ? "min-h-[40px] hover:bg-surface-container/40"
    : "h-[40px] max-h-[40px] hover:bg-surface-container/40";
  const cellSizeClass = autoHeight ? "h-px min-h-[40px] py-2 align-top" : "h-[40px] max-h-[40px] py-0 align-middle";

  return (
    <div className={`min-w-0 w-full overflow-x-auto ${className}`.trim()}>
      <table className="w-full min-w-0 table-fixed border-collapse text-left text-sm">
        {colgroup}
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {!hideHeader ? (
          <thead>
            <tr className="h-[40px] max-h-[40px] border-b border-border-rule bg-surface-table-row-header">
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={`h-[40px] max-h-[40px] px-3 py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-tertiary ${c.className ?? ""}`.trim()}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={rowClass}>
              {columns.map((c) => (
                <td
                  key={c.id}
                  className={`${cellSizeClass} text-text-primary ${c.className ?? "px-3"}`.trim()}
                >
                  {autoHeight ? (
                    <div className="flex h-full min-h-7 flex-col justify-center">{c.cell(row)}</div>
                  ) : (
                    c.cell(row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
