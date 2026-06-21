import type { IconName } from "../design-system";
import type { ObservableEntityIconName } from "../assets/icons/observable-icons";
import type { OcsfEventIconName } from "../assets/icons/ocsf-icons";

export type SearchEntityOption = {
  id: string;
  label: string;
  icon: ObservableEntityIconName;
};

/** Figma Entities picker (`3554:607`) — four columns, top-to-bottom per column. */
export const SEARCH_ENTITY_COLUMNS: readonly (readonly SearchEntityOption[])[] = [
  [
    { id: "account-id", label: "Account ID", icon: "observable-account-id" },
    { id: "account-name", label: "Account Name", icon: "observable-account-name" },
    { id: "advisory-id", label: "Advisory ID", icon: "observable-advisory-id" },
    { id: "command-line", label: "Command Line", icon: "observable-command-line" },
    { id: "country", label: "Country", icon: "observable-country" },
    { id: "credential-id", label: "Credential ID", icon: "observable-credential-id" },
    { id: "cve-id", label: "CVE ID", icon: "observable-cve" },
    { id: "cwe-id", label: "CWE ID", icon: "observable-cwe" },
    { id: "email-address", label: "Email Address", icon: "observable-email-address" },
  ],
  [
    { id: "email-message-uid", label: "Email Message UID", icon: "observable-email-address" },
    { id: "email-subject", label: "Email Subject", icon: "observable-email-address" },
    { id: "email-uid", label: "Email UID", icon: "observable-email-address" },
    { id: "file-hash", label: "File Hash", icon: "observable-file-hash" },
    { id: "filename", label: "Filename", icon: "observable-filename" },
    { id: "group-id", label: "Group ID", icon: "observable-group-id" },
    { id: "group-name", label: "Group Name", icon: "observable-group-name" },
    { id: "hostname", label: "Hostname", icon: "observable-hostname" },
    { id: "ip-address", label: "IP Address", icon: "observable-ip-address" },
  ],
  [
    { id: "mac-address", label: "MAC Address", icon: "observable-mac-address" },
    { id: "port", label: "Port", icon: "observable-port" },
    { id: "process-id", label: "Process ID", icon: "observable-process-id" },
    { id: "process-name", label: "Process Name", icon: "observable-process-name" },
    { id: "process-uid", label: "Process UID", icon: "observable-process-id" },
    { id: "registry-value-name", label: "Registry Value Name", icon: "observable-registry-value-name" },
    { id: "resource-id", label: "Resource ID", icon: "observable-resource-id" },
    { id: "resource-name", label: "Resource Name", icon: "observable-resource-name" },
    { id: "script-content", label: "Script Content", icon: "observable-script-content" },
  ],
  [
    { id: "serial-number", label: "Serial Number", icon: "observable-serial-number" },
    { id: "subnet", label: "Subnet", icon: "observable-subnet" },
    { id: "url", label: "URL", icon: "observable-url" },
    { id: "user-agent", label: "User Agent", icon: "observable-user-agent" },
    { id: "user-id", label: "User ID", icon: "observable-user-id" },
    { id: "user-name", label: "User Name", icon: "observable-username" },
  ],
] as const;

export type SearchEventOption = {
  id: string;
  label: string;
  icon: OcsfEventIconName;
  categoryId: string;
};

export type SearchEventCategory = {
  id: string;
  label: string;
  icon: OcsfEventIconName;
  iconClassName: string;
  events: readonly SearchEventOption[];
};

/** Figma Events picker (`3715:16483`) — left categories, right OCSF event classes. */
export const DEFAULT_EVENT_CATEGORY_ID = "unmanned-systems";

