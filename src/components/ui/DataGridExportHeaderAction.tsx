import type { DataGridExportSelectionSnapshot } from "./useDataGridExportSelection";
import { DataGridExportButton } from "./DataGridExportButton";
import { DataGridExportSelectionPill } from "./DataGridExportSelectionPill";

/** Toolbar export control: pill when rows are selected, otherwise the export button. */
export function DataGridExportHeaderAction({
  snapshot,
  exportLabel = "Export JSON",
  onExportAll,
  onExportSelected,
  className,
}: {
  snapshot: DataGridExportSelectionSnapshot;
  exportLabel?: string;
  onExportAll: () => void;
  onExportSelected: () => void;
  className?: string;
}) {
  if (snapshot.showPill) {
    return (
      <DataGridExportSelectionPill
        count={snapshot.exportCount}
        onExport={onExportSelected}
        className={className}
      />
    );
  }

  return (
    <DataGridExportButton label={exportLabel} onClick={onExportAll} className={className} />
  );
}
