import { ENTITY_ATTRIBUTE_COLUMNS } from "./dataGridColumnCatalog";
import { getEntityAttributeDemoValues } from "./dataGridEntityAttributes";
import type { DataGridFacetDefinition } from "./dataGridFilterTypes";

const FACET_LABELS: Record<string, string> = {
  severity: "Severity",
  activity: "Activity",
  status: "Status",
  eventClass: "Event Class",
  eventType: "Event Class",
  category: "Event Class",
  connector: "Connectors",
  connectors: "Connectors",
  patchStatus: "Patch Compliance",
  asset: "Asset",
  owner: "Owner",
  app: "App",
  user: "User",
  sourceIp: "Source IP",
  host: "Host",
  process: "Process",
  entity: "Entity",
  risk: "Risk",
  type: "Type",
  categories: "Categories Involved",
  name: "Name",
  state: "State",
  lastRun: "Last Run",
  recurrence: "Recurrence",
  findings: "Detection Findings",
  queuedBy: "Queued By",
  queuedDate: "Queued Date",
  detectionName: "Detection",
  runTime: "Run Time",
  findingsGenerated: "Findings Generated",
  duration: "Duration",
  triggeredBy: "Triggered By",
  source: "Source",
  destination: "Destination",
  records: "Records",
};

export function facetDef<T>(
  id: string,
  getValue: (row: T) => string,
  label = FACET_LABELS[id] ?? id,
): DataGridFacetDefinition<T> {
  return { id, label, getValue };
}

export function withEntityAttributeFacets<T extends { id: string }>(
  definitions: readonly DataGridFacetDefinition<T>[],
): DataGridFacetDefinition<T>[] {
  return [
    ...definitions,
    ...ENTITY_ATTRIBUTE_COLUMNS.map((column) => ({
      id: column.id,
      label: column.label,
      getValue: () => "",
      getValues: (row: T) => getEntityAttributeDemoValues(row.id, column.id),
    })),
  ];
}

type EventGridFacetFields<T> = {
  severity?: (row: T) => string;
  activity?: (row: T) => string;
  status?: (row: T) => string;
  eventClass?: (row: T) => string;
  eventType?: (row: T) => string;
  category?: (row: T) => string;
  connector?: (row: T) => string;
  connectors?: (row: T) => string;
  patchStatus?: (row: T) => string;
  asset?: (row: T) => string;
  owner?: (row: T) => string;
  app?: (row: T) => string;
  user?: (row: T) => string;
  sourceIp?: (row: T) => string;
  host?: (row: T) => string;
  process?: (row: T) => string;
  entity?: (row: T) => string;
  risk?: (row: T) => string;
  type?: (row: T) => string;
  categories?: (row: T) => string;
  name?: (row: T) => string;
  state?: (row: T) => string;
  lastRun?: (row: T) => string;
  recurrence?: (row: T) => string;
  findings?: (row: T) => string;
  queuedBy?: (row: T) => string;
  queuedDate?: (row: T) => string;
  detectionName?: (row: T) => string;
  runTime?: (row: T) => string;
  findingsGenerated?: (row: T) => string;
  duration?: (row: T) => string;
  triggeredBy?: (row: T) => string;
  source?: (row: T) => string;
  destination?: (row: T) => string;
  records?: (row: T) => string;
};

export function eventGridFacetDefinitions<T extends { id: string }>(
  fields: EventGridFacetFields<T>,
  options?: { includeEntityAttributes?: boolean },
): DataGridFacetDefinition<T>[] {
  const includeEntityAttributes = options?.includeEntityAttributes ?? true;
  const definitions = (Object.entries(fields) as [keyof EventGridFacetFields<T>, (row: T) => string][])
    .map(([id, getValue]) => facetDef(String(id), getValue));

  return includeEntityAttributes ? withEntityAttributeFacets(definitions) : definitions;
}

export function formatDetectionFindings(findings: number | "error" | "none"): string {
  if (typeof findings === "number") return String(findings);
  return findings === "error" ? "Error" : "None";
}
