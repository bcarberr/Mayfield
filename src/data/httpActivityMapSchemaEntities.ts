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
    id: "country",
    label: "Country",
    paths: ["src_endpoint.location.country", "dst_endpoint.location.country"],
  },
  {
    id: "email-address",
    label: "Email Address",
    paths: ["actor.user.email_addr"],
  },
  {
    id: "file-hash",
    label: "File Hash",
    paths: ["file.hashes.md5", "file.hashes.sha256"],
  },
  {
    id: "filename",
    label: "Filename",
    paths: ["file.name"],
  },
  {
    id: "hostname",
    label: "Hostname",
    paths: ["src_endpoint.domain", "dst_endpoint.domain"],
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
    id: "serial-number",
    label: "Serial Number",
    paths: ["device.serial_number"],
  },
  {
    id: "subnet",
    label: "Subnet",
    paths: ["src_endpoint.subnet_uid", "dst_endpoint.subnet_uid"],
  },
  {
    id: "url",
    label: "URL",
    paths: ["http_request.url"],
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
