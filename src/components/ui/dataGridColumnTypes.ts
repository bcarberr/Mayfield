import { useCallback, useMemo, useState } from "react";

export type LockedColumnPlacement = "start" | "end";

export type DataGridColumnDef = {
  id: string;
  label: string;
  /** Shown in the grid on first load / after reset. */
  defaultVisible?: boolean;
  /** Always rendered; omitted from the column picker. */
  locked?: boolean;
  /** Where locked columns are inserted relative to picker columns. */
  lockedPlacement?: LockedColumnPlacement;
};

export type DataGridColumnLayout = {
  /** Full catalog order — visible ids are listed first after picker interactions. */
  order: string[];
  visibleIds: Set<string>;
};

/** Figma column picker — federated results default visible set + entity attributes. */
export const DEFAULT_FEDERATED_RESULTS_COLUMNS: DataGridColumnDef[] = [
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "time", label: "Time", defaultVisible: true },
  { id: "activity", label: "Activity", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "eventType", label: "Event Class", defaultVisible: true },
  { id: "connector", label: "Connector", defaultVisible: true },
  { id: "accountId", label: "Account ID" },
  { id: "commandLine", label: "Command Line" },
  { id: "country", label: "Country" },
  { id: "cveId", label: "CVE ID" },
  { id: "cweId", label: "CWE ID" },
  { id: "deviceId", label: "Device ID" },
  { id: "domainId", label: "Domain ID" },
  { id: "domainName", label: "Domain Name" },
  { id: "emailAddress", label: "Email Address" },
  { id: "fileHash", label: "File Hash" },
  { id: "filename", label: "Filename" },
  { id: "groupId", label: "Group ID" },
  { id: "groupName", label: "Group Name" },
  { id: "hostname", label: "Hostname" },
  { id: "ipAddress", label: "IP Address" },
  { id: "macAddress", label: "MAC Address" },
  { id: "port", label: "Port" },
  { id: "processId", label: "Process ID" },
  { id: "processName", label: "Process Name" },
  { id: "subnet", label: "Subnet" },
  { id: "url", label: "URL" },
  { id: "userAgent", label: "User Agent" },
  { id: "userId", label: "User ID" },
  { id: "username", label: "Username" },
];

/** Findings grid — matches current dashboard columns as defaults. */
export const FINDINGS_DATA_GRID_COLUMNS: DataGridColumnDef[] = [
  { id: "select", label: "Select", locked: true, lockedPlacement: "start" },
  { id: "severity", label: "Severity", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "time", label: "Time", defaultVisible: true },
  { id: "activity", label: "Activity", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "category", label: "Event Class", defaultVisible: true },
  { id: "actions", label: "Actions", locked: true, lockedPlacement: "end" },
  { id: "connector", label: "Connector", defaultVisible: true },
  { id: "accountId", label: "Account ID" },
  { id: "commandLine", label: "Command Line" },
  { id: "country", label: "Country" },
  { id: "cveId", label: "CVE ID" },
  { id: "cweId", label: "CWE ID" },
  { id: "deviceId", label: "Device ID" },
  { id: "domainId", label: "Domain ID" },
  { id: "domainName", label: "Domain Name" },
  { id: "emailAddress", label: "Email Address" },
  { id: "fileHash", label: "File Hash" },
  { id: "filename", label: "Filename" },
  { id: "groupId", label: "Group ID" },
  { id: "groupName", label: "Group Name" },
  { id: "hostname", label: "Hostname" },
  { id: "ipAddress", label: "IP Address" },
  { id: "macAddress", label: "MAC Address" },
  { id: "port", label: "Port" },
  { id: "processId", label: "Process ID" },
  { id: "processName", label: "Process Name" },
  { id: "subnet", label: "Subnet" },
  { id: "url", label: "URL" },
  { id: "userAgent", label: "User Agent" },
  { id: "userId", label: "User ID" },
  { id: "username", label: "Username" },
];

export function getPickerColumns(columns: readonly DataGridColumnDef[]): DataGridColumnDef[] {
  return columns.filter((column) => !column.locked);
}

export function createDefaultColumnLayout(columns: readonly DataGridColumnDef[]): DataGridColumnLayout {
  const pickerColumns = getPickerColumns(columns);
  const visible = pickerColumns.filter((column) => column.defaultVisible).map((column) => column.id);
  const hidden = pickerColumns.filter((column) => !column.defaultVisible).map((column) => column.id);
  return {
    order: [...visible, ...hidden],
    visibleIds: new Set(visible),
  };
}

function layoutsEqual(a: DataGridColumnLayout, b: DataGridColumnLayout): boolean {
  if (a.order.length !== b.order.length) return false;
  for (let i = 0; i < a.order.length; i++) {
    if (a.order[i] !== b.order[i]) return false;
  }
  if (a.visibleIds.size !== b.visibleIds.size) return false;
  for (const id of a.visibleIds) {
    if (!b.visibleIds.has(id)) return false;
  }
  return true;
}

