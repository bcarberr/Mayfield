import { useCallback, useState } from "react";
import { buildExportFilename, downloadJsonExport } from "./exportRowsToJson";

/** Export-all JSON download with optional success snackbar (grids without row selection workflow). */
export function useDataGridJsonExport<T>(rows: readonly T[], filenamePrefix: string) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const exportAll = useCallback(() => {
    downloadJsonExport(rows, buildExportFilename(filenamePrefix));
    setSnackbarMessage(`Exported ${rows.length.toLocaleString()} results as JSON`);
    setSnackbarOpen(true);
  }, [rows, filenamePrefix]);

  return {
    exportAll,
    snackbarProps: {
      open: snackbarOpen,
      message: snackbarMessage,
      onClose: () => setSnackbarOpen(false),
    },
  };
}
