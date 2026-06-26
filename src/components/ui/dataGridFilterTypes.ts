import { useMemo, useState } from "react";

export type DataGridFilterFacetValue = {
  label: string;
  count: number;
};

export type DataGridFilterFacet = {
  id: string;
  label: string;
  values: DataGridFilterFacetValue[];
};

/** facetId → selected value labels */
export type DataGridFacetSelections = Record<string, Set<string>>;

export type DataGridFacetDefinition<T> = {
  id: string;
  label: string;
  getValue: (row: T) => string;
  /** When set, facet values/counts/filtering use all returned labels (e.g. entity attributes). */
  getValues?: (row: T) => readonly string[];
  order?: readonly string[];
};

/** Always pinned above the entity/attribute section. */
export const DATA_GRID_FILTER_PRIMARY_FACET_IDS = [
  "connectors",
  "connector",
  "eventType",
  "eventClass",
  "category",
] as const;

/** Entity observables + recommended attributes below the section divider (Figma order). */
export const DATA_GRID_FILTER_SECONDARY_FACET_ORDER = [
  "accountId",
  "activity",
  "country",
  "countryRegion",
  "domain",
  "domainName",
  "email",
  "emailAddress",
  "fileHash",
  "ipAddress",
  "hostname",
  "severity",
  "status",
] as const;

const PRIMARY_FACET_SORT = DATA_GRID_FILTER_PRIMARY_FACET_IDS as readonly string[];
const SECONDARY_FACET_SORT = DATA_GRID_FILTER_SECONDARY_FACET_ORDER as readonly string[];

export function partitionDataGridFacets(facets: readonly DataGridFilterFacet[]): {
  primary: DataGridFilterFacet[];
  secondary: DataGridFilterFacet[];
} {
  const primaryIdSet = new Set<string>(PRIMARY_FACET_SORT);
  const primary: DataGridFilterFacet[] = [];
  const secondaryById = new Map<string, DataGridFilterFacet>();

  for (const facet of facets) {
    if (primaryIdSet.has(facet.id)) primary.push(facet);
    else secondaryById.set(facet.id, facet);
  }

  primary.sort(
    (a, b) =>
      PRIMARY_FACET_SORT.indexOf(a.id) - PRIMARY_FACET_SORT.indexOf(b.id) ||
      a.label.localeCompare(b.label),
  );

  const secondary: DataGridFilterFacet[] = [];
  for (const id of SECONDARY_FACET_SORT) {
    const facet = secondaryById.get(id);
    if (facet) {
      secondary.push(facet);
      secondaryById.delete(id);
    }
  }

  secondary.push(
    ...[...secondaryById.values()].sort((a, b) => a.label.localeCompare(b.label)),
  );

  return { primary, secondary };
}

