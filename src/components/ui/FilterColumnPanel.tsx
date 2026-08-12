import { useCallback, useMemo, useState } from "react";
import { Icon } from "../../design-system";
import { DATA_GRID_FILTER_RAIL_STICKY_CLASS } from "./dataGridTableStyles";
import { DataGridFilterSlideOut } from "./DataGridFilterSlideOut";
import {
  type DataGridFacetSelections,
  type DataGridFilterFacet,
} from "./dataGridFilterTypes";
import {
  createDefaultColumnLayout,
  DEFAULT_FEDERATED_RESULTS_COLUMNS,
  isColumnLayoutDefault,
  type DataGridColumnDef,
  type DataGridColumnLayout,
} from "./dataGridColumnTypes";
import { DataGridColumnSlideOut } from "./DataGridColumnSlideOut";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type FilterColumnPanelTool = "filter" | "columns";

/**
 * Figma `7671:8864` — 32px filter + column toggle rail on detection tables,
 * with optional facet filter and column picker slide-outs.
 */
export function FilterColumnPanel({
  active,
  onFilterClick,
  onColumnsClick,
  facets,
  selections: controlledSelections,
  onSelectionsChange,
  defaultExpandedFacetIds,
  columns,
  columnLayout,
  onColumnLayoutChange,
  columnLayoutIsDefault,
  onColumnLayoutReset,
}: {
  active: FilterColumnPanelTool | null;
  onFilterClick: () => void;
  onColumnsClick: () => void;
  /** Row-derived facets; defaults to demo facets when omitted. */
  facets?: readonly DataGridFilterFacet[];
  selections?: DataGridFacetSelections;
  onSelectionsChange?: (next: DataGridFacetSelections) => void;
  defaultExpandedFacetIds?: readonly string[];
  /** Column picker catalog; defaults to federated results columns. */
  columns?: readonly DataGridColumnDef[];
  columnLayout?: DataGridColumnLayout;
  onColumnLayoutChange?: (next: DataGridColumnLayout) => void;
  columnLayoutIsDefault?: boolean;
  onColumnLayoutReset?: () => void;
}) {
  const [internalSelections, setInternalSelections] = useState<DataGridFacetSelections>({});
  const selections = controlledSelections ?? internalSelections;
  const handleSelectionsChange = useCallback(
    (next: DataGridFacetSelections) => {
      if (onSelectionsChange) onSelectionsChange(next);
      else setInternalSelections(next);
    },
    [onSelectionsChange],
  );

  const resolvedColumns = columns ?? DEFAULT_FEDERATED_RESULTS_COLUMNS;
  const defaultColumnLayout = useMemo(
    () => createDefaultColumnLayout(resolvedColumns),
    [resolvedColumns],
  );
  const [internalColumnLayout, setInternalColumnLayout] = useState<DataGridColumnLayout | null>(null);
  const resolvedColumnLayout = columnLayout ?? internalColumnLayout ?? defaultColumnLayout;
  const resolvedColumnLayoutIsDefault =
    columnLayoutIsDefault ?? isColumnLayoutDefault(resolvedColumnLayout, resolvedColumns);

  const handleColumnLayoutChange = useCallback(
    (next: DataGridColumnLayout) => {
      if (onColumnLayoutChange) onColumnLayoutChange(next);
      else setInternalColumnLayout(next);
    },
    [onColumnLayoutChange],
  );

  const handleColumnLayoutReset = useCallback(() => {
    if (onColumnLayoutReset) onColumnLayoutReset();
    else setInternalColumnLayout(null);
  }, [onColumnLayoutReset]);

  const sectionClass =
    "group flex w-full shrink-0 items-center justify-center bg-datavis-card-bg px-1 transition-colors hover:bg-interactive-secondary-hover";
  const iconButtonClass =
    "p-[3px] text-text-secondary transition-colors group-hover:text-text-primary";
  const railIconClass = "shrink-0 [&>svg]:!w-3";
  const filterIconClass = cx(railIconClass, "[&>svg]:!h-2");
  const columnIconClass = cx(railIconClass, "[&>svg]:!h-[9px]");

  const dividerClass = "h-px w-full shrink-0 bg-datavis-gridlines";

  return (
    <div className="flex shrink-0 self-stretch">
      <div className="flex w-8 shrink-0 self-stretch flex-col border-r border-datavis-gridlines bg-datavis-card-bg">
        <div className={cx("flex flex-col", DATA_GRID_FILTER_RAIL_STICKY_CLASS)}>
          <div className={cx(sectionClass, "h-14")}>
            <button
              type="button"
              className={iconButtonClass}
              aria-label="Filter"
              aria-pressed={active === "filter"}
              aria-expanded={active === "filter"}
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
              aria-expanded={active === "columns"}
              onClick={onColumnsClick}
            >
              <Icon name="action-view-column" size={12} className={columnIconClass} />
            </button>
          </div>
        </div>
      </div>
      <DataGridFilterSlideOut
        open={active === "filter"}
        facets={facets}
        selections={selections}
        onSelectionsChange={handleSelectionsChange}
        defaultExpandedFacetIds={defaultExpandedFacetIds}
      />
      <DataGridColumnSlideOut
        open={active === "columns"}
        columns={resolvedColumns}
        layout={resolvedColumnLayout}
        onLayoutChange={handleColumnLayoutChange}
        isDefault={resolvedColumnLayoutIsDefault}
        onResetToDefault={handleColumnLayoutReset}
      />
    </div>
  );
}
