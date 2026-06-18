import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Icon } from "../design-system";
import { AddConnectorDrawer } from "../components/connectors/AddConnectorDrawer";
import { ConnectorsDashboard } from "../components/connectors/ConnectorsDashboard";
import {
  resolveConnectorSetupTarget,
  type ConnectorPlatformType,
  type ConnectorSetupTarget,
} from "../components/connectors/connectorPlatformTypes";
import { saveConnectorFromSetup } from "../components/connectors/connectorEnabledState";
import { ConnectorSelectionCountText } from "../components/connectors/ConnectorSelectionCountText";
import { SearchTopHeader } from "../components/SearchTopHeader";
import {
  CONNECTOR_PAGE_SLIDE_OVER_PANEL_CLASS,
  PageSlideOver,
  SlideOverHeaderBackButton,
} from "../components/ui/SlideOver";
import { Button } from "@/components/shadcn/button";
import { Input } from "../components/ui/Input";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

const ConnectorSetupPanel = lazy(() =>
  import("./ConfigSchemaMapPage").then((module) => ({ default: module.ConnectorSetupPanel })),
);

type SlideOverMode =
  | { kind: "add" }
  | { kind: "setup"; connector: ConnectorSetupTarget };

function useConnectorsSetupSlideOver() {
  const [slideOverMode, setSlideOverMode] = useState<SlideOverMode | null>(null);

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

  const handleSetupSave = useCallback((connector: ConnectorSetupTarget, enabled: boolean) => {
    saveConnectorFromSetup(connector, enabled);
  }, []);

  const setupSlideOver = slideOverMode != null && (
    <PageSlideOver
      open
      onClose={closeSlideOver}
      ariaLabel={slideOverMode.kind === "add" ? "Add connector" : "Connector setup"}
      panelClassName={CONNECTOR_PAGE_SLIDE_OVER_PANEL_CLASS}
    >
      {slideOverMode.kind === "add" ? (
        <AddConnectorDrawer onClose={closeSlideOver} onSelectPlatform={handleSelectPlatform} />
      ) : (
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
              Loading connector setup…
            </div>
          }
        >
          <ConnectorSetupPanel
            onClose={closeSlideOver}
            onSave={handleSetupSave}
            connector={slideOverMode.connector}
          />
        </Suspense>
      )}
    </PageSlideOver>
  );

  return { openAddConnector, openSetup, setupSlideOver };
}

/** Connectors grid and nested add/setup drawers — shared by full page and header panel. */
export type ConnectorsWorkspaceProps = {
  chromeSurface?: "page" | "modal";
};

export function ConnectorsWorkspace({ chromeSurface = "page" }: ConnectorsWorkspaceProps) {
  const { openSetup, setupSlideOver } = useConnectorsSetupSlideOver();

  return (
    <>
      <ConnectorsDashboard onConfigureConnector={openSetup} chromeSurface={chromeSurface} />
      {setupSlideOver}
    </>
  );
}

export type ConnectorsPanelSlideOverProps = {
  open: boolean;
  onClose: () => void;
};

/** Header-triggered connectors drawer — dashboard only, no page header chrome. */
export function ConnectorsPanelSlideOver({ open, onClose }: ConnectorsPanelSlideOverProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.title;
    document.title = "Connectors";
    return () => {
      document.title = previous;
    };
  }, [open]);

  return (
    <PageSlideOver open={open} onClose={onClose} ariaLabel="Connectors">
      <div className="flex h-full min-h-0 flex-col text-text-primary">
        <header className="shrink-0 border-b border-border-rule bg-surface-modal px-6 pt-5 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <SlideOverHeaderBackButton onClose={onClose} className="ring-offset-surface-modal" />
              <div className="flex min-w-0 items-baseline gap-3">
                <h1 className="text-[24px] font-bold leading-8 tracking-[0.7px] text-text-primary">Connectors</h1>
                <span className="rounded bg-surface-container px-2 py-1 text-sm font-semibold text-text-primary">
                  <ConnectorSelectionCountText />
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="size-8 shrink-0 rounded-2xl p-1 ring-offset-surface-modal"
              aria-label="Close connectors panel"
              onClick={onClose}
            >
              <Icon name="close" size={24} />
            </Button>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6 pt-6">
          <ConnectorsWorkspace chromeSurface="modal" />
        </main>
      </div>
    </PageSlideOver>
  );
}

/**
 * Connectors workspace — Figma `6582:59192` (06a Connectors).
 * Add Connector catalog — Figma `1718:21128` / drawer `1718:21522`.
 */
export function ConnectorsPage() {
  const { openAddConnector, openSetup, setupSlideOver } = useConnectorsSetupSlideOver();
  const [connectorSearch, setConnectorSearch] = useState("");

  useEffect(() => {
    const previous = document.title;
    document.title = "Connectors";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner variant="federated-search" activeSection="connectors" navTargets={NAV_RAIL_TARGETS} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader
          title="Connectors"
          chromeSurface="page"
          headerAfterTitle={
            <div className="flex min-w-0 items-center gap-4">
              <span className="shrink-0 rounded bg-surface-container px-2 py-1 text-sm font-semibold text-text-primary">
                <ConnectorSelectionCountText />
              </span>
              <div className="w-[240px] shrink-0">
                <Input
                  variant="search"
                  placeholder="Search"
                  value={connectorSearch}
                  onChange={(e) => setConnectorSearch(e.target.value)}
                  onClear={() => setConnectorSearch("")}
                  startAdornment={null}
                  className="!bg-surface-container"
                  aria-label="Search connectors"
                />
              </div>
            </div>
          }
          titleTrailing={
            <div className="flex items-center gap-4" role="toolbar" aria-label="Connector actions">
              <Button
                type="button"
                variant="secondary-outline"
                className="h-8 shrink-0 ring-offset-surface-page"
                onClick={openAddConnector}
              >
                <Icon name="action-add" size={6} className="size-1.5 shrink-0 text-current [&>svg]:!size-[6px]" aria-hidden />
                Add Connector
              </Button>
              <Button type="button" variant="secondary-outline" className="h-8 shrink-0 ring-offset-surface-page">
                <Icon name="action-file-upload" size={12} className="size-3 shrink-0 text-current [&>svg]:!size-[12px]" aria-hidden />
                Export Connectors
              </Button>
            </div>
          }
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6 pt-6">
          <ConnectorsDashboard onConfigureConnector={openSetup} />
        </main>
      </div>

      {setupSlideOver}
    </div>
  );
}
