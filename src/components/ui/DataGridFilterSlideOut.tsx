import { useMemo, useState } from "react";
import { Icon } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/shadcn/collapsible";
import { Checkbox } from "../uiCheckbox";
import { Input } from "./Input";
import { DATA_GRID_FILTER_RAIL_STICKY_CLASS } from "./dataGridTableStyles";
import {
  clearDataGridFacetSelections,
  DEFAULT_DATA_GRID_FILTER_FACETS,
  hasDataGridFacetSelections,
  partitionDataGridFacets,
  type DataGridFacetSelections,
  type DataGridFilterFacet,
  type DataGridFilterFacetValue,
} from "./dataGridFilterTypes";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

const FILTER_PANEL_WIDTH_PX = 300;

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

function filterActionLinkClass(active: boolean) {
  return cx(
    "h-auto p-0 text-sm font-semibold",
    active ? "text-interactive-active" : "text-text-tertiary hover:text-text-secondary",
  );
}

export type DataGridFilterSlideOutProps = {
  open: boolean;
  facets?: readonly DataGridFilterFacet[];
  selections: DataGridFacetSelections;
  onSelectionsChange: (next: DataGridFacetSelections) => void;
  defaultExpandedFacetIds?: readonly string[];
};

function facetSelectionState(
  facetId: string,
  values: readonly DataGridFilterFacetValue[],
  selections: DataGridFacetSelections,
  visibleLabels: ReadonlySet<string>,
) {
  const selected = selections[facetId] ?? new Set<string>();
  const visible = values.filter((value) => visibleLabels.has(value.label));
  const selectedVisible = visible.filter((value) => selected.has(value.label));

  return {
    selected,
    allSelected: visible.length > 0 && selectedVisible.length === visible.length,
    someSelected: selectedVisible.length > 0 && selectedVisible.length < visible.length,
    noneSelected: selectedVisible.length === 0,
  };
}

