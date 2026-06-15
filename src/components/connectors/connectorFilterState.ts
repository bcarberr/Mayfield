import { useCallback, useState } from "react";
import { CONNECTOR_CATEGORIES, type ConnectorCategoryId } from "./connectorsData";

export const DEFAULT_CONNECTOR_CATEGORY_ORDER: ConnectorCategoryId[] = CONNECTOR_CATEGORIES.map(
  (category) => category.id,
);

export const DEFAULT_ENABLED_CONNECTOR_CATEGORY_IDS: ConnectorCategoryId[] = [...DEFAULT_CONNECTOR_CATEGORY_ORDER];

const DASHBOARD_FILTERS_STORAGE_KEY = "mayfield.connectors.dashboard-filters";
const ADD_CONNECTOR_FILTERS_STORAGE_KEY = "mayfield.connectors.add-connector-filters";

type ConnectorFiltersSnapshot = {
  categoryOrder: ConnectorCategoryId[];
  enabledCategoryIds: ConnectorCategoryId[];
  filtersExpanded: boolean;
};

type AddConnectorFiltersSnapshot = ConnectorFiltersSnapshot & {
  query: string;
};

function createDefaultSnapshot(): ConnectorFiltersSnapshot {
  return {
    categoryOrder: [...DEFAULT_CONNECTOR_CATEGORY_ORDER],
    enabledCategoryIds: [...DEFAULT_ENABLED_CONNECTOR_CATEGORY_IDS],
    filtersExpanded: false,
  };
}

function createDefaultAddConnectorSnapshot(): AddConnectorFiltersSnapshot {
  return {
    ...createDefaultSnapshot(),
    query: "",
  };
}

function sanitizeCategoryOrder(order: readonly ConnectorCategoryId[]): ConnectorCategoryId[] {
  const valid = new Set(DEFAULT_CONNECTOR_CATEGORY_ORDER);
  const seen = new Set<ConnectorCategoryId>();
  const sanitized: ConnectorCategoryId[] = [];

  for (const id of order) {
    if (valid.has(id) && !seen.has(id)) {
      sanitized.push(id);
      seen.add(id);
    }
  }

  for (const id of DEFAULT_CONNECTOR_CATEGORY_ORDER) {
    if (!seen.has(id)) sanitized.push(id);
  }

  return sanitized;
}

function sanitizeEnabledCategoryIds(ids: readonly ConnectorCategoryId[]): ConnectorCategoryId[] {
  const valid = new Set(DEFAULT_CONNECTOR_CATEGORY_ORDER);
  return ids.filter((id) => valid.has(id));
}

function sanitizeDashboardSnapshot(value: unknown): ConnectorFiltersSnapshot {
  if (!value || typeof value !== "object") return createDefaultSnapshot();

  const record = value as Partial<ConnectorFiltersSnapshot>;
  return {
    categoryOrder: sanitizeCategoryOrder(
      Array.isArray(record.categoryOrder) ? (record.categoryOrder as ConnectorCategoryId[]) : [],
    ),
    enabledCategoryIds: sanitizeEnabledCategoryIds(
      Array.isArray(record.enabledCategoryIds) ? (record.enabledCategoryIds as ConnectorCategoryId[]) : [],
    ),
    filtersExpanded: Boolean(record.filtersExpanded),
  };
}

function sanitizeAddConnectorSnapshot(value: unknown): AddConnectorFiltersSnapshot {
  if (!value || typeof value !== "object") return createDefaultAddConnectorSnapshot();

  const record = value as Partial<AddConnectorFiltersSnapshot>;
  return {
    ...sanitizeDashboardSnapshot(record),
    query: typeof record.query === "string" ? record.query : "",
  };
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readStoredSnapshot<T>(key: string, sanitize: (value: unknown) => T, fallback: () => T): T {
  if (!canUseSessionStorage()) return fallback();
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return fallback();
    return sanitize(JSON.parse(raw));
  } catch {
    return fallback();
  }
}

function writeStoredSnapshot(key: string, snapshot: ConnectorFiltersSnapshot | AddConnectorFiltersSnapshot): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    /* ignore quota / private mode */
  }
}

function toEnabledSet(ids: readonly ConnectorCategoryId[]): Set<ConnectorCategoryId> {
  return new Set(sanitizeEnabledCategoryIds(ids));
}

let dashboardFiltersStore: ConnectorFiltersSnapshot = readStoredSnapshot(
  DASHBOARD_FILTERS_STORAGE_KEY,
  sanitizeDashboardSnapshot,
  createDefaultSnapshot,
);

let addConnectorFiltersStore: AddConnectorFiltersSnapshot = readStoredSnapshot(
  ADD_CONNECTOR_FILTERS_STORAGE_KEY,
  sanitizeAddConnectorSnapshot,
  createDefaultAddConnectorSnapshot,
);

const dashboardFilterListeners = new Set<() => void>();
let dashboardFilterStoreVersion = 0;

function persistDashboardSnapshot(next: ConnectorFiltersSnapshot): void {
  dashboardFiltersStore = next;
  writeStoredSnapshot(DASHBOARD_FILTERS_STORAGE_KEY, next);
  dashboardFilterStoreVersion += 1;
  for (const listener of dashboardFilterListeners) listener();
}

function persistAddConnectorSnapshot(next: AddConnectorFiltersSnapshot): void {
  addConnectorFiltersStore = next;
  writeStoredSnapshot(ADD_CONNECTOR_FILTERS_STORAGE_KEY, next);
}