/** OCSF event classes from https://schema.ocsf.io/ (schema v4.0.0). */
export const SEARCH_EVENT_CATEGORIES: readonly SearchEventCategory[] = [
  {
    id: "system-activity",
    label: "System Activity",
    icon: "ocsf-system-activity",
    iconClassName: "text-datavis-data-weak-red-30",
    events: [
      { id: "event_log_actvity", label: "Event Log Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "file_activity", label: "File System Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "kernel_activity", label: "Kernel Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "kernel_extension_activity", label: "Kernel Extension Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "memory_activity", label: "Memory Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "module_activity", label: "Module Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "peripheral_activity", label: "Peripheral Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "process_activity", label: "Process Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "registry_key_activity", label: "Registry Key Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "registry_value_activity", label: "Registry Value Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "scheduled_job_activity", label: "Scheduled Job Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "script_activity", label: "Script Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "windows_resource_activity", label: "Windows Resource Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
      { id: "windows_service_activity", label: "Windows Service Activity", icon: "ocsf-system-activity", categoryId: "system-activity" },
    ],
  },
  {
    id: "findings",
    label: "Findings",
    icon: "ocsf-findings",
    iconClassName: "text-datavis-data-smalt-green-40",
    events: [
      { id: "application_security_posture_finding", label: "Application Security Posture Finding", icon: "ocsf-findings", categoryId: "findings" },
      { id: "compliance_finding", label: "Compliance Finding", icon: "ocsf-findings", categoryId: "findings" },
      { id: "data_security_finding", label: "Data Security Finding", icon: "ocsf-findings", categoryId: "findings" },
      { id: "detection_finding", label: "Detection Finding", icon: "ocsf-findings", categoryId: "findings" },
      { id: "iam_analysis_finding", label: "IAM Analysis Finding", icon: "ocsf-findings", categoryId: "findings" },
      { id: "incident_finding", label: "Incident Finding", icon: "ocsf-findings", categoryId: "findings" },
      { id: "security_finding", label: "Security Finding", icon: "ocsf-findings", categoryId: "findings" },
      { id: "vulnerability_finding", label: "Vulnerability Finding", icon: "ocsf-findings", categoryId: "findings" },
    ],
  },
  {
    id: "identity-access",
    label: "Identity & Access",
    icon: "ocsf-identity-access",
    iconClassName: "text-datavis-data-pop-teal-20",
    events: [
      { id: "account_change", label: "Account Change", icon: "ocsf-identity-access", categoryId: "identity-access" },
      { id: "authentication", label: "Authentication", icon: "ocsf-identity-access", categoryId: "identity-access" },
      { id: "authorize_session", label: "Authorize Session", icon: "ocsf-identity-access", categoryId: "identity-access" },
      { id: "entity_management", label: "Entity Management", icon: "ocsf-identity-access", categoryId: "identity-access" },
      { id: "group_management", label: "Group Management", icon: "ocsf-identity-access", categoryId: "identity-access" },
      { id: "user_access", label: "User Access Management", icon: "ocsf-identity-access", categoryId: "identity-access" },
    ],
  },
  {
    id: "network-activity",
    label: "Network Activity",
    icon: "ocsf-network-activity",
    iconClassName: "text-datavis-data-peanut-orange",
    events: [
      { id: "dhcp_activity", label: "DHCP Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "dns_activity", label: "DNS Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "email_activity", label: "Email Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "email_file_activity", label: "Email File Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "email_url_activity", label: "Email URL Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "ftp_activity", label: "FTP Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "http_activity", label: "HTTP Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "network_activity", label: "Network Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "network_file_activity", label: "Network File Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "ntp_activity", label: "NTP Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "rdp_activity", label: "RDP Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "smb_activity", label: "SMB Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "ssh_activity", label: "SSH Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
      { id: "tunnel_activity", label: "Tunnel Activity", icon: "ocsf-network-activity", categoryId: "network-activity" },
    ],
  },
  {
    id: "discovery",
    label: "Discovery",
    icon: "ocsf-discovery",
    iconClassName: "text-accent-enum",
    events: [
      { id: "inventory_info", label: "Device Inventory Info", icon: "ocsf-discovery", categoryId: "discovery" },
      { id: "user_inventory", label: "User Inventory Info", icon: "ocsf-discovery", categoryId: "discovery" },
      { id: "patch_state", label: "Operating System Patch State", icon: "ocsf-discovery", categoryId: "discovery" },
      { id: "device_config_state_change", label: "Device Config State Change", icon: "ocsf-discovery", categoryId: "discovery" },
      { id: "software_info", label: "Software Inventory Info", icon: "ocsf-discovery", categoryId: "discovery" },
      { id: "osint_inventory_info", label: "OSINT Inventory Info", icon: "ocsf-discovery", categoryId: "discovery" },
      { id: "cloud_resources_inventory_info", label: "Cloud Resources Inventory Info", icon: "ocsf-discovery", categoryId: "discovery" },
      { id: "evidence_info", label: "Live Evidence Info", icon: "ocsf-discovery", categoryId: "discovery" },
    ],
  },
  {
    id: "application-activity",
    label: "Application Activity",
    icon: "ocsf-application-activity",
    iconClassName: "text-datavis-data-rouge-40",
    events: [
      { id: "api_activity", label: "API Activity", icon: "ocsf-application-activity", categoryId: "application-activity" },
      { id: "application_error", label: "Application Error", icon: "ocsf-application-activity", categoryId: "application-activity" },
      { id: "application_lifecycle", label: "Application Lifecycle", icon: "ocsf-application-activity", categoryId: "application-activity" },
      { id: "datastore_activity", label: "Datastore Activity", icon: "ocsf-application-activity", categoryId: "application-activity" },
      { id: "file_hosting", label: "File Hosting Activity", icon: "ocsf-application-activity", categoryId: "application-activity" },
      { id: "scan_activity", label: "Scan Activity", icon: "ocsf-application-activity", categoryId: "application-activity" },
      { id: "web_resource_access_activity", label: "Web Resource Access Activity", icon: "ocsf-application-activity", categoryId: "application-activity" },
      { id: "web_resources_activity", label: "Web Resources Activity", icon: "ocsf-application-activity", categoryId: "application-activity" },
    ],
  },
  {
    id: "remediation",
    label: "Remediation",
    icon: "ocsf-remediation",
    iconClassName: "text-interactive-active",
    events: [
      { id: "file_remediation_activity", label: "File Remediation Activity", icon: "ocsf-remediation", categoryId: "remediation" },
      { id: "network_remediation_activity", label: "Network Remediation Activity", icon: "ocsf-remediation", categoryId: "remediation" },
      { id: "process_remediation_activity", label: "Process Remediation Activity", icon: "ocsf-remediation", categoryId: "remediation" },
      { id: "remediation_activity", label: "Remediation Activity", icon: "ocsf-remediation", categoryId: "remediation" },
    ],
  },
  {
    id: "unmanned-systems",
    label: "Unmanned Systems",
    icon: "ocsf-unmanned-system",
    iconClassName: "text-accent-enum",
    events: [
      { id: "airborne_broadcast_activity", label: "Airborne Broadcast Activity", icon: "ocsf-unmanned-system", categoryId: "unmanned-systems" },
      { id: "drone_flights_activity", label: "Drone Flights Activity", icon: "ocsf-unmanned-system", categoryId: "unmanned-systems" },
    ],
  },
] as const;

export type SearchScopeKind = "entities" | "events";

export type SearchScopeSelection =
  | { kind: "entities"; option: SearchEntityOption }
  | { kind: "events"; option: SearchEventOption };

export function selectionLabel(selection: SearchScopeSelection | null): string {
  if (!selection) return "";
  return selection.option.label;
}

export function selectionIcon(selection: SearchScopeSelection | null): IconName | null {
  if (!selection) return null;
  return selection.option.icon;
}

export function eventCategoryById(categoryId: string): SearchEventCategory | undefined {
  return SEARCH_EVENT_CATEGORIES.find((category) => category.id === categoryId);
}

export function searchEventById(eventId: string): SearchEventOption | undefined {
  for (const category of SEARCH_EVENT_CATEGORIES) {
    const match = category.events.find((event) => event.id === eventId);
    if (match) return match;
  }
  return undefined;
}

export function selectionEventIconClassName(selection: SearchScopeSelection | null): string | null {
  if (!selection || selection.kind !== "events") return null;
  return eventCategoryById(selection.option.categoryId)?.iconClassName ?? null;
}
