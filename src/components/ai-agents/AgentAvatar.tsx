import { AI_AGENT_ICON_BY_ID } from "../../assets/icons/ai-agents-icons";
import type { AiAgentId } from "./aiAgentsData";

export function AgentAvatar({
  agentId,
  size = 24,
  className = "",
}: {
  agentId: AiAgentId;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={AI_AGENT_ICON_BY_ID[agentId]}
      alt=""
      aria-hidden
      draggable={false}
      className={`block shrink-0 object-contain ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
}
