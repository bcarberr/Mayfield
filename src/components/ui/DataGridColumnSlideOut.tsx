import { useMemo, useState, type DragEvent } from "react";
import { Icon } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "../uiCheckbox";
import { Input } from "./Input";
import { DATA_GRID_FILTER_RAIL_STICKY_CLASS } from "./dataGridTableStyles";
import {
  reorderPickerColumns,
  setPickerColumnVisible,
  type DataGridColumnDef,
  type DataGridColumnLayout,
} from "./dataGridColumnTypes";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

const COLUMN_PANEL_WIDTH_PX = 300;

function filterActionLinkClass(active: boolean) {
  return cx(
    "h-auto p-0 text-sm font-semibold",
    active ? "text-interactive-active" : "text-text-tertiary hover:text-text-secondary",
  );
}

function ColumnDragHandle({ isDragging, label }: { isDragging: boolean; label: string }) {
  return (
    <span
      className={cx(
        "flex shrink-0 cursor-grab items-center py-1 active:cursor-grabbing",
        isDragging && "cursor-grabbing",
      )}
      title={`Drag to reorder ${label}`}
      aria-hidden
    >
      <Icon
        name="action-drag-indicator"
        size={11}
        className={cx(
          "shrink-0 text-text-tertiary [&_svg]:!h-[11px] [&_svg]:!w-[11px]",
          isDragging && "text-interactive-active",
        )}
      />
    </span>
  );
}

function ColumnPickerRow({
  label,
  visible,
  draggable,
  isDragging,
  isDragOver,
  onToggle,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  label: string;
  visible: boolean;
  draggable: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onToggle: (checked: boolean) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      className={cx(
        "flex items-center gap-2 border-b border-datavis-gridlines px-4 py-2.5",
        isDragOver && "bg-overlay-subtle",
        isDragging && "opacity-60",
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {draggable ? (
        <ColumnDragHandle isDragging={isDragging} label={label} />
      ) : (
        <span className="w-[11px] shrink-0" aria-hidden />
      )}
      <Checkbox
        checked={visible}
        aria-label={label}
        onCheckedChange={onToggle}
      />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{label}</span>
    </div>
  );
}

export type DataGridColumnSlideOutProps = {
  open: boolean;
  columns: readonly DataGridColumnDef[];
  layout: DataGridColumnLayout;
  onLayoutChange: (next: DataGridColumnLayout) => void;
  isDefault: boolean;
  onResetToDefault: () => void;
};

/** Figma column picker — slides open beside the filter/column rail. */
export function DataGridColumnSlideOut({
  open,
  columns,
  layout,
  onLayoutChange,
  isDefault,
  onResetToDefault,
}: DataGridColumnSlideOutProps) {
  const [columnSearch, setColumnSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const columnById = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns]);

  const pickerRows = useMemo(() => {
    const query = columnSearch.trim().toLowerCase();
    const visible = layout.order.filter((id) => layout.visibleIds.has(id));
    const hidden = layout.order.filter((id) => !layout.visibleIds.has(id));
    const ordered = [...visible, ...hidden];

    return ordered
      .map((id) => columnById.get(id))
      .filter((column): column is DataGridColumnDef => column != null)
      .filter((column) => !query || column.label.toLowerCase().includes(query))
      .map((column) => ({
        id: column.id,
        label: column.label,
        visible: layout.visibleIds.has(column.id),
      }));
  }, [layout, columnById, columnSearch]);

  const resetToDefaultActive = !isDefault;

  return (
    <div
      className={cx(
        "shrink-0 self-stretch overflow-hidden border-r border-datavis-gridlines bg-datavis-card-bg transition-[width] duration-200 ease-out",
        open ? "w-[300px]" : "w-0 border-r-0",
      )}
      style={{ ["--column-panel-width" as string]: `${COLUMN_PANEL_WIDTH_PX}px` }}
      aria-hidden={!open}
    >
      <aside
        className={cx(
          DATA_GRID_FILTER_RAIL_STICKY_CLASS,
          "flex h-full max-h-[min(70vh,720px)] w-[300px] flex-col",
        )}
        aria-label="Columns"
      >
        <div className="shrink-0 space-y-3 border-b border-datavis-gridlines px-4 py-4">
          <Input
            variant="search"
            placeholder="Search columns"
            value={columnSearch}
            onChange={(event) => setColumnSearch(event.target.value)}
            onClear={() => setColumnSearch("")}
            className="!bg-surface-modal"
            aria-label="Search columns"
          />
          <Button
            type="button"
            variant="link"
            className={filterActionLinkClass(resetToDefaultActive)}
            aria-current={resetToDefaultActive ? "true" : undefined}
            onClick={() => {
              onResetToDefault();
              setColumnSearch("");
            }}
          >
            Reset to default
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {pickerRows.map((row) => (
            <ColumnPickerRow
              key={row.id}
              label={row.label}
              visible={row.visible}
              draggable={row.visible}
              isDragging={draggedId === row.id}
              isDragOver={dragOverId === row.id && draggedId !== row.id}
              onToggle={(checked) => onLayoutChange(setPickerColumnVisible(layout, row.id, checked))}
              onDragStart={(event) => {
                if (!row.visible) return;
                setDraggedId(row.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", row.id);
              }}
              onDragOver={(event) => {
                if (!draggedId || !row.visible || draggedId === row.id) return;
                event.preventDefault();
                setDragOverId(row.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const activeId = draggedId ?? event.dataTransfer.getData("text/plain");
                if (activeId && activeId !== row.id && row.visible) {
                  onLayoutChange(reorderPickerColumns(layout, activeId, row.id));
                }
                setDraggedId(null);
                setDragOverId(null);
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
