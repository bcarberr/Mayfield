import { SearchTopHeader } from "../components/SearchTopHeader";
import { SummaryInsightsDashboard } from "../components/summary-insights/SummaryInsightsDashboard";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

/**
 * Summary & insights workspace — Figma `4524:35393` “100a Federated Analytics” body under app chrome.
 */
export function SummaryInsightsPage() {
  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner
        variant="federated-search"
        activeSection="summary"
        navTargets={NAV_RAIL_TARGETS}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader title="Federated Analytics" chromeSurface="page" />
        <SummaryInsightsDashboard />
      </div>
    </div>
  );
}
