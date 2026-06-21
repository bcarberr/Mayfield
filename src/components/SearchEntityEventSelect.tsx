import { useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Icon } from "../design-system";
import {
  DEFAULT_EVENT_CATEGORY_ID,
  SEARCH_ENTITY_COLUMNS,
  SEARCH_EVENT_CATEGORIES,
  type SearchEntityOption,
  type SearchEventCategory,
  type SearchEventOption,
  type SearchScopeKind,
  type SearchScopeSelection,
  selectionEventIconClassName,
  selectionIcon,
  selectionLabel,
} from "../data/searchEntityOptions";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const PICKER_ICON_SIZE = 18;
const ENTITY_PANEL_WIDTH = 775;
const EVENT_PANEL_WIDTH = 702;

const SEARCH_BY_OPTIONS: readonly { id: SearchScopeKind; label: string }[] = [
  { id: "entities", label: "Entities" },
  { id: "events", label: "Events" },
] as const;

export type SearchEntityEventSelectProps = {
  className?: string;
  /** Accessible name for the search field. */
  "aria-label"?: string;
  placeholder?: string;
  value?: SearchScopeSelection | null;
  onChange?: (selection: SearchScopeSelection | null) => void;
};

function SearchByRadios({
  value,
  onChange,
  groupName,
}: {
  value: SearchScopeKind;
  onChange: (next: SearchScopeKind) => void;
  groupName: string;
}) {
  return (
    <div role="radiogroup" aria-label="Search by" className="flex items-center gap-6">
      {SEARCH_BY_OPTIONS.map((option) => (
        <label
          key={option.id}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold leading-[14px] tracking-[0.4px] text-text-primary"
        >
          <input
            type="radio"
            name={groupName}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
            className="size-[18px] shrink-0 accent-interactive-active"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function EntityPickerItem({
  option,
  onSelect,
}: {
  option: SearchEntityOption;
  onSelect: (option: SearchEntityOption) => void;
}) {
  return (
    <button
      type="button"
      className="flex h-8 w-full min-w-0 items-center gap-2 rounded px-1 text-left transition-colors hover:bg-interactive-secondary-hover focus-visible:bg-interactive-secondary-hover focus-visible:outline-none"
      onClick={() => onSelect(option)}
    >
      <Icon
        name={option.icon}
        size={PICKER_ICON_SIZE}
        className="shrink-0 text-datavis-data-pop-teal-20"
        aria-hidden
      />
      <span className="min-w-0 truncate text-sm font-semibold leading-8 tracking-[0.4px] text-text-secondary">
        {option.label}
      </span>
    </button>
  );
}

function EventCategoryItem({
  category,
  selected,
  onSelect,
}: {
  category: SearchEventCategory;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cx(
        "flex h-10 w-full items-center gap-2 px-4 text-left transition-colors focus-visible:outline-none",
        selected ? "bg-interactive-secondary-hover" : "hover:bg-interactive-secondary-hover",
      )}
      onClick={onSelect}
    >
      <Icon
        name={category.icon}
        size={PICKER_ICON_SIZE}
        className={cx("shrink-0", category.iconClassName)}
        aria-hidden
      />
      <span className="min-w-0 truncate text-sm font-semibold leading-[18px] text-text-primary">
        {category.label}
      </span>
    </button>
  );
}

function EventPickerItem({
  option,
  iconClassName,
  onSelect,
}: {
  option: SearchEventOption;
  iconClassName: string;
  onSelect: (option: SearchEventOption) => void;
}) {
  return (
    <button
      type="button"
      className="flex h-8 w-full min-w-0 items-center gap-2 rounded px-1 text-left transition-colors hover:bg-interactive-secondary-hover focus-visible:bg-interactive-secondary-hover focus-visible:outline-none"
      onClick={() => onSelect(option)}
    >
      <Icon name={option.icon} size={PICKER_ICON_SIZE} className={cx("shrink-0", iconClassName)} aria-hidden />
      <span className="min-w-0 text-sm font-semibold leading-8 tracking-[0.4px] text-text-secondary">
        {option.label}
      </span>
    </button>
  );
}

function EventsPickerPanel({
  selectedCategoryId,
  onCategoryChange,
  onSelectEvent,
}: {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  onSelectEvent: (option: SearchEventOption) => void;
}) {
  const activeCategory =
    SEARCH_EVENT_CATEGORIES.find((category) => category.id === selectedCategoryId) ??
    SEARCH_EVENT_CATEGORIES.find((category) => category.id === DEFAULT_EVENT_CATEGORY_ID)!;

  return (
    <div className="flex items-stretch">
      <div className="w-48 shrink-0 border-r border-border-rule">
        <p className="px-4 pt-3 text-xs font-bold uppercase leading-[14px] tracking-[0.4px] text-text-tertiary">
          Event categories:
        </p>
        <div className="pb-2 pt-1">
          {SEARCH_EVENT_CATEGORIES.map((category) => (
            <EventCategoryItem
              key={category.id}
              category={category}
              selected={category.id === activeCategory.id}
              onSelect={() => onCategoryChange(category.id)}
            />
          ))}
        </div>
      </div>
      <div className="min-w-0 flex-1 px-3 py-3">
        <div
          className={cx(
            "grid gap-x-3",
            activeCategory.events.length > 6 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {activeCategory.events.map((option) => (
            <EventPickerItem
              key={option.id}
              option={option}
              iconClassName={activeCategory.iconClassName}
              onSelect={onSelectEvent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchScopePickerPanel({
  searchBy,
  onSearchByChange,
  selectedEventCategoryId,
  onEventCategoryChange,
  onSelectEntity,
  onSelectEvent,
}: {
  searchBy: SearchScopeKind;
  onSearchByChange: (next: SearchScopeKind) => void;
  selectedEventCategoryId: string;
  onEventCategoryChange: (categoryId: string) => void;
  onSelectEntity: (option: SearchEntityOption) => void;
  onSelectEvent: (option: SearchEventOption) => void;
}) {
  const radioGroupName = useId();
  const panelWidth = searchBy === "events" ? EVENT_PANEL_WIDTH : ENTITY_PANEL_WIDTH;

  return (
    <div
      className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-[calc(100vh-96px)] overflow-y-auto rounded-[4px] border border-border-rule bg-surface-modal shadow-[0px_5px_5px_-3px_rgba(0,0,0,0.2),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_3px_14px_2px_rgba(0,0,0,0.12)]"
      style={{ width: panelWidth, maxWidth: `min(${panelWidth}px, calc(100vw - 80px))` }}
      role="dialog"
      aria-label="Search scope picker"
    >
      <header className="flex h-12 items-center gap-6 border-b border-border-rule bg-surface-modal px-4">
        <span className="shrink-0 text-xs font-bold uppercase leading-[14px] tracking-[0.4px] text-text-tertiary">
          Search by:
        </span>
        <SearchByRadios value={searchBy} onChange={onSearchByChange} groupName={radioGroupName} />
      </header>

      {searchBy === "entities" ? (
        <div className="px-4 py-4">
          <div className="grid grid-cols-4 gap-x-3">
            {SEARCH_ENTITY_COLUMNS.map((column, columnIndex) => (
              <div key={`entity-column-${columnIndex}`} className="min-w-0">
                {column.map((option) => (
                  <EntityPickerItem key={option.id} option={option} onSelect={onSelectEntity} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EventsPickerPanel
          selectedCategoryId={selectedEventCategoryId}
          onCategoryChange={onEventCategoryChange}
          onSelectEvent={onSelectEvent}
        />
      )}
    </div>
  );
}

/**
 * Query Builder search scope control — Figma Entities picker (`3554:607`) and Events picker (`3715:16483`).
 * Focus opens the default Entities dropdown with SEARCH BY header and four-column entity list.
 */
export function SearchEntityEventSelect({
  className = "",
  "aria-label": ariaLabel = "Select Entity or Event",
  placeholder = "Select an Entity or an Event",
  value,
  onChange,
}: SearchEntityEventSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [searchBy, setSearchBy] = useState<SearchScopeKind>("entities");
  const [selectedEventCategoryId, setSelectedEventCategoryId] = useState(DEFAULT_EVENT_CATEGORY_ID);
  const [internalSelection, setInternalSelection] = useState<SearchScopeSelection | null>(null);
  const selection = value !== undefined ? value : internalSelection;

  const setSelection = (next: SearchScopeSelection | null) => {
    if (value === undefined) setInternalSelection(next);
    onChange?.(next);
  };

  const displayValue = selectionLabel(selection);
  const selectedIcon = selectionIcon(selection);
  const selectedEventIconClassName = selectionEventIconClassName(selection);

  const openPicker = () => {
    setSearchBy(selection?.kind === "events" ? "events" : "entities");
    setOpen(true);
  };

  const handleSearchByChange = (next: SearchScopeKind) => {
    setSearchBy(next);
    if (next === "events" && selection?.kind !== "events") {
      setSelectedEventCategoryId(DEFAULT_EVENT_CATEGORY_ID);
    }
  };

  useEffect(() => {
    if (selection?.kind === "events") {
      setSelectedEventCategoryId(selection.option.categoryId);
    }
  }, [selection]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSelectEntity = (option: SearchEntityOption) => {
    setSelection({ kind: "entities", option });
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleSelectEvent = (option: SearchEventOption) => {
    setSelection({ kind: "events", option });
    setSelectedEventCategoryId(option.categoryId);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className={cx("relative min-w-0", className)}>
      <div
        className={cx(
          "flex h-8 w-full max-w-[240px] items-center gap-2 rounded-[4px] border border-border-rule bg-surface-container px-3 transition-colors",
          open ? "ring-1 ring-interactive-active" : "hover:bg-overlay-subtle",
        )}
      >
        {selectedIcon && selection?.kind === "entities" ? (
          <Icon
            name={selectedIcon}
            size={PICKER_ICON_SIZE}
            className="shrink-0 text-datavis-data-pop-teal-20"
            aria-hidden
          />
        ) : selectedIcon ? (
          <Icon
            name={selectedIcon}
            size={PICKER_ICON_SIZE}
            className={cx("shrink-0", selectedEventIconClassName ?? "text-accent-enum")}
            aria-hidden
          />
        ) : (
          <Search size={PICKER_ICON_SIZE} strokeWidth={1.5} className="shrink-0 text-text-primary" aria-hidden />
        )}
        <input
          ref={inputRef}
          type="text"
          readOnly
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          placeholder={placeholder}
          value={displayValue}
          className={cx(
            "min-w-0 flex-1 cursor-text bg-transparent text-sm leading-5 outline-none placeholder:font-normal placeholder:italic placeholder:text-text-secondary",
            displayValue ? "font-semibold not-italic text-text-primary" : "font-normal italic text-text-secondary",
          )}
          onFocus={openPicker}
          onClick={openPicker}
        />
      </div>

      {open ? (
        <SearchScopePickerPanel
          searchBy={searchBy}
          onSearchByChange={handleSearchByChange}
          selectedEventCategoryId={selectedEventCategoryId}
          onEventCategoryChange={setSelectedEventCategoryId}
          onSelectEntity={handleSelectEntity}
          onSelectEvent={handleSelectEvent}
        />
      ) : null}
    </div>
  );
}
