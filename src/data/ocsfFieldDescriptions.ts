/**
 * OCSF field descriptions for HTTP Activity mapping.
 * Source: https://schema.ocsf.io/1.3.0/ (objects, attributes, and HTTP Activity class).
 */

/** Leaf and composite path descriptions keyed by normalized dot-path. */
const OCSF_FIELD_DESCRIPTIONS: Record<string, string> = {
  "actor.user.account.uid": "The unique identifier of the account (e.g. AWS Account ID).",
  "actor.process.user.account.uid":
    "The unique identifier of the account associated with the process actor user.",
  "actor.user.account.name": "The name of the account (e.g. GCP Account Name).",
  "actor.process.user.account.name":
    "The name of the account associated with the process actor user.",
  "cloud.account.uid": "The unique identifier of the account (e.g. AWS Account ID).",
  "cloud.account.name": "The name of the account (e.g. GCP Account Name).",
  "actor.user.uid":
    "The unique user identifier. For example, the Windows user SID, ActiveDirectory DN or AWS user ARN.",
  "actor.user.name": "The username. For example, `janedoe1`.",
  "actor.user.email_addr": "The user's primary email address.",
  "src_endpoint.location.country": "The name of the country.",
  "dst_endpoint.location.country": "The name of the country.",
  "src_endpoint.ip": "The IP address of the endpoint, in either IPv4 or IPv6 format.",
  "dst_endpoint.ip": "The IP address of the endpoint, in either IPv4 or IPv6 format.",
  "src_endpoint.port": "The port used for communication within the network connection.",
  "dst_endpoint.port": "The port used for communication within the network connection.",
  "src_endpoint.domain": "The name of the domain.",
  "dst_endpoint.domain": "The name of the domain.",
  "src_endpoint.mac": "The Media Access Control (MAC) address of the endpoint.",
  "dst_endpoint.mac": "The Media Access Control (MAC) address of the endpoint.",
  "src_endpoint.subnet_uid": "The unique identifier of a virtual subnet.",
  "dst_endpoint.subnet_uid": "The unique identifier of a virtual subnet.",
  "http_request.url": "The URL object that pertains to the request.",
  "http_request.user_agent":
    "The request header that identifies the operating system and web browser.",
  "file.name": "The name of the file. For example: `svchost.exe`.",
  "file.hashes.md5": "MD5 message-digest hash fingerprint of the file.",
  "file.hashes.sha256": "SHA-256 hash fingerprint of the file.",
  "device.serial_number": "The serial number of the device hardware.",
  activity_id: "The normalized identifier of the activity that triggered the event.",
  activity_name: "The event activity name, as defined by the activity_id.",
  category_uid: "The category unique identifier of the event.",
  category_name: "The event category name, as defined by category_uid.",
  severity_id:
    "The normalized severity is a measurement of the effort and expense required to manage and resolve an event or incident.",
  severity: "The event/finding severity, normalized to the caption of the severity_id value.",
  type_uid:
    "The event/finding type ID. It identifies the event's semantics and structure.",
  type_name: "The event/finding type name, as defined by the type_uid.",
  time: "The normalized event occurrence time or the finding creation time.",
};

/** Observable entity category blurbs aligned to OCSF attribute captions. */
const OCSF_ENTITY_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "account-id": OCSF_FIELD_DESCRIPTIONS["actor.user.account.uid"],
  "account-name": OCSF_FIELD_DESCRIPTIONS["actor.user.account.name"],
  country:
    "The Geo Location object describes a geographical location, usually associated with an IP address.",
  "email-address": OCSF_FIELD_DESCRIPTIONS["actor.user.email_addr"],
  "file-hash": "An array of hash attributes.",
  filename: OCSF_FIELD_DESCRIPTIONS["file.name"],
  hostname: "The name of the domain.",
  "ip-address": OCSF_FIELD_DESCRIPTIONS["src_endpoint.ip"],
  "mac-address": OCSF_FIELD_DESCRIPTIONS["src_endpoint.mac"],
  port: OCSF_FIELD_DESCRIPTIONS["src_endpoint.port"],
  "serial-number": OCSF_FIELD_DESCRIPTIONS["device.serial_number"],
  subnet: OCSF_FIELD_DESCRIPTIONS["src_endpoint.subnet_uid"],
  url: OCSF_FIELD_DESCRIPTIONS["http_request.url"],
  "user-agent": OCSF_FIELD_DESCRIPTIONS["http_request.user_agent"],
  "user-id": OCSF_FIELD_DESCRIPTIONS["actor.user.uid"],
  "user-name": OCSF_FIELD_DESCRIPTIONS["actor.user.name"],
};

const LEAF_ATTRIBUTE_DESCRIPTIONS: Record<string, string> = {
  uid: "The unique identifier.",
  name: "The name.",
  ip: "The IP address of the endpoint, in either IPv4 or IPv6 format.",
  port: "The port used for communication within the network connection.",
  domain: "The name of the domain.",
  mac: "The Media Access Control (MAC) address of the endpoint.",
  country: "The name of the country.",
  subnet_uid: "The unique identifier of a virtual subnet.",
  email_addr: "The user's primary email address.",
  url: "The URL object that pertains to the request.",
  user_agent: "The request header that identifies the operating system and web browser.",
  serial_number: "The serial number of the device hardware.",
  md5: "MD5 message-digest hash fingerprint of the file.",
  sha256: "SHA-256 hash fingerprint of the file.",
};

function normalizeOcsfFieldKey(fieldPath: string): string {
  return fieldPath.trim().replace(/\./g, "").replace(/_/g, "").toLowerCase();
}

export function formatOcsfPathLabel(fieldPath: string): string {
  return fieldPath.toLowerCase();
}

export function getOcsfFieldDescription(fieldPath: string): string {
  const key = fieldPath.toLowerCase();
  const direct = OCSF_FIELD_DESCRIPTIONS[key];
  if (direct) return direct;

  const normalized = normalizeOcsfFieldKey(fieldPath);
  const normalizedMatch = Object.entries(OCSF_FIELD_DESCRIPTIONS).find(
    ([candidate]) => normalizeOcsfFieldKey(candidate) === normalized,
  );
  if (normalizedMatch) return normalizedMatch[1];

  const leaf = key.split(".").at(-1);
  if (leaf && LEAF_ATTRIBUTE_DESCRIPTIONS[leaf]) {
    return LEAF_ATTRIBUTE_DESCRIPTIONS[leaf];
  }

  return `OCSF field on HTTP Activity: ${formatOcsfPathLabel(fieldPath)}.`;
}

export function getOcsfEntityCategoryDescription(entity: {
  id: string;
  paths: readonly string[];
}): string {
  const category = OCSF_ENTITY_CATEGORY_DESCRIPTIONS[entity.id];
  if (category) return category;

  if (entity.paths[0]) return getOcsfFieldDescription(entity.paths[0]);
  return "Observable entity mapped to HTTP Activity fields.";
}

export function ocsfFieldMappingTag(fieldPath: string): string {
  return formatOcsfPathLabel(fieldPath).replace(/\./g, "_");
}
