import { useMemo, useCallback } from "react";
import { ConnectorCard } from "./ConnectorCard";
import { ConnectorFilters } from "./ConnectorFilters";
import { resetAllConnectorsEnabled, usePersistedConnectorInstances, useShowConnectorResetToDefault } from "./connectorEnabledState";
import {
  usePersistedDashboardConnectorFilters,
} from "./connectorFilterState";
import {
  CONNECTOR_CATEGORIES,
  type ConnectorCategoryId,
  type ConnectorInstance,
} from "./connectorsData";

export type ConnectorsDashboardProps = {
  onConfigureConnector?: (connectorId: string) => void;
  /** Page vs panel surface — controls filter bar background and focus rings. */
  chromeSurface?: "page" | "modal";
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Figma `6582:59192` — 06a Connectors connections grid. */
export function ConnectorsDashboard({
  onConfigureConnector,
  chromeSurface = "page",
}: ConnectorsDashboardProps) {
  const { connectors, setConnectorEnabled } = usePersistedConnectorInstances();
  const showResetToDefault = useShowConnectorResetToDefault();
  const {
    categoryOrder,
    enabledCategories,
    filtersExpanded,
    setCategoryOrder,
    setCategoryEnabled,
    setFiltersExpanded,
    resetFilters,
  } = usePersistedDashboardConnectorFilters();

  const categoriesById = useMemo(
    () => new Map(CONNECTOR_CATEGORIES.map((category) => [category.id, category])),
    [],
  );

  const orderedCategories = useMemo(
    () => categoryOrder.map((id) => categoriesById.get(id)).filter((category) => category != null),
    [categoryOrder, categoriesById],
  );

  const connectorsByCategory = useMemo(() => {
    const grouped = new Map<ConnectorCategoryId, ConnectorInstance[]>();
    for (const category of CONNECTOR_CATEGORIES) {
      grouped.set(category.id, []);
    }
    for (const connector of connectors) {
      grouped.get(connector.categoryId)?.push(connector);
    }
    return grouped;
  }, [connectors]);

  const visibleCategories = useMemo(
    () => orderedCategories.filter((category) => enabledCategories.has(category.id)),
    [orderedCategories, enabledCategories],
  );

  const handleResetFilters = useCallback(() => {
    resetFilters();
    resetAllConnectorsEnabled();
  }, [resetFilters]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={cx(
          "shrink-0 pb-6",
          chromeSurface === "modal" ? "bg-surface-modal" : "bg-surface-page",
        )}
      >
        <ConnectorFilters
          categories={orderedCategories}
          enabledCategories={enabledCategories}
          filtersAltered={showResetToDefault}
          expanded={filtersExpanded}
          onExpandedChange={setFiltersExpanded}
          onCategoryToggle={setCategoryEnabled}
          onCategoryOrderChange={setCategoryOrder}
          onResetFilters={handleResetFilters}
          ringOffsetSurface={chromeSurface}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-8">
        {visibleCategories.map((category) => {
          const categoryConnectors = connectorsByCategory.get(category.id) ?? [];
          if (categoryConnectors.length === 0) return null;

          return (
            <section key={category.id}>
              <h2 className="text-sm font-bold text-text-primary">{category.title}</h2>
              <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {categoryConnectors.map((connector) => (
                  <li key={connector.id}>
                    <ConnectorCard
                      connector={connector}
                      onEnabledChange={(enabled) => setConnectorEnabled(connector.id, enabled)}
                      onConfigure={onConfigureConnector ? () => onConfigureConnector(connector.id) : undefined}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        </div>
      </div>
    </div>
  );
}
