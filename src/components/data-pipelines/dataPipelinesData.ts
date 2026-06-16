import type { OcsfEventIconName } from "../../assets/icons/ocsf-icons";
import type { ConnectorLargeIconName } from "../../design-system";

export type PipelineState = "Active" | "Paused";

export type PipelineEventLog = {
  id: string;
  label: string;
  icon: OcsfEventIconName;
  iconClassName: string;
  enabled: boolean;
};

export type DataPipelineRow = {
  id: string;
  name: string;
  source: string;
  sourceIcon?: ConnectorLargeIconName;
  destination: string;
  destinationIcon?: ConnectorLargeIconName;
  state: PipelineState;
  records: string;
  recordsNumeric: number;
  lastRun: string;
  description: string;
  eventLogs: PipelineEventLog[];
};

const FINDINGS_ICON = {
  icon: "ocsf-findings" as const,
  iconClassName: "text-datavis-data-smalt-green-40",
};

const DISCOVERY_ICON = {
  icon: "ocsf-discovery" as const,
  iconClassName: "text-datavis-data-weak-red-30",
};

const NETWORK_ICON = {
  icon: "ocsf-network-activity" as const,
  iconClassName: "text-datavis-data-peanut-orange",
};

const IDENTITY_ICON = {
  icon: "ocsf-identity-access" as const,
  iconClassName: "text-datavis-data-pop-teal-20",
};

const SYSTEM_ICON = {
  icon: "ocsf-system-activity" as const,
  iconClassName: "text-datavis-data-weak-red-30",
};

const APPLICATION_ICON = {
  icon: "ocsf-application-activity" as const,
  iconClassName: "text-datavis-data-rouge-40",
};

function findingLog(id: string, label: string, enabled = true): PipelineEventLog {
  return { id, label, enabled, ...FINDINGS_ICON };
}

function discoveryLog(id: string, label: string, enabled = true): PipelineEventLog {
  return { id, label, enabled, ...DISCOVERY_ICON };
}

function networkLog(id: string, label: string, enabled = true): PipelineEventLog {
  return { id, label, enabled, ...NETWORK_ICON };
}

function identityLog(id: string, label: string, enabled = true): PipelineEventLog {
  return { id, label, enabled, ...IDENTITY_ICON };
}

function systemLog(id: string, label: string, enabled = true): PipelineEventLog {
  return { id, label, enabled, ...SYSTEM_ICON };
}

function applicationLog(id: string, label: string, enabled = true): PipelineEventLog {
  return { id, label, enabled, ...APPLICATION_ICON };
}

