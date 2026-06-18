import type { DetectionRow } from "./detectionHubTypes";

const LIBRARY_MANAGED_DETECTIONS: DetectionRow[] = [
  {
    id: "managed-lib-1",
    source: "library",
    name: "APT28 Operation Phantom Net Voxel",
    description:
      "Detects command-and-control beaconing and DNS tunneling patterns associated with APT28 infrastructure across perimeter and internal resolvers.",
    enabled: true,
    severity: "High",
    lastRun: "Oct 31, 2024 2:15 PM",
    recurrence: "Every 30 minutes",
    findings: 42,
    connectorsActive: 14,
    connectorsTotal: 36,
  },
  {
    id: "managed-lib-2",
    source: "library",
    name: "Suspicious Kerberos TGT Request",
    description:
      "Flags anomalous Kerberos ticket-granting ticket requests indicative of credential theft or golden ticket activity.",
    enabled: true,
    severity: "Critical",
    lastRun: "Oct 31, 2024 1:45 PM",
    recurrence: "Every 30 minutes",
    findings: 18,
    connectorsActive: 12,
    connectorsTotal: 36,
  },
];

export const DETECTION_ROWS: DetectionRow[] = [
  ...LIBRARY_MANAGED_DETECTIONS,
  {
    id: "1",
    name: "Suspicious PowerShell Execution",
    description:
      "Flags encoded or obfuscated PowerShell commands executed outside approved automation accounts, often used for fileless malware staging and credential access.",
    enabled: true,
    severity: "High",
    lastRun: "1 min ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 861,
  },
  {
    id: "2",
    name: "Lateral Movement via SMB",
    description:
      "Correlates unusual SMB session setup and remote service creation patterns that indicate an actor pivoting between hosts after initial compromise.",
    enabled: true,
    severity: "Critical",
    lastRun: "22 mins ago",
    recurrence: "Every Tue 12:00 AM",
    findings: "error",
  },
  {
    id: "3",
    name: "Credential Dumping Activity",
    description:
      "Detects access to LSASS or credential store artifacts consistent with Mimikatz-style tooling and pass-the-hash preparation.",
    enabled: true,
    severity: "High",
    lastRun: "58 mins ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 209,
  },
  {
    id: "4",
    name: "Unusual Outbound DNS Queries",
    description:
      "Surfaces high-entropy subdomain lookups and rare resolver destinations that may indicate DNS tunneling or C2 beaconing.",
    enabled: false,
    severity: "High",
    lastRun: "1 hour 15 mins ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 87,
  },
  {
    id: "5",
    name: "Privilege Escalation Attempts",
    description:
      "Monitors token manipulation, sudo misuse, and local admin group changes on endpoints where escalation is not part of the change window.",
    enabled: true,
    severity: "Medium",
    lastRun: "—",
    recurrence: "—",
    findings: "none",
  },
  {
    id: "6",
    name: "Suspicious PowerShell Execution",
    description:
      "Flags encoded or obfuscated PowerShell commands executed outside approved automation accounts, often used for fileless malware staging and credential access.",
    enabled: true,
    severity: "Medium",
    lastRun: "6 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 24,
  },
  {
    id: "7",
    name: "Lateral Movement via SMB",
    description:
      "Correlates unusual SMB session setup and remote service creation patterns that indicate an actor pivoting between hosts after initial compromise.",
    enabled: true,
    severity: "Critical",
    lastRun: "7 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 319,
  },
  {
    id: "8",
    name: "Credential Dumping Activity",
    description:
      "Detects access to LSASS or credential store artifacts consistent with Mimikatz-style tooling and pass-the-hash preparation.",
    enabled: false,
    severity: "Low",
    lastRun: "8 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 11,
  },
  {
    id: "9",
    name: "Unusual Outbound DNS Queries",
    description:
      "Surfaces high-entropy subdomain lookups and rare resolver destinations that may indicate DNS tunneling or C2 beaconing.",
    enabled: true,
    severity: "Medium",
    lastRun: "10 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 56,
  },
  {
    id: "10",
    name: "Privilege Escalation Attempts",
    description:
      "Monitors token manipulation, sudo misuse, and local admin group changes on endpoints where escalation is not part of the change window.",
    enabled: true,
    severity: "High",
    lastRun: "18 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 33,
  },
  {
    id: "11",
    name: "Ransomware Precursor File Activity",
    description:
      "Identifies mass file rename and encryption extension changes consistent with ransomware staging before payload deployment.",
    enabled: true,
    severity: "Critical",
    lastRun: "20 hours ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 42,
  },
  {
    id: "12",
    name: "Impossible Travel Login",
    description:
      "Flags authentications from geographically distant locations within an implausible time window for the same user account.",
    enabled: true,
    severity: "High",
    lastRun: "1 day ago",
    recurrence: "Every Tue 12:00 AM",
    findings: "error",
  },
  {
    id: "13",
    name: "Cloud Storage Public Exposure",
    description:
      "Detects bucket or container ACL changes that grant anonymous or public read access to sensitive data stores.",
    enabled: false,
    severity: "Medium",
    lastRun: "1 day ago",
    recurrence: "Every Tue 12:00 AM",
    findings: "none",
  },
  {
    id: "14",
    name: "Kerberoasting Anomaly",
    description:
      "Surfaces service ticket requests targeting accounts with weak SPN configurations outside normal service desk activity.",
    enabled: true,
    severity: "High",
    lastRun: "2 days ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 72,
  },
  {
    id: "15",
    name: "Disabled AV Tampering",
    description:
      "Alerts when endpoint protection services are stopped, uninstalled, or excluded paths are added without approved change tickets.",
    enabled: true,
    severity: "High",
    lastRun: "2 days ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 18,
  },
  {
    id: "16",
    name: "Anomalous SaaS OAuth Grant",
    description:
      "Monitors new third-party OAuth applications granted broad mail or directory scopes to high-privilege user accounts.",
    enabled: true,
    severity: "Low",
    lastRun: "3 days ago",
    recurrence: "Every Tue 12:00 AM",
    findings: 9,
  },
];
