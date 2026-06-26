import type { DataGridColumnDef } from "./dataGridColumnTypes";

/** Optional entity / attribute columns shared across event grids. */
export const ENTITY_ATTRIBUTE_COLUMNS: DataGridColumnDef[] = [
  { id: "accountId", label: "Account ID" },
  { id: "commandLine", label: "Command Line" },
  { id: "country", label: "Country" },
  { id: "cveId", label: "CVE ID" },
  { id: "cweId", label: "CWE ID" },
  { id: "deviceId", label: "Device ID" },
  { id: "domainId", label: "Domain ID" },
  { id: "domainName", label: "Domain Name" },
  { id: "emailAddress", label: "Email Address" },
  { id: "fileHash", label: "File Hash" },
  { id: "filename", label: "Filename" },
  { id: "groupId", label: "Group ID" },
  { id: "groupName", label: "Group Name" },
  { id: "hostname", label: "Hostname" },
  { id: "ipAddress", label: "IP Address" },
  { id: "macAddress", label: "MAC Address" },
  { id: "port", label: "Port" },
  { id: "processId", label: "Process ID" },
  { id: "processName", label: "Process Name" },
  { id: "subnet", label: "Subnet" },
  { id: "url", label: "URL" },
  { id: "userAgent", label: "User Agent" },
  { id: "userId", label: "User ID" },
  { id: "username", label: "Username" },
];

function withEntityAttributes(columns: DataGridColumnDef[]): DataGridColumnDef[] {
  return [...columns, ...ENTITY_ATTRIBUTE_COLUMNS];
}

export const FSQL_SEARCH_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "time", label: "Time", defaultVisible: true },
  { id: "activity", label: "Activity", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "eventType", label: "Event Class", defaultVisible: true },
  { id: "connector", label: "Connector", defaultVisible: true },
]);

export const DISCOVERY_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "time", label: "Time", defaultVisible: true },
  { id: "patchStatus", label: "Patch Compliance", defaultVisible: true },
  { id: "eventClass", label: "Event Class", defaultVisible: true },
  { id: "asset", label: "Asset", defaultVisible: true },
  { id: "owner", label: "Owner", defaultVisible: true },
  { id: "connector", label: "Connector", defaultVisible: true },
]);

export const NETWORK_ACTIVITY_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "time", label: "Time", defaultVisible: true },
  { id: "activity", label: "Activity", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "eventClass", label: "Event Class", defaultVisible: true },
  { id: "connector", label: "Connector", defaultVisible: true },
]);

export const APPLICATION_ACTIVITY_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "time", label: "Time", defaultVisible: true },
  { id: "activity", label: "Activity", defaultVisible: true },
  { id: "eventClass", label: "Event Class", defaultVisible: true },
  { id: "app", label: "App", defaultVisible: true },
  { id: "user", label: "User", defaultVisible: true },
  { id: "connector", label: "Connector", defaultVisible: true },
]);

export const SYSTEM_ACTIVITY_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "time", label: "Time", defaultVisible: true },
  { id: "activity", label: "Activity", defaultVisible: true },
  { id: "eventClass", label: "Event Class", defaultVisible: true },
  { id: "host", label: "Host", defaultVisible: true },
  { id: "process", label: "Process", defaultVisible: true },
  { id: "connector", label: "Connector", defaultVisible: true },
]);

export const IDENTITY_ACCESS_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "time", label: "Time", defaultVisible: true },
  { id: "activity", label: "Activity", defaultVisible: true },
  { id: "eventClass", label: "Event Class", defaultVisible: true },
  { id: "user", label: "User", defaultVisible: true },
  { id: "sourceIp", label: "Source IP", defaultVisible: true },
  { id: "connector", label: "Connector", defaultVisible: true },
]);

export const REMEDIATION_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "time", label: "Time", defaultVisible: true },
  { id: "activity", label: "Activity", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "eventClass", label: "Event Class", defaultVisible: true },
  { id: "entity", label: "Entity", defaultVisible: true },
  { id: "connector", label: "Connector", defaultVisible: true },
]);

export const ENTITIES_AGGREGATED_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "risk", label: "Risk", defaultVisible: true },
  { id: "entity", label: "Entity", defaultVisible: true },
  { id: "type", label: "Type", defaultVisible: true },
  { id: "lastSeen", label: "Last Seen", defaultVisible: true },
  { id: "eventCount", label: "# Events", defaultVisible: true },
  { id: "categories", label: "Categories Involved", defaultVisible: true },
  { id: "connector", label: "Connector", defaultVisible: true },
]);

export const FEDERATED_DETECTIONS_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "expand", label: "Expand", locked: true, lockedPlacement: "start" },
  { id: "name", label: "Detections", defaultVisible: true },
  { id: "state", label: "State", defaultVisible: true },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "lastRun", label: "Last Run", defaultVisible: true },
  { id: "recurrence", label: "Recurrence", defaultVisible: true },
  { id: "findings", label: "Detection Findings", defaultVisible: true },
  { id: "actions", label: "Actions", locked: true, lockedPlacement: "end" },
]);

export const DETECTION_LIBRARY_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "expand", label: "Expand", locked: true, lockedPlacement: "start" },
  { id: "name", label: "Detections", defaultVisible: true },
  { id: "state", label: "State", defaultVisible: true },
  { id: "category", label: "Category", defaultVisible: true },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "lastRun", label: "Last Run", defaultVisible: true },
  { id: "recurrence", label: "Recurrence", defaultVisible: true },
  { id: "findings", label: "Detection Findings", defaultVisible: true },
  { id: "connectors", label: "Connectors", defaultVisible: true },
  { id: "actions", label: "Actions", locked: true, lockedPlacement: "end" },
]);

export const QUEUED_FOR_REVIEW_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "expand", label: "Expand", locked: true, lockedPlacement: "start" },
  { id: "name", label: "Detections", defaultVisible: true },
  { id: "state", label: "State", defaultVisible: true },
  { id: "queuedBy", label: "Queued By", defaultVisible: true },
  { id: "queuedDate", label: "Queued Date", defaultVisible: true },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "findings", label: "Detection Findings", defaultVisible: true },
  { id: "actions", label: "Actions", locked: true, lockedPlacement: "end" },
]);

export const DETECTION_HISTORY_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "expand", label: "Expand", locked: true, lockedPlacement: "start" },
  { id: "detectionName", label: "Detection", defaultVisible: true },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "runTime", label: "Run Time", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "findingsGenerated", label: "Findings Generated", defaultVisible: true },
  { id: "duration", label: "Duration", defaultVisible: true },
  { id: "triggeredBy", label: "Triggered By", defaultVisible: true },
]);

export const DATA_PIPELINES_DATA_GRID_COLUMNS: DataGridColumnDef[] = withEntityAttributes([
  { id: "expand", label: "Expand", locked: true, lockedPlacement: "start" },
  { id: "name", label: "Pipeline Name", defaultVisible: true },
  { id: "source", label: "Source", defaultVisible: true },
  { id: "destination", label: "Destination", defaultVisible: true },
  { id: "state", label: "Pipeline State", defaultVisible: true },
  { id: "records", label: "Records", defaultVisible: true },
  { id: "lastRun", label: "Last Run", defaultVisible: true },
  { id: "actions", label: "Actions", locked: true, lockedPlacement: "end" },
]);
