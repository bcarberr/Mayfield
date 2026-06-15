import { formatConnectorSelectionCount, useConnectorSelectionCounts } from "./connectorEnabledState";

export function ConnectorSelectionCountText({ className }: { className?: string }) {
  const counts = useConnectorSelectionCounts();
  return <span className={className}>{formatConnectorSelectionCount(counts)}</span>;
}
