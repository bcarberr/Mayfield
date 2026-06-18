import { Icon } from "../../design-system";
import { CONNECTOR_INSTANCES } from "../connectors/connectorsData";

export type DetectionConnectorRunStatus = "success" | "failure";

export type DetectionConnector = {
  name: string;
  icon: string;
  status?: DetectionConnectorRunStatus;
};

export const DETECTION_CONNECTOR_CATALOG: DetectionConnector[] = [
  { name: "Amazon Security Lake", icon: "connector-large-aws-sec-lake" },
  { name: "Amazon CloudWatch Logs", icon: "connector-large-amazon-cloudwatch" },
  { name: "Microsoft Defender for Endpoint", icon: "connector-large-ms-defender-endpoint" },
  { name: "Microsoft Defender for Office 365", icon: "connector-large-ms-defender-office365" },
  { name: "Microsoft Graph", icon: "connector-large-microsoftgraph" },
  { name: "Okta", icon: "connector-large-okta" },
  { name: "SentinelOne Singularity Platform", icon: "connector-large-sentinelone" },
  { name: "Microsoft Active Directory", icon: "connector-large-ms-active-directory" },
];

function hashSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function shuffleInstancesDeterministic(id: string) {
  const instances = [...CONNECTOR_INSTANCES];
  const seed = hashSeed(id);

  for (let i = instances.length - 1; i > 0; i -= 1) {
    const j = (seed + i * 13) % (i + 1);
    [instances[i], instances[j]] = [instances[j], instances[i]];
  }

  return instances;
}

export type LastRunConnectorOptions = {
  connectorsActive: number;
  connectorsTotal: number;
};

export function getLastRunConnectorsForDetection(
  id: string,
  lastRun?: string,
  options?: LastRunConnectorOptions,
): DetectionConnector[] {
  if (lastRun === "—") return [];

  if (options) {
    const { connectorsActive, connectorsTotal } = options;
    const runCount = Math.min(Math.max(0, connectorsActive), connectorsTotal);
    if (runCount === 0) return [];

    const instances = shuffleInstancesDeterministic(id);
    const seed = hashSeed(`${id}:last-run`);
    const hasFailure = seed % 100 < 5;
    const failureIndex = hasFailure ? seed % runCount : -1;

    return Array.from({ length: runCount }, (_, index) => {
      const instance = instances[index % instances.length];
      return {
        name: instance.instanceName,
        icon: instance.icon,
        status: index === failureIndex ? "failure" : "success",
      };
    });
  }

  const seed = hashSeed(id);
  const count = 2 + (seed % 3);
  const connectors: DetectionConnector[] = [];
  const used = new Set<number>();

  for (let i = 0; i < count; i += 1) {
    let index = (seed + i * 7) % DETECTION_CONNECTOR_CATALOG.length;
    while (used.has(index)) {
      index = (index + 1) % DETECTION_CONNECTOR_CATALOG.length;
    }
    used.add(index);
    connectors.push({ ...DETECTION_CONNECTOR_CATALOG[index], status: "success" });
  }

  return connectors;
}

export function pickRandomConnectors(): DetectionConnector[] {
  const shuffled = [...DETECTION_CONNECTOR_CATALOG].sort(() => Math.random() - 0.5);
  return shuffled
    .slice(0, Math.floor(Math.random() * 3) + 2)
    .map((connector) => ({ ...connector, status: "success" as const }));
}

const CONNECTORS_PER_COLUMN = 8;

function chunkConnectors<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function ConnectorRunListItem({ connector }: { connector: DetectionConnector }) {
  const status = connector.status ?? "success";
  const isSuccess = status === "success";

  return (
    <li className="flex items-center gap-3 text-sm text-text-primary">
      <Icon
        name={isSuccess ? "action-check" : "error-outline"}
        size={16}
        className={cx("shrink-0", isSuccess ? "text-feedback-positive" : "text-feedback-negative")}
        aria-hidden
      />
      <Icon
        name={connector.icon as Parameters<typeof Icon>[0]["name"]}
        size={24}
        className="shrink-0"
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{connector.name}</span>
    </li>
  );
}

type DetectionConnectorsRunPanelProps = {
  connectors: DetectionConnector[];
  variant: "test-success" | "last-run";
  connectorsActive?: number;
  connectorsTotal?: number;
};

export function DetectionConnectorsRunPanel({
  connectors,
  variant,
  connectorsActive,
  connectorsTotal,
}: DetectionConnectorsRunPanelProps) {
  if (connectors.length === 0) return null;

  const failures = connectors.filter((connector) => connector.status === "failure").length;
  const showConnectorCount = connectorsActive != null && connectorsTotal != null;

  const heading =
    variant === "test-success"
      ? `Query ran successfully on ${connectors.length} connectors`
      : showConnectorCount
        ? `Last run on ${connectorsActive} of ${connectorsTotal} connectors`
        : failures > 0
          ? `Last run on ${connectors.length} connectors: ${connectors.length - failures} succeeded, ${failures} failed`
          : `Last ran successfully on ${connectors.length} connectors`;

  return (
    <div className="rounded border border-border bg-muted/20 p-4">
      <div className="space-y-3">
        <p
          className={cx(
            "text-sm font-semibold",
            failures > 0 && variant === "last-run" ? "text-text-primary" : "text-feedback-positive",
          )}
        >
          {heading}
        </p>
        <div className="flex gap-8">
          {chunkConnectors(connectors, CONNECTORS_PER_COLUMN).map((columnConnectors, columnIndex) => (
            <ul key={columnIndex} className="min-w-0 flex-1 space-y-2">
              {columnConnectors.map((connector, index) => (
                <ConnectorRunListItem
                  key={`${connector.name}-${columnIndex * CONNECTORS_PER_COLUMN + index}`}
                  connector={connector}
                />
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type DetectionExpandedDetailsProps = {
  description: string;
  detectionId: string;
  lastRun?: string;
  connectorsActive?: number;
  connectorsTotal?: number;
};

export function DetectionExpandedDetails({
  description,
  detectionId,
  lastRun,
  connectorsActive,
  connectorsTotal,
}: DetectionExpandedDetailsProps) {
  const connectorOptions =
    connectorsActive != null && connectorsTotal != null
      ? { connectorsActive, connectorsTotal }
      : undefined;

  const connectors = getLastRunConnectorsForDetection(detectionId, lastRun, connectorOptions);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
      <DetectionConnectorsRunPanel
        connectors={connectors}
        variant="last-run"
        connectorsActive={connectorsActive}
        connectorsTotal={connectorsTotal}
      />
    </div>
  );
}
