/** Demo source fields from connector customer sample data.
 * Copilot automap covers ~80% of MAP Schema entity paths and ~90% of Recommended fields.
 * Includes a few customer-side enums (expandable parents + value children) for Enums v2 demos.
 */

import { HTTP_ACTIVITY_MAP_SCHEMA_ENTITIES } from "./httpActivityMapSchemaEntities";
import { ocsfFieldMappingTag } from "./ocsfFieldDescriptions";

export type HttpActivityDemoSourceRow = {
  source: string;
  sample: string;
  mapped: boolean;
  tags?: string[];
  /** Expandable customer-side enum parent (e.g. cus_activity). */
  sourceEnum?: boolean;
  /** Parent source key when this row is a value under a customer enum. */
  parentSource?: string;
};

const DEMO_SOURCE_FIELDS: readonly {
  source: string;
  sample: string;
  sourceEnum?: boolean;
  parentSource?: string;
}[] = [
  { source: "action", sample: "Allowed" },
  { source: "appclass", sample: "General Browsing" },
  { source: "appname", sample: "General Browsing" },
  { source: "bwclassname", sample: "None" },
  { source: "bwrulename", sample: "None" },
  { source: "bwthrottle", sample: "No" },
  // Customer-side activity enum (maps to OCSF activity_id)
  { source: "Activity_name", sample: "Create", sourceEnum: true },
  { source: "activity_connect_1", sample: "Connect_1", parentSource: "Activity_name" },
  { source: "activity_options", sample: "options", parentSource: "Activity_name" },
  { source: "activity_head", sample: "head", parentSource: "Activity_name" },
  { source: "activity_post", sample: "Post", parentSource: "Activity_name" },
  { source: "activity_delete", sample: "delete", parentSource: "Activity_name" },
  { source: "activity_unknown", sample: "unknown", parentSource: "Activity_name" },
  { source: "activity_put", sample: "put", parentSource: "Activity_name" },
  { source: "activity_trace", sample: "Trace", parentSource: "Activity_name" },
  { source: "activity_connect", sample: "connect", parentSource: "Activity_name" },
  { source: "clientip", sample: "76.95.243.98" },
  { source: "clientpublicip", sample: "176.95.243.98" },
  { source: "clientsslcipher", sample: "TLS1_3_CK_AES_256_GCM_SHA384" },
  { source: "clientsslversion", sample: "TLSv1.3" },
  { source: "cs_method", sample: "GET" },
  { source: "cs_uri", sample: "/api/v1/health" },
  { source: "cs_host", sample: "api.example.com" },
  { source: "cs_referer", sample: "https://app.example.com/" },
  { source: "cs_user_agent", sample: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  { source: "cs_bytes", sample: "312" },
  { source: "sc_bytes", sample: "2048" },
  { source: "sc_status", sample: "200" },
  { source: "s_ip", sample: "52.84.12.10" },
  { source: "s_port", sample: "443" },
  { source: "c_port", sample: "51882" },
  { source: "time_taken", sample: "128" },
  { source: "duration", sample: "128" },
  { source: "protocol", sample: "HTTPS" },
  { source: "proxy_ip", sample: "10.10.0.5" },
  { source: "proxy_port", sample: "8080" },
  { source: "x_forwarded_for", sample: "203.0.113.10" },
  { source: "url_scheme", sample: "https" },
  { source: "url_path", sample: "/api/v1/health" },
  { source: "url_query", sample: "id=42" },
  { source: "url_port", sample: "443" },
  { source: "content_type", sample: "application/json" },
  { source: "request_len", sample: "312" },
  { source: "response_len", sample: "2048" },
  { source: "latency_ms", sample: "45" },
  { source: "packets_in", sample: "12" },
  { source: "packets_out", sample: "18" },
  { source: "direction", sample: "Outbound" },
  { source: "username", sample: "jdoe" },
  { source: "userdomain", sample: "EXAMPLE" },
  { source: "authmethod", sample: "none" },
  { source: "sessionid", sample: "sess-9f3a" },
  { source: "virus_id", sample: "" },
  { source: "malware_name", sample: "" },
  { source: "risk_score", sample: "12" },
  { source: "category", sample: "Network" },
  { source: "subcategory", sample: "HTTP" },
  { source: "filter_result", sample: "Observed" },
  { source: "disposition", sample: "Allowed" },
  { source: "threat_id", sample: "" },
  { source: "rule_id", sample: "r-204" },
  { source: "policy_name", sample: "allow-web" },
  { source: "device_name", sample: "Perimeter Firewall" },
  { source: "device_ip", sample: "10.0.1.22" },
  { source: "site_name", sample: "site-east" },
  { source: "tenant", sample: "t-01" },
  { source: "vendor", sample: "Blue Coat" },
  { source: "product", sample: "ProxySG" },
  { source: "log_version", sample: "1.0" },
  { source: "event_time", sample: "2024-06-01T12:00:00.128Z" },
  { source: "start_time", sample: "2024-06-01T12:00:00Z" },
  { source: "end_time", sample: "2024-06-01T12:00:01Z" },
  // Customer-side status enum (maps to OCSF status_id)
  { source: "cus_status", sample: "Success", sourceEnum: true },
  { source: "status_success", sample: "success", parentSource: "cus_status" },
  { source: "status_failure", sample: "failure", parentSource: "cus_status" },
  { source: "status_unknown", sample: "unknown", parentSource: "cus_status" },
  { source: "status", sample: "Success" },
  { source: "status_code", sample: "0" },
  { source: "status_detail", sample: "ok" },
  { source: "message", sample: "Request completed" },
  { source: "dst_host", sample: "api.example.com" },
  { source: "dst_ip", sample: "52.84.12.10" },
  { source: "dst_port", sample: "443" },
  { source: "src_mac", sample: "00:1a:2b:3c:4d:5e" },
  { source: "dst_mac", sample: "00:0a:95:9d:68:16" },
  { source: "tls_sni", sample: "api.example.com" },
  { source: "ja3", sample: "e7d705a3286e19ea42f587b344ee6865" },
  { source: "cache_status", sample: "MISS" },
  { source: "waf_action", sample: "allow" },
  { source: "waf_rule", sample: "SQLi-100" },
  // Customer-side severity enum (maps to OCSF severity_id)
  { source: "cus_severity", sample: "Medium", sourceEnum: true },
  { source: "severity_informational", sample: "informational", parentSource: "cus_severity" },
  { source: "severity_low", sample: "low", parentSource: "cus_severity" },
  { source: "severity_medium", sample: "medium", parentSource: "cus_severity" },
  { source: "severity_high", sample: "high", parentSource: "cus_severity" },
  // Empty customer enum — used to demo the "no enum values" error after mapping.
  { source: "cus_empty_enum", sample: "n/a", sourceEnum: true },
  { source: "geo_country", sample: "US" },
  { source: "geo_city", sample: "Austin" },
  { source: "bytes_total", sample: "2360" },
  { source: "request_id", sample: "req-abc123" },
];

/** Recommended MAP Schema fields (keep in sync with AmazonAthenaMapReviewStep). */
export const HTTP_ACTIVITY_DEMO_RECOMMENDED_FIELDS = [
  "activity_id",
  "activity_name",
  "category_uid",
  "category_name",
  "severity_id",
  "severity",
  "type_id",
  "type_name",
] as const;

const ENTITY_PATHS = HTTP_ACTIVITY_MAP_SCHEMA_ENTITIES.flatMap((entity) => [...entity.paths]);

/** ~80% of entity paths (22 of 27). */
const ENTITY_PATHS_TO_MAP = ENTITY_PATHS.slice(0, Math.round(ENTITY_PATHS.length * 0.8));

/** ~90% of recommended fields (7 of 8) — leave `type_id` unmapped for the demo gap. */
const RECOMMENDED_FIELDS_TO_MAP = HTTP_ACTIVITY_DEMO_RECOMMENDED_FIELDS.filter(
  (field) => field !== "type_id",
);

const PRIORITY_TAGS = [
  ...RECOMMENDED_FIELDS_TO_MAP.map((field) => ocsfFieldMappingTag(field)),
  ...ENTITY_PATHS_TO_MAP.map((path) => ocsfFieldMappingTag(path)),
];

/** Required MAP Schema `time*` must always map from a source time column. */
const REQUIRED_TIME_SOURCE = "event_time";
const REQUIRED_TIME_TAG = ocsfFieldMappingTag("time");

/**
 * Explicit source → OCSF tag overrides (wins over cycling).
 * Customer enum parents map to OCSF enums; value children stay unmapped until the user maps them.
 */
const SOURCE_TAG_OVERRIDES: Readonly<Record<string, readonly string[]>> = {
  [REQUIRED_TIME_SOURCE]: [REQUIRED_TIME_TAG],
  Activity_name: ["activity_id"],
  cus_status: ["status_id"],
  cus_severity: ["severity_id"],
  clientip: ["src_endpoint_ip", "src_endpoint_name"],
  clientpublicip: ["src_endpoint_ip", "http_request_x_forwarded_for"],
  cs_method: ["http_request_http_method", "activity_name"],
  cs_uri: ["http_request_url_path", "http_request_url", "http_request_url_url_string"],
  cs_host: ["http_request_url_hostname", "dst_endpoint_hostname", "dst_endpoint_domain"],
  s_ip: ["dst_endpoint_ip", "dst_endpoint_name"],
  username: ["actor_user_name", "actor_user_uid", "actor_user_email_addr"],
  dst_host: ["dst_endpoint_hostname", "dst_endpoint_domain", "http_request_url_hostname"],
  geo_country: ["src_endpoint_location_country", "dst_endpoint_location_country"],
  device_ip: ["device_ip", "src_endpoint_ip"],
};

/** Vendor / low-signal columns left unmapped on purpose. */
const UNMAPPED_SOURCES = new Set([
  "bwclassname",
  "bwrulename",
  "bwthrottle",
  "virus_id",
  "threat_id",
  "waf_rule",
  "ja3",
  "cache_status",
  // Empty enum parent — maps only when the user maps it (shows "no values" error).
  "cus_empty_enum",
]);

function uniqueTags(tags: readonly string[]): string[] {
  return [...new Set(tags)];
}

function buildMappedRows(): HttpActivityDemoSourceRow[] {
  const tags = PRIORITY_TAGS.filter(
    (tag) => tag !== REQUIRED_TIME_TAG && tag !== "activity_id" && tag !== "severity_id",
  );
  let tagIndex = 0;

  return DEMO_SOURCE_FIELDS.map((field) => {
    if (UNMAPPED_SOURCES.has(field.source)) {
      return { ...field, mapped: false };
    }
    // Enum value children are never auto-mapped — only appear after the parent is mapped.
    if (field.parentSource) {
      return { ...field, mapped: false };
    }
    const override = SOURCE_TAG_OVERRIDES[field.source];
    if (override) {
      return { ...field, mapped: true, tags: uniqueTags(override) };
    }
    const tag = tags[tagIndex % tags.length]!;
    tagIndex += 1;
    return { ...field, mapped: true, tags: [tag] };
  });
}

export const HTTP_ACTIVITY_DEMO_INITIAL_ROWS: readonly HttpActivityDemoSourceRow[] = DEMO_SOURCE_FIELDS.map(
  (field) => ({
    ...field,
    mapped: false,
  }),
);

export const HTTP_ACTIVITY_DEMO_MAPPED_ROWS: readonly HttpActivityDemoSourceRow[] = buildMappedRows();

export function buildHttpActivityDemoMappedRows(
  sourceRows: readonly HttpActivityDemoSourceRow[],
): HttpActivityDemoSourceRow[] {
  const bySource = new Map(HTTP_ACTIVITY_DEMO_MAPPED_ROWS.map((row) => [row.source, row]));
  return sourceRows.map((row) => {
    const mapped = bySource.get(row.source);
    if (!mapped?.mapped || !mapped.tags?.length) {
      return {
        ...row,
        mapped: false,
        tags: undefined,
        sourceEnum: row.sourceEnum ?? mapped?.sourceEnum,
        parentSource: row.parentSource ?? mapped?.parentSource,
      };
    }
    return {
      ...row,
      mapped: true,
      tags: [...mapped.tags],
      sourceEnum: row.sourceEnum ?? mapped.sourceEnum,
      parentSource: row.parentSource ?? mapped.parentSource,
    };
  });
}

export function buildHttpActivityDemoUnmappedRows(
  sourceRows: readonly HttpActivityDemoSourceRow[],
): HttpActivityDemoSourceRow[] {
  return sourceRows.map((row) => ({ ...row, mapped: false, tags: undefined }));
}