export function reorderPickerColumns(
  layout: DataGridColumnLayout,
  draggedId: string,
  targetId: string,
): DataGridColumnLayout {
  const visible = layout.order.filter((id) => layout.visibleIds.has(id));
  const hidden = layout.order.filter((id) => !layout.visibleIds.has(id));
  const fromIndex = visible.indexOf(draggedId);
  const toIndex = visible.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return layout;

  const nextVisible = [...visible];
  nextVisible.splice(fromIndex, 1);
  nextVisible.splice(toIndex, 0, draggedId);

  return {
    order: [...nextVisible, ...hidden],
    visibleIds: layout.visibleIds,
  };
}

export function setPickerColumnVisible(
  layout: DataGridColumnLayout,
  columnId: string,
  visible: boolean,
): DataGridColumnLayout {
  const nextVisibleIds = new Set(layout.visibleIds);
  const wasVisible = nextVisibleIds.has(columnId);

  if (visible) nextVisibleIds.add(columnId);
  else nextVisibleIds.delete(columnId);

  let visibleOrder = layout.order.filter((id) => nextVisibleIds.has(id));
  const hiddenOrder = layout.order.filter((id) => !nextVisibleIds.has(id));

  if (visible && !wasVisible) {
    visibleOrder = [...visibleOrder.filter((id) => id !== columnId), columnId];
  }

  return {
    order: [...visibleOrder, ...hiddenOrder],
    visibleIds: nextVisibleIds,
  };
}

export function isColumnLayoutDefault(
  layout: DataGridColumnLayout,
  columns: readonly DataGridColumnDef[],
): boolean {
  return layoutsEqual(layout, createDefaultColumnLayout(columns));
}

function getLockedPlacement(column: DataGridColumnDef): LockedColumnPlacement {
  if (column.id === "actions") return "end";
  if (column.lockedPlacement) return column.lockedPlacement;
  if (column.id === "select" || column.id === "expand") return "start";
  return "end";
}

/** Locked columns + visible picker order. Actions always renders last. */
export function resolveTableColumnIds(
  columns: readonly DataGridColumnDef[],
  layout: DataGridColumnLayout,
): string[] {
  const lockedColumns = columns.filter((column) => column.locked);
  const startLocked = lockedColumns
    .filter((column) => getLockedPlacement(column) === "start")
    .map((column) => column.id);
  const endLocked = lockedColumns
    .filter((column) => getLockedPlacement(column) === "end" && column.id !== "actions")
    .map((column) => column.id);
  const hasActions = lockedColumns.some((column) => column.id === "actions");
  const pickerVisible = layout.order.filter((id) => layout.visibleIds.has(id));

  const result = [...startLocked, ...pickerVisible, ...endLocked];
  if (hasActions) result.push("actions");
  return result;
}

export function useDataGridColumnLayout(columns: readonly DataGridColumnDef[]) {
  const defaultLayout = useMemo(() => createDefaultColumnLayout(columns), [columns]);
  const [layout, setLayout] = useState<DataGridColumnLayout>(defaultLayout);

  const isDefault = useMemo(() => layoutsEqual(layout, defaultLayout), [layout, defaultLayout]);

  const resetToDefault = useCallback(() => {
    setLayout(defaultLayout);
  }, [defaultLayout]);

  const visiblePickerColumnIds = useMemo(
    () => layout.order.filter((id) => layout.visibleIds.has(id)),
    [layout],
  );

  const tableColumnIds = useMemo(
    () => resolveTableColumnIds(columns, layout),
    [columns, layout],
  );

  const isColumnVisible = useCallback(
    (columnId: string) => {
      const column = columns.find((entry) => entry.id === columnId);
      if (column?.locked) return true;
      return layout.visibleIds.has(columnId);
    },
    [columns, layout],
  );

  return {
    layout,
    setLayout,
    resetToDefault,
    isDefault,
    visiblePickerColumnIds,
    tableColumnIds,
    isColumnVisible,
    pickerColumns: getPickerColumns(columns),
  };
}

/** Column layout state + FilterColumnPanel props for a data grid. */
export function useDataGridColumnPanel(
  columns: readonly DataGridColumnDef[],
) {
  const columnLayout = useDataGridColumnLayout(columns);
  return {
    tableColumnIds: columnLayout.tableColumnIds,
    filterColumnPanelColumnProps: {
      columns,
      columnLayout: columnLayout.layout,
      onColumnLayoutChange: columnLayout.setLayout,
      columnLayoutIsDefault: columnLayout.isDefault,
      onColumnLayoutReset: columnLayout.resetToDefault,
    },
  };
}
