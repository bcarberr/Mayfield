import { getEntityAttributeDemoValues } from "../components/ui/dataGridEntityAttributes";
import type { ResultsDetailAttributeNode, ResultsDetailSourceRow } from "../components/ui/resultsDetailPanelTypes";

export type OcsfDetailSchemaField = {
  type: "field";
  id: string;
  label: string;
  customMapped?: boolean;
};

export type OcsfDetailSchemaGroup = {
  type: "group";
  id: string;
  label: string;
  defaultOpen?: boolean;
  children: readonly OcsfDetailSchemaNode[];
};

export type OcsfDetailSchemaNode = OcsfDetailSchemaField | OcsfDetailSchemaGroup;

export const CUSTOM_MAPPED_ATTRIBUTE_TOOLTIP =
  "Additional field that was returned from the Connector that does not fit into our Data Model (QDM). This is custom mapped.";

/** Vulnerability / Findings — matches OCSF Findings category (class: Vulnerability). */
const FINDINGS_VULNERABILITY_SCHEMA: readonly OcsfDetailSchemaNode[] = [
  { type: "field", id: "activity", label: "Activity" },
  { type: "field", id: "categoryId", label: "Category ID" },
  { type: "field", id: "classId", label: "Class ID" },
  { type: "field", id: "enrichment", label: "Enrichment", customMapped: true },
  { type: "field", id: "eventTime", label: "Event Time" },
  { type: "field", id: "findingInformation", label: "Finding Information", customMapped: true },
  { type: "field", id: "manageType", label: "Manage Type", customMapped: true },
  { type: "field", id: "endTime", label: "End Time" },
  {
    type: "group",
    id: "evidenceArtifacts",
    label: "Evidence Artifacts",
    defaultOpen: true,
    children: [
      {
        type: "group",
        id: "actor",
        label: "Actor",
        defaultOpen: true,
        children: [
          { type: "field", id: "applicationName", label: "Application Name" },
          {
            type: "group",
            id: "user",
            label: "User",
            defaultOpen: true,
            children: [{ type: "field", id: "domain", label: "Domain" }],
          },
        ],
      },
      {
        type: "group",
        id: "destinationEndpoint",
        label: "Destination Endpoint",
        defaultOpen: true,
        children: [
          { type: "field", id: "hostname", label: "Hostname" },
          { type: "field", id: "ipAddress", label: "IP Address" },
        ],
      },
    ],
  },
  {
    type: "field",
    id: "message",
    label: "Message",
  },
  { type: "field", id: "severityId", label: "Severity ID" },
  { type: "field", id: "startTime", label: "Start Time" },
  { type: "field", id: "statusDetails", label: "Status Details" },
  { type: "field", id: "statusId", label: "Status ID" },
  { type: "field", id: "rawData", label: "Raw Data" },
];

const FINDINGS_DATA_SECURITY_SCHEMA: readonly OcsfDetailSchemaNode[] = [
  { type: "field", id: "activity", label: "Activity" },
  { type: "field", id: "categoryId", label: "Category ID" },
  { type: "field", id: "classId", label: "Class ID" },
  { type: "field", id: "findingTitle", label: "Finding.Title" },
  { type: "field", id: "findingDesc", label: "Finding.Desc" },
  { type: "field", id: "complianceControl", label: "Compliance.Control", customMapped: true },
  { type: "field", id: "complianceFramework", label: "Compliance.Framework" },
  { type: "field", id: "severityId", label: "Severity ID" },
  { type: "field", id: "statusId", label: "Status ID" },
  { type: "field", id: "message", label: "Message" },
];

