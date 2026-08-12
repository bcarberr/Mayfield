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
const CONNECTOR_NAME_OVERRIDES_STORAGE_KEY = "mayfield.connectors.instance-name-overrides";
const CONNECTOR_SCHEMA_PREVIEW_STORAGE_KEY = "mayfield.connectors.schema-preview-fetched";
const CONNECTOR_MAPPINGS_STORAGE_KEY = "mayfield.connectors.mappings-complete";
const CONNECTOR_DELETED_STORAGE_KEY = "mayfield.connectors.deleted-ids";

type EnabledById = Record<string, boolean>;
type InstanceNameOverrides = Record<string, string>;
type SchemaPreviewFetchedById = Record<string, boolean>;
type MappingsCompleteById = Record<string, boolean>;
type DeletedIds = Set<string>;

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

function sanitizeNameOverrides(value: unknown): InstanceNameOverrides {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const sanitized: InstanceNameOverrides = {};
  for (const [id, name] of Object.entries(record)) {
    if (typeof name === "string" && name.trim()) {
      sanitized[id] = name.trim();
    }
  }
  return sanitized;
}

function sanitizeSchemaPreviewFetched(value: unknown): SchemaPreviewFetchedById {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const sanitized: SchemaPreviewFetchedById = {};
  for (const [id, fetched] of Object.entries(record)) {
    if (fetched === true) sanitized[id] = true;
  }
  return sanitized;
}

