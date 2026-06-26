import { buildOcsfAttributesForEventClass } from "../../data/ocsfEventClassDetailSchema";
import type {
  ResultsDetailAttributeGroup,
  ResultsDetailAttributeNode,
  ResultsDetailRecord,
  ResultsDetailSourceRow,
} from "./resultsDetailPanelTypes";

export function buildResultsDetailRecord(row: ResultsDetailSourceRow): ResultsDetailRecord {
  const eventType = row.eventClass ?? row.category ?? "Vulnerability";
  const attributes = buildOcsfAttributesForEventClass(row);

  return {
    id: row.id,
    headerTitle: row.time,
    title: row.title,
    connector: row.connector,
    connectionAlias: "BC-CS",
    owner: "DunderMifflin_HQ",
    eventType,
    description: row.description,
    severity: row.severity,
    activity: row.activity,
    status: row.status,
    attributes,
    qdmJson: JSON.stringify(
      {
        metadata: {
          version: "1.3.0",
          product: { name: row.connector, vendor_name: "Query" },
        },
        class_name: eventType,
        activity_name: row.activity ?? "Create",
        severity: row.severity ?? "Medium",
        time: row.time,
        message: row.title,
        custom_mapped: Object.fromEntries(
          attributes
            .flatMap((node) => flattenAttributeFields(node))
            .filter((field) => field.customMapped)
            .map((field) => [field.id, field.value]),
        ),
      },
      null,
      2,
    ),
    relatedFindings: [
      { id: `${row.id}-f1`, label: "Repeated POST requests exceeded baseline volume" },
      { id: `${row.id}-f2`, label: "Unusual authentication pattern detected" },
    ],
  };
}

function flattenAttributeFields(
  node: ResultsDetailAttributeNode,
): Array<Extract<ResultsDetailAttributeNode, { type: "field" }>> {
  if (node.type === "field") return [node];
  return node.children.flatMap(flattenAttributeFields);
}

export function asResultsDetailSourceRow(row: {
  id: string;
  title: string;
  time: string;
  connector: string;
  description?: string;
  eventClass?: string;
  category?: string;
  eventType?: string;
  activity?: string;
  status?: string;
  severity?: string;
}): ResultsDetailSourceRow {
  return {
    id: row.id,
    title: row.title,
    time: row.time,
    connector: row.connector,
    description: row.description,
    eventClass: row.eventClass ?? row.category ?? row.eventType,
    activity: row.activity,
    status: row.status,
    severity: row.severity,
  };
}

export function hasAttributeValue(node: ResultsDetailAttributeNode): boolean {
  if (node.type === "field") return Boolean(node.value?.trim()) && node.value !== "—";
  return node.children.some(hasAttributeValue);
}

export function filterAttributesWithValues(
  nodes: readonly ResultsDetailAttributeNode[],
): ResultsDetailAttributeNode[] {
  return nodes
    .map((node) => {
      if (node.type === "group") {
        const children = filterAttributesWithValues(node.children);
        if (!children.length) return null;
        return { ...node, children };
      }
      return node.value?.trim() && node.value !== "—" ? node : null;
    })
    .filter((node): node is ResultsDetailAttributeNode => node != null);
}

export function filterAttributesBySearch(
  nodes: readonly ResultsDetailAttributeNode[],
  query: string,
): ResultsDetailAttributeNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...nodes];

  return nodes
    .map((node) => {
      if (node.type === "field") {
        const haystack = `${node.attribute} ${node.value}`.toLowerCase();
        return haystack.includes(normalizedQuery) ? node : null;
      }

      const children = filterAttributesBySearch(node.children, query);
      if (!children.length) return null;
      const group: ResultsDetailAttributeGroup = { ...node, defaultOpen: true, children };
      return group;
    })
    .filter((node): node is ResultsDetailAttributeNode => node != null);
}

export function setAllGroupsExpanded(
  nodes: readonly ResultsDetailAttributeNode[],
  expanded: boolean,
): ResultsDetailAttributeNode[] {
  return nodes.map((node) =>
    node.type === "group"
      ? { ...node, defaultOpen: expanded, children: setAllGroupsExpanded(node.children, expanded) }
      : node,
  );
}
