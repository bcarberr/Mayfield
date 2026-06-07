import { lazy, Suspense, useEffect, useState } from "react";
import { Icon } from "../design-system";
import { ConnectorsDashboard } from "../components/connectors/ConnectorsDashboard";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { SlideOver } from "../components/ui/SlideOver";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

const ConnectorSetupPanel = lazy(() =>
  import("./ConfigSchemaMapPage").then((module) => ({ default: module.ConnectorSetupPanel })),
);

/**
 * Connectors workspace — Figma `6582:59192` (06a Connectors).
 * Connector setup (schema mapping wizard) opens in a slide-over.
 */
export function ConnectorsPage() {
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupConnectorId, setSetupConnectorId] = useState<string | undefined>();

  useEffect(() => {
    const previous = document.title;
    document.title = "Connectors";
    return () => {
      document.title = previous;
    };
  }, []);

  const openSetup = (connectorId = "new") => {
    setSetupConnectorId(connectorId);
    setSetupOpen(true);
  };

  const closeSetup = () => {
    setSetupOpen(false);
    setSetupConnectorId(undefined);
  };

  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner variant="federated-search" activeSection="connectors" navTargets={NAV_RAIL_TARGETS} />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader
          title="Connectors"
          chromeSurface="page"
          titleTrailing={
            <div className="flex items-center gap-4" role="toolbar" aria-label="Connector actions">
              <div className="w-[240px] shrink-0">
                <Input
                  variant="search"
                  placeholder="Search"
                  className="h-8 !bg-surface-container"
                  startAdornment={<Icon name="search" size={18} aria-hidden />}
                  aria-label="Search connectors"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-8 shrink-0 ring-offset-surface-page"
                onClick={() => openSetup()}
              >
                <Icon name="action-add" size={12} className="size-3 shrink-0 text-current [&>svg]:!size-[12px]" aria-hidden />
                Add Connector
              </Button>
              <Button type="button" variant="secondary" className="h-8 shrink-0 ring-offset-surface-page">
                <Icon name="action-add" size={12} className="size-3 shrink-0 text-current [&>svg]:!size-[12px]" aria-hidden />
                Add Federated Join
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

        {setupOpen ? (
          <SlideOver open onClose={closeSetup} ariaLabel="Connector setup">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
                  Loading connector setup…
                </div>
              }
            >
              <ConnectorSetupPanel onClose={closeSetup} connectorId={setupConnectorId} />
            </Suspense>
          </SlideOver>
        ) : null}
      </div>
    </div>
  );
}
