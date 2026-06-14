import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Icon } from "../design-system";
import { AddConnectorDrawer } from "../components/connectors/AddConnectorDrawer";
import { ConnectorsDashboard } from "../components/connectors/ConnectorsDashboard";
import {
  resolveConnectorSetupTarget,
  type ConnectorPlatformType,
  type ConnectorSetupTarget,
} from "../components/connectors/connectorPlatformTypes";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { PageSlideOver } from "../components/ui/SlideOver";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

const ConnectorSetupPanel = lazy(() =>
  import("./ConfigSchemaMapPage").then((module) => ({ default: module.ConnectorSetupPanel })),
);

type SlideOverMode =
  | { kind: "add" }
  | { kind: "setup"; connector: ConnectorSetupTarget };

/**
 * Connectors workspace — Figma `6582:59192` (06a Connectors).
 * Add Connector catalog — Figma `1718:21128` / drawer `1718:21522`.
 */
export function ConnectorsPage() {
  const [slideOverMode, setSlideOverMode] = useState<SlideOverMode | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = "Connectors";
    return () => {
      document.title = previous;
    };
  }, []);

  const closeSlideOver = useCallback(() => {
    setSlideOverMode(null);
  }, []);

  const openAddConnector = useCallback(() => {
    setSlideOverMode({ kind: "add" });
  }, []);

  const openSetup = useCallback((connectorId = "new") => {
    setSlideOverMode({ kind: "setup", connector: resolveConnectorSetupTarget(connectorId) });
  }, []);

  const handleSelectPlatform = useCallback((platform: ConnectorPlatformType) => {
    setSlideOverMode({
      kind: "setup",
      connector: {
        id: platform.id,
        name: platform.name,
        icon: platform.icon,
        categoryId: platform.categoryId,
      },
    });
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner variant="federated-search" activeSection="connectors" navTargets={NAV_RAIL_TARGETS} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader
          title="Connectors"
          chromeSurface="page"
          headerAfterTitle={
            <div className="w-[240px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                className="!bg-surface-container"
                startAdornment={<Icon name="search" size={18} aria-hidden />}
                aria-label="Search connectors"
              />
            </div>
          }
          titleTrailing={
            <div className="flex items-center gap-4" role="toolbar" aria-label="Connector actions">
              <Button
                type="button"
                variant="secondary"
                className="h-8 shrink-0 ring-offset-surface-page"
                onClick={openAddConnector}
              >
                <Icon name="action-add" size={12} className="size-3 shrink-0 text-current [&>svg]:!size-[12px]" aria-hidden />
                Add Connector
              </Button>
              <Button type="button" variant="secondary" className="h-8 shrink-0 ring-offset-surface-page">
                <Icon name="action-file-upload" size={12} className="size-3 shrink-0 text-current [&>svg]:!size-[12px]" aria-hidden />
                Export Connectors
              </Button>
            </div>
          }
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6">
          <ConnectorsDashboard onConfigureConnector={openSetup} />
        </main>
      </div>

      <PageSlideOver
        open={slideOverMode != null}
        onClose={closeSlideOver}
        ariaLabel={slideOverMode?.kind === "add" ? "Add connector" : "Connector setup"}
      >
        {slideOverMode?.kind === "add" ? (
          <AddConnectorDrawer onClose={closeSlideOver} onSelectPlatform={handleSelectPlatform} />
        ) : slideOverMode?.kind === "setup" ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
                Loading connector setup…
              </div>
            }
          >
            <ConnectorSetupPanel onClose={closeSlideOver} connector={slideOverMode.connector} />
          </Suspense>
        ) : null}
      </PageSlideOver>
    </div>
  );
}