export function isDefaultCategoryOrder(order: readonly ConnectorCategoryId[]): boolean {
  return (
    order.length === DEFAULT_CONNECTOR_CATEGORY_ORDER.length &&
    order.every((id, index) => id === DEFAULT_CONNECTOR_CATEGORY_ORDER[index])
  );
}

export function isDefaultEnabledCategories(enabled: ReadonlySet<ConnectorCategoryId>): boolean {
  return (
    enabled.size === DEFAULT_ENABLED_CONNECTOR_CATEGORY_IDS.length &&
    DEFAULT_CONNECTOR_CATEGORY_ORDER.every((id) => enabled.has(id))
  );
}

export function getDashboardEnabledCategories(): ReadonlySet<ConnectorCategoryId> {
  return toEnabledSet(dashboardFiltersStore.enabledCategoryIds);
}

export function getDashboardCategoryOrder(): ConnectorCategoryId[] {
  return [...dashboardFiltersStore.categoryOrder];
}

export function getDashboardFilterStoreVersion(): number {
  return dashboardFilterStoreVersion;
}

export function subscribeDashboardConnectorFilters(listener: () => void): () => void {
  dashboardFilterListeners.add(listener);
  return () => dashboardFilterListeners.delete(listener);
}

export function usePersistedDashboardConnectorFilters() {
  const [snapshot, setSnapshot] = useState<ConnectorFiltersSnapshot>(() => ({
    categoryOrder: [...dashboardFiltersStore.categoryOrder],
    enabledCategoryIds: [...dashboardFiltersStore.enabledCategoryIds],
    filtersExpanded: dashboardFiltersStore.filtersExpanded,
  }));

  const persist = useCallback((next: ConnectorFiltersSnapshot) => {
    persistDashboardSnapshot(next);
    setSnapshot(next);
  }, []);

  const setCategoryOrder = useCallback(
    (order: ConnectorCategoryId[]) => {
      persist({
        ...dashboardFiltersStore,
        categoryOrder: sanitizeCategoryOrder(order),
      });
    },
    [persist],
  );

  const setCategoryEnabled = useCallback(
    (categoryId: ConnectorCategoryId, enabled: boolean) => {
      const enabledSet = toEnabledSet(dashboardFiltersStore.enabledCategoryIds);
      if (enabled) enabledSet.add(categoryId);
      else enabledSet.delete(categoryId);
      persist({
        ...dashboardFiltersStore,
        enabledCategoryIds: [...enabledSet],
      });
    },
    [persist],
  );

  const setFiltersExpanded = useCallback(
    (filtersExpanded: boolean) => {
      persist({ ...dashboardFiltersStore, filtersExpanded });
    },
    [persist],
  );

  const resetFilters = useCallback(() => {
    persist(createDefaultSnapshot());
  }, [persist]);

  return {
    categoryOrder: snapshot.categoryOrder,
    enabledCategories: toEnabledSet(snapshot.enabledCategoryIds),
    filtersExpanded: snapshot.filtersExpanded,
    setCategoryOrder,
    setCategoryEnabled,
    setFiltersExpanded,
    resetFilters,
  };
}

export function usePersistedAddConnectorFilters() {
  const [snapshot, setSnapshot] = useState<AddConnectorFiltersSnapshot>(() => ({
    categoryOrder: [...addConnectorFiltersStore.categoryOrder],
    enabledCategoryIds: [...addConnectorFiltersStore.enabledCategoryIds],
    filtersExpanded: addConnectorFiltersStore.filtersExpanded,
    query: addConnectorFiltersStore.query,
  }));

  const persist = useCallback((next: AddConnectorFiltersSnapshot) => {
    persistAddConnectorSnapshot(next);
    setSnapshot(next);
  }, []);

  const setCategoryOrder = useCallback(
    (order: ConnectorCategoryId[]) => {
      persist({
        ...addConnectorFiltersStore,
        categoryOrder: sanitizeCategoryOrder(order),
      });
    },
    [persist],
  );

  const setCategoryEnabled = useCallback(
    (categoryId: ConnectorCategoryId, enabled: boolean) => {
      const enabledSet = toEnabledSet(addConnectorFiltersStore.enabledCategoryIds);
      if (enabled) enabledSet.add(categoryId);
      else enabledSet.delete(categoryId);
      persist({
        ...addConnectorFiltersStore,
        enabledCategoryIds: [...enabledSet],
      });
    },
    [persist],
  );

  const setFiltersExpanded = useCallback(
    (filtersExpanded: boolean) => {
      persist({ ...addConnectorFiltersStore, filtersExpanded });
    },
    [persist],
  );

  const setQuery = useCallback(
    (query: string) => {
      persist({ ...addConnectorFiltersStore, query });
    },
    [persist],
  );

  const resetFilters = useCallback(() => {
    persist({
      ...createDefaultSnapshot(),
      query: addConnectorFiltersStore.query,
    });
  }, [persist]);

  return {
    categoryOrder: snapshot.categoryOrder,
    enabledCategories: toEnabledSet(snapshot.enabledCategoryIds),
    filtersExpanded: snapshot.filtersExpanded,
    query: snapshot.query,
    setCategoryOrder,
    setCategoryEnabled,
    setFiltersExpanded,
    setQuery,
    resetFilters,
  };
}
