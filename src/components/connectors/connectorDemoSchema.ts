export type ConnectorSampleDataRow = {
  action: string;
  appclass: string;
  appname: string;
  bwclassname: string;
  bwrulename: string;
  bwthrottle: string;
  clientip: string;
  clientpublicip: string;
  clientsslcipher: string;
  clientsslversion: string;
  cs_method: string;
  cs_uri: string;
  cs_host: string;
  cs_referer: string;
  cs_user_agent: string;
  cs_bytes: string;
  sc_bytes: string;
  sc_status: string;
  s_ip: string;
  s_port: string;
  c_port: string;
  time_taken: string;
  duration: string;
  protocol: string;
  proxy_ip: string;
  proxy_port: string;
  x_forwarded_for: string;
  url_scheme: string;
  url_path: string;
  url_query: string;
  url_port: string;
  content_type: string;
  request_len: string;
  response_len: string;
  latency_ms: string;
  packets_in: string;
  packets_out: string;
  direction: string;
  username: string;
  userdomain: string;
  authmethod: string;
  sessionid: string;
  virus_id: string;
  malware_name: string;
  risk_score: string;
  category: string;
  subcategory: string;
  filter_result: string;
  disposition: string;
  threat_id: string;
  rule_id: string;
  policy_name: string;
  device_name: string;
  device_ip: string;
  site_name: string;
  tenant: string;
  vendor: string;
  product: string;
  log_version: string;
  event_time: string;
  start_time: string;
  end_time: string;
  status: string;
  status_code: string;
  status_detail: string;
  message: string;
  dst_host: string;
  dst_ip: string;
  dst_port: string;
  src_mac: string;
  dst_mac: string;
  tls_sni: string;
  ja3: string;
  cache_status: string;
  waf_action: string;
  waf_rule: string;
  geo_country: string;
  geo_city: string;
  bytes_total: string;
  request_id: string;
};

export type ConnectorSampleDataPreview = {
  previewCount: number;
  totalResults: number;
  rows: readonly ConnectorSampleDataRow[];
};

/** Demo label — `{initials} data schema` from the connector display name. */
export function connectorDemoDataTableName(connectorName: string): string {
  const initials = connectorName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return initials ? `${initials} data schema` : "data schema";
}

const BASE_ROW: ConnectorSampleDataRow = {
  action: "Allowed",
  appclass: "General Browsing",
  appname: "General Browsing",
  bwclassname: "None",
  bwrulename: "None",
  bwthrottle: "No",
  clientip: "76.95.243.98",
  clientpublicip: "176.95.243.98",
  clientsslcipher: "TLS1_3_CK_AES_256_GCM_SHA384",
  clientsslversion: "TLSv1.3",
  cs_method: "GET",
  cs_uri: "/api/v1/health",
  cs_host: "api.example.com",
  cs_referer: "https://app.example.com/",
  cs_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  cs_bytes: "312",
  sc_bytes: "2048",
  sc_status: "200",
  s_ip: "52.84.12.10",
  s_port: "443",
  c_port: "51882",
  time_taken: "128",
  duration: "128",
  protocol: "HTTPS",
  proxy_ip: "10.10.0.5",
  proxy_port: "8080",
  x_forwarded_for: "203.0.113.10",
  url_scheme: "https",
  url_path: "/api/v1/health",
  url_query: "id=42",
  url_port: "443",
  content_type: "application/json",
  request_len: "312",
  response_len: "2048",
  latency_ms: "45",
  packets_in: "12",
  packets_out: "18",
  direction: "Outbound",
  username: "jdoe",
  userdomain: "EXAMPLE",
  authmethod: "none",
  sessionid: "sess-9f3a",
  virus_id: "",
  malware_name: "",
  risk_score: "12",
  category: "Network",
  subcategory: "HTTP",
  filter_result: "Observed",
  disposition: "Allowed",
  threat_id: "",
  rule_id: "r-204",
  policy_name: "allow-web",
  device_name: "Perimeter Firewall",
  device_ip: "10.0.1.22",
  site_name: "site-east",
  tenant: "t-01",
  vendor: "Blue Coat",
  product: "ProxySG",
  log_version: "1.0",
  event_time: "2024-06-01T12:00:00.128Z",
  start_time: "2024-06-01T12:00:00Z",
  end_time: "2024-06-01T12:00:01Z",
  status: "Success",
  status_code: "0",
  status_detail: "ok",
  message: "Request completed",
  dst_host: "api.example.com",
  dst_ip: "52.84.12.10",
  dst_port: "443",
  src_mac: "00:1a:2b:3c:4d:5e",
  dst_mac: "00:0a:95:9d:68:16",
  tls_sni: "api.example.com",
  ja3: "e7d705a3286e19ea42f587b344ee6865",
  cache_status: "MISS",
  waf_action: "allow",
  waf_rule: "SQLi-100",
  geo_country: "US",
  geo_city: "Austin",
  bytes_total: "2360",
  request_id: "req-abc123",
};

/** Demo sample table for connector setup Step 2 — Preview Sample Data (80 customer fields). */
export const DEMO_CONNECTOR_SAMPLE_DATA: ConnectorSampleDataPreview = {
  previewCount: 20,
  totalResults: 1000,
  rows: Array.from({ length: 20 }, (_, index) => ({
    ...BASE_ROW,
    clientpublicip: index === 0 ? "176.95.243.98" : "76.95.243.98",
  })),
};

