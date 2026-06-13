import type { AiAgentId } from "./aiAgentsData";

function AgentAvatarSvg({ agentId, color }: { agentId: AiAgentId; color: string }) {
  switch (agentId) {
    case "threat-researcher":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-full">
          <circle cx="12" cy="7" r="3.5" fill={color} />
          <path d="M6 20c.8-3.5 3-5.5 6-5.5s5.2 2 6 5.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M16 4l2 2-2 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "asset-context":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-full">
          <path d="M12 4 5 8v8l7 4 7-4V8l-7-4Z" stroke={color} strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M12 12 5 8M12 12l7-4M12 12v8" stroke={color} strokeWidth="1.75" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="1.75" fill={color} />
        </svg>
      );
    case "vulnerability-intelligence":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-full">
          <rect x="6" y="8" width="12" height="10" rx="2" stroke={color} strokeWidth="1.75" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="10" cy="12.5" r="1" fill={color} />
          <circle cx="14" cy="12.5" r="1" fill={color} />
          <path d="M10 16h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "detection-triage":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-full">
          <circle cx="9" cy="12" r="4" stroke={color} strokeWidth="1.75" />
          <circle cx="15" cy="12" r="4" stroke={color} strokeWidth="1.75" />
          <path d="M9 9.5v5M15 9.5v5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "netsec-specialist":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-full">
          <path d="M6 14c0-4 2.5-7 6-7s6 3 6 7" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
          <path d="M4 14h16" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.5" fill={color} />
        </svg>
      );
    case "lolbin-hash-hunter":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-full">
          <circle cx="10.5" cy="10.5" r="5" stroke={color} strokeWidth="1.75" />
          <path d="M14.5 14.5 19 19" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
          <rect x="8" y="9" width="5" height="3.5" rx=".75" stroke={color} strokeWidth="1.25" />
        </svg>
      );
  }
}

export function AgentAvatar({
  agentId,
  color,
  size = 24,
  className = "",
}: {
  agentId: AiAgentId;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <AgentAvatarSvg agentId={agentId} color={color} />
    </span>
  );
}
