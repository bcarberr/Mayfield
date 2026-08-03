import { Search } from "lucide-react";
import { Button } from "@/components/shadcn/button";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

/** Top-right pivot actions when datagrid / widget rows are selected. */
export function DataGridSearchSelectedActions({
  onSearch,
  onClear,
  searchLabel = "Pivot to Search",
  className,
}: {
  onSearch: () => void;
  onClear: () => void;
  searchLabel?: string;
  className?: string;
}) {
  return (
    <div className={cx("ml-auto flex shrink-0 flex-wrap items-center justify-end gap-3", className)}>
      <Button
        type="button"
        variant="secondary-outline"
        className="h-8 shrink-0 gap-1.5"
        onClick={onSearch}
      >
        <Search size={14} strokeWidth={1.5} className="size-3.5 shrink-0 text-current" aria-hidden />
        {searchLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-8 shrink-0 px-2 text-base-small text-text-tertiary hover:text-text-primary"
        onClick={onClear}
      >
        Clear selection
      </Button>
    </div>
  );
}
