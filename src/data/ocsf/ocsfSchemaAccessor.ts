import {
  getHttpActivityEnumValues,
  getHttpActivityFullSchemaPaths,
  getHttpActivityShowAllAttributes,
  isHttpActivityArrayField,
  isHttpActivityEnumField,
  isHttpActivityObjectArrayField,
  isHttpActivityShowAllObjectRoot,
  isHttpActivitySimpleMappableField,
  isHttpActivityStringArrayField,
  type HttpActivityShowAllAttribute,
} from "../httpActivityFullSchema";
import {
  getMapSchemaEntitiesForEventClass,
  type MapSchemaEntity,
} from "../httpActivityMapSchemaEntities";
import { HTTP_ACTIVITY_DEMO_INITIAL_ROWS } from "../httpActivityDemoSourceFields";
import { ocsfFieldMappingTag } from "../ocsfFieldDescriptions";

export type OcsfEnumValue = { id: number; label: string };

export type OcsfShowAllAttribute = HttpActivityShowAllAttribute;

export type OcsfDemoSourceField = { source: string; sample: string };

/** Shape emitted by tools/generate_ocsf_class_schemas.py for each non-http_activity event class. */
export type OcsfGeneratedClassData = {
  fullSchemaPaths: readonly string[];
  entities: readonly MapSchemaEntity[];
  enumFields: Readonly<Record<string, readonly OcsfEnumValue[]>>;
  arrayFieldNames: readonly string[];
  stringArrayFieldNames: readonly string[];
  showAllAttributes: readonly OcsfShowAllAttribute[];
  objectRootNames: readonly string[];
  demoSourceFields: readonly OcsfDemoSourceField[];
};

/** Uniform read interface the mapper UI consumes, regardless of which event class is selected. */
export type OcsfSchemaAccessor = {
  classId: string;
  entities: readonly MapSchemaEntity[];
  demoSourceFields: readonly OcsfDemoSourceField[];
  getFullSchemaPaths(): readonly string[];
  getShowAllAttributes(): readonly OcsfShowAllAttribute[];
  isEnumField(fieldPath: string): boolean;
  getEnumValues(fieldPath: string): readonly OcsfEnumValue[];
  isArrayField(fieldPath: string): boolean;
  isObjectArrayField(fieldPath: string): boolean;
  isStringArrayField(fieldPath: string): boolean;
  isShowAllObjectRoot(fieldPath: string): boolean;
  isSimpleMappableField(
    fieldPath: string,
    options: { hasPathChildren: boolean; isEnumValue?: boolean },
  ): boolean;
};

function leafOf(fieldPath: string): string {
  return (fieldPath.split(".").at(-1) ?? fieldPath).toLowerCase();
}

export function buildHttpActivityAccessor(): OcsfSchemaAccessor {
  return {
    classId: "http_activity",
    entities: getMapSchemaEntitiesForEventClass("http_activity"),
    demoSourceFields: HTTP_ACTIVITY_DEMO_INITIAL_ROWS.map((row) => ({ source: row.source, sample: row.sample })),
    getFullSchemaPaths: getHttpActivityFullSchemaPaths,
    getShowAllAttributes: getHttpActivityShowAllAttributes,
    isEnumField: isHttpActivityEnumField,
    getEnumValues: getHttpActivityEnumValues,
    isArrayField: isHttpActivityArrayField,
    isObjectArrayField: isHttpActivityObjectArrayField,
    isStringArrayField: isHttpActivityStringArrayField,
    isShowAllObjectRoot: isHttpActivityShowAllObjectRoot,
    isSimpleMappableField: isHttpActivitySimpleMappableField,
  };
}

export const HTTP_ACTIVITY_SCHEMA_ACCESSOR: OcsfSchemaAccessor = buildHttpActivityAccessor();

/** Rendered while a generated class's data chunk is still loading. */
export const EMPTY_SCHEMA_ACCESSOR: OcsfSchemaAccessor = {
  classId: "",
  entities: [],
  demoSourceFields: [],
  getFullSchemaPaths: () => [],
  getShowAllAttributes: () => [],
  isEnumField: () => false,
  getEnumValues: () => [],
  isArrayField: () => false,
  isObjectArrayField: () => false,
  isStringArrayField: () => false,
  isShowAllObjectRoot: () => false,
  isSimpleMappableField: (_fieldPath, options) => !options.hasPathChildren,
};

export function buildGeneratedSchemaAccessor(data: OcsfGeneratedClassData, classId: string): OcsfSchemaAccessor {
  const arraySet = new Set(data.arrayFieldNames);
  const stringArraySet = new Set(data.stringArrayFieldNames);
  const objectRootSet = new Set(data.objectRootNames);
  const enumSet = new Set(Object.keys(data.enumFields));

  const isArrayField = (fieldPath: string) => arraySet.has(leafOf(fieldPath));
  const isStringArrayField = (fieldPath: string) => stringArraySet.has(leafOf(fieldPath));
  const isEnumField = (fieldPath: string) => enumSet.has(leafOf(fieldPath));

  return {
    classId,
    entities: data.entities,
    demoSourceFields: data.demoSourceFields,
    getFullSchemaPaths: () => data.fullSchemaPaths,
    getShowAllAttributes: () => data.showAllAttributes,
    isEnumField,
    getEnumValues: (fieldPath) => data.enumFields[leafOf(fieldPath)] ?? [],
    isArrayField,
    isObjectArrayField: (fieldPath) => isArrayField(fieldPath) && !isStringArrayField(fieldPath),
    isStringArrayField,
    isShowAllObjectRoot: (fieldPath) => objectRootSet.has(fieldPath.toLowerCase()),
    isSimpleMappableField: (fieldPath, options) => {
      if (options.isEnumValue) return true;
      if (options.hasPathChildren) return false;
      if (isEnumField(fieldPath)) return false;
      if (isArrayField(fieldPath)) return false;
      return true;
    },
  };
}

export type GenericMappingRow = { source: string; sample: string; mapped: boolean; tags?: string[] };

/**
 * Demo "AI mapping" preview for generated (non-http_activity) classes: maps most rows to a
 * cycling selection of this class's entity + classification/occurrence paths, mirroring the
 * ~80%-mapped shape of httpActivityDemoSourceFields.ts's hand-built http_activity demo.
 */
export function buildGenericDemoMappedRows(
  sourceRows: readonly OcsfDemoSourceField[],
  data: OcsfGeneratedClassData,
): GenericMappingRow[] {
  const entityPaths = data.entities.flatMap((entity) => [...entity.paths]);
  const recommendedPaths = data.showAllAttributes
    .filter((attribute) => attribute.group === "classification" || attribute.group === "occurrence")
    .map((attribute) => attribute.name);
  const candidatePaths = [...new Set([...recommendedPaths, ...entityPaths])];

  if (candidatePaths.length === 0) {
    return sourceRows.map((row) => ({ ...row, mapped: false }));
  }

  const mapCount = Math.max(1, Math.round(sourceRows.length * 0.8));
  return sourceRows.map((row, index) => {
    if (index >= mapCount) return { ...row, mapped: false };
    const path = candidatePaths[index % candidatePaths.length]!;
    return { ...row, mapped: true, tags: [ocsfFieldMappingTag(path)] };
  });
}
