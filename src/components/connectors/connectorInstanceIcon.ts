import type { ConnectorLargeIconName } from "../../design-system";
import { CONNECTOR_INSTANCES } from "./connectorsData";

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function iconFromKeywords(name: string): ConnectorLargeIconName | null {
  const lower = name.toLowerCase();
  if (lower.includes("athena")) return "connector-large-aws-athena";
  if (lower.includes("sentinelone") || lower.includes("sentinel one")) return "connector-large-sentinelone";
  if (lower.includes("defender")) return "connector-large-ms-defender-endpoint";
  if (lower.includes("crowdstrike") || lower.includes("crowd strike")) return "connector-large-crowdstrike";
  if (lower.includes("carbon black")) return "connector-large-vm-carbon-black";
  if (lower.includes("okta")) return "connector-large-okta";
  if (lower.includes("splunk")) return "connector-large-splunk";
  if (lower.includes("graph") || lower.includes("entra") || lower.includes("azure")) {
    return "connector-large-microsoftgraph";
  }
  if (lower.includes("sec lake") || lower.includes("security lake")) return "connector-large-aws-sec-lake";
  if (lower.includes("cloudwatch") || lower.includes("waf")) return "connector-large-amazon-cloudwatch";
  if (lower.includes("google") || lower.includes("gcp")) return "connector-large-gcp-google-big-query";
  if (lower.includes("active directory") || lower.includes("directory")) {
    return "connector-large-ms-active-directory";
  }
  return null;
}

/** Resolve a 24px connector-large icon for a connector instance name shown in data tables. */
export function connectorIconForInstanceName(instanceName: string): ConnectorLargeIconName {
  const exact = CONNECTOR_INSTANCES.find((connector) => connector.instanceName === instanceName);
  if (exact) return exact.icon;

  const keywordIcon = iconFromKeywords(instanceName);
  if (keywordIcon) return keywordIcon;

  const index = hashSeed(instanceName) % CONNECTOR_INSTANCES.length;
  return CONNECTOR_INSTANCES[index]?.icon ?? "connector-large-aws-sec-lake";
}
