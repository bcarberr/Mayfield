import { HTTP_ACTIVITY_MAP_SCHEMA_ENTITIES } from "./httpActivityMapSchemaEntities";
import {
  HTTP_ACTIVITY_ARRAY_FIELD_NAMES,
  HTTP_ACTIVITY_ARRAY_PATHS,
} from "./httpActivityArrayPaths.generated";

/** Enum fields on OCSF HTTP Activity (class 4002). */
const HTTP_ACTIVITY_ENUM_FIELDS = new Set([
  "action_id",
  "activity_id",
  "category_uid",
  "class_uid",
  "confidence_id",
  "disposition_id",
  "risk_level_id",
  "severity_id",
  "status_id",
  "type_id",
]);

/** Array attributes on HTTP Activity — from schema.ocsf.io class http_activity. */
const HTTP_ACTIVITY_ARRAY_FIELDS = new Set<string>(HTTP_ACTIVITY_ARRAY_FIELD_NAMES);

export type HttpActivityEnumValue = {
  id: number;
  label: string;
};

/** OCSF enum captions for HTTP Activity attributes (schema.ocsf.io). */
const HTTP_ACTIVITY_ENUM_VALUES: Record<string, readonly HttpActivityEnumValue[]> = {
  action_id: [
    { id: 0, label: "Unknown" },
    { id: 1, label: "Allowed" },
    { id: 2, label: "Denied" },
    { id: 3, label: "Observed" },
    { id: 4, label: "Modified" },
    { id: 99, label: "Other" },
  ],
  activity_id: [
    { id: 0, label: "Unknown" },
    { id: 1, label: "Create" },
    { id: 2, label: "Read" },
    { id: 3, label: "Update" },
    { id: 4, label: "Delete" },
    { id: 5, label: "Connect" },
    { id: 6, label: "Disconnect" },
    { id: 99, label: "Other" },
  ],
  category_uid: [{ id: 4, label: "Network Activity" }],
  class_uid: [{ id: 4002, label: "HTTP Activity" }],
  confidence_id: [
    { id: 0, label: "Unknown" },
    { id: 1, label: "Low" },
    { id: 2, label: "Medium" },
    { id: 3, label: "High" },
    { id: 99, label: "Other" },
  ],
  disposition_id: [
    { id: 0, label: "Unknown" },
    { id: 1, label: "Allowed" },
    { id: 2, label: "Blocked" },
    { id: 3, label: "Quarantined" },
    { id: 4, label: "Isolated" },
    { id: 5, label: "Deleted" },
    { id: 6, label: "Dropped" },
    { id: 7, label: "Custom Action" },
    { id: 99, label: "Other" },
  ],
  risk_level_id: [
    { id: 0, label: "Info" },
    { id: 1, label: "Low" },
    { id: 2, label: "Medium" },
    { id: 3, label: "High" },
    { id: 4, label: "Critical" },
  ],
  severity_id: [
    { id: 0, label: "Unknown" },
    { id: 1, label: "Informational" },
    { id: 2, label: "Low" },
    { id: 3, label: "Medium" },
    { id: 4, label: "High" },
    { id: 5, label: "Critical" },
    { id: 6, label: "Fatal" },
    { id: 99, label: "Other" },
  ],
  status_id: [
    { id: 0, label: "Unknown" },
    { id: 1, label: "Success" },
    { id: 2, label: "Failure" },
    { id: 99, label: "Other" },
  ],
  type_id: [
    { id: 400201, label: "HTTP Activity: Create" },
    { id: 400202, label: "HTTP Activity: Read" },
    { id: 400203, label: "HTTP Activity: Update" },
    { id: 400204, label: "HTTP Activity: Delete" },
    { id: 400205, label: "HTTP Activity: Connect" },
    { id: 400206, label: "HTTP Activity: Disconnect" },
  ],
};

const HTTP_ACTIVITY_RECOMMENDED_PATHS = [
  "activity_id",
  "activity_name",
  "category_uid",
  "category_name",
  "severity_id",
  "severity",
  "type_uid",
  "type_name",
] as const;

/** Leaf paths beyond the entity-grouped basic view. */
const HTTP_ACTIVITY_ADDITIONAL_PATHS = [
  "message",
  "status",
  "status_code",
  "status_detail",
  "status_id",
  "class_uid",
  "class_name",
  "count",
  "duration",
  "start_time",
  "end_time",
  "raw_data",
  "http_request.http_method",
  "http_request.version",
  "http_request.referrer",
  "http_request.x_forwarded_for",
  "http_response.code",
  "http_response.status",
  "http_response.latency",
  "http_response.length",
  "http_response.content_type",
  "traffic.bytes_in",
  "traffic.bytes_out",
  "metadata.product.name",
  "metadata.product.vendor_name",
  "metadata.version",
  "src_endpoint.hostname",
  "dst_endpoint.hostname",
  "src_endpoint.name",
  "dst_endpoint.name",
  "actor.session.uid",
  "actor.user.type_id",
  "actor.user.domain",
  "cloud.provider",
  "cloud.region",
  "device.ip",
  "device.hostname",
  "device.type_id",
  "device.name",
  "file.size",
  "file.type_id",
  "file.path",
  "unmapped",
] as const;

