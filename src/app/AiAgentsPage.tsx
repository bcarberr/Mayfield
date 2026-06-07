import { useEffect } from "react";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

/**
 * AI Agents workspace — nav destination from Figma `4462:1204` (AI Agents).
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader title="AI Agents" chromeSurface="page" />
        <main className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-12">
          <p className="text-base-semibold text-text-primary">AI Agents</p>
          <p className="text-sm text-text-tertiary">Content coming soon.</p>
        </main>
      </div>
    </div>
  );
}
