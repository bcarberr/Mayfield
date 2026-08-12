import { useEffect, useState } from "react";
import { OCSF_GENERATED_CLASS_LOADERS } from "./ocsfClassSchemaRegistry.generated";
import {
  buildGeneratedSchemaAccessor,
  EMPTY_SCHEMA_ACCESSOR,
  HTTP_ACTIVITY_SCHEMA_ACCESSOR,
  type OcsfGeneratedClassData,
  type OcsfSchemaAccessor,
} from "./ocsfSchemaAccessor";

const rawDataCache = new Map<string, OcsfGeneratedClassData>();
const accessorCache = new Map<string, OcsfSchemaAccessor>();

/** Loads (and caches) a generated class's raw schema data — used by the AI-mapping demo. */
export async function loadGeneratedOcsfClassData(eventClassId: string): Promise<OcsfGeneratedClassData | null> {
  const cached = rawDataCache.get(eventClassId);
  if (cached) return cached;

  const loader = OCSF_GENERATED_CLASS_LOADERS[eventClassId];
  if (!loader) return null;

  const mod = await loader();
  rawDataCache.set(eventClassId, mod.default);
  return mod.default;
}

/** Resolves the schema accessor for the selected event class, loading its data chunk on demand. */
export function useOcsfSchemaAccessor(eventClassId: string): {
  accessor: OcsfSchemaAccessor;
  isLoading: boolean;
} {
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (eventClassId === "http_activity") return;
    if (accessorCache.has(eventClassId)) return;

    let cancelled = false;
    loadGeneratedOcsfClassData(eventClassId).then((data) => {
      if (cancelled || !data) return;
      accessorCache.set(eventClassId, buildGeneratedSchemaAccessor(data, eventClassId));
      forceRender((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [eventClassId]);

  if (eventClassId === "http_activity") {
    return { accessor: HTTP_ACTIVITY_SCHEMA_ACCESSOR, isLoading: false };
  }

  const cached = accessorCache.get(eventClassId);
  return { accessor: cached ?? EMPTY_SCHEMA_ACCESSOR, isLoading: !cached };
}
