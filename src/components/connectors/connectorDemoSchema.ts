export type ConnectorSampleDataRow = {
  action: string;
  appclass: string;
  appname: string;
  bwclassname: string;
  bwrulename: string;
  bwthrottle: string;
  clientip: string;
  clientpublicip: string;
  clientsslcipher: string;
};

export type ConnectorSampleDataPreview = {
  previewCount: number;
  totalResults: number;
  rows: readonly ConnectorSampleDataRow[];
};

/** Demo label — `{initials} data schema` from the connector display name. */
export function connectorDemoDataTableName(connectorName: string): string {
  const initials = connectorName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return initials ? `${initials} data schema` : "data schema";
}

const BASE_ROW: ConnectorSampleDataRow = {
  action: "Allowed",
  appclass: "General Browsing",
  appname: "General Browsing",
  bwclassname: "None",
  bwrulename: "None",
  bwthrottle: "No",
  clientip: "76.95.243.98",
  clientpublicip: "176.95.243.98",
  clientsslcipher: "TLS1_3_CK_AES_256_GCM_SHA384",
};

/** Demo sample table for connector setup Step 2 — Preview Sample Data. */
export const DEMO_CONNECTOR_SAMPLE_DATA: ConnectorSampleDataPreview = {
  previewCount: 20,
  totalResults: 1000,
  rows: Array.from({ length: 20 }, (_, index) => ({
    ...BASE_ROW,
    clientpublicip: index === 0 ? "176.95.243.98" : "76.95.243.98",
  })),
};

export const DEMO_CONNECTOR_SAMPLE_COLUMNS: readonly {
  id: keyof ConnectorSampleDataRow;
  header: string;
}[] = [
  { id: "action", header: "ACTION" },
  { id: "appclass", header: "APPCLASS" },
  { id: "appname", header: "APPNAME" },
  { id: "bwclassname", header: "BWCLASSNAME" },
  { id: "bwrulename", header: "BWRULENAME" },
  { id: "bwthrottle", header: "BWTHROTTLE" },
  { id: "clientip", header: "CLIENTIP" },
  { id: "clientpublicip", header: "CLIENTPUBLICIP" },
  { id: "clientsslcipher", header: "CLIENTSSLCIPHER" },
];

export function connectorSampleRowsAsJson(rows: readonly ConnectorSampleDataRow[]): string {
  const payload = rows.map((row) =>
    Object.fromEntries(
      DEMO_CONNECTOR_SAMPLE_COLUMNS.map(({ id, header }) => [header, row[id]]),
    ),
  );
  return JSON.stringify(payload, null, 2);
}
