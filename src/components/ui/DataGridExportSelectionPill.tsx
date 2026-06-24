import { Download } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shadcn/tooltip";

/** Replaces the export button when rows are selected (Figma "N selected" pill). */
export function DataGridExportSelectionPill({
  count,
  onExport,
  className,
}: {
  count: number;
  onExport: () => void;
  className?: string;
}) {
  return (
    <div
      className={[
        "ml-auto flex shrink-0 items-center gap-3 rounded bg-interactive-selected px-4 py-1.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-sm font-semibold text-text-primary">{count.toLocaleString()} selected</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 text-interactive-active hover:bg-overlay-subtle"
            onClick={onExport}
            aria-label="Export selected results as JSON"
          >
            <Download size={18} strokeWidth={1.5} aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export selected (JSON)</TooltipContent>
      </Tooltip>
    </div>
  );
}