export const DEMO_CONNECTOR_SAMPLE_COLUMNS: readonly {
  id: keyof ConnectorSampleDataRow;
  header: string;
}[] = [
  { id: "action", header: "ACTION" },
  { id: "appclass", header: "APPCLASS" },
  { id: "appname", header: "APPNAME" },
  { id: "bwclassname", header: "BWCLASSNAME" },
  { id: "bwrulename", header: "BWRULENAME" },
  { id: "bwthrottle", header: "BWTHROTTLE" },
  { id: "clientip", header: "CLIENTIP" },
  { id: "clientpublicip", header: "CLIENTPUBLICIP" },
  { id: "clientsslcipher", header: "CLIENTSSLCIPHER" },
  { id: "clientsslversion", header: "CLIENTSSLVERSION" },
  { id: "cs_method", header: "CS_METHOD" },
  { id: "cs_uri", header: "CS_URI" },
  { id: "cs_host", header: "CS_HOST" },
  { id: "cs_referer", header: "CS_REFERER" },
  { id: "cs_user_agent", header: "CS_USER_AGENT" },
  { id: "cs_bytes", header: "CS_BYTES" },
  { id: "sc_bytes", header: "SC_BYTES" },
  { id: "sc_status", header: "SC_STATUS" },
  { id: "s_ip", header: "S_IP" },
  { id: "s_port", header: "S_PORT" },
  { id: "c_port", header: "C_PORT" },
  { id: "time_taken", header: "TIME_TAKEN" },
  { id: "duration", header: "DURATION" },
  { id: "protocol", header: "PROTOCOL" },
  { id: "proxy_ip", header: "PROXY_IP" },
  { id: "proxy_port", header: "PROXY_PORT" },
  { id: "x_forwarded_for", header: "X_FORWARDED_FOR" },
  { id: "url_scheme", header: "URL_SCHEME" },
  { id: "url_path", header: "URL_PATH" },
  { id: "url_query", header: "URL_QUERY" },
  { id: "url_port", header: "URL_PORT" },
  { id: "content_type", header: "CONTENT_TYPE" },
  { id: "request_len", header: "REQUEST_LEN" },
  { id: "response_len", header: "RESPONSE_LEN" },
  { id: "latency_ms", header: "LATENCY_MS" },
  { id: "packets_in", header: "PACKETS_IN" },
  { id: "packets_out", header: "PACKETS_OUT" },
  { id: "direction", header: "DIRECTION" },
  { id: "username", header: "USERNAME" },
  { id: "userdomain", header: "USERDOMAIN" },
  { id: "authmethod", header: "AUTHMETHOD" },
  { id: "sessionid", header: "SESSIONID" },
  { id: "virus_id", header: "VIRUS_ID" },
  { id: "malware_name", header: "MALWARE_NAME" },
  { id: "risk_score", header: "RISK_SCORE" },
  { id: "category", header: "CATEGORY" },
  { id: "subcategory", header: "SUBCATEGORY" },
  { id: "filter_result", header: "FILTER_RESULT" },
  { id: "disposition", header: "DISPOSITION" },
  { id: "threat_id", header: "THREAT_ID" },
  { id: "rule_id", header: "RULE_ID" },
  { id: "policy_name", header: "POLICY_NAME" },
  { id: "device_name", header: "DEVICE_NAME" },
  { id: "device_ip", header: "DEVICE_IP" },
  { id: "site_name", header: "SITE_NAME" },
  { id: "tenant", header: "TENANT" },
  { id: "vendor", header: "VENDOR" },
  { id: "product", header: "PRODUCT" },
  { id: "log_version", header: "LOG_VERSION" },
  { id: "event_time", header: "EVENT_TIME" },
  { id: "start_time", header: "START_TIME" },
  { id: "end_time", header: "END_TIME" },
  { id: "status", header: "STATUS" },
  { id: "status_code", header: "STATUS_CODE" },
  { id: "status_detail", header: "STATUS_DETAIL" },
  { id: "message", header: "MESSAGE" },
  { id: "dst_host", header: "DST_HOST" },
  { id: "dst_ip", header: "DST_IP" },
  { id: "dst_port", header: "DST_PORT" },
  { id: "src_mac", header: "SRC_MAC" },
  { id: "dst_mac", header: "DST_MAC" },
  { id: "tls_sni", header: "TLS_SNI" },
  { id: "ja3", header: "JA3" },
  { id: "cache_status", header: "CACHE_STATUS" },
  { id: "waf_action", header: "WAF_ACTION" },
  { id: "waf_rule", header: "WAF_RULE" },
  { id: "geo_country", header: "GEO_COUNTRY" },
  { id: "geo_city", header: "GEO_CITY" },
  { id: "bytes_total", header: "BYTES_TOTAL" },
  { id: "request_id", header: "REQUEST_ID" },
];

export function connectorSampleRowsAsJson(rows: readonly ConnectorSampleDataRow[]): string {
  const payload = rows.map((row) =>
    Object.fromEntries(
      DEMO_CONNECTOR_SAMPLE_COLUMNS.map(({ id, header }) => [header, row[id]]),
    ),
  );
  return JSON.stringify(payload, null, 2);
}
