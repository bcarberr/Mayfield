import { Icon } from "../../design-system";
import { DATA_GRID_FILTER_RAIL_STICKY_CLASS } from "./dataGridTableStyles";

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
    "group flex w-full shrink-0 items-center justify-center bg-datavis-card-bg px-1 transition-colors hover:bg-interactive-secondary-hover";
  const iconButtonClass =
    "p-[3px] text-text-secondary transition-colors group-hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active";
  const railIconClass = "shrink-0 [&>svg]:!w-3";
  const filterIconClass = cx(railIconClass, "[&>svg]:!h-2");
  const columnIconClass = cx(railIconClass, "[&>svg]:!h-[9px]");

  const dividerClass = "h-px w-full shrink-0 bg-datavis-gridlines";

  return (
    <div className="flex w-8 shrink-0 self-stretch flex-col border-r border-datavis-gridlines bg-datavis-card-bg">
      <div className={cx("flex flex-col", DATA_GRID_FILTER_RAIL_STICKY_CLASS)}>
        <div className={cx(sectionClass, "h-14")}>
          <button
            type="button"
            className={iconButtonClass}
            aria-label="Filter"
            aria-pressed={active === "filter"}
            onClick={onFilterClick}
          >
            <Icon name="action-filter-list" size={12} className={filterIconClass} />
          </button>
        </div>
        <div className={dividerClass} aria-hidden />
        <div className={cx(sectionClass, "h-14")}>
          <button
            type="button"
            className={iconButtonClass}
            aria-label="Column layout"
            aria-pressed={active === "columns"}
            onClick={onColumnsClick}
          >
            <Icon name="action-view-column" size={12} className={columnIconClass} />
          </button>
        </div>
      </div>
    </div>
  );
}
