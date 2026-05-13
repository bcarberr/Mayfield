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
};

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  className = "",
  caption,
  hideHeader,
  colgroup,
}: DataTableProps<Row>) {
  return (
    <div className={`min-w-0 overflow-x-auto ${className}`.trim()}>
      <table className="w-full min-w-0 table-fixed border-collapse text-left text-sm">
        {colgroup}
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {!hideHeader ? (
          <thead>
            <tr className="border-b border-border-rule bg-surface-container/60">
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wide text-text-tertiary ${c.className ?? ""}`.trim()}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-surface-container/40">
              {columns.map((c) => (
                <td
                  key={c.id}
                  className={`align-middle text-text-primary ${c.className ?? "px-3 py-2"}`.trim()}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