function FilterFacetGroup({
  facet,
  expanded,
  onExpandedChange,
  selections,
  onSelectionsChange,
  facetSearch,
  className,
}: {
  facet: DataGridFilterFacet;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  selections: DataGridFacetSelections;
  onSelectionsChange: (next: DataGridFacetSelections) => void;
  facetSearch: string;
  className?: string;
}) {
  const visibleValues = useMemo(() => {
    const query = facetSearch.trim().toLowerCase();
    return facet.values.filter((value) => {
      if (!query) return true;
      return value.label.toLowerCase().includes(query);
    });
  }, [facet.values, facetSearch]);

  const visibleLabels = useMemo(
    () => new Set(visibleValues.map((value) => value.label)),
    [visibleValues],
  );

  const { selected, allSelected, someSelected } = facetSelectionState(
    facet.id,
    facet.values,
    selections,
    visibleLabels,
  );

  const setFacetSelection = (nextSelected: Set<string>) => {
    onSelectionsChange({
      ...selections,
      [facet.id]: nextSelected,
    });
  };

  const toggleValue = (label: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(label);
    else next.delete(label);
    setFacetSelection(next);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      for (const label of visibleLabels) next.delete(label);
      setFacetSelection(next);
      return;
    }

    const next = new Set(selected);
    for (const label of visibleLabels) next.add(label);
    setFacetSelection(next);
  };

  if (visibleValues.length === 0 && facetSearch.trim()) return null;

  return (
    <Collapsible
      open={expanded}
      onOpenChange={onExpandedChange}
      className={cx("border-b border-datavis-gridlines", className)}
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-overlay-subtle">
        <Icon
          name="navi-chevron-right"
          size={16}
          className={cx(
            "size-4 shrink-0 text-text-tertiary transition-transform [&_svg]:!size-4",
            expanded && "rotate-90",
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate">
          {facet.label} ({facet.values.length})
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-3">
        <div className="space-y-2">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            label="Select All"
            labelClassName="text-sm font-semibold text-text-secondary"
            onCheckedChange={toggleSelectAll}
          />
          {visibleValues.map((value) => (
            <div key={value.label} className="flex items-center gap-2">
              <Checkbox
                checked={selected.has(value.label)}
                aria-label={value.label}
                onCheckedChange={(checked: boolean) => toggleValue(value.label, checked)}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-secondary">
                {value.label}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-text-tertiary">
                {value.count}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Figma filter facet rail — slides open beside the 32px filter/column rail. */
export function DataGridFilterSlideOut({
  open,
  facets = DEFAULT_DATA_GRID_FILTER_FACETS,
  selections,
  onSelectionsChange,
  defaultExpandedFacetIds = [],
}: DataGridFilterSlideOutProps) {
  const [facetSearch, setFacetSearch] = useState("");
  const [expandedFacetIds, setExpandedFacetIds] = useState<Set<string>>(
    () => new Set(defaultExpandedFacetIds),
  );

  const defaultExpandedSet = useMemo(
    () => new Set(defaultExpandedFacetIds),
    [defaultExpandedFacetIds],
  );

  const isPanelAtDefault = useMemo(
    () =>
      setsEqual(expandedFacetIds, defaultExpandedSet) &&
      !facetSearch.trim() &&
      !hasDataGridFacetSelections(selections),
    [expandedFacetIds, defaultExpandedSet, facetSearch, selections],
  );

  const resetToDefaultActive = !isPanelAtDefault;
  const expandAllActive = isPanelAtDefault;

  const filteredFacets = useMemo(() => {
    const query = facetSearch.trim().toLowerCase();
    if (!query) return facets;
    return facets.filter((facet) => facet.label.toLowerCase().includes(query));
  }, [facets, facetSearch]);

  const { primary: primaryFacets, secondary: secondaryFacets } = useMemo(
    () => partitionDataGridFacets(filteredFacets),
    [filteredFacets],
  );

  const showFacetSectionDivider = primaryFacets.length > 0 && secondaryFacets.length > 0;

  const renderFacetGroup = (facet: DataGridFilterFacet, className?: string) => (
    <FilterFacetGroup
      key={facet.id}
      facet={facet}
      expanded={expandedFacetIds.has(facet.id)}
      onExpandedChange={(isOpen) => {
        setExpandedFacetIds((current) => {
          const next = new Set(current);
          if (isOpen) next.add(facet.id);
          else next.delete(facet.id);
          return next;
        });
      }}
      selections={selections}
      onSelectionsChange={onSelectionsChange}
      facetSearch={facetSearch}
      className={className}
    />
  );

  const expandAll = () => {
    setExpandedFacetIds(new Set(facets.map((facet) => facet.id)));
  };

  const resetToDefault = () => {
    onSelectionsChange(clearDataGridFacetSelections());
    setFacetSearch("");
    setExpandedFacetIds(new Set(defaultExpandedFacetIds));
  };

  return (
    <div
      className={cx(
        "shrink-0 self-stretch overflow-hidden border-r border-datavis-gridlines bg-datavis-card-bg transition-[width] duration-200 ease-out",
        open ? "w-[300px]" : "w-0 border-r-0",
      )}
      style={{ ["--filter-panel-width" as string]: `${FILTER_PANEL_WIDTH_PX}px` }}
      aria-hidden={!open}
    >
      <aside
        className={cx(
          DATA_GRID_FILTER_RAIL_STICKY_CLASS,
          "flex h-full max-h-[min(70vh,720px)] w-[300px] flex-col",
        )}
        aria-label="Filters"
      >
        <div className="shrink-0 space-y-3 border-b border-datavis-gridlines px-4 py-4">
          <h2 className="text-base-semibold text-text-primary">Filters</h2>
          <Input
            variant="search"
            placeholder="Search facets"
            value={facetSearch}
            onChange={(event) => setFacetSearch(event.target.value)}
            onClear={() => setFacetSearch("")}
            className="!bg-surface-modal"
            aria-label="Search facets"
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button
              type="button"
              variant="link"
              className={filterActionLinkClass(resetToDefaultActive)}
              aria-current={resetToDefaultActive ? "true" : undefined}
              onClick={resetToDefault}
            >
              Reset to Default
            </Button>
            <Button
              type="button"
              variant="link"
              className={filterActionLinkClass(expandAllActive)}
              aria-current={expandAllActive ? "true" : undefined}
              onClick={expandAll}
            >
              Expand All
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {primaryFacets.map((facet, index) =>
            renderFacetGroup(
              facet,
              showFacetSectionDivider && index === primaryFacets.length - 1 ? "border-b-0" : undefined,
            ),
          )}
          {showFacetSectionDivider ? (
            <div className="h-1 shrink-0 bg-datavis-gridlines" aria-hidden />
          ) : null}
          {secondaryFacets.map((facet) => renderFacetGroup(facet))}
        </div>
      </aside>
    </div>
  );
}
