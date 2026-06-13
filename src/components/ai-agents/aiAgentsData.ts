export type AiAgentId =
  | "threat-researcher"
  | "asset-context"
  | "vulnerability-intelligence"
  | "detection-triage"
  | "netsec-specialist"
  | "lolbin-hash-hunter";

export type AiAgentDefinition = {
  id: AiAgentId;
  name: string;
  /** One-line summary for the agents sidebar card. */
  summary: string;
  /** Full description shown in the main workspace header. */
  longDescription: string;
  scopeTags: [string, string, string];
  examplePrompts: [string, string, string];
  accent: string;
};

export const AGENT_GUARDRAIL_DISCLAIMER =
  "Responses are generated from your platform's current data and should be verified before acting on them. Citations link to the underlying findings, events, or entities used. This agent cannot modify detections, suppress findings, or trigger remediations — it can only suggest next steps for an analyst to review and approve.";

export const AGENT_INPUT_FOOTER_DISCLAIMER =
  "Read-only agent — verify all responses and citations before acting. This agent cannot modify detections, suppress findings, or trigger remediations.";

export const AI_AGENTS: AiAgentDefinition[] = [
  {
    id: "threat-researcher",
    name: "Threat Researcher",
    summary: "Cross-correlates findings & entities to assess campaign-level activity.",
    longDescription:
      "Correlates findings, entities, and external threat intel to assess whether activity is part of a broader campaign. Reads from Findings, Entities, Network Activity, and Detection History.",
    scopeTags: ["Read-only", "Scoped: Findings, Entities, Network, Detections", "No remediation actions"],
    examplePrompts: [
      "Is the activity on corp-srv-22 part of a broader pattern across other hosts?",
      "Summarize the Critical findings from the last 24 hours and group by likely root cause.",
      "Does the outbound connection to the known C2 IP correlate with any other entity activity this week?",
    ],
    accent: "#fac354",
  },
  {
    id: "asset-context",
    name: "Asset Context Specialist",
    summary: "Looks up ownership, criticality, and history for a given host or entity.",
    longDescription:
      "Enriches hosts and entities with ownership, business criticality, and historical context from your CMDB and asset inventory. Reads from Entities, Findings, and Discovery data.",
    scopeTags: ["Read-only", "Scoped: Entities, Findings, Discovery", "No remediation actions"],
    examplePrompts: [
      "Who owns corp-srv-22 and what is its business criticality tier?",
      "Show recent findings and ownership changes for all Tier-1 database hosts.",
      "Which entities in the finance VLAN lack an assigned owner?",
    ],
    accent: "#6dc6a1",
  },
  {
    id: "vulnerability-intelligence",
    name: "Vulnerability Intelligence",
    summary: "Explains CVEs, exploitability, and prioritization against your findings.",
    longDescription:
      "Explains CVE exposure, exploit availability, and patch coverage in the context of your active findings. Reads from Findings, Entities, and vulnerability scan results.",
    scopeTags: ["Read-only", "Scoped: Findings, Entities, Vulnerabilities", "No remediation actions"],
    examplePrompts: [
      "Which Critical CVEs on internet-facing hosts have known exploits in the wild?",
      "Prioritize open findings tied to Log4j across production clusters.",
      "Summarize patch coverage gaps for CVE-2024-3400 on Linux endpoints.",
    ],
    accent: "#817cf6",
  },
  {
    id: "detection-triage",
    name: "Detection Triage",
    summary: "Reviews triggered detections, flags likely false positives for tuning.",
    longDescription:
      "Reviews triggered detections, noise patterns, and correlated findings to recommend tuning or escalation. Reads from Detection History, Findings, and Detection Library.",
    scopeTags: ["Read-only", "Scoped: Detections, Findings, Detection History", "No remediation actions"],
    examplePrompts: [
      "Which detections fired more than 50 times in the last 24 hours with zero escalated findings?",
      "Review the PowerShell encoded-command rule — is this likely a false positive on dev workstations?",
      "Summarize failed detection runs from last night and group by root cause.",
    ],
    accent: "#1ec1dd",
  },
  {
    id: "netsec-specialist",
    name: "NetSec Specialist",
    summary: "Analyzes traffic patterns, source/destination pairs, and anomalies.",
    longDescription:
      "Analyzes network flows, top talkers, and suspicious east-west paths to surface lateral movement and exfiltration patterns. Reads from Network Activity, Entities, and Findings.",
    scopeTags: ["Read-only", "Scoped: Network Activity, Entities, Findings", "No remediation actions"],
    examplePrompts: [
      "What are the top source/destination pairs by volume for corp-srv-22 in the last 7 days?",
      "Did any internal hosts initiate new outbound connections to unknown geographies this week?",
      "Correlate the suspicious DNS tunnel finding with recent network flows from the same subnet.",
    ],
    accent: "#39daf5",
  },
  {
    id: "lolbin-hash-hunter",
    name: "LOLBIN & Hash Hunter",
    summary: "Searches for living-off-the-land binary abuse and known-bad file hashes.",
    longDescription:
      "Traces suspicious binaries, LOLBin abuse chains, and file hash reputation across endpoint telemetry. Reads from Findings, Entities, and Detection History.",
    scopeTags: ["Read-only", "Scoped: Findings, Entities, Detections", "No remediation actions"],
    examplePrompts: [
      "Has hash a3f2…9c1b been seen on any other hosts in the last 30 days?",
      "Find LOLBin chains involving certutil.exe and encoded PowerShell on workstation endpoints.",
      "Summarize all findings tied to known-bad hashes reported in the last 48 hours.",
    ],
    accent: "#b1edd4",
  },
];

export const DEFAULT_AI_AGENT_ID: AiAgentId = "threat-researcher";

export function getAiAgent(id: AiAgentId): AiAgentDefinition {
  return AI_AGENTS.find((agent) => agent.id === id) ?? AI_AGENTS[0];
}

export function mockAgentResponse(agent: AiAgentDefinition, prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return `${agent.name} is ready. Ask a question to get started.`;
  }

  switch (agent.id) {
    case "threat-researcher":
      return `I'll trace "${trimmed}" against recent threat intel feeds and known actor playbooks. Expect a summary of related TTPs, IOCs, and recommended hunt queries with citations to underlying findings and entities.`;
    case "asset-context":
      return `I'll enrich "${trimmed}" with asset ownership, criticality tags, and exposure context from your CMDB and endpoint inventory, citing the entities and findings used.`;
    case "vulnerability-intelligence":
      return `I'll score "${trimmed}" by exploit availability, patch coverage, and affected asset count to help you prioritize remediation — all suggestions require analyst review before action.`;
    case "detection-triage":
      return `I'll review "${trimmed}" against recent detection runs, noise patterns, and correlated findings to suggest tuning or escalation paths for your approval.`;
    case "netsec-specialist":
      return `I'll map "${trimmed}" to top talkers, blocked flows, and suspicious east-west paths in your network telemetry with links to source events.`;
    case "lolbin-hash-hunter":
      return `I'll pivot on "${trimmed}" across file hash reputation, parent process chains, and known LOLBin abuse patterns, citing the underlying detection and entity records.`;
  }
}
