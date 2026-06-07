import { useState, type DragEvent } from "react";
import { Icon } from "../../design-system";
import type { ConnectorCategory, ConnectorCategoryId } from "./connectorsData";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type ConnectorFiltersProps = {
  categories: readonly ConnectorCategory[];
  enabledCategories: ReadonlySet<ConnectorCategoryId>;
  visibleCount: number;
  totalCount: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onCategoryToggle: (categoryId: ConnectorCategoryId, enabled: boolean) => void;
  onCategoryOrderChange: (order: ConnectorCategoryId[]) => void;
};

function reorderCategoryIds(
  order: readonly ConnectorCategoryId[],
  draggedId: ConnectorCategoryId,
  targetId: ConnectorCategoryId,
): ConnectorCategoryId[] {
  const fromIndex = order.indexOf(draggedId);
  const toIndex = order.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return [...order];

  const next = [...order];
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, draggedId);
  return next;
}

function FilterTagToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`Show ${label} connectors`}
      className={cx(
        "relative box-border h-[11px] w-[22px] shrink-0 rounded-[9px] border transition-colors",
        checked
          ? "border-transparent bg-interactive-active"
          : "border-text-tertiary bg-transparent",
      )}
      draggable={false}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
    >
      <span
        aria-hidden
        className={cx(
          "absolute top-1/2 size-[7px] -translate-y-1/2 rounded-full bg-surface-page transition-[left]",
          checked ? "left-[12px]" : "left-[1px]",
        )}
      />
    </button>
  );
}

function FilterTagMoveHandle({ isDragging, label }: { isDragging: boolean; label: string }) {
  return (
    <span
      className={cx(
        "group/handle -ml-2 flex shrink-0 cursor-grab items-center rounded-l-[14px] py-1 pl-2 pr-1 active:cursor-grabbing",
        "transition-colors hover:bg-interactive-active/15",
        isDragging && "cursor-grabbing bg-interactive-active/15",
      )}
      title={`Drag to reorder ${label}`}
      aria-hidden
    >
      <Icon
        name="action-drag-indicator"
        size={8}
        className={cx(
          "size-2 shrink-0 transition-colors [&>svg]:!size-[8px]",
          isDragging
            ? "text-interactive-active"
            : "text-text-tertiary group-hover/handle:text-interactive-active",
        )}
      />
    </span>
  );
}

function FilterTag({
  label,
  enabled,
  isDragging,
  isDragOver,
  onToggle,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  label: string;
  enabled: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onToggle: (enabled: boolean) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-grabbed={isDragging}
      className={cx(
        "inline-flex h-[26px] max-w-full items-center gap-1 rounded-[14px] border py-1 pl-2 pr-2 transition-[opacity,box-shadow,border-color]",
        enabled
          ? "border-interactive-active bg-[#14333d]"
          : "border-border-container bg-surface-container opacity-80",
        isDragging && "opacity-50",
        isDragOver && !isDragging && "ring-1 ring-interactive-active ring-offset-1 ring-offset-surface-page",
      )}
    >
      <FilterTagMoveHandle isDragging={isDragging} label={label} />
      <Icon name="action-check" size={10} className="size-2.5 shrink-0 text-text-primary [&>svg]:!size-[10px]" aria-hidden />
      <span className="max-w-[12rem] truncate text-xs font-semibold tracking-[0.4px] text-text-primary">{label}</span>
      <FilterTagToggle checked={enabled} onChange={onToggle} label={label} />
    </div>
  );
}

/** Figma `6582:59195` — filter tag row + collapsible header. */
export function ConnectorFilters({
  categories,
  enabledCategories,
  visibleCount,
  totalCount,
  expanded,
  onExpandedChange,
  onCategoryToggle,
  onCategoryOrderChange,
}: ConnectorFiltersProps) {
  const [draggedId, setDraggedId] = useState<ConnectorCategoryId | null>(null);
  const [dragOverId, setDragOverId] = useState<ConnectorCategoryId | null>(null);

  const clearDragState = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragStart = (categoryId: ConnectorCategoryId) => (event: DragEvent<HTMLDivElement>) => {
    setDraggedId(categoryId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", categoryId);
  };

  const handleDragOver = (categoryId: ConnectorCategoryId) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggedId && draggedId !== categoryId) {
      setDragOverId(categoryId);
    }
  };

  const handleDrop = (categoryId: ConnectorCategoryId) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const activeId = draggedId ?? (event.dataTransfer.getData("text/plain") as ConnectorCategoryId);
    if (activeId && activeId !== categoryId) {
      const currentOrder = categories.map((category) => category.id);
      onCategoryOrderChange(reorderCategoryIds(currentOrder, activeId, categoryId));
    }
    clearDragState();
  };

  return (
    <section className="shrink-0">
      <button
        type="button"
        aria-expanded={expanded}
        className="-ml-[7px] flex items-center gap-0.5 rounded py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
        onClick={() => onExpandedChange(!expanded)}
      >
        <Icon
          name="navi-arrow-drop-down"
          size={24}
          className={cx("shrink-0 text-interactive-active transition-transform", !expanded && "-rotate-90")}
          aria-hidden
        />
        <span className="text-base-semibold">
          <span className="text-interactive-active">Filters: </span>
          <span className="font-normal text-text-primary">
            Connectors {visibleCount} of {totalCount}
          </span>
        </span>
      </button>

      {expanded ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((category) => (
            <FilterTag
              key={category.id}
              label={category.filterLabel}
              enabled={enabledCategories.has(category.id)}
              isDragging={draggedId === category.id}
              isDragOver={dragOverId === category.id}
              onToggle={(enabled) => onCategoryToggle(category.id, enabled)}
              onDragStart={handleDragStart(category.id)}
              onDragEnd={clearDragState}
              onDragOver={handleDragOver(category.id)}
              onDragLeave={() => setDragOverId((current) => (current === category.id ? null : current))}
              onDrop={handleDrop(category.id)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
