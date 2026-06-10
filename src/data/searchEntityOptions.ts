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

/** Figma Events picker (`3715:16483`) — left categories, right event types. */
export const DEFAULT_EVENT_CATEGORY_ID = "unmanned-systems";

export const SEARCH_EVENT_CATEGORIES: readonly SearchEventCategory[] = [
  {
    id: "system-activity",
    label: "System Activity",
    icon: "ocsf-system-activity",
    iconClassName: "text-datavis-data-weak-red-30",
    events: [
      {
        id: "system-activity",
        label: "System Activity",
        icon: "ocsf-system-activity",
        categoryId: "system-activity",
      },
    ],
  },
  {
    id: "findings",
    label: "Findings",
    icon: "ocsf-findings",
    iconClassName: "text-datavis-data-smalt-green-40",
    events: [
      {
        id: "detection-finding",
        label: "Detection Finding",
        icon: "ocsf-findings",
        categoryId: "findings",
      },
    ],
  },
  {
    id: "identity-access",
    label: "Identity & Access",
    icon: "ocsf-identity-access",
    iconClassName: "text-datavis-data-pop-teal-20",
    events: [
      {
        id: "authentication",
        label: "Authentication",
        icon: "ocsf-identity-access",
        categoryId: "identity-access",
      },
      {
        id: "authorization",
        label: "Authorization",
        icon: "ocsf-authorization",
        categoryId: "identity-access",
      },
    ],
  },
  {
    id: "network-activity",
    label: "Network Activity",
    icon: "ocsf-network-activity",
    iconClassName: "text-datavis-data-peanut-orange",
    events: [
      {
        id: "network-activity",
        label: "Network Activity",
        icon: "ocsf-network-activity",
        categoryId: "network-activity",
      },
      {
        id: "dns-activity",
        label: "DNS Activity",
        icon: "ocsf-dns-activity",
        categoryId: "network-activity",
      },
    ],
  },
  {
    id: "discovery",
    label: "Discovery",
    icon: "ocsf-discovery",
    iconClassName: "text-accent-enum",
    events: [
      {
        id: "discovery",
        label: "Discovery",
        icon: "ocsf-discovery",
        categoryId: "discovery",
      },
    ],
  },
  {
    id: "application-activity",
    label: "Application Activity",
    icon: "ocsf-application-activity",
    iconClassName: "text-datavis-data-rouge-40",
    events: [
      {
        id: "application-activity",
        label: "Application Activity",
        icon: "ocsf-application-activity",
        categoryId: "application-activity",
      },
      {
        id: "process-activity",
        label: "Process Activity",
        icon: "ocsf-process-activity",
        categoryId: "application-activity",
      },
    ],
  },
  {
    id: "remediation",
    label: "Remediation",
    icon: "ocsf-remediation",
    iconClassName: "text-interactive-active",
    events: [
      {
        id: "remediation",
        label: "Remediation",
        icon: "ocsf-remediation",
        categoryId: "remediation",
      },
    ],
  },
  {
    id: "unmanned-systems",
    label: "Unmanned Systems",
    icon: "ocsf-unmanned-system",
    iconClassName: "text-accent-enum",
    events: [
      {
        id: "drone-flights-activity",
        label: "Drone Flights Activity",
        icon: "ocsf-unmanned-system",
        categoryId: "unmanned-systems",
      },
      {
        id: "airborne-broadcast-activity",
        label: "Airborne Broadcast Activity",
        icon: "ocsf-unmanned-system",
        categoryId: "unmanned-systems",
      },
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