export const DATA_PIPELINE_ROWS: DataPipelineRow[] = [
  {
    id: "pipeline-1",
    name: "CloudTrail Events to S3",
    source: "AWS CloudTrail",
    sourceIcon: "connector-large-amazon-cloudwatch",
    destination: "Amazon S3",
    destinationIcon: "connector-large-amazon-s3",
    state: "Active",
    records: "1.2M",
    recordsNumeric: 1_200_000,
    lastRun: "5 mins ago",
    description: "Ingests AWS CloudTrail events and stores them in S3 for long-term archival and compliance.",
    eventLogs: [
      findingLog("vulnerability-finding", "Vulnerability Finding"),
      findingLog("detection-finding", "Detection Finding"),
      findingLog("incident-finding", "Incident Finding"),
      discoveryLog("device-inventory-info", "Device Inventory Info"),
      discoveryLog("user-inventory-info", "User Inventory Info"),
      discoveryLog("device-config-state-change", "Device Config State Change"),
    ],
  },
  {
    id: "pipeline-2",
    name: "VPC Flow Logs Pipeline",
    source: "AWS VPC",
    sourceIcon: "connector-large-amazon-cloudwatch",
    destination: "Security Lake",
    destinationIcon: "connector-large-aws-sec-lake",
    state: "Active",
    records: "890K",
    recordsNumeric: 890_000,
    lastRun: "15 mins ago",
    description:
      "Collects VPC flow logs from production subnets and forwards normalized network telemetry into Security Lake.",
    eventLogs: [
      networkLog("network-activity", "Network Activity"),
      networkLog("dns-activity", "DNS Activity"),
      networkLog("http-activity", "HTTP Activity"),
      findingLog("detection-finding", "Detection Finding"),
    ],
  },
  {
    id: "pipeline-3",
    name: "Okta System Log Ingest",
    source: "Okta",
    sourceIcon: "connector-large-okta",
    destination: "Snowflake",
    destinationIcon: "connector-large-snowflake",
    state: "Active",
    records: "456K",
    recordsNumeric: 456_000,
    lastRun: "30 mins ago",
    description:
      "Pulls Okta system log events and loads identity authentication activity into the Snowflake identity analytics schema.",
    eventLogs: [
      identityLog("authentication", "Authentication"),
      identityLog("account-change", "Account Change"),
      identityLog("group-management", "Group Management"),
      discoveryLog("user-inventory-info", "User Inventory Info"),
    ],
  },
  {
    id: "pipeline-4",
    name: "CrowdStrike Detections",
    source: "CrowdStrike",
    sourceIcon: "connector-large-crowdstrike",
    destination: "Security Lake",
    destinationIcon: "connector-large-aws-sec-lake",
    state: "Paused",
    records: "123K",
    recordsNumeric: 123_000,
    lastRun: "2 hours ago",
    description:
      "Streams CrowdStrike detection summaries into Security Lake. Currently paused while connector credentials are rotated.",
    eventLogs: [
      findingLog("detection-finding", "Detection Finding"),
      findingLog("incident-finding", "Incident Finding"),
      systemLog("process-activity", "Process Activity"),
      systemLog("file-activity", "File System Activity"),
    ],
  },
  {
    id: "pipeline-5",
    name: "Microsoft Defender Alerts",
    source: "Microsoft Defender",
    sourceIcon: "connector-large-ms-defender-endpoint",
    destination: "ClickHouse",
    destinationIcon: "connector-large-clickhouse",
    state: "Active",
    records: "312K",
    recordsNumeric: 312_000,
    lastRun: "1 hour ago",
    description:
      "Imports endpoint alerts from Microsoft Defender for Endpoint and materializes them in ClickHouse for low-latency hunt queries.",
    eventLogs: [
      findingLog("detection-finding", "Detection Finding"),
      findingLog("vulnerability-finding", "Vulnerability Finding"),
      systemLog("process-activity", "Process Activity"),
      discoveryLog("device-inventory-info", "Device Inventory Info"),
    ],
  },
  {
    id: "pipeline-6",
    name: "Splunk Forwarder Events",
    source: "Splunk",
    sourceIcon: "connector-large-splunk",
    destination: "Amazon S3",
    destinationIcon: "connector-large-amazon-s3",
    state: "Active",
    records: "678K",
    recordsNumeric: 678_000,
    lastRun: "45 mins ago",
    description:
      "Exports selected Splunk indexes to S3 for long-term retention and downstream federated search normalization.",
    eventLogs: [
      systemLog("event-log-activity", "Event Log Activity"),
      applicationLog("application-error", "Application Error"),
      findingLog("security-finding", "Security Finding"),
    ],
  },
  {
    id: "pipeline-7",
    name: "Entra ID Sign-in Logs",
    source: "Microsoft Entra ID",
    sourceIcon: "connector-large-ms-entra-id",
    destination: "Snowflake",
    destinationIcon: "connector-large-snowflake",
    state: "Paused",
    records: "89K",
    recordsNumeric: 89_000,
    lastRun: "3 hours ago",
    description:
      "Synchronizes Entra ID interactive and non-interactive sign-in logs. Paused pending schema mapping updates for conditional access fields.",
    eventLogs: [
      identityLog("authentication", "Authentication"),
      identityLog("authorize-session", "Authorize Session"),
      findingLog("iam-analysis-finding", "IAM Analysis Finding"),
      discoveryLog("user-inventory-info", "User Inventory Info"),
    ],
  },
  {
    id: "pipeline-8",
    name: "Proofpoint TAP Events",
    source: "Proofpoint",
    sourceIcon: "connector-large-proofpoint",
    destination: "Security Lake",
    destinationIcon: "connector-large-aws-sec-lake",
    state: "Active",
    records: "201K",
    recordsNumeric: 201_000,
    lastRun: "20 mins ago",
    description:
      "Delivers Proofpoint Targeted Attack Protection message and click events into the email security dataset within Security Lake.",
    eventLogs: [
      networkLog("email-activity", "Email Activity"),
      networkLog("email-url-activity", "Email URL Activity"),
      findingLog("detection-finding", "Detection Finding"),
    ],
  },
  {
    id: "pipeline-9",
    name: "Zscaler Web Logs",
    source: "Zscaler",
    sourceIcon: "connector-large-zscaler",
    destination: "ClickHouse",
    destinationIcon: "connector-large-clickhouse",
    state: "Active",
    records: "534K",
    recordsNumeric: 534_000,
    lastRun: "10 mins ago",
    description:
      "Ingests Zscaler web proxy logs for egress monitoring and stores parsed HTTP metadata in ClickHouse.",
    eventLogs: [
      networkLog("http-activity", "HTTP Activity"),
      networkLog("dns-activity", "DNS Activity"),
      findingLog("data-security-finding", "Data Security Finding"),
    ],
  },
  {
    id: "pipeline-10",
    name: "Jamf Device Inventory",
    source: "Jamf",
    sourceIcon: "connector-large-jamf",
    destination: "Amazon S3",
    destinationIcon: "connector-large-amazon-s3",
    state: "Active",
    records: "67K",
    recordsNumeric: 67_000,
    lastRun: "1 hour ago",
    description:
      "Snapshots Jamf-managed device inventory and compliance posture daily into S3 for asset context enrichment.",
    eventLogs: [
      discoveryLog("device-inventory-info", "Device Inventory Info"),
      discoveryLog("software-inventory-info", "Software Inventory Info"),
      discoveryLog("device-config-state-change", "Device Config State Change"),
      discoveryLog("patch-state", "Operating System Patch State"),
    ],
  },
];

export function getPipelineSummaryStats(rows: readonly DataPipelineRow[]) {
  const active = rows.filter((row) => row.state === "Active").length;
  const paused = rows.filter((row) => row.state === "Paused").length;
  const highestRecords = rows.reduce(
    (best, row) => (row.recordsNumeric > best.recordsNumeric ? row : best),
    rows[0],
  );

  return {
    total: rows.length,
    active,
    paused,
    highestRecordsLabel: highestRecords?.records ?? "—",
    highestRecordsNumeric: highestRecords?.recordsNumeric ?? 0,
  };
}

export function pipelineMatchesSearch(row: DataPipelineRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    row.name,
    row.source,
    row.destination,
    row.state,
    row.records,
    row.lastRun,
    row.description,
    ...row.eventLogs.map((log) => log.label),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}