/** Figma `7671:8864` — default facet panel when a grid has no row-derived facets. */
export const DEFAULT_DATA_GRID_FILTER_FACETS: DataGridFilterFacet[] = [
  {
    id: "connectors",
    label: "Connectors",
    values: [
      { label: "Amazon S3", count: 42 },
      { label: "CrowdStrike Falcon", count: 38 },
      { label: "Microsoft Defender", count: 31 },
      { label: "Okta", count: 28 },
      { label: "Palo Alto Cortex", count: 24 },
    ],
  },
  {
    id: "eventType",
    label: "Event Class",
    values: [
      { label: "Application Security Posture Finding", count: 2 },
      { label: "Authentication", count: 38 },
      { label: "Detection Finding", count: 22 },
      { label: "Entity Management", count: 1 },
      { label: "Network Activity", count: 101 },
      { label: "Process Activity", count: 65 },
      { label: "Software Inventory Info", count: 10 },
    ],
  },
  {
    id: "accountId",
    label: "Account ID",
    values: [
      { label: "10029384", count: 14 },
      { label: "10084721", count: 9 },
      { label: "10100293", count: 6 },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    values: [
      { label: "Create", count: 18 },
      { label: "Delete", count: 12 },
      { label: "Update", count: 24 },
    ],
  },
  {
    id: "country",
    label: "Country/Region",
    values: [
      { label: "US", count: 88 },
      { label: "EU", count: 42 },
    ],
  },
  {
    id: "domain",
    label: "Domain Name",
    values: [
      { label: "corp.example.com", count: 31 },
      { label: "api.example.com", count: 22 },
      { label: "cdn.example.net", count: 15 },
    ],
  },
  {
    id: "email",
    label: "Email Address",
    values: [
      { label: "admin@corp.example.com", count: 12 },
      { label: "svc-backup@corp.example.com", count: 8 },
      { label: "alerts@corp.example.com", count: 5 },
    ],
  },
  {
    id: "fileHash",
    label: "File Hash",
    values: [
      { label: "a3f5…9c2d", count: 7 },
      { label: "b81e…44fa", count: 4 },
      { label: "c29a…10be", count: 3 },
    ],
  },
  {
    id: "ipAddress",
    label: "IP Address",
    values: [
      { label: "10.0.4.12", count: 24 },
      { label: "192.168.1.44", count: 18 },
      { label: "207.32.75.34", count: 15 },
    ],
  },
  {
    id: "hostname",
    label: "Hostname",
    values: [
      { label: "norma-laptop", count: 21 },
      { label: "WIN-DC01", count: 18 },
      { label: "api-prod-04", count: 14 },
    ],
  },
  {
    id: "severity",
    label: "Severity",
    values: [
      { label: "Critical", count: 256 },
      { label: "High", count: 402 },
      { label: "Medium", count: 78 },
    ],
  },
  {
    id: "status",
    label: "Status",
    values: [
      { label: "New", count: 44 },
      { label: "In Progress", count: 28 },
      { label: "Resolved", count: 16 },
      { label: "Suppressed", count: 9 },
      { label: "Failure", count: 6 },
    ],
  },
];

export function countFacetValues<T>(
  rows: readonly T[],
  getValue: (row: T) => string,
  order?: readonly string[],
): DataGridFilterFacetValue[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = getValue(row);
    if (!label || label === "—") continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  if (order) {
    return order
      .map((label) => ({
        label,
        count: counts.get(label) ?? 0,
      }))
      .filter((entry) => entry.count > 0);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

export function countMultiValueFacetValues<T>(
  rows: readonly T[],
  getValues: (row: T) => readonly string[],
): DataGridFilterFacetValue[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const label of getValues(row)) {
      if (!label || label === "—") continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

export function buildDataGridFacets<T>(
  rows: readonly T[],
  definitions: readonly DataGridFacetDefinition<T>[],
): DataGridFilterFacet[] {
  return definitions
    .map((definition) => ({
      id: definition.id,
      label: definition.label,
      values: definition.getValues
        ? countMultiValueFacetValues(rows, definition.getValues)
        : countFacetValues(rows, definition.getValue, definition.order),
    }))
    .filter((facet) => facet.values.length > 0);
}

export function applyDataGridFacetFilters<T>(
  rows: readonly T[],
  selections: DataGridFacetSelections,
  definitions: readonly DataGridFacetDefinition<T>[],
): T[] {
  const activeFacets = Object.entries(selections).filter(([, selected]) => selected.size > 0);
  if (activeFacets.length === 0) return [...rows];

  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));

  return rows.filter((row) =>
    activeFacets.every(([facetId, selected]) => {
      const definition = definitionById.get(facetId);
      if (!definition) return true;

      if (definition.getValues) {
        return definition.getValues(row).some((value) => selected.has(value));
      }

      return selected.has(definition.getValue(row));
    }),
  );
}

export function hasDataGridFacetSelections(selections: DataGridFacetSelections): boolean {
  return Object.values(selections).some((selected) => selected.size > 0);
}

export function clearDataGridFacetSelections(): DataGridFacetSelections {
  return {};
}

export function useDataGridFacetFilter<T>(
  rows: readonly T[],
  definitions: readonly DataGridFacetDefinition<T>[],
) {
  const [selections, setSelections] = useState<DataGridFacetSelections>({});

  const facets = useMemo(
    () => buildDataGridFacets(rows, definitions),
    [rows, definitions],
  );

  const filteredRows = useMemo(
    () => applyDataGridFacetFilters(rows, selections, definitions),
    [rows, selections, definitions],
  );

  const hasFacetFilters = useMemo(() => hasDataGridFacetSelections(selections), [selections]);

  return {
    facets,
    selections,
    setSelections,
    filteredRows,
    hasFacetFilters,
    clearSelections: () => setSelections({}),
    filterPanelProps: {
      facets,
      selections,
      onSelectionsChange: setSelections,
    },
  };
}