const NETWORK_ACTIVITY_SCHEMA: readonly OcsfDetailSchemaNode[] = [
  { type: "field", id: "activity", label: "Activity" },
  { type: "field", id: "categoryId", label: "Category ID" },
  { type: "field", id: "classId", label: "Class ID" },
  { type: "field", id: "protocol", label: "Protocol" },
  { type: "field", id: "trafficDirection", label: "Traffic Direction" },
  {
    type: "group",
    id: "srcEndpoint",
    label: "Src Endpoint",
    defaultOpen: true,
    children: [
      { type: "field", id: "srcIp", label: "IP Address" },
      { type: "field", id: "srcPort", label: "Port" },
      { type: "field", id: "srcName", label: "Hostname" },
    ],
  },
  {
    type: "group",
    id: "dstEndpoint",
    label: "Dst Endpoint",
    defaultOpen: true,
    children: [
      { type: "field", id: "dstIp", label: "IP Address" },
      { type: "field", id: "dstPort", label: "Port" },
      { type: "field", id: "dstName", label: "Hostname" },
    ],
  },
  {
    type: "group",
    id: "http",
    label: "HTTP Request",
    children: [
      { type: "field", id: "httpRequestUrl", label: "URL" },
      { type: "field", id: "httpMethod", label: "Method" },
      { type: "field", id: "httpResponseCode", label: "Response Code" },
    ],
  },
  { type: "field", id: "connectionUid", label: "Connection UID", customMapped: true },
  { type: "field", id: "message", label: "Message" },
];

const DISCOVERY_SCHEMA: readonly OcsfDetailSchemaNode[] = [
  { type: "field", id: "activity", label: "Activity" },
  { type: "field", id: "categoryId", label: "Category ID" },
  { type: "field", id: "classId", label: "Class ID" },
  {
    type: "group",
    id: "device",
    label: "Device",
    defaultOpen: true,
    children: [
      { type: "field", id: "deviceName", label: "Name" },
      { type: "field", id: "deviceIp", label: "IP Address" },
      { type: "field", id: "deviceOsName", label: "OS Name" },
      { type: "field", id: "deviceType", label: "Type" },
    ],
  },
  {
    type: "group",
    id: "software",
    label: "Software",
    children: [
      { type: "field", id: "softwareName", label: "Name" },
      { type: "field", id: "softwareVersion", label: "Version" },
    ],
  },
  { type: "field", id: "patchStatus", label: "Patch Status", customMapped: true },
  { type: "field", id: "message", label: "Message" },
];

const IDENTITY_ACCESS_SCHEMA: readonly OcsfDetailSchemaNode[] = [
  { type: "field", id: "activity", label: "Activity" },
  { type: "field", id: "categoryId", label: "Category ID" },
  { type: "field", id: "classId", label: "Class ID" },
  {
    type: "group",
    id: "actor",
    label: "Actor",
    defaultOpen: true,
    children: [
      { type: "field", id: "userName", label: "User.Name" },
      { type: "field", id: "userUid", label: "User.Uid" },
      { type: "field", id: "userEmail", label: "User.EmailAddr" },
      { type: "field", id: "userDomain", label: "User.Domain" },
    ],
  },
  {
    type: "group",
    id: "srcEndpoint",
    label: "Src Endpoint",
    children: [
      { type: "field", id: "srcIp", label: "IP Address" },
      { type: "field", id: "srcName", label: "Name" },
    ],
  },
  { type: "field", id: "logonType", label: "Logon Type", customMapped: true },
  { type: "field", id: "authProtocol", label: "Auth Protocol" },
  { type: "field", id: "message", label: "Message" },
];

const SYSTEM_ACTIVITY_SCHEMA: readonly OcsfDetailSchemaNode[] = [
  { type: "field", id: "activity", label: "Activity" },
  { type: "field", id: "categoryId", label: "Category ID" },
  { type: "field", id: "classId", label: "Class ID" },
  {
    type: "group",
    id: "process",
    label: "Process",
    defaultOpen: true,
    children: [
      { type: "field", id: "processName", label: "Name" },
      { type: "field", id: "processCmdLine", label: "Command Line" },
      { type: "field", id: "processPid", label: "PID" },
      {
        type: "group",
        id: "processUser",
        label: "User",
        children: [
          { type: "field", id: "processUserName", label: "Name" },
          { type: "field", id: "processUserUid", label: "UID" },
        ],
      },
    ],
  },
  {
    type: "group",
    id: "file",
    label: "File",
    children: [
      { type: "field", id: "fileName", label: "Name" },
      { type: "field", id: "filePath", label: "Path" },
    ],
  },
  { type: "field", id: "executionContext", label: "Execution Context", customMapped: true },
  { type: "field", id: "message", label: "Message" },
];

