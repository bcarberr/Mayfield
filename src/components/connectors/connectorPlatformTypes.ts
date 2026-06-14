import type { ConnectorLargeIconName } from "../../design-system";
import {
  CONNECTOR_CATEGORIES,
  CONNECTOR_INSTANCES,
  type ConnectorCategoryId,
} from "./connectorsData";

export type ConnectorPlatformType = {
  id: string;
  categoryId: ConnectorCategoryId;
  /** Tile label — Figma Configure-Schema-Simplified catalog names. */
  name: string;
  icon: ConnectorLargeIconName;
};

const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  "Amazon Athena (for Amazon S3)": "Amazon Athena",
  "Amazon Cloudwatch Logs (for AWS WAFv2)": "Amazon CloudWatch Logs",
  "SentinelOne Singularity Platform": "SentinelOne",
  "JAMF Pro": "Jamf",
  "Google Workspace - Directory API": "Google Workspace",
  "AlienVault": "AlienVault OTX",
  "Virus Total": "VirusTotal",
};

function displayName(connectorType: string): string {
  return DISPLAY_NAME_OVERRIDES[connectorType] ?? connectorType;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildPlatformTypes(): ConnectorPlatformType[] {
  const seen = new Map<string, ConnectorPlatformType>();

  for (const instance of CONNECTOR_INSTANCES) {
    const key = `${instance.categoryId}:${instance.connectorType}:${instance.icon}`;
    if (seen.has(key)) continue;

    const name = displayName(instance.connectorType);
    const id = slug(`${instance.categoryId}-${name}`);

    seen.set(key, {
      id,
      categoryId: instance.categoryId,
      name,
      icon: instance.icon,
    });
  }

  return [...seen.values()];
}

export const CONNECTOR_PLATFORM_TYPES: readonly ConnectorPlatformType[] = buildPlatformTypes();

export const CONNECTOR_PLATFORM_TYPES_BY_CATEGORY = CONNECTOR_CATEGORIES.map((category) => ({
  category,
  platforms: CONNECTOR_PLATFORM_TYPES.filter((platform) => platform.categoryId === category.id),
})).filter((group) => group.platforms.length > 0);

export type ConnectorSetupTarget = {
  id: string;
  name: string;
  icon: ConnectorLargeIconName;
  categoryId: ConnectorCategoryId;
};

/** Data Lakes and Data Warehouses use the multi-step dynamic schema wizard. */
export const DYNAMIC_SCHEMA_CATEGORY_ID: ConnectorCategoryId = "data-lakes";

export function isDynamicSchemaCategory(categoryId: ConnectorCategoryId): boolean {
  return categoryId === DYNAMIC_SCHEMA_CATEGORY_ID;
}

export function resolveConnectorSetupTarget(connectorId: string): ConnectorSetupTarget {
  const platform = CONNECTOR_PLATFORM_TYPES.find((entry) => entry.id === connectorId);
  if (platform) {
    return {
      id: platform.id,
      name: platform.name,
      icon: platform.icon,
      categoryId: platform.categoryId,
    };
  }

  const instance = CONNECTOR_INSTANCES.find((entry) => entry.id === connectorId);
  if (instance) {
    return {
      id: instance.id,
      name: displayName(instance.connectorType),
      icon: instance.icon,
      categoryId: instance.categoryId,
    };
  }

  return {
    id: connectorId,
    name: connectorId,
    icon: CONNECTOR_PLATFORM_TYPES[0]?.icon ?? "connector-large-aws-athena",
    categoryId: CONNECTOR_PLATFORM_TYPES[0]?.categoryId ?? "cloud-infrastructure",
  };
}