function collectEntityPaths(): string[] {
  const paths = new Set<string>();
  for (const entity of HTTP_ACTIVITY_MAP_SCHEMA_ENTITIES) {
    for (const path of entity.paths) paths.add(path);
  }
  return [...paths];
}

/** Full HTTP Activity OCSF schema — flat leaf paths for advanced mapping mode. */
export function getHttpActivityFullSchemaPaths(): readonly string[] {
  const all = new Set<string>([
    ...collectEntityPaths(),
    ...HTTP_ACTIVITY_RECOMMENDED_PATHS,
    ...HTTP_ACTIVITY_ADDITIONAL_PATHS,
    ...HTTP_ACTIVITY_ARRAY_PATHS,
  ]);
  return [...all].sort((a, b) => a.localeCompare(b));
}

export function isHttpActivityEnumField(fieldPath: string): boolean {
  const leaf = fieldPath.split(".").at(-1) ?? fieldPath;
  return HTTP_ACTIVITY_ENUM_FIELDS.has(leaf.toLowerCase());
}

export function isHttpActivityArrayField(fieldPath: string): boolean {
  const leaf = fieldPath.split(".").at(-1) ?? fieldPath;
  return HTTP_ACTIVITY_ARRAY_FIELDS.has(leaf.toLowerCase());
}

/** Scalar leaf fields that can be dragged to map (excludes enum, object, array containers). */
export function isHttpActivitySimpleMappableField(
  fieldPath: string,
  options: { hasPathChildren: boolean; isEnumValue?: boolean },
): boolean {
  if (options.isEnumValue) return true;
  if (options.hasPathChildren) return false;
  if (isHttpActivityEnumField(fieldPath)) return false;
  if (isHttpActivityArrayField(fieldPath)) return false;
  return true;
}

export function getHttpActivityEnumValues(fieldPath: string): readonly HttpActivityEnumValue[] {
  const leaf = fieldPath.split(".").at(-1) ?? fieldPath;
  return HTTP_ACTIVITY_ENUM_VALUES[leaf.toLowerCase()] ?? [];
}

/**
 * Advanced Mode → Attributes: Show All
 * Top-level HTTP Activity attributes in Figma Config-Schema-v2 order (corrected OCSF spellings).
 */
export type HttpActivityShowAllAttribute = {
  name: string;
  /** Display label override (e.g. time*). */
  label?: string;
  required?: boolean;
};

export const HTTP_ACTIVITY_SHOW_ALL_ATTRIBUTES: readonly HttpActivityShowAllAttribute[] = [
  { name: "time", label: "time*", required: true },
  { name: "action_id" },
  { name: "action" },
  { name: "activity_id" },
  { name: "activity_name" },
  { name: "actor" },
  { name: "api" },
  { name: "app_name" },
  { name: "attacks" },
  { name: "authorizations" },
  { name: "cloud" },
  { name: "confidence_id" },
  { name: "confidence_name" },
  { name: "confidence_score" },
  { name: "connection_info" },
  { name: "count" },
  { name: "device" },
  { name: "disposition_id" },
  { name: "disposition" },
  { name: "dst_endpoint" },
  { name: "duration" },
  { name: "end_time" },
  { name: "end_time_dt" },
  { name: "enrichments" },
  { name: "file" },
  { name: "firewall_rule" },
  { name: "http_cookies" },
  { name: "http_request" },
  { name: "http_response" },
  { name: "is_alert" },
  { name: "ja4_fingerprint_list" },
  { name: "load_balancer" },
  { name: "malware" },
  { name: "message" },
  { name: "metadata" },
  { name: "policy" },
  { name: "proxy_connection_info" },
  { name: "proxy_endpoint" },
  { name: "proxy_http_request" },
  { name: "proxy_tls" },
  { name: "proxy_traffic" },
  { name: "raw_data" },
  { name: "risk_details" },
  { name: "risk_level_id" },
  { name: "risk_level" },
  { name: "risk_score" },
  { name: "severity_id" },
  { name: "severity" },
  { name: "src_endpoint" },
  { name: "status_id" },
  { name: "status" },
  { name: "status_detail" },
  { name: "trace" },
  { name: "traffic" },
] as const;

/** Object-like top-level attributes that expand even without nested demo paths yet. */
const HTTP_ACTIVITY_SHOW_ALL_OBJECT_ROOTS = new Set([
  "actor",
  "api",
  "cloud",
  "connection_info",
  "device",
  "dst_endpoint",
  "file",
  "firewall_rule",
  "http_request",
  "http_response",
  "load_balancer",
  "metadata",
  "policy",
  "proxy_connection_info",
  "proxy_endpoint",
  "proxy_http_request",
  "proxy_tls",
  "proxy_traffic",
  "src_endpoint",
  "trace",
  "traffic",
]);

export function getHttpActivityShowAllAttributes(): readonly HttpActivityShowAllAttribute[] {
  return HTTP_ACTIVITY_SHOW_ALL_ATTRIBUTES;
}

export function isHttpActivityShowAllObjectRoot(fieldPath: string): boolean {
  return HTTP_ACTIVITY_SHOW_ALL_OBJECT_ROOTS.has(fieldPath.toLowerCase());
}
