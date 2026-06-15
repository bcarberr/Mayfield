import { useCallback, useEffect, useState } from "react";
import { FederatedDetectionHubDashboard } from "../components/federated-detection-hub/FederatedDetectionHubDashboard";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { ContentAreaSlideOverHost, type ContentAreaSlideOverState } from "../components/ui/SlideOver";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

/**
 * Federated Detection Hub — Figma `7671:7964` (`02a` Manage Detections).
 */
export function FederatedDetectionHubPage() {
  const [slideOver, setSlideOver] = useState<ContentAreaSlideOverState | null>(null);
  const handleSlideOverChange = useCallback((state: ContentAreaSlideOverState | null) => {
    setSlideOver(state);
  }, []);

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

        <ContentAreaSlideOverHost slideOver={slideOver}>
          <FederatedDetectionHubDashboard onSlideOverChange={handleSlideOverChange} />
        </ContentAreaSlideOverHost>
      </div>
    </div>
  );
}
