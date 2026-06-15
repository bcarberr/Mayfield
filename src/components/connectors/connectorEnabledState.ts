import { useCallback, useSyncExternalStore } from "react";
import type { ConnectorSetupTarget } from "./connectorPlatformTypes";
import {
  getDashboardCategoryOrder,
  getDashboardEnabledCategories,
  getDashboardFilterStoreVersion,
  isDefaultCategoryOrder,
  isDefaultEnabledCategories,
  subscribeDashboardConnectorFilters,
} from "./connectorFilterState";
import { CONNECTOR_CATEGORIES, CONNECTOR_INSTANCES, type ConnectorInstance } from "./connectorsData";

const CONNECTOR_ENABLED_STORAGE_KEY = "mayfield.connectors.enabled-by-id";
const CONNECTOR_ADDED_STORAGE_KEY = "mayfield.connectors.added-instances";

type EnabledById = Record<string, boolean>;

export type ConnectorSelectionCounts = {
  selectedCount: number;
  totalCount: number;
};

const listeners = new Set<() => void>();

const VALID_CATEGORY_IDS = new Set(CONNECTOR_CATEGORIES.map((category) => category.id));

function defaultEnabledById(instances: readonly ConnectorInstance[]): EnabledById {
  return Object.fromEntries(instances.map((connector) => [connector.id, connector.enabled]));
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function sanitizeEnabledById(value: unknown, instances: readonly ConnectorInstance[]): EnabledById {
  const defaults = defaultEnabledById(instances);
  if (!value || typeof value !== "object") return defaults;

  const record = value as Record<string, unknown>;
  const sanitized: EnabledById = { ...defaults };
  for (const connector of instances) {
    const stored = record[connector.id];
    if (typeof stored === "boolean") {
      sanitized[connector.id] = stored;
    }
  }
  return sanitized;
}

function sanitizeAddedInstances(value: unknown): ConnectorInstance[] {
  if (!Array.isArray(value)) return [];

  const seenIds = new Set(CONNECTOR_INSTANCES.map((connector) => connector.id));
  const sanitized: ConnectorInstance[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Partial<ConnectorInstance>;
    if (
      typeof record.id !== "string" ||
      typeof record.categoryId !== "string" ||
      typeof record.instanceName !== "string" ||
      typeof record.connectorType !== "string" ||
      typeof record.icon !== "string" ||
      typeof record.enabled !== "boolean" ||
      !VALID_CATEGORY_IDS.has(record.categoryId as ConnectorInstance["categoryId"]) ||
      seenIds.has(record.id)
    ) {
      continue;
    }

    seenIds.add(record.id);
    sanitized.push({
      id: record.id,
      categoryId: record.categoryId as ConnectorInstance["categoryId"],
      instanceName: record.instanceName,
      connectorType: record.connectorType,
      icon: record.icon,
      enabled: record.enabled,
    });
  }

  return sanitized;
}

function readStoredAddedInstances(): ConnectorInstance[] {
  if (!canUseSessionStorage()) return [];
  try {
    const raw = window.sessionStorage.getItem(CONNECTOR_ADDED_STORAGE_KEY);
    if (!raw) return [];
    return sanitizeAddedInstances(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeStoredAddedInstances(next: ConnectorInstance[]): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(CONNECTOR_ADDED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

function readStoredEnabledById(instances: readonly ConnectorInstance[]): EnabledById {
  if (!canUseSessionStorage()) return defaultEnabledById(instances);
  try {
    const raw = window.sessionStorage.getItem(CONNECTOR_ENABLED_STORAGE_KEY);
    if (!raw) return defaultEnabledById(instances);
    return sanitizeEnabledById(JSON.parse(raw), instances);
  } catch {
    return defaultEnabledById(instances);
  }
}

function writeStoredEnabledById(next: EnabledById): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(CONNECTOR_ENABLED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

let addedInstances: ConnectorInstance[] = readStoredAddedInstances();

function getAllConnectorInstances(): ConnectorInstance[] {
  return [...CONNECTOR_INSTANCES, ...addedInstances];
}

let enabledById: EnabledById = readStoredEnabledById(getAllConnectorInstances());
let storeVersion = 0;

function resolveConnectorEnabled(connector: ConnectorInstance): boolean {
  return enabledById[connector.id] ?? connector.enabled;
}

function isConnectorSelected(connector: ConnectorInstance): boolean {
  if (!resolveConnectorEnabled(connector)) return false;
  return getDashboardEnabledCategories().has(connector.categoryId);
}

function computeSelectionCounts(): ConnectorSelectionCounts {
  const all = getAllConnectorInstances();
  return {
    selectedCount: all.filter(isConnectorSelected).length,
    totalCount: all.length,
  };
}

function computeConnectorsList(): ConnectorInstance[] {
  return getAllConnectorInstances().map((connector) => ({
    ...connector,
    enabled: resolveConnectorEnabled(connector),
  }));
}

function getStoreVersion(): number {
  return storeVersion;
}

function getSelectionStoreVersion(): number {
  return storeVersion + getDashboardFilterStoreVersion();
}

function subscribeConnectorSelectionStore(listener: () => void): () => void {
  const unsubscribeEnabled = subscribe(listener);
  const unsubscribeFilters = subscribeDashboardConnectorFilters(listener);
  return () => {
    unsubscribeEnabled();
    unsubscribeFilters();
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange(): void {
  storeVersion += 1;
  for (const listener of listeners) listener();
}

function persistStore(nextEnabledById: EnabledById, nextAddedInstances: ConnectorInstance[]): void {
  enabledById = nextEnabledById;
  addedInstances = nextAddedInstances;
  writeStoredEnabledById(nextEnabledById);
  writeStoredAddedInstances(nextAddedInstances);
  emitChange();
}

export function getConnectorSelectionCounts(): ConnectorSelectionCounts {
  return computeSelectionCounts();
}

export function formatConnectorSelectionCount(counts: ConnectorSelectionCounts): string {
  return `${counts.selectedCount} of ${counts.totalCount}`;
}

export function useConnectorSelectionCounts(): ConnectorSelectionCounts {
  useSyncExternalStore(subscribeConnectorSelectionStore, getSelectionStoreVersion, getSelectionStoreVersion);
  return computeSelectionCounts();
}

/** True when filters, section visibility, or connector toggles differ from the default (all on). */
export function shouldShowConnectorResetToDefault(): boolean {
  const counts = computeSelectionCounts();
  if (counts.selectedCount !== counts.totalCount) return true;
  if (!isDefaultEnabledCategories(getDashboardEnabledCategories())) return true;
  if (!isDefaultCategoryOrder(getDashboardCategoryOrder())) return true;
  return false;
}

export function useShowConnectorResetToDefault(): boolean {
  useSyncExternalStore(subscribeConnectorSelectionStore, getSelectionStoreVersion, getSelectionStoreVersion);
  return shouldShowConnectorResetToDefault();
}

export function areAllConnectorsEnabled(): boolean {
  return getAllConnectorInstances().every((connector) => resolveConnectorEnabled(connector));
}

/** Turn every connector instance on — used by Reset Connectors to default. */
export function resetAllConnectorsEnabled(): void {
  const nextEnabledById: EnabledById = {};
  for (const connector of getAllConnectorInstances()) {
    nextEnabledById[connector.id] = true;
  }
  persistStore(nextEnabledById, addedInstances);
}

export function usePersistedConnectorInstances(): {
  connectors: ConnectorInstance[];
  setConnectorEnabled: (connectorId: string, enabled: boolean) => void;
} {
  useSyncExternalStore(subscribe, getStoreVersion, getStoreVersion);
  const connectors = computeConnectorsList();

  const setConnectorEnabled = useCallback((connectorId: string, enabled: boolean) => {
    persistStore({ ...enabledById, [connectorId]: enabled }, addedInstances);
  }, []);

  return { connectors, setConnectorEnabled };
}

function createAddedConnectorInstance(target: ConnectorSetupTarget, enabled: boolean): ConnectorInstance {
  const baseId = `custom-${target.id}`;
  let id = baseId;
  let suffix = 1;
  const existingIds = new Set(getAllConnectorInstances().map((connector) => connector.id));
  while (existingIds.has(id)) {
    suffix += 1;
    id = `${baseId}-${suffix}`;
  }

  return {
    id,
    categoryId: target.categoryId,
    instanceName: target.name,
    connectorType: target.name,
    icon: target.icon,
    enabled,
  };
}

/** Persist setup completion — updates an existing instance or registers a newly added connector. */
export function saveConnectorFromSetup(target: ConnectorSetupTarget, enabled: boolean): void {
  const existing = getAllConnectorInstances().find((connector) => connector.id === target.id);
  if (existing) {
    persistStore({ ...enabledById, [target.id]: enabled }, addedInstances);
    return;
  }

  const nextInstance = createAddedConnectorInstance(target, enabled);
  persistStore({ ...enabledById, [nextInstance.id]: enabled }, [...addedInstances, nextInstance]);
}
