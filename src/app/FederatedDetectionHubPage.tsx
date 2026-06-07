import { useEffect } from "react";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

/**
 * Federated Detection Hub workspace — Figma `4462:1204` (`v4 Nav-thinner`).
 */
export function FederatedDetectionHubPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Federated Detection Hub";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner
        variant="federated-search"
        activeSection="federatedDetectionHub"
        navTargets={NAV_RAIL_TARGETS}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader title="Federated Detection Hub" chromeSurface="page" />
        <main className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-12">
          <p className="text-base-semibold text-text-primary">Federated Detection Hub</p>
          <p className="text-sm text-text-tertiary">Content coming soon.</p>
        </main>
      </div>
    </div>
  );
}