const APPLICATION_ACTIVITY_SCHEMA: readonly OcsfDetailSchemaNode[] = [
  { type: "field", id: "activity", label: "Activity" },
  { type: "field", id: "categoryId", label: "Category ID" },
  { type: "field", id: "classId", label: "Class ID" },
  {
    type: "group",
    id: "actor",
    label: "Actor",
    defaultOpen: true,
    children: [
      { type: "field", id: "actorUserName", label: "User.Name" },
      { type: "field", id: "actorAppName", label: "App Name" },
    ],
  },
  {
    type: "group",
    id: "resource",
    label: "Resource",
    children: [
      { type: "field", id: "resourceName", label: "Name" },
      { type: "field", id: "resourceType", label: "Type" },
    ],
  },
  { type: "field", id: "apiOperation", label: "API Operation" },
  { type: "field", id: "tenantId", label: "Tenant ID", customMapped: true },
  { type: "field", id: "message", label: "Message" },
];

const REMEDIATION_SCHEMA: readonly OcsfDetailSchemaNode[] = [
  { type: "field", id: "activity", label: "Activity" },
  { type: "field", id: "categoryId", label: "Category ID" },
  { type: "field", id: "classId", label: "Class ID" },
  { type: "field", id: "remediationDesc", label: "Remediation.Desc" },
  { type: "field", id: "remediationKb", label: "Remediation.Kb Articles" },
  { type: "field", id: "ticketReference", label: "Ticket Reference", customMapped: true },
  { type: "field", id: "message", label: "Message" },
];

type OcsfCategoryKey =
  | "findings"
  | "network-activity"
  | "discovery"
  | "identity-access"
  | "system-activity"
  | "application-activity"
  | "remediation";

const CATEGORY_SCHEMAS: Record<OcsfCategoryKey, readonly OcsfDetailSchemaNode[]> = {
  findings: FINDINGS_VULNERABILITY_SCHEMA,
  "network-activity": NETWORK_ACTIVITY_SCHEMA,
  discovery: DISCOVERY_SCHEMA,
  "identity-access": IDENTITY_ACCESS_SCHEMA,
  "system-activity": SYSTEM_ACTIVITY_SCHEMA,
  "application-activity": APPLICATION_ACTIVITY_SCHEMA,
  remediation: REMEDIATION_SCHEMA,
};

const CATEGORY_LABELS: Record<OcsfCategoryKey, string> = {
  findings: "Findings",
  "network-activity": "Network Activity",
  discovery: "Discovery",
  "identity-access": "Identity & Access Management",
  "system-activity": "System Activity",
  "application-activity": "Application Activity",
  remediation: "Remediation",
};

export function resolveOcsfCategoryKey(eventClass: string): OcsfCategoryKey {
  const lower = eventClass.toLowerCase();

  if (lower.includes("remediation") || lower.includes("patch")) return "remediation";
  if (
    lower.includes("network") ||
    lower.includes("http") ||
    lower.includes("dns") ||
    lower.includes("firewall")
  ) {
    return "network-activity";
  }
  if (
    lower.includes("discovery") ||
    lower.includes("inventory") ||
    lower.includes("osint") ||
    lower.includes("device")
  ) {
    return "discovery";
  }
  if (
    lower.includes("identity") ||
    lower.includes("auth") ||
    lower.includes("account") ||
    lower.includes("group") ||
    lower.includes("session") ||
    lower.includes("access management")
  ) {
    return "identity-access";
  }
  if (lower.includes("system") || lower.includes("process") || lower.includes("file")) {
    return "system-activity";
  }
  if (lower.includes("application") || lower.includes("api") || lower.includes("cloud")) {
    return "application-activity";
  }
  if (
    lower.includes("vulner") ||
    lower.includes("finding") ||
    lower.includes("data security") ||
    lower.includes("compliance")
  ) {
    return "findings";
  }

  return "findings";
}

function schemaForEventClass(eventClass: string): readonly OcsfDetailSchemaNode[] {
  const category = resolveOcsfCategoryKey(eventClass);
  if (category === "findings" && eventClass.toLowerCase().includes("data security")) {
    return FINDINGS_DATA_SECURITY_SCHEMA;
  }
  return CATEGORY_SCHEMAS[category];
}

