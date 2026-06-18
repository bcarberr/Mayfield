import type { ConnectorLargeIconName } from "../../design-system";

export type ConnectorSummaryQueryStatus = "completed" | "not-planned";

export type ConnectorSummaryResultKind =
  | "no-data"
  | "success"
  | "not-applicable"
  | "partial-errors"
  | "partial-max"
  | "partial-max-errors";

export type ConnectorSummaryRow = {
  id: string;
  name: string;
  icon: ConnectorLargeIconName;
  limit?: number;
  queryStatus: ConnectorSummaryQueryStatus;
  statusNote: string;
  resultKind: ConnectorSummaryResultKind;
  showView?: boolean;
};

export const CONNECTOR_SUMMARY_ROWS: readonly ConnectorSummaryRow[] = [
  {
    id: "snowflake",
    name: "Snowflake",
    icon: "connector-large-snowflake",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - No Data",
    resultKind: "no-data",
  },
  {
    id: "google-secops",
    name: "GoogleSecOps",
    icon: "connector-large-google-secops",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "amazon-cloudwatch",
    name: "Amazon Cloud Watch",
    icon: "connector-large-amazon-cloudwatch",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "cribl",
    name: "Cribl",
    icon: "connector-large-cribl-search",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Partial results - some errors, some results",
    resultKind: "partial-errors",
    showView: true,
  },
  {
    id: "databricks",
    name: "Databricks",
    icon: "connector-large-databricks",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "microsoft-entra",
    name: "Microsoft Entra",
    icon: "connector-large-ms-entra-id",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "datadog",
    name: "Datadog",
    icon: "connector-large-datadog",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "amazon-athena",
    name: "Amazon Athena",
    icon: "connector-large-aws-athena",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "splunk",
    name: "Splunk",
    icon: "connector-large-splunk",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "crowdstrike-logscale",
    name: "Crowdstrike Logscale",
    icon: "connector-large-crowdstrike-logscale",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Partial results - no errors/max results",
    resultKind: "partial-max",
  },
  {
    id: "sentinelone",
    name: "SentinelOne",
    icon: "connector-large-sentinelone",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Partial results - some errors and max results",
    resultKind: "partial-max-errors",
    showView: true,
  },
  {
    id: "whoisapi",
    name: "WhoisApi",
    icon: "connector-large-whoisxmlapi",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
    showView: true,
  },
  {
    id: "auth0",
    name: "Auth0",
    icon: "connector-large-auth0",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "opensearch",
    name: "OpenSearch",
    icon: "connector-large-opensearch",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "google-gmail",
    name: "Google Gmail",
    icon: "connector-large-google-mail",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "alienvault",
    name: "Alienvault",
    icon: "connector-large-alienvault-otx",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "jamf",
    name: "Jamf",
    icon: "connector-large-jamf",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "tego",
    name: "Tego",
    icon: "connector-large-tego",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
  {
    id: "virustotal",
    name: "VirusTotal",
    icon: "connector-large-virus-total",
    limit: 1000,
    queryStatus: "completed",
    statusNote: "Successful query - Results",
    resultKind: "success",
  },
];
