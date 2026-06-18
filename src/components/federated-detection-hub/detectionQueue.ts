export type DetectionSeverity = "Critical" | "High" | "Medium" | "Low";

export type QueuedDetectionRow = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  queuedBy: string;
  queuedDate: string;
  severity: DetectionSeverity;
  findings: number | "error" | "none";
};

export type DetectionQueueSourceRow = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: DetectionSeverity;
  findings: number | "error" | "none";
};

const DEFAULT_QUEUED_BY = "Admin User";

export const INITIAL_QUEUED_DETECTION_ROWS: QueuedDetectionRow[] = [
  {
    id: "review-1",
    name: "Active Ransomware Campaign Detected",
    description:
      "Correlates endpoint encryption bursts, shadow copy deletion, and ransom-note file creation across multiple hosts in the finance segment.",
    enabled: true,
    queuedBy: "Admin User",
    queuedDate: "Oct 12, 2025",
    severity: "High",
    findings: 3,
  },
  {
    id: "review-2",
    name: "Unusual Network Traffic Pattern",
    description:
      "Flags sustained outbound connections to rare destinations with elevated byte counts inconsistent with baseline peer behavior.",
    enabled: true,
    queuedBy: "Security Team",
    queuedDate: "Oct 11, 2025",
    severity: "High",
    findings: 7,
  },
  {
    id: "review-3",
    name: "Privileged Account Misuse",
    description:
      "Detects privileged account activity executing sensitive commands outside approved maintenance windows or jump host paths.",
    enabled: true,
    queuedBy: "Admin User",
    queuedDate: "Oct 10, 2025",
    severity: "Critical",
    findings: 2,
  },
  {
    id: "review-4",
    name: "Abnormal SaaS OAuth Grant",
    description:
      "Monitors third-party OAuth applications receiving broad mail or directory scopes on executive mailboxes without change approval.",
    enabled: false,
    queuedBy: "Security Team",
    queuedDate: "Oct 9, 2025",
    severity: "High",
    findings: 5,
  },
  {
    id: "review-5",
    name: "Excessive Failed Auth Attempts",
    description:
      "Surfaces authentication failure spikes against VPN and identity providers from distributed source addresses within short intervals.",
    enabled: false,
    queuedBy: "Analyst Team",
    queuedDate: "Oct 8, 2025",
    severity: "Critical",
    findings: 1,
  },
];

export function formatQueuedDate(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function detectionRowToQueuedRow(
  row: DetectionQueueSourceRow,
  queuedBy = DEFAULT_QUEUED_BY,
  queuedDate = formatQueuedDate(),
): QueuedDetectionRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    severity: row.severity,
    findings: row.findings,
    queuedBy,
    queuedDate,
  };
}
