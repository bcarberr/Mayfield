import ocsfApplicationActivity from "./ocsf-application-activity.svg?raw";
import ocsfAuthorization from "./ocsf-authorization.svg?raw";
import ocsfDiscovery from "./ocsf-discovery.svg?raw";
import ocsfDnsActivity from "./ocsf-dns-activity.svg?raw";
import ocsfEmailDelivery from "./ocsf-email-delivery.svg?raw";
import ocsfFileSystemActivity from "./ocsf-file-system-activity.svg?raw";
import ocsfFindings from "./ocsf-findings.svg?raw";
import ocsfIdentityAccess from "./ocsf-identity-access.svg?raw";
import ocsfNetworkActivity from "./ocsf-network-activity.svg?raw";
import ocsfProcessActivity from "./ocsf-process-activity.svg?raw";
import ocsfRemediation from "./ocsf-remediation.svg?raw";
import ocsfSystemActivity from "./ocsf-system-activity.svg?raw";
import ocsfUnmannedSystem from "./ocsf-unmanned-system.svg?raw";

/**
 * OCSF Events category icons from Figma frame “OCSF Events” (node 1119:1293), v1 Query DS Library.
 * Exported via Figma Dev Mode MCP. `ocsf-network-activity` is distinct from legacy `network-activity`.
 */
export const OCSF_EVENT_ICON_NAMES = [
  "ocsf-application-activity",
  "ocsf-authorization",
  "ocsf-discovery",
  "ocsf-dns-activity",
  "ocsf-email-delivery",
  "ocsf-file-system-activity",
  "ocsf-findings",
  "ocsf-identity-access",
  "ocsf-network-activity",
  "ocsf-process-activity",
  "ocsf-remediation",
  "ocsf-system-activity",
  "ocsf-unmanned-system",
] as const;

export type OcsfEventIconName = (typeof OCSF_EVENT_ICON_NAMES)[number];

export const OCSF_EVENT_RAW_BY_NAME: Record<OcsfEventIconName, string> = {
  "ocsf-application-activity": ocsfApplicationActivity,
  "ocsf-authorization": ocsfAuthorization,
  "ocsf-discovery": ocsfDiscovery,
  "ocsf-dns-activity": ocsfDnsActivity,
  "ocsf-email-delivery": ocsfEmailDelivery,
  "ocsf-file-system-activity": ocsfFileSystemActivity,
  "ocsf-findings": ocsfFindings,
  "ocsf-identity-access": ocsfIdentityAccess,
  "ocsf-network-activity": ocsfNetworkActivity,
  "ocsf-process-activity": ocsfProcessActivity,
  "ocsf-remediation": ocsfRemediation,
  "ocsf-system-activity": ocsfSystemActivity,
  "ocsf-unmanned-system": ocsfUnmannedSystem,
};
