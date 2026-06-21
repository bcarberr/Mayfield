import { useEffect, useId, useRef, useState } from "react";
import { Plus, Info } from "lucide-react";
import { Icon } from "../design-system";
import {
  SEARCH_ENTITY_COLUMNS,
  SEARCH_EVENT_CATEGORIES,
  eventCategoryById,
  type SearchEntityOption,
  type SearchEventOption,
} from "../data/searchEntityOptions";
import { getFieldsForCategory } from "../data/ocsfEventFields";
import { SearchCriteriaSelect } from "./SearchCriteriaSelect";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible";
import { Field, FieldLabel } from "@/components/shadcn/field";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const SMALL_OUTLINE_BUTTON_CLASS =
  "h-auto gap-1 rounded-[4px] border-interactive-secondary-pressed bg-transparent px-2 py-1 text-xs font-semibold text-interactive-active shadow-none hover:bg-interactive-secondary-hover hover:text-interactive-active";

const ICON_GHOST_BUTTON_CLASS =
  "shrink-0 text-text-tertiary hover:bg-overlay-subtle hover:text-text-primary disabled:opacity-40";

const CHIP_INPUT_CLASS =
  "h-auto min-w-[80px] flex-1 border-0 bg-transparent px-0 py-0 text-sm leading-5 shadow-none focus-visible:ring-0 placeholder:font-normal placeholder:italic placeholder:text-text-tertiary dark:bg-transparent";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConditionOperator =
  | "contains"
  | "equals"
  | "not-equals"
  | "not-contains"
  | "starts-with"
  | "ends-with";
type MatchType = "any-of" | "all-of";
type GroupLogic = "or" | "and";

type EventConditionRow = {
  id: string;
  fieldId: string;
  operator: ConditionOperator;
  matchType: MatchType;
  values: string[];
  caseSensitive: boolean;
};

type EventConditionGroup = {
  id: string;
  logic: GroupLogic;
  conditions: EventConditionRow[];
};

type EventBlock = {
  id: string;
  eventOption: SearchEventOption;
  groups: EventConditionGroup[];
};

// Entity blocks — simpler: no OCSF field selector, entity IS the field
type EntityConditionRow = {
  id: string;
  operator: ConditionOperator;
  matchType: MatchType;
  values: string[];
  caseSensitive: boolean;
};

type EntityConditionGroup = {
  id: string;
  logic: GroupLogic;
  conditions: EntityConditionRow[];
};

