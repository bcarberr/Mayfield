import { useMemo } from "react";
import { useResizableColumns } from "./useResizableColumns";

export const DATA_GRID_SELECT_COL_WIDTH = 40;
export const DATA_GRID_EXPAND_COL_WIDTH = 40;
export const DATA_GRID_OPTIONAL_COL_WIDTH = { default: 120, min: 80 } as const;

export const COMMON_DATA_GRID_COL_WIDTHS: Record<string, { default: number; min: number }> = {
  select: { default: DATA_GRID_SELECT_COL_WIDTH, min: DATA_GRID_SELECT_COL_WIDTH },
  expand: { default: DATA_GRID_EXPAND_COL_WIDTH, min: DATA_GRID_EXPAND_COL_WIDTH },
  severity: { default: 108, min: 72 },
  title: { default: 280, min: 120 },
  time: { default: 96, min: 72 },
  activity: { default: 88, min: 56 },
  status: { default: 88, min: 56 },
  eventType: { default: 120, min: 80 },
  eventClass: { default: 120, min: 80 },
  category: { default: 120, min: 80 },
  patchStatus: { default: 168, min: 120 },
  asset: { default: 120, min: 80 },
  owner: { default: 112, min: 80 },
  app: { default: 100, min: 72 },
  user: { default: 120, min: 80 },
  sourceIp: { default: 148, min: 96 },
  host: { default: 140, min: 96 },
  process: { default: 140, min: 96 },
  entity: { default: 140, min: 96 },
  connector: { default: 120, min: 80 },
  connectors: { default: 120, min: 80 },
  actions: { default: 56, min: 48 },
  risk: { default: 108, min: 72 },
  type: { default: 120, min: 88 },
  lastSeen: { default: 96, min: 72 },
  eventCount: { default: 96, min: 72 },
  categories: { default: 260, min: 140 },
  name: { default: 280, min: 140 },
  state: { default: 100, min: 72 },
  lastRun: { default: 120, min: 88 },
  recurrence: { default: 120, min: 88 },
  findings: { default: 140, min: 96 },
  queuedBy: { default: 120, min: 88 },
  queuedDate: { default: 120, min: 88 },
  detectionName: { default: 280, min: 140 },
  runTime: { default: 168, min: 120 },
  findingsGenerated: { default: 140, min: 96 },
  duration: { default: 100, min: 72 },
  triggeredBy: { default: 120, min: 88 },
  source: { default: 140, min: 96 },
  destination: { default: 140, min: 96 },
  records: { default: 100, min: 72 },
  accountId: { default: 120, min: 80 },
  commandLine: { default: 180, min: 100 },
  country: { default: 96, min: 72 },
  cveId: { default: 132, min: 88 },
  cweId: { default: 96, min: 72 },
  deviceId: { default: 112, min: 80 },
  domainId: { default: 112, min: 80 },
  domainName: { default: 160, min: 96 },
  emailAddress: { default: 180, min: 120 },
  fileHash: { default: 120, min: 88 },
  filename: { default: 120, min: 80 },
  groupId: { default: 112, min: 80 },
  groupName: { default: 140, min: 96 },
  hostname: { default: 140, min: 96 },
  ipAddress: { default: 132, min: 96 },
  macAddress: { default: 148, min: 96 },
  port: { default: 72, min: 56 },
  processId: { default: 96, min: 72 },
  processName: { default: 140, min: 96 },
  subnet: { default: 140, min: 96 },
  url: { default: 200, min: 120 },
  userAgent: { default: 180, min: 120 },
  userId: { default: 112, min: 80 },
  username: { default: 120, min: 80 },
};

export function buildResizableColumnArrays(
  tableColumnIds: readonly string[],
  widthMap: Record<string, { default: number; min: number }> = COMMON_DATA_GRID_COL_WIDTHS,
  fallback = DATA_GRID_OPTIONAL_COL_WIDTH,
) {
  return {
    colDefaults: tableColumnIds.map((id) => (widthMap[id] ?? fallback).default),
    colMins: tableColumnIds.map((id) => (widthMap[id] ?? fallback).min),
  };
}

export function useDynamicResizableColumns(
  tableColumnIds: readonly string[],
  widthMap?: Record<string, { default: number; min: number }>,
) {
  const { colDefaults, colMins } = useMemo(
    () => buildResizableColumnArrays(tableColumnIds, widthMap),
    [tableColumnIds, widthMap],
  );

  const firstColumnId = tableColumnIds[0];
  const selectColWidth =
    firstColumnId === "select"
      ? DATA_GRID_SELECT_COL_WIDTH
      : firstColumnId === "expand"
        ? DATA_GRID_EXPAND_COL_WIDTH
        : (widthMap?.[firstColumnId ?? ""] ?? DATA_GRID_OPTIONAL_COL_WIDTH).default;

  return useResizableColumns({
    selectColWidth,
    colDefaults,
    colMins,
  });
}

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export function dataGridHeaderCellClass(colIndex: number, total: number, columnId: string) {
  return cx(
    "relative py-0 align-middle text-xs font-bold uppercase tracking-wide text-text-primary",
    columnId === "select" || columnId === "expand" ? "border-r border-datavis-gridlines px-0" : "border-r border-datavis-gridlines px-2",
    colIndex === total - 1 && "border-r-0",
  );
}

export function dataGridBodyCellClass(columnId: string) {
  return cx("py-0 align-middle", columnId === "select" || columnId === "expand" ? "px-0" : "px-2");
}
