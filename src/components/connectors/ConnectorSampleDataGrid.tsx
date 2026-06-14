import {
  DEMO_CONNECTOR_SAMPLE_COLUMNS,
  type ConnectorSampleDataRow,
} from "./connectorDemoSchema";

const COLUMN_MIN_WIDTH: Record<keyof ConnectorSampleDataRow, string> = {
  action: "6.5rem",
  appclass: "9.5rem",
  appname: "9.5rem",
  bwclassname: "8.5rem",
  bwrulename: "8.5rem",
  bwthrottle: "7.5rem",
  clientip: "8.5rem",
  clientpublicip: "10rem",
  clientsslcipher: "18rem",
};

export type ConnectorSampleDataGridRow = ConnectorSampleDataRow & { previewRowId: string };

export function ConnectorSampleDataGrid({ rows }: { rows: readonly ConnectorSampleDataGridRow[] }) {
  return (
    <div className="min-h-0 h-full w-full overflow-auto">
      <table className="w-max min-w-full border-collapse text-left">
        <caption className="sr-only">Preview sample data rows from the connected data table</caption>
        <thead className="sticky top-0 z-10 bg-surface-container">
          <tr>
            {DEMO_CONNECTOR_SAMPLE_COLUMNS.map(({ id, header }) => (
              <th
                key={id}
                scope="col"
                style={{ minWidth: COLUMN_MIN_WIDTH[id] }}
                className="border border-border-rule px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap text-text-primary"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.previewRowId} className="bg-surface-modal hover:bg-surface-container/50">
              {DEMO_CONNECTOR_SAMPLE_COLUMNS.map(({ id }) => (
                <td
                  key={id}
                  style={{ minWidth: COLUMN_MIN_WIDTH[id] }}
                  className="border border-border-rule px-4 py-2.5 text-sm whitespace-nowrap text-text-primary"
                >
                  {row[id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConnectorSampleDataJson({ json }: { json: string }) {
  return (
    <pre className="h-full min-h-0 overflow-auto p-4 text-xs leading-relaxed whitespace-pre text-text-primary">{json}</pre>
  );
}
