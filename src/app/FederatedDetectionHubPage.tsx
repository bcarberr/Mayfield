import { useCallback, useEffect, useState } from "react";
import { Icon } from "../design-system";
import { FederatedDetectionHubDashboard } from "../components/federated-detection-hub/FederatedDetectionHubDashboard";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { Button } from "../components/ui/Button";
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
        <SearchTopHeader
          title="Federated Detection Hub"
          chromeSurface="page"
          titleTrailing={
            <Button type="button" variant="secondary" className="h-8 shrink-0 ring-offset-surface-page">
              <Icon
                name="action-add"
                size={12}
                className="size-3 shrink-0 text-current [&>svg]:!size-[12px]"
                aria-hidden
              />
              Create New Detection
            </Button>
          }
        />

        <ContentAreaSlideOverHost slideOver={slideOver}>
          <FederatedDetectionHubDashboard onSlideOverChange={handleSlideOverChange} />
        </ContentAreaSlideOverHost>
      </div>
    </div>
  );
}