function demoValue(row: ResultsDetailSourceRow, fieldId: string, fallback: string): string {
  const hostname = getEntityAttributeDemoValues(row.id, "hostname")[0];
  const ipAddress = getEntityAttributeDemoValues(row.id, "ipAddress")[0];
  const username = getEntityAttributeDemoValues(row.id, "username")[0];

  const values: Record<string, string> = {
    activity: row.activity ?? "Create",
    categoryId: CATEGORY_LABELS[resolveOcsfCategoryKey(row.eventClass ?? row.category ?? "Event")],
    classId: row.eventClass ?? row.category ?? "Event",
    enrichment: "w4rtjdtj",
    eventTime: row.severity ?? row.time,
    findingInformation: row.description ?? "Suspicious activity detected on endpoint",
    manageType: "MicrosoftSense",
    endTime: "2024-10-07 05:12:00 AM",
    applicationName: "234646",
    domain: "w4rtjdtj",
    hostname: hostname ?? "www.epgoaig.com",
    ipAddress: ipAddress ?? "124.56.234.12",
    message: row.title,
    severityId: "4567899",
    startTime: row.time,
    statusDetails: row.status ?? "New",
    statusId: row.status ?? "New",
    rawData:
      "{//garbly gook a123-108 rawe data stuffgoies herebuoiutt43456// kljfdaskillroy43453-q3...}",
    findingTitle: row.title,
    findingDesc: row.description ?? row.title,
    complianceControl: "AC-2",
    complianceFramework: "NIST 800-53",
    protocol: "TCP",
    trafficDirection: "Outbound",
    srcIp: ipAddress ?? "10.0.4.12",
    srcPort: "443",
    srcName: hostname ?? "workstation-01",
    dstIp: "207.32.75.34",
    dstPort: "8443",
    dstName: "api.external-service.com",
    httpRequestUrl: "https://api.external-service.com/v1/events",
    httpMethod: "POST",
    httpResponseCode: "200",
    connectionUid: `conn-${row.id}`,
    deviceName: hostname ?? "norma-laptop",
    deviceIp: ipAddress ?? "10.0.4.12",
    deviceOsName: "Windows 11",
    deviceType: "Laptop",
    softwareName: "CrowdStrike Falcon",
    softwareVersion: "7.12.0",
    patchStatus: "Pending",
    userName: username ?? "j.smith",
    userUid: `uid-${row.id}`,
    userEmail: username ? `${username}@corp.example.com` : "bonnie@corp.example.com",
    userDomain: "CORP",
    logonType: "Interactive",
    authProtocol: "Kerberos",
    processName: "powershell.exe",
    processCmdLine: "powershell.exe -enc ...",
    processPid: "4892",
    processUserName: username ?? "admin",
    processUserUid: "S-1-5-21-...",
    fileName: "update.exe",
    filePath: "C:\\Users\\Public\\update.exe",
    executionContext: "Elevated",
    actorUserName: username ?? "svc-backup",
    actorAppName: row.connector,
    resourceName: "security-events",
    resourceType: "Table",
    apiOperation: row.activity ?? "GetObject",
    tenantId: "DunderMifflin_HQ",
    remediationDesc: row.description ?? row.title,
    remediationKb: "KB5021234",
    ticketReference: `INC-${row.id.padStart(5, "0")}`,
  };

  return values[fieldId] ?? fallback;
}

function materializeSchema(
  nodes: readonly OcsfDetailSchemaNode[],
  row: ResultsDetailSourceRow,
  depth = 0,
): ResultsDetailAttributeNode[] {
  return nodes.map((node) => {
    if (node.type === "group") {
      return {
        type: "group",
        id: node.id,
        label: node.label,
        defaultOpen: node.defaultOpen,
        depth,
        children: materializeSchema(node.children, row, depth + 1),
      };
    }

    return {
      type: "field",
      id: node.id,
      attribute: node.label,
      value: demoValue(row, node.id, "—"),
      customMapped: node.customMapped,
      depth,
    };
  });
}

export function buildOcsfAttributesForEventClass(row: ResultsDetailSourceRow): ResultsDetailAttributeNode[] {
  const eventClass = row.eventClass ?? row.category ?? "Vulnerability";
  const schema = schemaForEventClass(eventClass);
  return materializeSchema(schema, { ...row, eventClass });
}
