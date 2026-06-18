import { useCallback, useSyncExternalStore } from "react";
import {
  DATA_GRID_DEFAULT_PAGE_SIZE,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  isDataGridPageSize,
} from "./dataGridPaginationConfig";

export const DATA_GRID_SYNC_PAGE_SIZE_KEY = "mayfield:datagrid-sync-page-size";
export const DATA_GRID_GLOBAL_PAGE_SIZE_KEY = "mayfield:datagrid-page-size";

type PreferenceState = {
  syncAllGrids: boolean;
  globalPageSize: number;
};

const SERVER_SNAPSHOT: PreferenceState = {
  syncAllGrids: false,
  globalPageSize: DATA_GRID_DEFAULT_PAGE_SIZE,
};

function readSyncEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DATA_GRID_SYNC_PAGE_SIZE_KEY) === "true";
  } catch {
    return false;
  }
}

function readGlobalPageSize(): number {
  if (typeof window === "undefined") return DATA_GRID_DEFAULT_PAGE_SIZE;
  try {
    const stored = window.localStorage.getItem(DATA_GRID_GLOBAL_PAGE_SIZE_KEY);
    const parsed = stored ? Number(stored) : NaN;
    if (isDataGridPageSize(parsed)) return parsed;
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
  return DATA_GRID_DEFAULT_PAGE_SIZE;
}

function readState(): PreferenceState {
  return {
    syncAllGrids: readSyncEnabled(),
    globalPageSize: readGlobalPageSize(),
  };
}

let state: PreferenceState = readState();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persistState(next: PreferenceState) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DATA_GRID_SYNC_PAGE_SIZE_KEY, String(next.syncAllGrids));
      window.localStorage.setItem(DATA_GRID_GLOBAL_PAGE_SIZE_KEY, String(next.globalPageSize));
    } catch {
      /* ignore */
    }
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function getInitialDataGridPageSize(fallback: number): number {
  if (readSyncEnabled()) return readGlobalPageSize();
  return fallback;
}

export function useDataGridPageSizePreference() {
  const { syncAllGrids, globalPageSize } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SERVER_SNAPSHOT,
  );

  const setSyncAllGrids = useCallback((enabled: boolean, currentPageSize?: number) => {
    if (enabled) {
      const pageSize =
        currentPageSize !== undefined && isDataGridPageSize(currentPageSize)
          ? currentPageSize
          : state.globalPageSize;
      persistState({ syncAllGrids: true, globalPageSize: pageSize });
      return;
    }
    persistState({ ...state, syncAllGrids: false });
  }, []);

  const setGlobalPageSize = useCallback((pageSize: number) => {
    if (!isDataGridPageSize(pageSize)) return;
    if (!state.syncAllGrids) return;
    persistState({ syncAllGrids: true, globalPageSize: pageSize });
  }, []);

  return {
    syncAllGrids,
    globalPageSize,
    setSyncAllGrids,
    setGlobalPageSize,
    pageSizeOptions: DATA_GRID_PAGE_SIZE_OPTIONS,
  };
}
