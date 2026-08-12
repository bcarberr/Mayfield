/**
 * Demo "Common Values in Sample Data" lists for Map & Review source-field hover.
 * Always returns exactly 10 values so the popover matches the design.
 */

const COMMON_COUNT = 10;

/** Matches the Figma Map Schema common-values mock for client IP. */
const CLIENT_IP_COMMON_VALUES = [
  "172.31.74.90",
  "192.168.15.60",
  "192.168.207.237",
  "172.16.211.114",
  "192.168.110.196",
  "172.16.65.137",
  "172.16.120.76",
  "10.100.190.136",
  "172.16.171.193",
  "10.100.190.145",
] as const;

const CURATED_BY_SOURCE: Readonly<Record<string, readonly string[]>> = {
  clientip: CLIENT_IP_COMMON_VALUES,
  client_ip: CLIENT_IP_COMMON_VALUES,
  clientpublicip: [
    "176.95.243.98",
    "203.0.113.10",
    "198.51.100.42",
    "203.0.113.88",
    "198.51.100.17",
    "203.0.113.201",
    "198.51.100.64",
    "203.0.113.55",
    "198.51.100.120",
    "203.0.113.9",
  ],
  src_ip: [
    "10.20.30.40",
    "10.0.4.12",
    "10.1.2.30",
    "172.16.8.22",
    "192.168.1.45",
    "10.50.1.8",
    "172.16.44.90",
    "10.0.0.88",
    "192.168.40.12",
    "10.10.5.61",
  ],
  dst_ip: [
    "52.84.12.10",
    "8.8.8.8",
    "1.1.1.1",
    "52.84.12.11",
    "104.16.48.7",
    "13.107.42.14",
    "142.250.72.14",
    "151.101.1.69",
    "23.216.10.18",
    "54.239.28.85",
  ],
  cs_method: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH", "CONNECT", "TRACE", "GET"],
  sc_status: ["200", "201", "204", "301", "302", "400", "401", "403", "404", "500"],
  action: [
    "Allowed",
    "Blocked",
    "Denied",
    "Observed",
    "Logged",
    "Quarantined",
    "Redirected",
    "Challenged",
    "Bypassed",
    "Dropped",
  ],
  protocol: ["HTTPS", "HTTP", "TCP", "UDP", "TLS", "SSL", "QUIC", "ICMP", "DNS", "SMTP"],
  username: ["jdoe", "asmith", "bjones", "cli", "svc-proxy", "admin", "mwilson", "rpatel", "guest", "svc-scan"],
  user: ["jdoe", "asmith", "bjones", "cli", "svc-proxy", "admin", "mwilson", "rpatel", "guest", "svc-scan"],
  severity: [
    "Informational",
    "Low",
    "Medium",
    "High",
    "Critical",
    "Info",
    "Warning",
    "Error",
    "Fatal",
    "Unknown",
  ],
  appclass: [
    "General Browsing",
    "Social Networking",
    "Streaming Media",
    "File Sharing",
    "Webmail",
    "Business Apps",
    "Remote Access",
    "Cloud Storage",
    "Collaboration",
    "Security Tools",
  ],
  appname: [
    "General Browsing",
    "Office 365",
    "Salesforce",
    "Zoom",
    "Slack",
    "GitHub",
    "Dropbox",
    "Box",
    "ServiceNow",
    "Workday",
  ],
};

const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function padToTen(values: readonly string[], seedKey: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= COMMON_COUNT) return out.slice(0, COMMON_COUNT);
  }

  const seed = hashSeed(seedKey || "sample");
  let i = 0;
  while (out.length < COMMON_COUNT) {
    const base = out[out.length % Math.max(out.length, 1)] ?? (seedKey || "value");
    const next = `${base}-${((seed + i * 17) % 997) + 1}`;
    if (!seen.has(next)) {
      seen.add(next);
      out.push(next);
    }
    i += 1;
    if (i > 40) break;
  }
  while (out.length < COMMON_COUNT) out.push(`${seedKey || "value"}-${out.length + 1}`);
  return out.slice(0, COMMON_COUNT);
}

function generateIpv4Variants(sample: string, seedKey: string): string[] {
  const parts = sample.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    return [...CLIENT_IP_COMMON_VALUES];
  }
  const seed = hashSeed(seedKey);
  const values = [sample];
  for (let i = 1; i < COMMON_COUNT; i += 1) {
    const a = (parts[0]! + ((seed >> (i % 8)) & 3)) % 223 || 10;
    const b = (parts[1]! + i * 7 + (seed % 17)) % 256;
    const c = (parts[2]! + i * 13 + ((seed >> 4) % 23)) % 256;
    const d = (parts[3]! + i * 19 + ((seed >> 8) % 29)) % 254 || 1;
    values.push(`${a}.${b}.${c}.${d}`);
  }
  return padToTen(values, seedKey);
}

function generateNumericVariants(sample: string, seedKey: string): string[] {
  const n = Number.parseInt(sample, 10);
  if (Number.isNaN(n)) return padToTen([sample], seedKey);
  const values = [sample];
  for (let i = 1; i < COMMON_COUNT; i += 1) {
    values.push(String(Math.max(0, n + i * (i % 2 === 0 ? 7 : -3))));
  }
  return padToTen(values, seedKey);
}

function generateStringVariants(sample: string, seedKey: string): string[] {
  if (!sample) {
    return padToTen(
      ["(empty)", "n/a", "-", "null", "none", "unknown", "other", "default", "unset", "n/a"],
      seedKey,
    );
  }
  const suffixes = ["", "-a", "-b", "-c", "-prod", "-dev", "-01", "-02", "-east", "-west"];
  return padToTen(
    suffixes.map((suffix, index) => (index === 0 ? sample : `${sample}${suffix}`)),
    seedKey,
  );
}

/** Returns exactly 10 common sample-data values for a source field. */
export function getDemoCommonSampleValues(source: string, sample: string): string[] {
  const key = source.trim().toLowerCase();
  const curated = CURATED_BY_SOURCE[key];
  if (curated) return padToTen(curated, key);

  for (const [pattern, values] of Object.entries(CURATED_BY_SOURCE)) {
    if (key.includes(pattern)) return padToTen(values, key);
  }

  if (IPV4_RE.test(sample) || /(?:^|_)ip(?:$|_)/i.test(key) || key.endsWith("ip")) {
    return generateIpv4Variants(IPV4_RE.test(sample) ? sample : "10.0.0.1", key);
  }

  if (/^\d+$/.test(sample) || /(?:port|bytes|len|score|pid|ttl|duration|latency|count)/i.test(key)) {
    return generateNumericVariants(sample || "0", key);
  }

  return generateStringVariants(sample, key || sample || "value");
}
