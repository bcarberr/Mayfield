import { useMemo, useState } from "react";
import { ConnectorCard } from "./ConnectorCard";
import { ConnectorFilters } from "./ConnectorFilters";
import {
  CONNECTOR_CATEGORIES,
  CONNECTOR_INSTANCES,
  type ConnectorCategoryId,
  type ConnectorInstance,
} from "./connectorsData";

export type ConnectorsDashboardProps = {
  onConfigureConnector?: (connectorId: string) => void;
};

/** Figma `6582:59192` — 06a Connectors connections grid. */
export function ConnectorsDashboard({ onConfigureConnector }: ConnectorsDashboardProps) {
  const [connectors, setConnectors] = useState<ConnectorInstance[]>(() =>
    CONNECTOR_INSTANCES.map((connector) => ({ ...connector })),
  );
  const [categoryOrder, setCategoryOrder] = useState<ConnectorCategoryId[]>(() =>
    CONNECTOR_CATEGORIES.map((category) => category.id),
  );
  const [enabledCategories, setEnabledCategories] = useState<Set<ConnectorCategoryId>>(
    () => new Set(CONNECTOR_CATEGORIES.map((category) => category.id)),
  );
  const [filtersExpanded, setFiltersExpanded] = useState(false);

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

  const visibleCount = useMemo(
    () => connectors.filter((connector) => enabledCategories.has(connector.categoryId)).length,
    [connectors, enabledCategories],
  );

  const setConnectorEnabled = (connectorId: string, enabled: boolean) => {
    setConnectors((current) =>
      current.map((connector) => (connector.id === connectorId ? { ...connector, enabled } : connector)),
    );
  };

  const setCategoryEnabled = (categoryId: ConnectorCategoryId, enabled: boolean) => {
    setEnabledCategories((current) => {
      const next = new Set(current);
      if (enabled) next.add(categoryId);
      else next.delete(categoryId);
      return next;
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <ConnectorFilters
        categories={orderedCategories}
        enabledCategories={enabledCategories}
        visibleCount={visibleCount}
        totalCount={connectors.length}
        expanded={filtersExpanded}
        onExpandedChange={setFiltersExpanded}
        onCategoryToggle={setCategoryEnabled}
        onCategoryOrderChange={setCategoryOrder}
      />

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
  );
}
