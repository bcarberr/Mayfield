import { Icon } from "../../design-system";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type FilterColumnPanelTool = "filter" | "columns";

/**
 * Figma `7671:8864` — 32px filter + column toggle rail on detection tables.
 */
export function FilterColumnPanel({
  active,
  onFilterClick,
  onColumnsClick,
}: {
  active: FilterColumnPanelTool | null;
  onFilterClick: () => void;
  onColumnsClick: () => void;
}) {
  const sectionClass =
    "group flex w-full shrink-0 items-center justify-center px-1 transition-colors hover:bg-interactive-secondary-hover";
  const iconButtonClass =
    "p-[3px] text-text-secondary transition-colors group-hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active";

  return (
    <div className="flex w-8 shrink-0 flex-col self-stretch rounded-tl-[4px] border border-border-container bg-surface-container">
      <div
        className={cx(
          sectionClass,
          "h-14",
          active === "filter" ? "bg-interactive-selected" : "bg-surface-container",
        )}
      >
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Filter"
          aria-pressed={active === "filter"}
          onClick={onFilterClick}
        >
          <Icon name="action-filter-list" size={16} />
        </button>
      </div>
      <div className="h-px w-full shrink-0 bg-datavis-gridlines" aria-hidden />
      <div
        className={cx(
          sectionClass,
          "h-14",
          active === "columns" ? "bg-interactive-selected" : "bg-surface-container",
        )}
      >
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Column layout"
          aria-pressed={active === "columns"}
          onClick={onColumnsClick}
        >
          <Icon name="action-view-column" size={16} />
        </button>
      </div>
      <div className="min-h-0 flex-1 bg-surface-container" aria-hidden />
    </div>
  );
}
