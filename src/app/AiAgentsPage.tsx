import { useEffect } from "react";
import { AiAgentsWorkspace } from "../components/ai-agents/AiAgentsWorkspace";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

/**
 * AI Agents workspace — chat interface with specialist agent sidebar.
 */
export function AiAgentsPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = "AI Agents";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner variant="federated-search" activeSection="aiAgents" navTargets={NAV_RAIL_TARGETS} />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader title="AI Agents" chromeSurface="page" />
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <AiAgentsWorkspace />
        </div>
      </div>
    </div>
  );
}
