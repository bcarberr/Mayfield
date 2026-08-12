export type MapSchemaEntity = {
  id: string;
  label: string;
  /** Lowercase OCSF field paths on the HTTP Activity event class. */
  paths: readonly string[];
};

/**
 * Observable entities mappable on OCSF HTTP Activity (class 4002).
 * Paths are limited to fields present on the event class — actor, cloud,
 * src/dst endpoints, http_request, file, and device.
 */
export const HTTP_ACTIVITY_MAP_SCHEMA_ENTITIES: readonly MapSchemaEntity[] = [
  {
    id: "account-id",
    label: "Account ID",
    paths: ["actor.user.account.uid", "actor.process.user.account.uid", "cloud.account.uid"],
  },
  {
    id: "account-name",
    label: "Account Name",
    paths: ["actor.user.account.name", "actor.process.user.account.name", "cloud.account.name"],
  },
  {
    id: "advisory-id",
    label: "Advisory ID",
    paths: ["osint.vulnerabilities.advisory.uid"],
  },
  {
    id: "command-line",
    label: "Command Line",
    paths: ["actor.process.cmd_line"],
  },
  {
    id: "country",
    label: "Country",
    paths: ["src_endpoint.location.country", "dst_endpoint.location.country"],
  },
  {
    id: "credential-id",
    label: "Credential ID",
    paths: ["actor.user.credential_uid", "actor.process.user.credential_uid"],
  },
  {
    id: "cve-id",
    label: "CVE ID",
    paths: ["malware.cves.uid"],
  },
  {
    id: "cwe-id",
    label: "CWE ID",
    paths: ["malware.cves.cwe.uid"],
  },
  {
    id: "email-address",
    label: "Email Address",
    paths: ["actor.user.email_addr"],
  },
  {
    id: "email-message-uid",
    label: "Email Message UID",
    paths: ["osint.email.message_uid"],
  },
  {
    id: "email-subject",
    label: "Email Subject",
    paths: ["osint.email.subject"],
  },
  {
    id: "email-uid",
    label: "Email UID",
    paths: ["osint.email.uid"],
  },
  {
    id: "file-hash",
    label: "File Hash",
    paths: ["file.hashes.value"],
  },
  {
    id: "filename",
    label: "Filename",
    paths: ["file.name"],
  },
  {
    id: "group-id",
    label: "Group ID",
    paths: ["actor.user.groups.uid", "actor.process.group.uid"],
  },
  {
    id: "group-name",
    label: "Group Name",
    paths: ["actor.user.groups.name", "actor.process.group.name"],
  },
  {
    id: "hostname",
    label: "Hostname",
    paths: ["src_endpoint.hostname", "dst_endpoint.hostname"],
  },
  {
    id: "ip-address",
    label: "IP Address",
    paths: ["src_endpoint.ip", "dst_endpoint.ip"],
  },
  {
    id: "mac-address",
    label: "MAC Address",
    paths: ["src_endpoint.mac", "dst_endpoint.mac"],
  },
  {
    id: "port",
    label: "Port",
    paths: ["src_endpoint.port", "dst_endpoint.port"],
  },
  {
    id: "process-id",
    label: "Process ID",
    paths: ["actor.process.pid"],
  },
  {
    id: "process-name",
    label: "Process Name",
    paths: ["actor.process.name"],
  },
  {
    id: "process-uid",
    label: "Process UID",
    paths: ["actor.process.uid"],
  },
  {
    id: "resource-id",
    label: "Resource ID",
    paths: ["actor.iam_role.resources.uid"],
  },
  {
    id: "resource-name",
    label: "Resource Name",
    paths: ["actor.iam_role.resources.name"],
  },
  {
    id: "serial-number",
    label: "Serial Number",
    paths: ["device.hw_info.serial_number"],
  },
  {
    id: "subnet",
    label: "Subnet",
    paths: ["device.subnet"],
  },
  {
    id: "url",
    label: "URL",
    paths: ["http_request.url.url_string"],
  },
  {
    id: "user-agent",
    label: "User Agent",
    paths: ["http_request.user_agent"],
  },
  {
    id: "user-id",
    label: "User ID",
    paths: ["actor.user.uid"],
  },
  {
    id: "user-name",
    label: "User Name",
    paths: ["actor.user.name"],
  },
];

export type MapSchemaEventClassId = "http_activity";

const ENTITIES_BY_EVENT_CLASS: Record<MapSchemaEventClassId, readonly MapSchemaEntity[]> = {
  http_activity: HTTP_ACTIVITY_MAP_SCHEMA_ENTITIES,
};

export function getMapSchemaEntitiesForEventClass(
  eventClassId: MapSchemaEventClassId,
): readonly MapSchemaEntity[] {
  return ENTITIES_BY_EVENT_CLASS[eventClassId] ?? [];
}