type EntityBlock = {
  id: string;
  entityOption: SearchEntityOption;
  groups: EntityConditionGroup[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const OPERATOR_OPTIONS: readonly { id: ConditionOperator; label: string }[] = [
  { id: "contains", label: "contains" },
  { id: "equals", label: "equals" },
  { id: "not-equals", label: "not equals" },
  { id: "not-contains", label: "does not contain" },
  { id: "starts-with", label: "starts with" },
  { id: "ends-with", label: "ends with" },
];

const MATCH_TYPE_OPTIONS: readonly { id: MatchType; label: string }[] = [
  { id: "any-of", label: "any of" },
  { id: "all-of", label: "all of" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _idCounter = 0;
const uid = (prefix: string) => `${prefix}-${++_idCounter}`;

const makeEmptyRow = (): EventConditionRow => ({
  id: uid("row"),
  fieldId: "",
  operator: "contains",
  matchType: "any-of",
  values: [],
  caseSensitive: false,
});

const makeEmptyGroup = (): EventConditionGroup => ({
  id: uid("group"),
  logic: "or",
  conditions: [makeEmptyRow()],
});

const makeEventBlock = (eventOption: SearchEventOption): EventBlock => ({
  id: uid("block"),
  eventOption,
  groups: [makeEmptyGroup()],
});

const makeEmptyEntityRow = (): EntityConditionRow => ({
  id: uid("erow"),
  operator: "contains",
  matchType: "any-of",
  values: [],
  caseSensitive: false,
});

const makeEmptyEntityGroup = (): EntityConditionGroup => ({
  id: uid("egroup"),
  logic: "or",
  conditions: [makeEmptyEntityRow()],
});

const makeEntityBlock = (entityOption: SearchEntityOption): EntityBlock => ({
  id: uid("eblock"),
  entityOption,
  groups: [makeEmptyEntityGroup()],
});

// ─── ValueChipInput ───────────────────────────────────────────────────────────

function ValueChipInput({
  values,
  onValuesChange,
}: {
  values: string[];
  onValuesChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (text: string) => {
    const trimmed = text.trim();
    if (trimmed) onValuesChange([...values, trimmed]);
    setDraft("");
  };

  return (
    <div
      className="flex min-h-8 flex-1 flex-wrap items-center gap-1.5 rounded-[4px] border border-border-rule bg-surface-container px-2 py-1 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {values.map((value, i) => (
        <span
          key={i}
          className="flex shrink-0 items-center gap-1 rounded bg-surface-modal px-2 py-0.5 text-xs font-semibold text-text-primary"
        >
          {value}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-auto shrink-0 p-0 text-text-secondary hover:bg-transparent hover:text-text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onValuesChange(values.filter((_, j) => j !== i));
            }}
            aria-label={`Remove ${value}`}
          >
            <Icon name="action-close" size={12} aria-hidden />
          </Button>
        </span>
      ))}
      <Input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && values.length > 0) {
            onValuesChange(values.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={values.length === 0 ? "Type and press Enter…" : ""}
        className={CHIP_INPUT_CLASS}
      />
    </div>
  );
}

// ─── OrAndToggle ──────────────────────────────────────────────────────────────

function OrAndToggle({
  value,
  onChange,
}: {
  value: GroupLogic;
  onChange: (v: GroupLogic) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded border border-border-rule">
      {(["or", "and"] as const).map((opt, i) => (
        <Button
          key={opt}
          type="button"
          variant="ghost"
          size="xs"
          className={cx(
            "h-auto rounded-none px-3 py-1 text-xs font-bold tracking-[0.4px]",
            i > 0 && "border-l border-border-rule",
            value === opt
              ? "bg-interactive-active text-text-on-primary hover:bg-interactive-active hover:text-text-on-primary"
              : "bg-surface-container text-text-secondary hover:bg-overlay-subtle hover:text-text-secondary",
          )}
          onClick={() => onChange(opt)}
        >
          {opt.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}

// ─── ConditionRow ─────────────────────────────────────────────────────────────

function ConditionRow({
  condition,
  categoryId,
  canDelete,
  onUpdate,
  onDelete,
  onAddBelow,
}: {
  condition: EventConditionRow;
  categoryId: string;
  canDelete: boolean;
  onUpdate: (updated: EventConditionRow) => void;
  onDelete: () => void;
  onAddBelow: () => void;
}) {
  const fields = getFieldsForCategory(categoryId);
  const fieldOptions = [
    { id: "", label: "Select field…" },
    ...fields.map((f) => ({ id: f.id, label: f.label })),
  ];

  return (
    <div className="flex flex-wrap items-start gap-2">
      {/* Field path */}
      <SearchCriteriaSelect
        value={condition.fieldId}
        onChange={(fieldId) => onUpdate({ ...condition, fieldId })}
        options={fieldOptions}
        className="w-[200px] shrink-0"
        aria-label="OCSF field"
        valueClassName={
          condition.fieldId
            ? "text-text-primary"
            : "font-normal italic text-text-tertiary"
        }
      />

      {/* Operator — italic orange to match Figma */}
      <SearchCriteriaSelect
        value={condition.operator}
        onChange={(operator) => onUpdate({ ...condition, operator })}
        options={OPERATOR_OPTIONS}
        className="w-[140px] shrink-0"
        aria-label="Operator"
        valueClassName="italic text-datavis-data-peanut-orange"
        selectedOptionClassName="text-interactive-active"
      />

      {/* Match type */}
      <SearchCriteriaSelect
        value={condition.matchType}
        onChange={(matchType) => onUpdate({ ...condition, matchType })}
        options={MATCH_TYPE_OPTIONS}
        className="w-[88px] shrink-0"
        aria-label="Match type"
        valueClassName="text-text-secondary"
      />

      {/* Multi-value chip input */}
      <ValueChipInput
        values={condition.values}
        onValuesChange={(values) => onUpdate({ ...condition, values })}
      />

      {/* Case-sensitive + actions */}
      <div className="flex shrink-0 items-center gap-1.5 pt-1">
        <Field orientation="horizontal" className="w-auto items-center gap-2">
          <Checkbox
            id={`case-sensitive-${condition.id}`}
            checked={condition.caseSensitive}
            onCheckedChange={(caseSensitive) =>
              onUpdate({ ...condition, caseSensitive: caseSensitive === true })
            }
          />
          <FieldLabel
            htmlFor={`case-sensitive-${condition.id}`}
            className="text-xs font-semibold text-text-secondary whitespace-nowrap"
          >
            Case-sensitive
          </FieldLabel>
        </Field>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={ICON_GHOST_BUTTON_CLASS}
          disabled={!canDelete}
          onClick={onDelete}
          aria-label="Remove condition"
        >
          <Icon name="action-delete" size={18} aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className={SMALL_OUTLINE_BUTTON_CLASS}
          onClick={onAddBelow}
          aria-label="Add condition"
        >
          <Plus size={6} strokeWidth={2} className="shrink-0" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

// ─── ConditionGroup ───────────────────────────────────────────────────────────

function ConditionGroup({
  group,
  categoryId,
  canDelete,
  onUpdate,
  onDelete,
}: {
  group: EventConditionGroup;
  categoryId: string;
  canDelete: boolean;
  onUpdate: (updated: EventConditionGroup) => void;
  onDelete: () => void;
}) {
  const updateCondition = (id: string, updated: EventConditionRow) =>
    onUpdate({
      ...group,
      conditions: group.conditions.map((c) => (c.id === id ? updated : c)),
    });

  const addConditionAfter = (afterId: string) => {
    const idx = group.conditions.findIndex((c) => c.id === afterId);
    const next = [...group.conditions];
    next.splice(idx + 1, 0, makeEmptyRow());
    onUpdate({ ...group, conditions: next });
  };

  const deleteCondition = (id: string) => {
    if (group.conditions.length <= 1) return;
    onUpdate({ ...group, conditions: group.conditions.filter((c) => c.id !== id) });
  };

  return (
    <div className="rounded-[4px] border border-border-rule bg-surface-container">
      {/* Group header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <OrAndToggle value={group.logic} onChange={(logic) => onUpdate({ ...group, logic })} />
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={ICON_GHOST_BUTTON_CLASS}
          disabled={!canDelete}
          onClick={onDelete}
          aria-label="Remove group"
        >
          <Icon name="action-delete" size={18} aria-hidden />
        </Button>
        <span className="cursor-grab p-1 text-text-tertiary">
          <Icon name="action-drag-indicator" size={18} aria-hidden />
        </span>
      </div>

      {/* Conditions with tree-connector lines */}
      <div className="relative ml-5 border-l border-border-rule pb-3 pl-4 pr-3">
        {group.conditions.map((condition) => (
          <div key={condition.id} className="relative mt-2 first:mt-0">
            {/* Horizontal connector to the vertical border-l */}
            <div
              className="absolute bg-border-rule"
              style={{ left: -16, top: 16, width: 16, height: 1 }}
              aria-hidden
            />
            <ConditionRow
              condition={condition}
              categoryId={categoryId}
              canDelete={group.conditions.length > 1}
              onUpdate={(updated) => updateCondition(condition.id, updated)}
              onDelete={() => deleteCondition(condition.id)}
              onAddBelow={() => addConditionAfter(condition.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EventBlock ───────────────────────────────────────────────────────────────

function EventBlockComp({
  block,
  onUpdate,
  onDelete,
}: {
  block: EventBlock;
  onUpdate: (updated: EventBlock) => void;
  onDelete: () => void;
}) {
  const category = eventCategoryById(block.eventOption.categoryId);

  const updateGroup = (id: string, updated: EventConditionGroup) =>
    onUpdate({ ...block, groups: block.groups.map((g) => (g.id === id ? updated : g)) });

  const deleteGroup = (id: string) => {
    if (block.groups.length <= 1) return;
    onUpdate({ ...block, groups: block.groups.filter((g) => g.id !== id) });
  };

  return (
    <div className="rounded-[4px] border border-border-rule">
      {/* Event header */}
      <div className="flex items-center gap-2 rounded-t-[4px] border-b border-border-rule bg-overlay-subtle px-4 py-2.5">
        <Icon
          name={block.eventOption.icon}
          size={18}
          className={cx("shrink-0", category?.iconClassName)}
          aria-hidden
        />
        <span className="text-sm font-semibold text-text-primary">{block.eventOption.label}</span>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={ICON_GHOST_BUTTON_CLASS}
          onClick={onDelete}
          aria-label={`Remove ${block.eventOption.label}`}
        >
          <Icon name="action-delete" size={18} aria-hidden />
        </Button>
      </div>

      {/* Condition groups */}
      <div className="space-y-3 p-4">
        {block.groups.map((group) => (
          <ConditionGroup
            key={group.id}
            group={group}
            categoryId={block.eventOption.categoryId}
            canDelete={block.groups.length > 1}
            onUpdate={(updated) => updateGroup(group.id, updated)}
            onDelete={() => deleteGroup(group.id)}
          />
        ))}

        {/* Add Condition (adds a new group) */}
        <Button
          type="button"
          variant="secondary-outline"
          className="self-start"
          onClick={() => onUpdate({ ...block, groups: [...block.groups, makeEmptyGroup()] })}
        >
          <Plus size={9} strokeWidth={2} className="shrink-0 text-current" aria-hidden />
          Add Condition
        </Button>
      </div>
    </div>
  );
}

// ─── EventPickerPopover ───────────────────────────────────────────────────────

function EventPickerPopover({
  onSelect,
  onClose,
}: {
  onSelect: (option: SearchEventOption) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState(SEARCH_EVENT_CATEGORIES[0]!.id);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const activeCategory =
    SEARCH_EVENT_CATEGORIES.find((c) => c.id === activeCategoryId) ?? SEARCH_EVENT_CATEGORIES[0]!;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 top-[calc(100%+4px)] z-50 flex overflow-hidden rounded-[4px] border border-border-rule bg-surface-modal shadow-[0px_5px_5px_-3px_rgba(0,0,0,0.2),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_3px_14px_2px_rgba(0,0,0,0.12)]"
      style={{ width: 560, maxHeight: 400 }}
      role="dialog"
      aria-label="Pick an event"
    >
      {/* Left: categories */}
      <div className="w-44 shrink-0 overflow-y-auto border-r border-border-rule">
        <p className="px-4 pt-3 text-xs font-bold uppercase leading-[14px] tracking-[0.4px] text-text-tertiary">
          Event categories
        </p>
        <div className="pb-2 pt-1">
          {SEARCH_EVENT_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              variant="ghost"
              className={cn(
                "h-9 w-full justify-start gap-2 rounded-none px-4 text-left text-sm font-semibold text-text-primary hover:bg-interactive-secondary-hover",
                cat.id === activeCategoryId && "bg-interactive-secondary-hover",
              )}
              onMouseEnter={() => setActiveCategoryId(cat.id)}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              <Icon name={cat.icon} size={16} className={cx("shrink-0", cat.iconClassName)} aria-hidden />
              <span className="min-w-0 truncate">{cat.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Right: events in active category */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div
          className={cx(
            "grid gap-x-3",
            activeCategory.events.length > 6 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {activeCategory.events.map((event) => (
            <Button
              key={event.id}
              type="button"
              variant="ghost"
              className="h-8 w-full min-w-0 justify-start gap-2 rounded px-1 text-left hover:bg-interactive-secondary-hover"
              onClick={() => {
                onSelect(event);
                onClose();
              }}
            >
              <Icon
                name={event.icon}
                size={16}
                className={cx("shrink-0", activeCategory.iconClassName)}
                aria-hidden
              />
              <span className="min-w-0 truncate text-sm font-semibold text-text-secondary">
                {event.label}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EntityPickerPopover ─────────────────────────────────────────────────────

function EntityPickerPopover({
  onSelect,
  onClose,
}: {
  onSelect: (option: SearchEntityOption) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute left-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-[4px] border border-border-rule bg-surface-modal shadow-[0px_5px_5px_-3px_rgba(0,0,0,0.2),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_3px_14px_2px_rgba(0,0,0,0.12)]"
      style={{ width: 680, maxHeight: 400, overflowY: "auto" }}
      role="dialog"
      aria-label="Pick an entity"
    >
      <p className="px-4 pt-3 text-xs font-bold uppercase leading-[14px] tracking-[0.4px] text-text-tertiary">
        Observable entities
      </p>
      <div className="grid grid-cols-4 gap-x-3 px-4 py-3">
        {SEARCH_ENTITY_COLUMNS.map((column, colIdx) => (
          <div key={colIdx} className="min-w-0">
            {column.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="ghost"
                className="h-8 w-full min-w-0 justify-start gap-2 rounded px-1 text-left hover:bg-interactive-secondary-hover"
                onClick={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Icon
                  name={option.icon}
                  size={18}
                  className="shrink-0 text-datavis-data-pop-teal-20"
                  aria-hidden
                />
                <span className="min-w-0 truncate text-sm font-semibold leading-8 tracking-[0.4px] text-text-secondary">
                  {option.label}
                </span>
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EntityConditionRow ───────────────────────────────────────────────────────

function EntityConditionRowComp({
  condition,
  canDelete,
  onUpdate,
  onDelete,
  onAddBelow,
}: {
  condition: EntityConditionRow;
  canDelete: boolean;
  onUpdate: (updated: EntityConditionRow) => void;
  onDelete: () => void;
  onAddBelow: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <SearchCriteriaSelect
        value={condition.operator}
        onChange={(operator) => onUpdate({ ...condition, operator })}
        options={OPERATOR_OPTIONS}
        className="w-[140px] shrink-0"
        aria-label="Operator"
        valueClassName="italic text-datavis-data-peanut-orange"
        selectedOptionClassName="text-interactive-active"
      />
      <SearchCriteriaSelect
        value={condition.matchType}
        onChange={(matchType) => onUpdate({ ...condition, matchType })}
        options={MATCH_TYPE_OPTIONS}
        className="w-[88px] shrink-0"
        aria-label="Match type"
        valueClassName="text-text-secondary"
      />
      <ValueChipInput
        values={condition.values}
        onValuesChange={(values) => onUpdate({ ...condition, values })}
      />
      <div className="flex shrink-0 items-center gap-1.5 pt-1">
        <Field orientation="horizontal" className="w-auto items-center gap-2">
          <Checkbox
            id={`entity-case-sensitive-${condition.id}`}
            checked={condition.caseSensitive}
            onCheckedChange={(caseSensitive) =>
              onUpdate({ ...condition, caseSensitive: caseSensitive === true })
            }
          />
          <FieldLabel
            htmlFor={`entity-case-sensitive-${condition.id}`}
            className="text-xs font-semibold text-text-secondary whitespace-nowrap"
          >
            Case-sensitive
          </FieldLabel>
        </Field>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={ICON_GHOST_BUTTON_CLASS}
          disabled={!canDelete}
          onClick={onDelete}
          aria-label="Remove condition"
        >
          <Icon name="action-delete" size={18} aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className={SMALL_OUTLINE_BUTTON_CLASS}
          onClick={onAddBelow}
          aria-label="Add condition"
        >
          <Plus size={6} strokeWidth={2} className="shrink-0" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

// ─── EntityConditionGroup ─────────────────────────────────────────────────────

function EntityConditionGroup({
  group,
  canDelete,
  onUpdate,
  onDelete,
}: {
  group: EntityConditionGroup;
  canDelete: boolean;
  onUpdate: (updated: EntityConditionGroup) => void;
  onDelete: () => void;
}) {
  const updateCondition = (id: string, updated: EntityConditionRow) =>
    onUpdate({
      ...group,
      conditions: group.conditions.map((c) => (c.id === id ? updated : c)),
    });

  const addConditionAfter = (afterId: string) => {
    const idx = group.conditions.findIndex((c) => c.id === afterId);
    const next = [...group.conditions];
    next.splice(idx + 1, 0, makeEmptyEntityRow());
    onUpdate({ ...group, conditions: next });
  };

  const deleteCondition = (id: string) => {
    if (group.conditions.length <= 1) return;
    onUpdate({ ...group, conditions: group.conditions.filter((c) => c.id !== id) });
  };

  return (
    <div className="rounded-[4px] border border-border-rule bg-surface-container">
      <div className="flex items-center gap-2 px-3 py-2">
        <OrAndToggle value={group.logic} onChange={(logic) => onUpdate({ ...group, logic })} />
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={ICON_GHOST_BUTTON_CLASS}
          disabled={!canDelete}
          onClick={onDelete}
          aria-label="Remove group"
        >
          <Icon name="action-delete" size={18} aria-hidden />
        </Button>
        <span className="cursor-grab p-1 text-text-tertiary">
          <Icon name="action-drag-indicator" size={18} aria-hidden />
        </span>
      </div>
      <div className="relative ml-5 border-l border-border-rule pb-3 pl-4 pr-3">
        {group.conditions.map((condition) => (
          <div key={condition.id} className="relative mt-2 first:mt-0">
            <div
              className="absolute bg-border-rule"
              style={{ left: -16, top: 16, width: 16, height: 1 }}
              aria-hidden
            />
            <EntityConditionRowComp
              condition={condition}
              canDelete={group.conditions.length > 1}
              onUpdate={(updated) => updateCondition(condition.id, updated)}
              onDelete={() => deleteCondition(condition.id)}
              onAddBelow={() => addConditionAfter(condition.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EntityBlockComp ─────────────────────────────────────────────────────────

function EntityBlockComp({
  block,
  onUpdate,
  onDelete,
}: {
  block: EntityBlock;
  onUpdate: (updated: EntityBlock) => void;
  onDelete: () => void;
}) {
  const updateGroup = (id: string, updated: EntityConditionGroup) =>
    onUpdate({ ...block, groups: block.groups.map((g) => (g.id === id ? updated : g)) });

  const deleteGroup = (id: string) => {
    if (block.groups.length <= 1) return;
    onUpdate({ ...block, groups: block.groups.filter((g) => g.id !== id) });
  };

  return (
    <div className="rounded-[4px] border border-border-rule">
      <div className="flex items-center gap-2 rounded-t-[4px] border-b border-border-rule bg-overlay-subtle px-4 py-2.5">
        <Icon
          name={block.entityOption.icon}
          size={18}
          className="shrink-0 text-datavis-data-pop-teal-20"
          aria-hidden
        />
        <span className="text-sm font-semibold text-text-primary">{block.entityOption.label}</span>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={ICON_GHOST_BUTTON_CLASS}
          onClick={onDelete}
          aria-label={`Remove ${block.entityOption.label}`}
        >
          <Icon name="action-delete" size={18} aria-hidden />
        </Button>
      </div>
      <div className="space-y-3 p-4">
        {block.groups.map((group) => (
          <EntityConditionGroup
            key={group.id}
            group={group}
            canDelete={block.groups.length > 1}
            onUpdate={(updated) => updateGroup(group.id, updated)}
            onDelete={() => deleteGroup(group.id)}
          />
        ))}
        <Button
          type="button"
          variant="secondary-outline"
          className="self-start"
          onClick={() => onUpdate({ ...block, groups: [...block.groups, makeEmptyEntityGroup()] })}
        >
          <Plus size={9} strokeWidth={2} className="shrink-0 text-current" aria-hidden />
          Add Condition
        </Button>
      </div>
    </div>
  );
}

// ─── AdvancedOptions ──────────────────────────────────────────────────────────

function AdvancedOptions() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-t border-border-rule pt-3">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto gap-1.5 px-0 text-sm font-semibold text-text-secondary hover:bg-transparent hover:text-text-primary"
            aria-expanded={open}
          >
            Advanced Options
            <Info size={16} strokeWidth={1.5} className="text-text-tertiary" aria-hidden />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-3 rounded-[4px] border border-border-rule bg-surface-container p-4 text-sm text-text-secondary">
            Advanced search options will appear here.
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── SearchQueryBuilder ───────────────────────────────────────────────────────

export function SearchQueryBuilder({
  onValidityChange,
  onConvertToFsql,
}: {
  onValidityChange?: (valid: boolean) => void;
  onConvertToFsql?: (query: string) => void;
}) {
  const matchLogicGroupName = useId();
  const [matchLogic, setMatchLogic] = useState<"any" | "all">("any");
  const [eventBlocks, setEventBlocks] = useState<EventBlock[]>([]);
  const [entityBlocks, setEntityBlocks] = useState<EntityBlock[]>([]);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);

  const isValid =
    eventBlocks.some((block) =>
      block.groups.some((group) =>
        group.conditions.some((c) => c.fieldId !== "" && c.values.length > 0),
      ),
    ) ||
    entityBlocks.some((block) =>
      block.groups.some((group) =>
        group.conditions.some((c) => c.values.length > 0),
      ),
    );

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  const updateEventBlock = (id: string, updated: EventBlock) =>
    setEventBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  const deleteEventBlock = (id: string) =>
    setEventBlocks((prev) => prev.filter((b) => b.id !== id));

  const updateEntityBlock = (id: string, updated: EntityBlock) =>
    setEntityBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  const deleteEntityBlock = (id: string) =>
    setEntityBlocks((prev) => prev.filter((b) => b.id !== id));

  const OP_FSQL: Record<ConditionOperator, string> = {
    contains: "CONTAINS",
    equals: "=",
    "not-equals": "!=",
    "not-contains": "NOT CONTAINS",
    "starts-with": "STARTS WITH",
    "ends-with": "ENDS WITH",
  };

  const handleConvertToFsql = () => {
    const eventParts = eventBlocks.flatMap((block) =>
      block.groups.flatMap((group) =>
        group.conditions
          .filter((c) => c.fieldId && c.values.length > 0)
          .map((c) => {
            const fieldLabel =
              getFieldsForCategory(block.eventOption.categoryId).find((f) => f.id === c.fieldId)
                ?.label ?? c.fieldId;
            const vals = c.values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(", ");
            return `${fieldLabel} ${OP_FSQL[c.operator]} (${vals})`;
          }),
      ),
    );
    const entityParts = entityBlocks.flatMap((block) =>
      block.groups.flatMap((group) =>
        group.conditions
          .filter((c) => c.values.length > 0)
          .map((c) => {
            const vals = c.values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(", ");
            return `${block.entityOption.label} ${OP_FSQL[c.operator]} (${vals})`;
          }),
      ),
    );
    const joiner = matchLogic === "any" ? " OR " : " AND ";
    onConvertToFsql?.([...entityParts, ...eventParts].join(joiner));
  };

  return (
    <div className="space-y-5">
      {/* Top-level match logic */}
      <div
        role="radiogroup"
        aria-label="Top-level match logic"
        className="flex flex-wrap items-center gap-6"
      >
        {(
          [
            { id: "any" as const, label: "Match ANY of the conditions below" },
            { id: "all" as const, label: "Match ALL of the conditions below" },
          ] as const
        ).map((opt) => (
          <Field key={opt.id} orientation="horizontal" className="w-auto items-center gap-2">
            <input
              type="radio"
              id={`${matchLogicGroupName}-${opt.id}`}
              name={matchLogicGroupName}
              value={opt.id}
              checked={matchLogic === opt.id}
              onChange={() => setMatchLogic(opt.id)}
              className="size-4 shrink-0 accent-interactive-active"
            />
            <FieldLabel
              htmlFor={`${matchLogicGroupName}-${opt.id}`}
              className="cursor-pointer text-sm font-semibold leading-5 tracking-[0.4px] text-text-primary"
            >
              {opt.label}
            </FieldLabel>
          </Field>
        ))}
      </div>

      {/* Entity + Event blocks */}
      {(entityBlocks.length > 0 || eventBlocks.length > 0) && (
        <div className="space-y-4">
          {entityBlocks.map((block) => (
            <EntityBlockComp
              key={block.id}
              block={block}
              onUpdate={(updated) => updateEntityBlock(block.id, updated)}
              onDelete={() => deleteEntityBlock(block.id)}
            />
          ))}
          {eventBlocks.map((block) => (
            <EventBlockComp
              key={block.id}
              block={block}
              onUpdate={(updated) => updateEventBlock(block.id, updated)}
              onDelete={() => deleteEventBlock(block.id)}
            />
          ))}
        </div>
      )}

      {/* Footer: Add Entity / Add Event */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Add Entity */}
        <div className="relative">
          <Button
            type="button"
            variant="secondary-outline"
            onClick={() => setShowEntityPicker((v) => !v)}
          >
            <Plus size={9} strokeWidth={2} className="shrink-0 text-current" aria-hidden />
            Add Entity
          </Button>
          {showEntityPicker && (
            <EntityPickerPopover
              onSelect={(option) => {
                setEntityBlocks((prev) => [...prev, makeEntityBlock(option)]);
              }}
              onClose={() => setShowEntityPicker(false)}
            />
          )}
        </div>

        {/* Add Event */}
        <div className="relative">
          <Button
            type="button"
            variant="secondary-outline"
            onClick={() => setShowEventPicker((v) => !v)}
          >
            <Plus size={9} strokeWidth={2} className="shrink-0 text-current" aria-hidden />
            Add Event
          </Button>

          {showEventPicker && (
            <EventPickerPopover
              onSelect={(option) => {
                setEventBlocks((prev) => [...prev, makeEventBlock(option)]);
              }}
              onClose={() => setShowEventPicker(false)}
            />
          )}
        </div>

        {/* Convert to FSQL — only shown when there's something to convert */}
        {isValid && onConvertToFsql && (
          <Button
            type="button"
            variant="ghost"
            className="ml-auto h-auto gap-1 px-1 py-2 font-semibold text-text-secondary hover:bg-overlay-subtle"
            onClick={handleConvertToFsql}
          >
            Convert to FSQL
          </Button>
        )}
      </div>

      {/* Advanced Options */}
      <AdvancedOptions />
    </div>
  );
}
