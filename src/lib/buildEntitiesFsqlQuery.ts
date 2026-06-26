export type EntityFsqlClause = {
  observable: string;
  value: string;
};

const ENTITY_TYPE_OBSERVABLE: Record<string, string> = {
  User: "%username",
  Account: "%username",
  Device: "%hostname",
  "Cloud Resource": "%resource_name",
  Process: "%processname",
};

export const ENTITY_CATEGORY_CARD_OBSERVABLE: Record<string, string> = {
  "Top IP Addresses": "%ip",
  "Top Usernames": "%username",
  "Top Hostnames": "%hostname",
  "Top CVEs": "%cve",
  "MAC Addresses": "%mac",
  "Top URLs": "%url",
};

function escapeFsqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/** Build an FSQL query to search for a results-detail attribute value. */
export function buildAttributeValueFsqlQuery(
  fieldId: string,
  attributeLabel: string,
  value: string,
): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "—") return "";

  const escaped = escapeFsqlString(trimmed);
  const id = fieldId.toLowerCase();
  const label = attributeLabel.toLowerCase();

  let filter: string;
  if (id.includes("ip") || label.includes("ip address")) {
    filter = `%ip = '${escaped}'`;
  } else if (
    id.includes("hostname") ||
    id === "domain" ||
    id.includes("dstname") ||
    id.includes("srcname") ||
    id.includes("devicename") ||
    label.includes("hostname")
  ) {
    filter = `%hostname = '${escaped}'`;
  } else if (id.includes("url") || label === "url") {
    filter = `%url CONTAINS '${escaped}'`;
  } else if (id.includes("user") || id.includes("email") || label.includes("user")) {
    filter = `%username = '${escaped}'`;
  } else if (id.includes("cve") || label.includes("cve")) {
    filter = `%cve = '${escaped}'`;
  } else if (id.includes("mac") || label.includes("mac")) {
    filter = `%mac = '${escaped}'`;
  } else {
    filter = `(%hostname CONTAINS '${escaped}' OR %username CONTAINS '${escaped}' OR %ip CONTAINS '${escaped}')`;
  }

  return `QUERY\nSHOW **\nWITH ${filter}\nLIMIT 100`;
}

function formatInList(values: readonly string[]): string {
  return values.map((value) => `'${escapeFsqlString(value)}'`).join(", ");
}

function groupByObservable(clauses: readonly EntityFsqlClause[]): Map<string, string[]> {
  const byObservable = new Map<string, string[]>();

  for (const { observable, value } of clauses) {
    const values = byObservable.get(observable) ?? [];
    if (!values.includes(value)) {
      values.push(value);
    }
    byObservable.set(observable, values);
  }

  return byObservable;
}

export function entityTypeToObservable(type: string): string {
  return ENTITY_TYPE_OBSERVABLE[type] ?? "%hostname";
}

export function buildEntitiesFsqlQuery(clauses: readonly EntityFsqlClause[]): string {
  if (clauses.length === 0) return "";

  const byObservable = groupByObservable(clauses);
  const parts = [...byObservable.entries()].map(
    ([observable, values]) => `${observable} IN ${formatInList(values)}`,
  );

  const where = parts.length === 1 ? parts[0]! : `(${parts.join(" OR ")})`;
  return `QUERY\nSHOW **\nWITH ${where}\nLIMIT 100`;
}

export function buildAggregatedEntitiesFsqlQuery(
  entities: readonly { entity: string; type: string }[],
): string {
  const clauses = entities.map(({ entity, type }) => ({
    observable: entityTypeToObservable(type),
    value: entity,
  }));
  return buildEntitiesFsqlQuery(clauses);
}

export function buildCategoryEntitiesFsqlQuery(
  selections: readonly { cardTitle: string; label: string }[],
): string {
  const clauses = selections.map(({ cardTitle, label }) => ({
    observable: ENTITY_CATEGORY_CARD_OBSERVABLE[cardTitle] ?? "%hostname",
    value: label,
  }));
  return buildEntitiesFsqlQuery(clauses);
}
