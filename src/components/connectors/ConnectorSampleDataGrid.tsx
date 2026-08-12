import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Icon } from "../../design-system";
import {
  DEMO_CONNECTOR_SAMPLE_COLUMNS,
  type ConnectorSampleDataRow,
} from "./connectorDemoSchema";

const DEFAULT_COLUMN_MIN_WIDTH = "8.5rem";

const COLUMN_MIN_WIDTH: Partial<Record<keyof ConnectorSampleDataRow, string>> = {
  action: "6.5rem",
  appclass: "9.5rem",
  appname: "9.5rem",
  bwclassname: "8.5rem",
  bwrulename: "8.5rem",
  bwthrottle: "7.5rem",
  clientip: "8.5rem",
  clientpublicip: "10rem",
  clientsslcipher: "18rem",
  cs_user_agent: "18rem",
  cs_referer: "14rem",
  event_time: "12rem",
  start_time: "12rem",
  end_time: "12rem",
  message: "12rem",
};

export type ConnectorSampleDataGridRow = ConnectorSampleDataRow & { previewRowId: string };

export function ConnectorSampleDataGrid({ rows }: { rows: readonly ConnectorSampleDataGridRow[] }) {
  return (
    <div className="min-h-0 h-full w-full overflow-auto">
      <table className="w-max min-w-full border-collapse text-left">
        <caption className="sr-only">Preview sample data rows from the connected data table</caption>
        <thead className="sticky top-0 z-10 bg-surface-table-row-header">
          <tr>
            {DEMO_CONNECTOR_SAMPLE_COLUMNS.map(({ id, header }) => (
              <th
                key={id}
                scope="col"
                style={{ minWidth: COLUMN_MIN_WIDTH[id] ?? DEFAULT_COLUMN_MIN_WIDTH }}
                className="h-[40px] max-h-[40px] border border-border-rule px-4 py-0 align-middle text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap text-text-primary"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.previewRowId} className="h-[40px] max-h-[40px] bg-surface-modal hover:bg-surface-container/50">
              {DEMO_CONNECTOR_SAMPLE_COLUMNS.map(({ id }) => (
                <td
                  key={id}
                  style={{ minWidth: COLUMN_MIN_WIDTH[id] ?? DEFAULT_COLUMN_MIN_WIDTH }}
                  className="h-[40px] max-h-[40px] border border-border-rule px-4 py-0 align-middle text-sm whitespace-nowrap text-text-primary"
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
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success("JSON copied to clipboard");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy JSON");
    }
  }, [json]);

  return (
    <div className="relative h-full min-h-0">
      <button
        type="button"
        className="absolute right-3 top-3 z-[1] rounded p-1.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-primary"
        aria-label={copied ? "JSON copied" : "Copy JSON"}
        onClick={handleCopy}
      >
        <Icon name="action-content-copy" size={18} className="text-current" />
      </button>
      <pre className="h-full min-h-0 overflow-auto p-4 pr-12 text-xs leading-relaxed whitespace-pre text-text-primary">
        {json}
      </pre>
    </div>
  );
}