function sanitizeMappingsComplete(value: unknown): MappingsCompleteById {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const sanitized: MappingsCompleteById = {};
  for (const [id, complete] of Object.entries(record)) {
    if (complete === true) sanitized[id] = true;
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

function readStoredNameOverrides(): InstanceNameOverrides {
  if (!canUseSessionStorage()) return {};
  try {
    const raw = window.sessionStorage.getItem(CONNECTOR_NAME_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeNameOverrides(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeStoredNameOverrides(next: InstanceNameOverrides): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(CONNECTOR_NAME_OVERRIDES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

function readStoredSchemaPreviewFetched(): SchemaPreviewFetchedById {
  if (!canUseSessionStorage()) return {};
  try {
    const raw = window.sessionStorage.getItem(CONNECTOR_SCHEMA_PREVIEW_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeSchemaPreviewFetched(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeStoredSchemaPreviewFetched(next: SchemaPreviewFetchedById): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(CONNECTOR_SCHEMA_PREVIEW_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

function readStoredMappingsComplete(): MappingsCompleteById {
  if (!canUseSessionStorage()) return {};
  try {
    const raw = window.sessionStorage.getItem(CONNECTOR_MAPPINGS_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeMappingsComplete(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeStoredMappingsComplete(next: MappingsCompleteById): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(CONNECTOR_MAPPINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

function sanitizeDeletedIds(value: unknown): DeletedIds {
  if (!Array.isArray(value)) return new Set();
  const deleted = new Set<string>();
  for (const entry of value) {
    if (typeof entry === "string" && entry.trim()) deleted.add(entry);
  }
  return deleted;
}

function readStoredDeletedIds(): DeletedIds {
  if (!canUseSessionStorage()) return new Set();
  try {
    const raw = window.sessionStorage.getItem(CONNECTOR_DELETED_STORAGE_KEY);
    if (!raw) return new Set();
    return sanitizeDeletedIds(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function writeStoredDeletedIds(next: DeletedIds): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(CONNECTOR_DELETED_STORAGE_KEY, JSON.stringify([...next]));
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
let instanceNameOverrides: InstanceNameOverrides = readStoredNameOverrides();
let schemaPreviewFetchedById: SchemaPreviewFetchedById = readStoredSchemaPreviewFetched();
let mappingsCompleteById: MappingsCompleteById = readStoredMappingsComplete();
let deletedIds: DeletedIds = readStoredDeletedIds();

function getAllConnectorInstances(): ConnectorInstance[] {
  return [...CONNECTOR_INSTANCES, ...addedInstances]
    .filter((connector) => !deletedIds.has(connector.id))
    .map((connector) => {
      const overrideName = instanceNameOverrides[connector.id];
      return overrideName ? { ...connector, instanceName: overrideName } : connector;
    });
}

export function getConnectorInstanceById(connectorId: string): ConnectorInstance | undefined {
  return getAllConnectorInstances().find((connector) => connector.id === connectorId);
}

/** True when this connector already has a fetched schema preview to restore on edit. */
export function hasConnectorSchemaPreview(connectorId: string): boolean {
  if (schemaPreviewFetchedById[connectorId]) return true;
  // Existing instances already have imported data from a prior setup.
  return getConnectorInstanceById(connectorId) != null;
}

export function markConnectorSchemaPreviewFetched(connectorId: string): void {
  if (schemaPreviewFetchedById[connectorId]) return;
  schemaPreviewFetchedById = { ...schemaPreviewFetchedById, [connectorId]: true };
  writeStoredSchemaPreviewFetched(schemaPreviewFetchedById);
}

function transferConnectorSchemaPreview(fromId: string, toId: string): void {
  if (!fromId || !toId || fromId === toId) return;
  if (!schemaPreviewFetchedById[fromId] && !schemaPreviewFetchedById[toId]) return;
  const next = { ...schemaPreviewFetchedById };
  if (next[fromId]) {
    next[toId] = true;
    delete next[fromId];
  }
  schemaPreviewFetchedById = next;
  writeStoredSchemaPreviewFetched(schemaPreviewFetchedById);
}

/** True when AI mapping has already been completed for this connector (skip auto re-run on edit). */
export function hasConnectorMappings(connectorId: string): boolean {
  if (mappingsCompleteById[connectorId]) return true;
  return getConnectorInstanceById(connectorId) != null;
}

export function markConnectorMappingsComplete(connectorId: string): void {
  if (mappingsCompleteById[connectorId]) return;
  mappingsCompleteById = { ...mappingsCompleteById, [connectorId]: true };
  writeStoredMappingsComplete(mappingsCompleteById);
}

function transferConnectorMappings(fromId: string, toId: string): void {
  if (!fromId || !toId || fromId === toId) return;
  if (!mappingsCompleteById[fromId] && !mappingsCompleteById[toId]) return;
  const next = { ...mappingsCompleteById };
  if (next[fromId]) {
    next[toId] = true;
    delete next[fromId];
  }
  mappingsCompleteById = next;
  writeStoredMappingsComplete(mappingsCompleteById);
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

function persistStore(
  nextEnabledById: EnabledById,
  nextAddedInstances: ConnectorInstance[],
  nextNameOverrides: InstanceNameOverrides = instanceNameOverrides,
  nextDeletedIds: DeletedIds = deletedIds,
): void {
  enabledById = nextEnabledById;
  addedInstances = nextAddedInstances;
  instanceNameOverrides = nextNameOverrides;
  deletedIds = nextDeletedIds;
  writeStoredEnabledById(nextEnabledById);
  writeStoredAddedInstances(nextAddedInstances);
  writeStoredNameOverrides(nextNameOverrides);
  writeStoredDeletedIds(nextDeletedIds);
  emitChange();
}

function clearConnectorMetadata(connectorId: string): void {
  if (schemaPreviewFetchedById[connectorId]) {
    const next = { ...schemaPreviewFetchedById };
    delete next[connectorId];
    schemaPreviewFetchedById = next;
    writeStoredSchemaPreviewFetched(schemaPreviewFetchedById);
  }
  if (mappingsCompleteById[connectorId]) {
    const next = { ...mappingsCompleteById };
    delete next[connectorId];
    mappingsCompleteById = next;
    writeStoredMappingsComplete(mappingsCompleteById);
  }
}

/** Remove a connector instance from the dashboard (persisted for the session). */
export function deleteConnectorInstance(connectorId: string): void {
  if (!connectorId || deletedIds.has(connectorId)) return;
  if (!getAllConnectorInstances().some((connector) => connector.id === connectorId)) return;

  const nextEnabledById = { ...enabledById };
  delete nextEnabledById[connectorId];

  const nextOverrides = { ...instanceNameOverrides };
  delete nextOverrides[connectorId];

  const isAddedInstance = addedInstances.some((connector) => connector.id === connectorId);
  const nextAdded = isAddedInstance
    ? addedInstances.filter((connector) => connector.id !== connectorId)
    : addedInstances;
  const nextDeleted = isAddedInstance ? deletedIds : new Set(deletedIds).add(connectorId);

  clearConnectorMetadata(connectorId);
  persistStore(nextEnabledById, nextAdded, nextOverrides, nextDeleted);
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
  deleteConnector: (connectorId: string) => void;
} {
  useSyncExternalStore(subscribe, getStoreVersion, getStoreVersion);
  const connectors = computeConnectorsList();

  const setConnectorEnabled = useCallback((connectorId: string, enabled: boolean) => {
    persistStore({ ...enabledById, [connectorId]: enabled }, addedInstances);
  }, []);

  const deleteConnector = useCallback((connectorId: string) => {
    deleteConnectorInstance(connectorId);
  }, []);

  return { connectors, setConnectorEnabled, deleteConnector };
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
  const nextName = target.name.trim();
  const existing = getAllConnectorInstances().find((connector) => connector.id === target.id);

  if (existing) {
    const nextEnabledById = { ...enabledById, [target.id]: enabled };
    const isAddedInstance = addedInstances.some((connector) => connector.id === target.id);

    if (isAddedInstance) {
      const nextAdded = addedInstances.map((connector) =>
        connector.id === target.id
          ? { ...connector, instanceName: nextName || connector.instanceName, enabled }
          : connector,
      );
      const nextOverrides = { ...instanceNameOverrides };
      delete nextOverrides[target.id];
      persistStore(nextEnabledById, nextAdded, nextOverrides);
      return;
    }

    const nextOverrides = { ...instanceNameOverrides };
    if (nextName && nextName !== CONNECTOR_INSTANCES.find((connector) => connector.id === target.id)?.instanceName) {
      nextOverrides[target.id] = nextName;
    } else {
      delete nextOverrides[target.id];
    }
    persistStore(nextEnabledById, addedInstances, nextOverrides);
    return;
  }

  const nextInstance = createAddedConnectorInstance(
    { ...target, name: nextName || target.name },
    enabled,
  );
  transferConnectorSchemaPreview(target.id, nextInstance.id);
  transferConnectorMappings(target.id, nextInstance.id);
  persistStore({ ...enabledById, [nextInstance.id]: enabled }, [...addedInstances, nextInstance]);
}
