import assetContextSpecialistIcon from "./ai-agents/Asset Context Specialist.svg?url";
import detectionTriageIcon from "./ai-agents/Detection Triage.svg?url";
import lolbinHashHunterIcon from "./ai-agents/LOLBIN & Hash Hunter.svg?url";
import netsecSpecialistIcon from "./ai-agents/NetSec Specialist.png?url";
import threatResearcherIcon from "./ai-agents/Threat Researcher.svg?url";
import vulnerabilityIntelligenceIcon from "./ai-agents/Vulnerability Intelligence.svg?url";

export const AI_AGENT_ICON_BY_ID = {
  "threat-researcher": threatResearcherIcon,
  "asset-context": assetContextSpecialistIcon,
  "vulnerability-intelligence": vulnerabilityIntelligenceIcon,
  "detection-triage": detectionTriageIcon,
  "netsec-specialist": netsecSpecialistIcon,
  "lolbin-hash-hunter": lolbinHashHunterIcon,
} as const;
