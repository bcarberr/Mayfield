import { useEffect, useState } from "react";
import { Icon } from "../design-system";
import { FederatedDetectionHubDashboard } from "../components/federated-detection-hub/FederatedDetectionHubDashboard";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

/**
 * Federated Detection Hub — Figma `7671:7964` (`02a` Manage Detections).
 */
export function FederatedDetectionHubPage() {
  const [searchQuery, setSearchQuery] = useState("");

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
            <div className="flex items-center gap-4" role="toolbar" aria-label="Detection actions">
              <div className="w-[240px] shrink-0">
                <Input
                  variant="search"
                  placeholder="Search Detections"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-8 !bg-surface-container"
                  startAdornment={<Icon name="search" size={18} aria-hidden />}
                  aria-label="Search detections"
                />
              </div>
              <Button type="button" variant="secondary" className="h-8 shrink-0 ring-offset-surface-page">
                <Icon
                  name="action-add"
                  size={12}
                  className="size-3 shrink-0 text-current [&>svg]:!size-[12px]"
                  aria-hidden
                />
                Create New Detection
              </Button>
            </div>
          }
        />

        <FederatedDetectionHubDashboard searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
      </div>
    </div>
  );
}
