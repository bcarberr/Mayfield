import { useMemo } from "react";
import { Icon } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import { Input } from "../ui/Input";
import { ConnectorFilters } from "./ConnectorFilters";
import { SlideOverHeaderBackButton } from "../ui/SlideOver";
import {
  isDefaultCategoryOrder,
  isDefaultEnabledCategories,
  usePersistedAddConnectorFilters,
} from "./connectorFilterState";
import { ConnectorPlatformTile } from "./ConnectorPlatformTile";
import {
  CONNECTOR_PLATFORM_TYPES,
  type ConnectorPlatformType,
} from "./connectorPlatformTypes";
import { CONNECTOR_CATEGORIES } from "./connectorsData";

export type AddConnectorDrawerProps = {
  onClose: () => void;
  onSelectPlatform: (platform: ConnectorPlatformType) => void;
};

/** Figma `1718:21522` — Add Connector catalog drawer (Configure-Schema-Simplified `1718:21128`). */
export function AddConnectorDrawer({ onClose, onSelectPlatform }: AddConnectorDrawerProps) {
  const {
    categoryOrder,
    enabledCategories,
    filtersExpanded,
    query,
    setCategoryOrder,
    setCategoryEnabled,
    setFiltersExpanded,
    setQuery,
    resetFilters,
  } = usePersistedAddConnectorFilters();

  const categoriesById = useMemo(
    () => new Map(CONNECTOR_CATEGORIES.map((category) => [category.id, category])),
    [],
  );

  const orderedCategories = useMemo(
    () => categoryOrder.map((id) => categoriesById.get(id)).filter((category) => category != null),
    [categoryOrder, categoriesById],
  );

  const searchFilteredPlatforms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return CONNECTOR_PLATFORM_TYPES;
    return CONNECTOR_PLATFORM_TYPES.filter((platform) =>
      platform.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const visibleCategories = useMemo(
    () => orderedCategories.filter((category) => enabledCategories.has(category.id)),
    [orderedCategories, enabledCategories],
  );

  const visibleCount = useMemo(
    () => searchFilteredPlatforms.filter((platform) => enabledCategories.has(platform.categoryId)).length,
    [searchFilteredPlatforms, enabledCategories],
  );

  const filteredGroups = useMemo(
    () =>
      visibleCategories
        .map((category) => ({
          category,
          platforms: searchFilteredPlatforms.filter((platform) => platform.categoryId === category.id),
        }))
        .filter((group) => group.platforms.length > 0),
    [visibleCategories, searchFilteredPlatforms],
  );

  const filtersAltered =
    !isDefaultCategoryOrder(categoryOrder) || !isDefaultEnabledCategories(enabledCategories);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-modal text-text-primary">
      <header className="shrink-0 border-b border-border-rule bg-surface-modal px-6 pt-5 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <SlideOverHeaderBackButton onClose={onClose} className="" />
            <h1 className="text-[24px] font-bold leading-8 tracking-[0.7px] text-text-primary">Add Connector:</h1>
            <div className="w-[240px] shrink-0">
              <Input
                variant="search"
                placeholder="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery("")}
                className="!bg-surface-container"
                aria-label="Search connector types"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="size-8 shrink-0 rounded-2xl p-1"
            aria-label="Close add connector panel"
            onClick={onClose}
          >
            <Icon name="close" size={24} />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
        <ConnectorFilters
          categories={orderedCategories}
          enabledCategories={enabledCategories}
          visibleCount={visibleCount}
          totalCount={CONNECTOR_PLATFORM_TYPES.length}
          filtersAltered={filtersAltered}
          expanded={filtersExpanded}
          onExpandedChange={setFiltersExpanded}
          onCategoryToggle={setCategoryEnabled}
          onCategoryOrderChange={setCategoryOrder}
          onResetFilters={resetFilters}
          ringOffsetSurface="modal"
        />

        {filteredGroups.length === 0 ? (
          <p className="text-sm text-text-secondary">No connector types match your search or filters.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {filteredGroups.map(({ category, platforms }) => (
              <section key={category.id}>
                <h2 className="text-sm font-bold leading-[18px] text-text-primary">{category.title}</h2>
                <ul className="mt-3 flex flex-wrap justify-start gap-4">
                  {platforms.map((platform) => (
                    <li key={platform.id} className="w-[251px] shrink-0">
                      <ConnectorPlatformTile platform={platform} onSelect={() => onSelectPlatform(platform)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
