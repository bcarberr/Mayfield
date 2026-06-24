import { Button } from "@/components/shadcn/button";

/** Inline banner above the table when bulk row selection is active (Figma Frame 11618). */
export function DataGridExportSelectionBanner({
  variant,
  pageCount,
  totalCount,
  onSelectAllResults,
  onClearSelection,
}: {
  variant: "page" | "all";
  pageCount: number;
  totalCount: number;
  onSelectAllResults: () => void;
  onClearSelection: () => void;
}) {
  return (
    <div
      className="flex h-10 w-full shrink-0 items-center justify-center gap-1 bg-interactive-selected px-4 text-sm text-text-primary"
      role="status"
    >
      {variant === "page" ? (
        <>
          <span>All {pageCount.toLocaleString()} Results on this page are selected.</span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-sm font-semibold text-interactive-active"
            onClick={onSelectAllResults}
          >
            Select all {totalCount.toLocaleString()} Results
          </Button>
        </>
      ) : (
        <>
          <span>All {totalCount.toLocaleString()} Results are selected.</span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-sm font-semibold text-interactive-active"
            onClick={onClearSelection}
          >
            Clear Selection
          </Button>
        </>
      )}
    </div>
  );
}
