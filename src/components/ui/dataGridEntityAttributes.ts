import { ENTITY_ATTRIBUTE_COLUMNS } from "./dataGridColumnCatalog";

const ENTITY_ATTRIBUTE_IDS = new Set(ENTITY_ATTRIBUTE_COLUMNS.map((column) => column.id));

const DEMO_VALUES: Record<string, readonly string[]> = {
  accountId: ["10029384", "10084721", "10100293", "10294817", "10311220", "10455891"],
  commandLine: ["powershell.exe -enc …", "curl -s https://api.example.com", "bash /tmp/setup.sh", "wget -qO- http://10.0.4.12"],
  country: ["US", "DE", "GB", "CA", "FR", "JP", "AU"],
  cveId: ["CVE-2024-1234", "CVE-2023-9876", "CVE-2025-0042", "CVE-2024-8812", "CVE-2023-4411"],
  cweId: ["CWE-79", "CWE-89", "CWE-287", "CWE-22", "CWE-502"],
  deviceId: ["dev-8f2a", "dev-19c4", "dev-7b11", "dev-2a90", "dev-55ef", "dev-91cc"],
  domainId: ["dom-0042", "dom-0198", "dom-7710", "dom-3301", "dom-8820"],
  domainName: ["corp.example.com", "api.example.com", "cdn.example.net", "auth.example.com", "edge.example.net"],
  emailAddress: ["admin@corp.example.com", "svc-backup@corp.example.com", "alerts@corp.example.com", "ops@corp.example.com"],
  fileHash: ["a3f5…9c2d", "b81e…44fa", "c29a…10be", "d44b…77ac", "e19f…02de"],
  filename: ["setup.exe", "invoice.pdf", "payload.dll", "update.msi", "config.bin"],
  groupId: ["grp-2201", "grp-8844", "grp-1190", "grp-5502", "grp-7731"],
  groupName: ["Domain Admins", "SecOps", "Contractors", "Engineering", "Finance Ops"],
  hostname: ["norma-laptop", "WIN-DC01", "api-prod-04", "db-replica-02", "edge-gw-01", "k8s-node-07", "vpn-01", "mail-02"],
  ipAddress: ["10.0.4.12", "192.168.1.44", "207.32.75.34", "10.0.8.19", "172.16.3.55", "10.1.2.88"],
  macAddress: ["00:1A:2B:3C:4D:5E", "08:00:27:4A:2B:1C", "AC:DE:48:00:11:22", "00:50:56:9A:01:02", "B8:27:EB:12:34:56"],
  port: ["443", "8080", "22", "3389", "53", "8443"],
  processId: ["4821", "9034", "1208", "5510", "7744", "3399"],
  processName: ["powershell.exe", "chrome.exe", "sshd", "nginx", "java", "svchost.exe"],
  subnet: ["10.0.4.0/24", "192.168.1.0/24", "172.16.0.0/16", "10.1.0.0/24", "10.0.8.0/24"],
  url: ["https://corp.example.com/login", "https://cdn.example.net/asset.js", "http://10.0.4.12/admin", "https://api.example.com/v1"],
  userAgent: ["Mozilla/5.0 (Macintosh; …)", "curl/8.4.0", "python-requests/2.31.0", "Go-http-client/1.1"],
  userId: ["usr-0042", "usr-8812", "usr-2209", "usr-1190", "usr-5503", "usr-7741"],
  username: ["j.smith", "svc-backup", "admin", "a.lee", "k.patel", "m.chen", "d.nguyen"],
};

/** Demo rows surface 1–12 entities per attribute column. */
const ENTITY_COUNT_OPTIONS = [1, 1, 2, 3, 3, 4, 5, 6, 7, 7, 8, 9, 10, 12, 3] as const;

export const ENTITY_ATTRIBUTE_VISIBLE_COUNT = 3;

function stableIndex(rowId: string, attributeId: string, modulo: number): number {
  const input = `${rowId}:${attributeId}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % modulo;
}

function pickDemoValue(rowId: string, attributeId: string, index: number, pool: readonly string[]): string {
  const base = pool[stableIndex(rowId, `${attributeId}:${index}`, pool.length)]!;
  if (index < pool.length) return base;
  return `${base}-${index - pool.length + 2}`;
}

export function isEntityAttributeColumn(columnId: string): boolean {
  return ENTITY_ATTRIBUTE_IDS.has(columnId);
}

export function getEntityAttributeDemoCount(rowId: string, attributeId: string): number {
  return ENTITY_COUNT_OPTIONS[stableIndex(rowId, `${attributeId}:count`, ENTITY_COUNT_OPTIONS.length)] ?? 1;
}

export function getEntityAttributeDemoValues(rowId: string, attributeId: string): string[] {
  const pool = DEMO_VALUES[attributeId];
  if (!pool?.length) return [];

  const count = getEntityAttributeDemoCount(rowId, attributeId);
  const values: string[] = [];
  for (let i = 0; i < count; i++) {
    values.push(pickDemoValue(rowId, attributeId, i, pool));
  }

  return [...new Set(values)];
}

/** @deprecated Prefer {@link getEntityAttributeDemoValues} for multi-value entity cells. */
export function getEntityAttributeDemoValue(rowId: string, attributeId: string): string {
  const values = getEntityAttributeDemoValues(rowId, attributeId);
  if (!values.length) return "—";
  return values.join(", ");
}
