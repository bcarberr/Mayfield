import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent, type ReactNode } from "react";
import { CircleX, ChevronDown, Eye, EyeOff, Info, Loader2, Minus, Plus, X } from "lucide-react";
import { Checkbox, Icon } from "../../design-system";
import { getDemoCommonSampleValues } from "../../data/demoCommonSampleValues";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcn/tooltip";
import type { MapSchemaEntity } from "../../data/httpActivityMapSchemaEntities";
import type { HttpActivityShowAllAttribute } from "../../data/httpActivityFullSchema";
import {
  HTTP_ACTIVITY_SCHEMA_ACCESSOR,
  buildGenericDemoMappedRows,
  type OcsfSchemaAccessor,
} from "../../data/ocsf/ocsfSchemaAccessor";
import {
  loadGeneratedOcsfClassData,
  useOcsfSchemaAccessor,
} from "../../data/ocsf/ocsfClassSchemaRegistry";
import { OCSF_DEMO_SOURCE_FIELDS_BY_CLASS } from "../../data/ocsf/ocsfDemoSourceFields.generated";
import {
  buildCopilotDemoMappedRows,
  buildCopilotDemoUnmappedRows,
  buildHttpActivityRowsFromScenario,
  findCopilotDemoScenarioByEventClass,
  takeNextCopilotDemoScenario,
  type CopilotDemoScenario,
} from "../../data/ocsf/copilotDemoScenarios";
import treeBranchSvg from "../../assets/icons/tree.svg?raw";
import {
  formatOcsfPathLabel,
  getOcsfEntityCategoryDescription,
  getOcsfFieldDescription,
  ocsfFieldMappingTag,
} from "../../data/ocsfFieldDescriptions";
import {
  HTTP_ACTIVITY_DEMO_INITIAL_ROWS,
  buildHttpActivityDemoMappedRows,
  buildHttpActivityDemoUnmappedRows,
  type HttpActivityDemoSourceRow,
} from "../../data/httpActivityDemoSourceFields";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Switch } from "../ui/Switch";
import { CopilotSparkMark } from "../SearchCopilotPanel";
import { SearchEventClassPicker } from "../SearchEventClassPicker";
import { searchEventById } from "../../data/searchEntityOptions";
import {
  hasConnectorMappings,
  markConnectorMappingsComplete,
} from "./connectorEnabledState";

/** Schema accessor for the mapper's currently-selected event class (see MapSchemaOverviewCard). */
const OcsfSchemaAccessorContext = createContext<OcsfSchemaAccessor>(HTTP_ACTIVITY_SCHEMA_ACCESSOR);
function useOcsfSchema(): OcsfSchemaAccessor {
  return useContext(OcsfSchemaAccessorContext);
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const MAP_SCHEMA_DRAG_MIME = "application/x-query-map-field";
const MAP_SCHEMA_ENUM_VALUE_MIME = "application/x-query-map-enum-value";

type MapSchemaEnumValueDragPayload = {
  fieldPath: string;
  id: number;
  label: string;
};

function enumValueMappingTag(value: { id: number; label: string }): string {
  return `${value.id} ${value.label}`;
}

function parseEnumValueDragPayload(raw: string): MapSchemaEnumValueDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as MapSchemaEnumValueDragPayload;
    if (
      typeof parsed?.fieldPath === "string" &&
      typeof parsed.id === "number" &&
      typeof parsed.label === "string"
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

const MAP_SCHEMA_PANEL_DEFAULT_WIDTH = 320;
const MAP_SCHEMA_PANEL_MIN_WIDTH = 260;
const MAP_SCHEMA_PANEL_MAX_WIDTH = 640;
const MAP_SCHEMA_TREE_INDENT_PX = 12;
/** Indent for source-side enum value rows (and matching target drop zones). */
const SOURCE_ENUM_VALUE_INDENT_PX = 64;
const MAP_SCHEMA_MOVE_SLOT_CLASS = "inline-flex w-[11px] shrink-0 items-center justify-center";
const MAP_SCHEMA_TREE_SLOT_CLASS = "inline-flex w-3 shrink-0 items-start justify-center";

function clampMapSchemaPanelWidth(width: number) {
  return Math.round(Math.min(MAP_SCHEMA_PANEL_MAX_WIDTH, Math.max(MAP_SCHEMA_PANEL_MIN_WIDTH, width)));
}

export const ADVANCED_MODE_CALLOUT =
  "Advanced Mode allows mapping of more details and will give more context for investigations and threat hunting.";

export const MAP_REVIEW_GETTING_STARTED =
  "To get started, use Basic Mode. Basic Mode has one required field: Event Time. You then can map any Entity to any field. Some other recommended fields may also be helpful to get started: activity, message, severity, and status. You can switch to Advanced Mode or Basic Mode anytime and not lose any mappings.";

export type SchemaMappingPreviewPayload = {
  eventClass: {
    id: string;
    label: string;
  };
  mappedFieldCount: number;
  mappings: Array<{
    sourceField: string;
    sampleValue: string;
    qdmFields: string[];
  }>;
};

type MappingRow = {
  source: string;
  sample: string;
  mapped: boolean;
  tags?: string[];
  /** Expandable customer-side enum parent. */
  sourceEnum?: boolean;
  /** Parent source when this row is a customer enum value. */
  parentSource?: string;
};

function isMappedRow(r: MappingRow): boolean {
  return Boolean(r.mapped && r.tags?.length);
}

function mappingStateSignature(rows: readonly MappingRow[], eventClassId: string): string {
  return JSON.stringify({
    eventClassId,
    rows: rows.map((row) => ({
      source: row.source,
      mapped: row.mapped,
      tags: row.tags ?? [],
    })),
  });
}

function buildSchemaMappingPreview(
  rows: readonly MappingRow[],
  eventClassId: string,
): SchemaMappingPreviewPayload {
  const eventClass = searchEventById(eventClassId);
  const mappings = rows
    .filter(isMappedRow)
    .map((row) => ({
      sourceField: row.source,
      sampleValue: row.sample,
      qdmFields: [...(row.tags ?? [])],
    }));

  return {
    eventClass: {
      id: eventClassId,
      label: eventClass?.label ?? eventClassId,
    },
    mappedFieldCount: mappings.length,
    mappings,
  };
}

type MapVisibilityMode = "all" | "hideMapped" | "hideUnmapped";

function MapVisibilityTrimode({
  value,
  onChange,
  disabled = false,
}: {
  value: MapVisibilityMode;
  onChange: (next: MapVisibilityMode) => void;
  disabled?: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  const leftRadioId = `${gid}-radio-left`;
  const midRadioId = `${gid}-radio-mid`;
  const rightRadioId = `${gid}-radio-right`;

  return (
    <div
      role="radiogroup"
      aria-label="Filter rows by mapping status"
      aria-disabled={disabled || undefined}
      className={cx(
        "flex flex-wrap items-center gap-x-3 gap-y-2",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <label
        htmlFor={leftRadioId}
        className={cx(
          "select-none text-sm font-semibold leading-[18px] underline-offset-2",
          disabled ? "cursor-not-allowed text-text-disabled" : "cursor-pointer",
          !disabled && (value === "hideMapped" ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"),
        )}
      >
        Hide Mapped
      </label>

      <div
        className={cx(
          "relative h-[18px] w-12 shrink-0 overflow-hidden rounded-full px-[3px] transition-colors duration-150 ease-out",
          value === "all" &&
            !disabled &&
            "border border-solid border-[var(--color-switch-track-off)] bg-transparent",
          value === "all" &&
            disabled &&
            "border border-solid border-[var(--color-switch-off-disabled)] bg-transparent",
          !disabled &&
            (value === "hideMapped" || value === "hideUnmapped") &&
            "border-0 bg-interactive-active hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-pressed)]",
          disabled &&
            (value === "hideMapped" || value === "hideUnmapped") &&
            "border-0 bg-[var(--color-switch-track-on-disabled)]",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "pointer-events-none absolute top-1/2 z-0 size-3 rounded-full transition-[left,transform,background-color] duration-200 ease-out",
            value === "all" && !disabled && "bg-[var(--color-switch-thumb-off)]",
            value === "all" && disabled && "bg-[var(--color-switch-thumb-off-disabled)]",
            !disabled &&
              (value === "hideMapped" || value === "hideUnmapped") &&
              "bg-text-on-primary",
            disabled &&
              (value === "hideMapped" || value === "hideUnmapped") &&
              "bg-[var(--color-switch-thumb-on-disabled)]",
            value === "hideMapped" && "left-[3px] -translate-y-1/2",
            value === "all" && "left-1/2 -translate-x-1/2 -translate-y-1/2",
            value === "hideUnmapped" && "left-[calc(100%-15px)] -translate-y-1/2",
          )}
        />
        <button
          id={leftRadioId}
          type="button"
          role="radio"
          aria-checked={value === "hideMapped"}
          aria-label="Show only unmapped fields"
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={() => onChange("hideMapped")}
          className="absolute inset-y-0 left-0 z-[1] w-1/3 cursor-pointer rounded-l-full border-0 bg-transparent p-0 disabled:cursor-not-allowed"
        />
        <button
          id={midRadioId}
          type="button"
          role="radio"
          aria-checked={value === "all"}
          aria-label="Show all rows"
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={() => onChange("all")}
          className="absolute inset-y-0 left-1/3 z-[1] w-1/3 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed"
        />
        <button
          id={rightRadioId}
          type="button"
          role="radio"
          aria-checked={value === "hideUnmapped"}
          aria-label="Show only mapped fields"
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={() => onChange("hideUnmapped")}
          className="absolute inset-y-0 left-2/3 z-[1] w-1/3 cursor-pointer rounded-r-full border-0 bg-transparent p-0 disabled:cursor-not-allowed"
        />
      </div>

      <label
        htmlFor={rightRadioId}
        className={cx(
          "select-none text-sm font-semibold leading-[18px] underline-offset-2",
          disabled ? "cursor-not-allowed text-text-disabled" : "cursor-pointer",
          !disabled && (value === "hideUnmapped" ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"),
        )}
      >
        Hide Unmapped
      </label>
    </div>
  );
}

const DEFAULT_EVENT_CLASS_ID = "http_activity";

const INITIAL_ROWS = HTTP_ACTIVITY_DEMO_INITIAL_ROWS;

function aiMappingDelayMs(): number {
  return 6000 + Math.floor(Math.random() * 2001);
}

function buildDemoMappedRows(sourceRows: readonly MappingRow[]): MappingRow[] {
  return buildHttpActivityDemoMappedRows(sourceRows);
}

function buildUnmappedRows(sourceRows: readonly MappingRow[]): MappingRow[] {
  return buildHttpActivityDemoUnmappedRows(sourceRows);
}

/** Demo *source* connector rows for the mapper's left column, for any event class. */
function getDemoSourceRowsForEventClass(eventClassId: string): MappingRow[] {
  if (eventClassId === "http_activity") {
    return buildHttpActivityRowsFromScenario(false);
  }
  const scenario = findCopilotDemoScenarioByEventClass(eventClassId);
  if (scenario) {
    return buildCopilotDemoUnmappedRows(scenario).map((row) => ({ ...row }));
  }
  const fields = OCSF_DEMO_SOURCE_FIELDS_BY_CLASS[eventClassId] ?? [];
  return fields.map((field) => ({ ...field, mapped: false }));
}

function rowsFromCopilotScenario(scenario: CopilotDemoScenario, mapped: boolean): MappingRow[] {
  if (scenario.eventClassId === "http_activity") {
    return buildHttpActivityRowsFromScenario(mapped);
  }
  if (mapped) {
    return buildCopilotDemoMappedRows(scenario).map((row) => ({ ...row }));
  }
  return buildCopilotDemoUnmappedRows(scenario).map((row) => ({ ...row }));
}

/** Async because generated classes' schema data (entity/recommended paths) is code-split. */
async function buildDemoMappedRowsForEventClass(
  eventClassId: string,
  sourceRows: readonly MappingRow[],
): Promise<MappingRow[]> {
  if (eventClassId === "http_activity") {
    return buildHttpActivityDemoMappedRows(sourceRows as readonly HttpActivityDemoSourceRow[]);
  }
  const scenario = findCopilotDemoScenarioByEventClass(eventClassId);
  if (scenario) {
    return buildCopilotDemoMappedRows(scenario).map((row) => ({ ...row }));
  }
  const data = await loadGeneratedOcsfClassData(eventClassId);
  if (!data) return sourceRows.map((row) => ({ ...row, mapped: false }));
  return buildGenericDemoMappedRows(sourceRows, data);
}

const MAPPING_FIELD_COLGROUP = (
  <colgroup>
    <col style={{ width: "calc((100% - 3rem) / 2)" }} />
    <col style={{ width: "3rem" }} />
    <col style={{ width: "calc((100% - 3rem) / 2)" }} />
  </colgroup>
);

function Tag({ children, onRemove }: { children: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex h-5 max-w-full items-center gap-1 rounded bg-surface-container px-1.5 text-[11px] font-semibold text-text-secondary ring-1 ring-border-container">
      <span className="truncate">{children}</span>
      <button
        type="button"
        className="shrink-0 text-text-tertiary hover:text-text-primary"
        aria-label={`Remove ${children}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove?.();
        }}
      >
        <CircleX size={12} strokeWidth={1.5} />
      </button>
    </span>
  );
}

type MapSchemaRecommendedRow =
  | { kind: "field"; name: string; enum?: boolean; info?: boolean }
  | { kind: "plain"; name: string };

const MAP_SCHEMA_RECOMMENDED: MapSchemaRecommendedRow[] = [
  { kind: "field", name: "activity_id", enum: true, info: true },
  { kind: "plain", name: "activity_name" },
  { kind: "field", name: "category_uid", enum: true, info: true },
  { kind: "plain", name: "category_name" },
  { kind: "field", name: "severity_id", enum: true, info: true },
  { kind: "plain", name: "severity" },
  { kind: "field", name: "type_id", enum: true, info: true },
  { kind: "plain", name: "type_name" },
];

/** Hover/click the italic sample value to preview 10 common values from sample data. */
function SourceSampleCommonValues({ source, sample }: { source: string; sample: string }) {
  const [open, setOpen] = useState(false);
  const values = useMemo(() => getDemoCommonSampleValues(source, sample), [source, sample]);

  return (
    <Tooltip delayDuration={150} open={open} onOpenChange={setOpen} disableHoverableContent={false}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cx(
            "max-w-[12rem] truncate rounded-sm text-xs font-semibold italic tracking-[0.4px]",
            open
              ? "text-interactive-active"
              : "text-text-tertiary hover:text-interactive-active",
          )}
          aria-label={`Common values for ${source}`}
          aria-expanded={open}
        >
          {sample || "(empty)"}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="start"
        sideOffset={10}
        showArrow={false}
        className={cx(
          "flex w-[264px] max-w-[264px] flex-col items-stretch gap-0 overflow-hidden rounded-[4px] p-0",
          "border border-border-rule bg-surface-modal text-text-primary",
          "shadow-[0px_5px_5px_-3px_rgba(0,0,0,0.2),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_3px_14px_2px_rgba(0,0,0,0.12)]",
        )}
      >        <div className="flex items-center justify-between gap-3 border-b border-border-rule px-4 py-3">
          <p className="min-w-0 flex-1 text-sm font-semibold leading-5 tracking-[0.4px] text-text-primary">
            Common Values in Sample Data
          </p>
          <button
            type="button"
            className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-primary"
            aria-label="Close common values"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
            }}
          >
            <X size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <ul className="max-h-[320px] overflow-y-auto px-4 py-3">
          {values.map((value, index) => (
            <li
              key={`${source}-common-${index}-${value}`}
              className="truncate text-xs font-normal leading-5 tracking-[0.4px] text-text-primary"
            >
              {value}
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

function MapSchemaFieldInfoPopover({
  label,
  description,
  fieldPath,
}: {
  label: string;
  description?: string;
  fieldPath?: string;
}) {
  const popoverDescription =
    description ?? (fieldPath ? getOcsfFieldDescription(fieldPath) : "No OCSF description available.");

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-primary data-[state=delayed-open]:bg-overlay-subtle data-[state=delayed-open]:text-text-primary data-[state=instant-open]:bg-overlay-subtle data-[state=instant-open]:text-text-primary"
          aria-label={`About ${label}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <Info size={16} strokeWidth={1.5} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        sideOffset={8}
        showArrow={false}
        className="max-w-[240px] rounded border border-border-container bg-surface-modal px-3 py-2 text-xs font-normal leading-4 text-text-primary shadow-none"
      >
        {popoverDescription}
      </TooltipContent>
    </Tooltip>
  );
}

function MapSchemaFieldRowShell({
  fieldPath,
  label,
  contentIndent = 0,
  draggable = false,
  onDragStart,
  rowClassName,
  contentClassName,
  children,
}: {
  fieldPath: string;
  label: string;
  contentIndent?: number;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void;
  rowClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={cx(
        "flex h-7 w-full min-w-0 items-center gap-2 rounded py-1 hover:bg-overlay-subtle",
        draggable && "cursor-grab active:cursor-grabbing",
        rowClassName,
      )}
    >
      <MapSchemaFieldInfoPopover fieldPath={fieldPath} label={label} />
      <div
        className={cx("flex min-w-0 flex-1 items-center gap-2", contentClassName)}
        style={contentIndent > 0 ? { paddingLeft: `${contentIndent}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function MapSchemaDraggableFieldRow({
  fieldPath,
  label,
  indent = 24,
  enumLabel,
  typeSuffix,
  onDragStart,
}: {
  fieldPath: string;
  label?: string;
  indent?: number;
  enumLabel?: boolean;
  typeSuffix?: ReactNode;
  onDragStart?: (event: DragEvent<HTMLDivElement>, fieldPath: string) => void;
}) {
  const displayLabel = label ?? formatOcsfPathLabel(fieldPath);
  const resolvedTypeSuffix =
    typeSuffix ??
    (enumLabel ? <span className="font-semibold italic text-[#b4b0ff]">enum</span> : undefined);

  return (
    <MapSchemaFieldRowShell
      fieldPath={fieldPath}
      label={displayLabel}
      contentIndent={indent}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(MAP_SCHEMA_DRAG_MIME, fieldPath);
        event.dataTransfer.setData("text/plain", fieldPath);
        event.dataTransfer.effectAllowed = "copy";
        onDragStart?.(event, fieldPath);
      }}
    >
      <MapSchemaAttributeRowContent
        showMove
        showTreeBranch={false}
        label={displayLabel}
        typeSuffix={resolvedTypeSuffix}
      />
    </MapSchemaFieldRowShell>
  );
}

function MapSchemaRequiredTimeRow() {
  return (
    <MapSchemaDraggableFieldRow
      fieldPath="time"
      label="time*"
      indent={0}
      typeSuffix={
        <span className="font-semibold italic text-accent-required">required</span>
      }
    />
  );
}

function MapSchemaExpandCollapseButton({
  expanded,
  onToggle,
  label,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex size-3.5 shrink-0 items-center justify-center rounded p-0 text-text-tertiary hover:text-text-primary"
      aria-expanded={expanded}
      aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      {expanded ? (
        <Minus size={10} strokeWidth={2.5} className="block size-2.5" aria-hidden />
      ) : (
        <Plus size={10} strokeWidth={2.5} className="block size-2.5" aria-hidden />
      )}
    </button>
  );
}

function MapSchemaTreeBranchIcon() {
  return (
    <span
      className="inline-flex h-3.5 w-3 shrink-0 items-start justify-center text-border-rule [&>svg]:h-3.5 [&>svg]:w-3"
      dangerouslySetInnerHTML={{ __html: treeBranchSvg }}
      aria-hidden
    />
  );
}

function MapSchemaMoveSlot({ active }: { active: boolean }) {
  return (
    <span className={MAP_SCHEMA_MOVE_SLOT_CLASS} aria-hidden={!active}>
      {active ? <Icon name="action-drag-indicator" size={11} className="text-text-tertiary" /> : null}
    </span>
  );
}

function MapSchemaTreeSlot({ show }: { show: boolean }) {
  return <span className={MAP_SCHEMA_TREE_SLOT_CLASS}>{show ? <MapSchemaTreeBranchIcon /> : null}</span>;
}

function MapSchemaAttributeRowContent({
  showMove,
  showTreeBranch,
  labelClassName = "text-text-primary",
  label,
  typeSuffix,
  trailing,
  expand,
}: {
  showMove: boolean;
  showTreeBranch: boolean;
  labelClassName?: string;
  label: ReactNode;
  typeSuffix?: ReactNode;
  trailing?: ReactNode;
  expand?: { expanded: boolean; onToggle: () => void; label: string };
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      {showTreeBranch ? <MapSchemaTreeSlot show /> : null}
      {showMove ? <MapSchemaMoveSlot active /> : null}
      <span
        className={cx(
          "inline-flex min-w-0 items-center gap-1 text-xs font-semibold leading-4 tracking-[0.4px]",
          labelClassName,
        )}
      >
        <span className="truncate">{label}</span>
        {typeSuffix}
        {trailing}
      </span>
      {expand ? (
        <MapSchemaExpandCollapseButton
          expanded={expand.expanded}
          onToggle={expand.onToggle}
          label={expand.label}
        />
      ) : null}
    </div>
  );
}

function MapSchemaEnumValueFieldRow({
  fieldPath,
  value,
  indent,
}: {
  fieldPath: string;
  value: { id: number; label: string };
  indent: number;
}) {
  const displayLabel = `${value.id} - ${value.label.toLowerCase()}`;

  return (
    <MapSchemaFieldRowShell
      fieldPath={fieldPath}
      label={displayLabel}
      contentIndent={indent}
      draggable
      onDragStart={(event) => {
        const payload: MapSchemaEnumValueDragPayload = {
          fieldPath,
          id: value.id,
          label: value.label,
        };
        event.dataTransfer.setData(MAP_SCHEMA_ENUM_VALUE_MIME, JSON.stringify(payload));
        event.dataTransfer.setData(MAP_SCHEMA_DRAG_MIME, fieldPath);
        event.dataTransfer.setData("text/plain", enumValueMappingTag(value));
        event.dataTransfer.effectAllowed = "copy";
      }}
    >
      <MapSchemaAttributeRowContent
        showMove
        showTreeBranch
        labelClassName="text-text-secondary"
        label={displayLabel}
      />
    </MapSchemaFieldRowShell>
  );
}

function MapSchemaExpandableEnumFieldRow({
  fieldPath,
  label,
  indent = 0,
  showParentDrag = true,
  showTreeBranch = false,
  defaultExpanded = false,
  searchQuery = "",
}: {
  fieldPath: string;
  label?: string;
  indent?: number;
  showParentDrag?: boolean;
  showTreeBranch?: boolean;
  defaultExpanded?: boolean;
  searchQuery?: string;
}) {
  const query = searchQuery.trim().toLowerCase();
  const searching = query.length > 0;
  const [expanded, setExpanded] = useState(defaultExpanded || searching);
  const schema = useOcsfSchema();
  const displayLabel = label ?? formatOcsfPathLabel(fieldPath);
  const enumValues = schema.getEnumValues(fieldPath);
  const visibleEnumValues = useMemo(() => {
    if (!searching) return enumValues;
    const fieldMatches = ocsfPathMatchesSearch(fieldPath, query);
    if (fieldMatches) return enumValues;
    return enumValues.filter((value) => {
      const valueLabel = value.label.toLowerCase();
      return (
        valueLabel.includes(query) ||
        `${value.id} ${valueLabel}`.includes(query) ||
        String(value.id).includes(query)
      );
    });
  }, [enumValues, fieldPath, query, searching]);

  useEffect(() => {
    if (searching) setExpanded(true);
  }, [searching, query, fieldPath]);

  return (
    <>
      <MapSchemaFieldRowShell
        fieldPath={fieldPath}
        label={displayLabel}
        contentIndent={indent}
        draggable={showParentDrag}
        onDragStart={
          showParentDrag
            ? (event) => {
                event.dataTransfer.setData(MAP_SCHEMA_DRAG_MIME, fieldPath);
                event.dataTransfer.setData("text/plain", fieldPath);
                event.dataTransfer.effectAllowed = "copy";
              }
            : undefined
        }
      >
        <MapSchemaAttributeRowContent
          showMove={showParentDrag}
          showTreeBranch={showTreeBranch}
          label={displayLabel}
          typeSuffix={<span className="font-semibold italic text-[#b4b0ff]">enum</span>}
          expand={{
            expanded,
            onToggle: () => setExpanded((current) => !current),
            label: displayLabel,
          }}
        />
      </MapSchemaFieldRowShell>
      {expanded
        ? visibleEnumValues.map((value) => (
            <MapSchemaEnumValueFieldRow
              key={value.id}
              fieldPath={fieldPath}
              value={value}
              indent={indent + MAP_SCHEMA_TREE_INDENT_PX}
            />
          ))
        : null}
    </>
  );
}

function MapSchemaFieldRow({
  fieldPath,
  label,
  indent = 0,
  enumLabel,
}: {
  fieldPath: string;
  label?: string;
  indent?: number;
  enumLabel?: boolean;
}) {
  const schema = useOcsfSchema();
  if (schema.isEnumField(fieldPath) && schema.getEnumValues(fieldPath).length > 0) {
    return (
      <MapSchemaExpandableEnumFieldRow
        fieldPath={fieldPath}
        label={label}
        indent={indent}
      />
    );
  }

  if (schema.isArrayField(fieldPath) || schema.isShowAllObjectRoot(fieldPath)) {
    return (
      <MapSchemaFieldRowShell fieldPath={fieldPath} label={label ?? formatOcsfPathLabel(fieldPath)} contentIndent={indent}>
        <MapSchemaAttributeRowContent
          showMove={false}
          showTreeBranch={false}
          label={label ?? formatOcsfPathLabel(fieldPath)}
          typeSuffix={
            schema.isArrayField(fieldPath) ? (
              <span className="font-semibold italic text-datavis-data-smalt-green-40">array</span>
            ) : undefined
          }
        />
      </MapSchemaFieldRowShell>
    );
  }

  return (
    <MapSchemaDraggableFieldRow
      fieldPath={fieldPath}
      label={label}
      indent={indent}
      enumLabel={enumLabel ?? schema.isEnumField(fieldPath)}
    />
  );
}

type OcsfPathTreeNode = {
  segment: string;
  fullPath?: string;
  children: OcsfPathTreeNode[];
  isEnumValue?: boolean;
};

function resolveOcsfPathTreeChildren(node: OcsfPathTreeNode): OcsfPathTreeNode[] {
  return node.children;
}

function buildOcsfPathTree(paths: readonly string[]): OcsfPathTreeNode[] {
  type MutableNode = { segment: string; fullPath?: string; children: Map<string, MutableNode> };
  const root = new Map<string, MutableNode>();

  for (const path of paths) {
    const segments = path.split(".");
    let level = root;
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      if (!level.has(segment)) {
        level.set(segment, { segment, children: new Map() });
      }
      const node = level.get(segment)!;
      if (index === segments.length - 1) node.fullPath = path;
      level = node.children;
    }
  }

  const toArray = (map: Map<string, MutableNode>): OcsfPathTreeNode[] =>
    [...map.values()].map((node) => ({
      segment: node.segment,
      fullPath: node.fullPath,
      children: toArray(node.children),
    }));

  return toArray(root).sort((a, b) => a.segment.localeCompare(b.segment));
}

function sortOcsfPathTree(nodes: OcsfPathTreeNode[]): OcsfPathTreeNode[] {
  return [...nodes]
    .sort((a, b) => a.segment.localeCompare(b.segment))
    .map((node) => ({
      ...node,
      children: sortOcsfPathTree(node.children),
    }));
}

/** Collect every expandable node key so tree view can open fully by default. */
function collectExpandableOcsfPathKeys(
  nodes: readonly OcsfPathTreeNode[],
  pathKeyPrefix = "",
): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    const pathKey = pathKeyPrefix
      ? node.isEnumValue
        ? `${pathKeyPrefix}.__enum.${node.segment}`
        : `${pathKeyPrefix}.${node.segment}`
      : node.segment;
    const children = resolveOcsfPathTreeChildren(node);
    if (children.length > 0) {
      keys.push(pathKey);
      keys.push(...collectExpandableOcsfPathKeys(children, pathKey));
    }
  }
  return keys;
}

function MapSchemaFieldTypeSuffix({ fieldPath }: { fieldPath: string }) {
  const schema = useOcsfSchema();
  if (schema.isEnumField(fieldPath)) {
    return <span className="font-semibold italic text-[#b4b0ff]">enum</span>;
  }
  if (schema.isArrayField(fieldPath)) {
    return <span className="font-semibold italic text-datavis-data-smalt-green-40">array</span>;
  }
  return null;
}

function MapSchemaExpandablePathTreeRow({
  segment,
  fieldPath,
  depth,
  hasPathChildren,
  hasChildren,
  isExpanded,
  onToggleExpand,
  isEnumValue = false,
}: {
  segment: string;
  fieldPath: string;
  depth: number;
  hasPathChildren: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand?: () => void;
  isEnumValue?: boolean;
}) {
  const schema = useOcsfSchema();
  const label = isEnumValue ? segment : segment.toLowerCase();
  const isMappable =
    !hasChildren &&
    schema.isSimpleMappableField(fieldPath, {
      hasPathChildren,
      isEnumValue,
    });
  const showTypeSuffix =
    !isEnumValue &&
    (schema.isEnumField(fieldPath) || schema.isArrayField(fieldPath)) &&
    hasChildren;
  const contentIndent = depth * MAP_SCHEMA_TREE_INDENT_PX;

  return (
    <MapSchemaFieldRowShell
      fieldPath={fieldPath}
      label={label}
      contentIndent={contentIndent}
      draggable={isMappable}
      onDragStart={
        isMappable
          ? (event) => {
              event.dataTransfer.setData(MAP_SCHEMA_DRAG_MIME, fieldPath);
              event.dataTransfer.setData("text/plain", fieldPath);
              event.dataTransfer.effectAllowed = "copy";
            }
          : undefined
      }
    >
      <MapSchemaAttributeRowContent
        showMove={isMappable}
        showTreeBranch={depth > 0}
        labelClassName="text-text-secondary"
        label={label}
        typeSuffix={showTypeSuffix ? <MapSchemaFieldTypeSuffix fieldPath={fieldPath} /> : undefined}
        expand={
          hasChildren
            ? {
                expanded: isExpanded,
                onToggle: () => onToggleExpand?.(),
                label,
              }
            : undefined
        }
      />
    </MapSchemaFieldRowShell>
  );
}

function MapSchemaExpandablePathTreeBranch({
  node,
  depth,
  pathPrefix,
  pathKey,
  expandedPaths,
  onToggleExpand,
  searchQuery = "",
}: {
  node: OcsfPathTreeNode;
  depth: number;
  pathPrefix: readonly string[];
  pathKey: string;
  expandedPaths: ReadonlySet<string>;
  onToggleExpand: (pathKey: string) => void;
  searchQuery?: string;
}) {
  const schema = useOcsfSchema();
  const segments = [...pathPrefix, node.segment];
  const fieldPath = node.fullPath ?? segments.join(".").toLowerCase();
  const hasPathChildren = node.children.length > 0;

  if (
    !hasPathChildren &&
    schema.isEnumField(fieldPath) &&
    schema.getEnumValues(fieldPath).length > 0
  ) {
    return (
      <MapSchemaExpandableEnumFieldRow
        fieldPath={fieldPath}
        indent={depth * MAP_SCHEMA_TREE_INDENT_PX}
        showTreeBranch={depth > 0}
        defaultExpanded
        searchQuery={searchQuery}
      />
    );
  }

  const displayChildren = resolveOcsfPathTreeChildren(node);
  const hasChildren = displayChildren.length > 0;
  const isExpanded = expandedPaths.has(pathKey);

  return (
    <>
      <MapSchemaExpandablePathTreeRow
        segment={node.segment}
        fieldPath={fieldPath}
        depth={depth}
        hasPathChildren={hasPathChildren}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        onToggleExpand={hasChildren ? () => onToggleExpand(pathKey) : undefined}
        isEnumValue={node.isEnumValue}
      />
      {hasChildren && isExpanded
        ? displayChildren.map((child) => {
            const childPathKey = child.isEnumValue
              ? `${pathKey}.__enum.${child.segment}`
              : pathKey
                ? `${pathKey}.${child.segment}`
                : child.segment;
            return (
              <MapSchemaExpandablePathTreeBranch
                key={childPathKey}
                node={child}
                depth={depth + 1}
                pathPrefix={segments}
                pathKey={childPathKey}
                expandedPaths={expandedPaths}
                onToggleExpand={onToggleExpand}
                searchQuery={searchQuery}
              />
            );
          })
        : null}
    </>
  );
}

function MapSchemaExpandablePathTree({
  paths,
  className,
  defaultExpandAll = false,
  baseDepth = 0,
}: {
  paths: readonly string[];
  className?: string;
  defaultExpandAll?: boolean;
  baseDepth?: number;
}) {
  const tree = useMemo(() => sortOcsfPathTree(buildOcsfPathTree(paths)), [paths]);
  const allExpandableKeys = useMemo(() => collectExpandableOcsfPathKeys(tree), [tree]);
  const [expandedPaths, setExpandedPaths] = useState<ReadonlySet<string>>(
    () => (defaultExpandAll ? new Set(allExpandableKeys) : new Set()),
  );

  useEffect(() => {
    setExpandedPaths(defaultExpandAll ? new Set(allExpandableKeys) : new Set());
  }, [allExpandableKeys, defaultExpandAll]);

  const toggleExpanded = useCallback((pathKey: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(pathKey)) next.delete(pathKey);
      else next.add(pathKey);
      return next;
    });
  }, []);

  if (tree.length === 0) return null;

  return (
    <div className={cx("flex flex-col gap-px", className)}>
      {tree.map((node) => (
        <MapSchemaExpandablePathTreeBranch
          key={node.segment}
          node={node}
          pathPrefix={[]}
          pathKey={node.segment}
          depth={baseDepth}
          expandedPaths={expandedPaths}
          onToggleExpand={toggleExpanded}
        />
      ))}
    </div>
  );
}

function MapSchemaShowAllTypeSuffix({
  attribute,
}: {
  attribute: HttpActivityShowAllAttribute;
}) {
  const schema = useOcsfSchema();
  if (attribute.required) {
    return <span className="font-semibold italic text-accent-required">required</span>;
  }
  if (schema.isEnumField(attribute.name)) {
    return <span className="font-semibold italic text-[#b4b0ff]">enum</span>;
  }
  if (schema.isArrayField(attribute.name)) {
    return <span className="font-semibold italic text-datavis-data-smalt-green-40">array</span>;
  }
  return null;
}

function ocsfPathMatchesSearch(path: string, query: string): boolean {
  const q = query.toLowerCase();
  const lower = path.toLowerCase();
  if (lower.includes(q)) return true;
  return lower.split(".").some((segment) => segment.includes(q));
}

function ocsfEnumValuesMatchSearch(
  schema: OcsfSchemaAccessor,
  fieldPath: string,
  query: string,
): boolean {
  const q = query.toLowerCase();
  return schema.getEnumValues(fieldPath).some((value) => {
    const label = value.label.toLowerCase();
    return label.includes(q) || `${value.id} ${label}`.includes(q) || String(value.id).includes(q);
  });
}

/** Keep matching paths plus their ancestors so the tree still has context. */
function filterOcsfPathsForSearch(
  paths: readonly string[],
  query: string,
  schema: OcsfSchemaAccessor,
): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...paths];

  const matching = new Set<string>();
  for (const path of paths) {
    if (ocsfPathMatchesSearch(path, q) || ocsfEnumValuesMatchSearch(schema, path, q)) {
      matching.add(path);
    }
  }

  const keep = new Set<string>();
  for (const path of matching) {
    const parts = path.split(".");
    for (let i = 1; i <= parts.length; i += 1) {
      keep.add(parts.slice(0, i).join("."));
    }
  }
  return paths.filter((path) => keep.has(path));
}

function attributeMatchesSearch(
  attribute: HttpActivityShowAllAttribute,
  childPaths: readonly string[],
  schema: OcsfSchemaAccessor,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const label = (attribute.label ?? attribute.name).toLowerCase();
  if (label.includes(q) || attribute.name.toLowerCase().includes(q)) return true;
  if (ocsfEnumValuesMatchSearch(schema, attribute.name, q)) return true;
  return childPaths.some(
    (path) => ocsfPathMatchesSearch(path, q) || ocsfEnumValuesMatchSearch(schema, path, q),
  );
}

function MapSchemaAdvancedShowAllAttributeRow({
  attribute,
  childPaths,
  searchQuery = "",
}: {
  attribute: HttpActivityShowAllAttribute;
  childPaths: readonly string[];
  searchQuery?: string;
}) {
  const schema = useOcsfSchema();
  const query = searchQuery.trim().toLowerCase();
  const searching = query.length > 0;
  const rootMatches =
    !searching ||
    (attribute.label ?? attribute.name).toLowerCase().includes(query) ||
    attribute.name.toLowerCase().includes(query);
  const visibleChildPaths = useMemo(() => {
    if (!searching || rootMatches) return childPaths;
    return filterOcsfPathsForSearch(childPaths, query, schema);
  }, [childPaths, query, rootMatches, schema, searching]);

  const [expanded, setExpanded] = useState(searching);
  useEffect(() => {
    if (searching) setExpanded(true);
  }, [searching, query, attribute.name]);

  const displayLabel = attribute.label ?? attribute.name;
  const enumValues = schema.getEnumValues(attribute.name);
  const isEnum = schema.isEnumField(attribute.name) && enumValues.length > 0;
  const isArray = schema.isArrayField(attribute.name);
  const isObjectRoot = schema.isShowAllObjectRoot(attribute.name);
  const hasNestedPaths = visibleChildPaths.length > 0;
  const expandable = isEnum || isArray || isObjectRoot || hasNestedPaths;

  if (isEnum) {
    return (
      <MapSchemaExpandableEnumFieldRow
        fieldPath={attribute.name}
        label={displayLabel}
        indent={0}
        showTreeBranch={false}
        defaultExpanded={searching}
        searchQuery={searchQuery}
      />
    );
  }

  const isMappable = !isArray && !isObjectRoot && !hasNestedPaths && childPaths.length === 0;

  return (
    <>
      <MapSchemaFieldRowShell
        fieldPath={attribute.name}
        label={displayLabel}
        contentIndent={0}
        draggable={isMappable}
        onDragStart={
          isMappable
            ? (event) => {
                event.dataTransfer.setData(MAP_SCHEMA_DRAG_MIME, attribute.name);
                event.dataTransfer.setData("text/plain", attribute.name);
                event.dataTransfer.effectAllowed = "copy";
              }
            : undefined
        }
      >
        <MapSchemaAttributeRowContent
          showMove={isMappable}
          showTreeBranch={false}
          label={displayLabel}
          typeSuffix={<MapSchemaShowAllTypeSuffix attribute={attribute} />}
          expand={
            expandable
              ? {
                  expanded,
                  onToggle: () => setExpanded((value) => !value),
                  label: displayLabel,
                }
              : undefined
          }
        />
      </MapSchemaFieldRowShell>
      {expanded && hasNestedPaths ? (
        <MapSchemaShowAllNestedPaths
          rootName={attribute.name}
          paths={visibleChildPaths}
          searchQuery={searchQuery}
        />
      ) : null}
    </>
  );
}

function MapSchemaShowAllNestedPaths({
  rootName,
  paths,
  searchQuery = "",
}: {
  rootName: string;
  paths: readonly string[];
  searchQuery?: string;
}) {
  const tree = useMemo(() => sortOcsfPathTree(buildOcsfPathTree(paths)), [paths]);
  const root = tree.find((node) => node.segment === rootName);
  const children = root?.children ?? [];
  const allExpandableKeys = useMemo(
    () => collectExpandableOcsfPathKeys(children, rootName),
    [children, rootName],
  );
  const searching = searchQuery.trim().length > 0;
  const [expandedPaths, setExpandedPaths] = useState<ReadonlySet<string>>(
    () => (searching ? new Set(allExpandableKeys) : new Set()),
  );

  useEffect(() => {
    setExpandedPaths(searching ? new Set(allExpandableKeys) : new Set());
  }, [allExpandableKeys, searching, searchQuery]);

  const toggleExpanded = useCallback((pathKey: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(pathKey)) next.delete(pathKey);
      else next.add(pathKey);
      return next;
    });
  }, []);

  if (children.length === 0) return null;

  return (
    <>
      {children.map((node) => (
        <MapSchemaExpandablePathTreeBranch
          key={node.segment}
          node={node}
          pathPrefix={[rootName]}
          pathKey={`${rootName}.${node.segment}`}
          depth={1}
          expandedPaths={expandedPaths}
          onToggleExpand={toggleExpanded}
          searchQuery={searchQuery}
        />
      ))}
    </>
  );
}

function MapSchemaAdvancedShowAllList({
  searchQuery,
  attributesFilter,
  isLoading = false,
}: {
  searchQuery: string;
  attributesFilter: MapSchemaAttributesFilter;
  isLoading?: boolean;
}) {
  const schema = useOcsfSchema();
  const attributes = useMemo(() => schema.getShowAllAttributes(), [schema]);
  const fullSchemaPaths = useMemo(() => schema.getFullSchemaPaths(), [schema]);

  const childPathsByRoot = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const path of fullSchemaPaths) {
      const root = path.split(".")[0] ?? path;
      if (path === root) continue;
      const existing = map.get(root) ?? [];
      existing.push(path);
      map.set(root, existing);
    }
    return map;
  }, [fullSchemaPaths]);

  const filteredAttributes = useMemo(() => {
    // `time*` is always pinned above this list — skip the duplicate schema entry.
    const byFilter = attributes.filter(
      (attribute) => attribute.name !== "time" && matchesAttributesFilter(attribute, attributesFilter, schema),
    );
    const query = searchQuery.trim();
    if (!query) return byFilter;
    return byFilter.filter((attribute) =>
      attributeMatchesSearch(attribute, childPathsByRoot.get(attribute.name) ?? [], schema, query),
    );
  }, [attributes, attributesFilter, childPathsByRoot, schema, searchQuery]);

  return (
    <div className="flex flex-col gap-px">
      {isLoading ? (
        <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-text-tertiary">
          <Loader2 size={14} strokeWidth={2} className="size-3.5 shrink-0 animate-spin" aria-hidden />
          Loading schema…
        </div>
      ) : filteredAttributes.length === 0 ? (
        <p className="px-2 py-2 text-xs font-semibold text-text-tertiary">No attributes match this filter.</p>
      ) : (
        filteredAttributes.map((attribute) => (
          <MapSchemaAdvancedShowAllAttributeRow
            key={attribute.name}
            attribute={attribute}
            childPaths={childPathsByRoot.get(attribute.name) ?? []}
            searchQuery={searchQuery}
          />
        ))
      )}
    </div>
  );
}

type MapSchemaAttributesFilter =
  | "classification"
  | "occurrence"
  | "context"
  | "primary"
  | "showAll"
  | "showAllEnums"
  | "showStringArrays"
  | "showObjectArrays";

const MAP_SCHEMA_ATTRIBUTES_FILTER_OPTIONS: {
  id: MapSchemaAttributesFilter;
  label: string;
  description: string;
}[] = [
  {
    id: "classification",
    label: "Classification",
    description: "Taxonomy attributes that identify the event class and activity.",
  },
  {
    id: "occurrence",
    label: "Occurrence",
    description: "Time and count attributes that describe when the event happened.",
  },
  {
    id: "context",
    label: "Context",
    description: "Enrichment and auxiliary attributes that add supporting detail.",
  },
  {
    id: "primary",
    label: "Primary",
    description: "Core semantic attributes for this event class.",
  },
  {
    id: "showAll",
    label: "Show All",
    description: "Show every top-level OCSF attribute for this event class.",
  },
  {
    id: "showAllEnums",
    label: "Show All Enums",
    description: "Show only enum attributes and their selectable values.",
  },
  {
    id: "showStringArrays",
    label: "Show String Arrays",
    description: "Show only attributes typed as string arrays.",
  },
  {
    id: "showObjectArrays",
    label: "Show Object Arrays",
    description: "Show only attributes typed as object arrays.",
  },
];

function matchesAttributesFilter(
  attribute: HttpActivityShowAllAttribute,
  filter: MapSchemaAttributesFilter,
  schema: OcsfSchemaAccessor,
): boolean {
  switch (filter) {
    case "classification":
    case "occurrence":
    case "context":
    case "primary":
      return attribute.group === filter;
    case "showAll":
      return true;
    case "showAllEnums":
      return schema.isEnumField(attribute.name);
    case "showStringArrays":
      return schema.isStringArrayField(attribute.name);
    case "showObjectArrays":
      return schema.isObjectArrayField(attribute.name);
    default:
      return true;
  }
}

function MapSchemaAttributesFilterControl({
  value,
  onChange,
}: {
  value: MapSchemaAttributesFilter;
  onChange: (next: MapSchemaAttributesFilter) => void;
}) {
  const selected =
    MAP_SCHEMA_ATTRIBUTES_FILTER_OPTIONS.find((option) => option.id === value) ??
    MAP_SCHEMA_ATTRIBUTES_FILTER_OPTIONS.find((option) => option.id === "showAll")!;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="focus-ring-none flex min-w-0 items-center gap-1 rounded border border-transparent py-0.5 text-left text-sm font-semibold leading-[18px] hover:bg-overlay-subtle"
            aria-haspopup="listbox"
            aria-label={`Attributes filter: ${selected.label}`}
          >
            <span className="text-text-primary">Attributes:</span>
            <span className="text-interactive-active">{selected.label}</span>
            <Icon name="chevron-down" size={12} className="ml-0.5 shrink-0 text-interactive-active" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[220px] rounded-[4px] border-0 bg-surface-modal p-1 text-text-primary shadow-[0_3px_14px_2px_rgba(0,0,0,0.12),0_8px_10px_1px_rgba(0,0,0,0.14),0_5px_5px_-3px_rgba(0,0,0,0.2),0_4px_4px_0_rgba(0,0,0,0.25)] ring-0"
        >
          {MAP_SCHEMA_ATTRIBUTES_FILTER_OPTIONS.map((option) => {
            const isSelected = option.id === value;
            return (
              <DropdownMenuItem
                key={option.id}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-none px-3 py-2.5 pr-4 focus:bg-overlay-subtle"
                onSelect={() => onChange(option.id)}
              >
                <span className="inline-flex size-[18px] shrink-0 items-center justify-center" aria-hidden>
                  {isSelected ? (
                    <Icon name="action-check" size={18} className="text-interactive-active" />
                  ) : null}
                </span>
                <span
                  className={cx(
                    "text-sm font-semibold leading-[14px] tracking-[0.4px]",
                    isSelected ? "text-interactive-active" : "text-text-secondary",
                  )}
                >
                  {option.label}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-secondary data-[state=delayed-open]:bg-overlay-subtle data-[state=delayed-open]:text-text-primary data-[state=instant-open]:bg-overlay-subtle data-[state=instant-open]:text-text-primary"
            aria-label="About attributes filter"
          >
            <Info size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          sideOffset={8}
          showArrow={false}
          className="max-w-[280px] rounded border border-border-container bg-surface-modal px-3 py-2 text-base-small text-text-primary shadow-none"
        >
          {selected.description}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function MapSchemaEntityOcsfPathTree({ paths }: { paths: readonly string[] }) {
  return <MapSchemaExpandablePathTree paths={paths} defaultExpandAll />;
}

function TargetMappingDropZone({
  source,
  onMapField,
  onMapEnumValue,
  onClearAll,
  showClearAll,
  acceptDrops = true,
  contentIndent = 0,
  children,
}: {
  source: string;
  onMapField: (source: string, fieldPath: string) => void;
  onMapEnumValue?: (source: string, value: MapSchemaEnumValueDragPayload) => void;
  onClearAll?: () => void;
  showClearAll?: boolean;
  acceptDrops?: boolean;
  contentIndent?: number;
  children: ReactNode;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        if (!acceptDrops) return;
        const types = event.dataTransfer.types;
        if (!types.includes(MAP_SCHEMA_DRAG_MIME) && !types.includes(MAP_SCHEMA_ENUM_VALUE_MIME)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        if (!acceptDrops) return;
        event.preventDefault();
        setIsDragOver(false);
        const enumRaw = event.dataTransfer.getData(MAP_SCHEMA_ENUM_VALUE_MIME);
        const enumPayload = enumRaw ? parseEnumValueDragPayload(enumRaw) : null;
        if (enumPayload && onMapEnumValue) {
          onMapEnumValue(source, enumPayload);
          return;
        }
        const fieldPath = event.dataTransfer.getData(MAP_SCHEMA_DRAG_MIME);
        if (fieldPath) onMapField(source, fieldPath);
      }}
      className={cx(
        "flex h-full min-h-7 w-full min-w-0 items-center gap-1 rounded border px-3 py-1 transition-shadow",
        acceptDrops ? "border-border-rule bg-surface-modal" : "border-border-rule/50 bg-surface-modal/70",
        isDragOver && acceptDrops && "ring-2 ring-inset ring-interactive-active",
      )}
      style={contentIndent > 0 ? { paddingLeft: contentIndent } : undefined}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1">{children}</div>
      {showClearAll ? (
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-primary"
          aria-label="Clear all mappings"
          onClick={(event) => {
            event.stopPropagation();
            onClearAll?.();
          }}
        >
          <CircleX size={16} strokeWidth={1.5} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function MapSchemaEntityRow({
  entity,
  expanded,
  onToggle,
  treeView,
}: {
  entity: MapSchemaEntity;
  expanded: boolean;
  onToggle: () => void;
  treeView: boolean;
}) {
  const expandable = entity.paths.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={expandable ? onToggle : undefined}
        aria-expanded={expandable ? expanded : undefined}
        disabled={!expandable}
        className={cx(
          "flex h-7 w-full min-w-0 items-center gap-2 rounded py-1 text-left",
          expandable && "hover:bg-overlay-subtle",
          !expandable && "cursor-default",
        )}
      >
        <MapSchemaFieldInfoPopover
          label={entity.label}
          description={getOcsfEntityCategoryDescription(entity)}
        />
        <Icon
          name="chevron-down"
          size={12}
          className={cx(
            "shrink-0 text-text-primary transition-transform duration-150",
            !expanded && "-rotate-90",
            !expandable && "opacity-0",
          )}
          aria-hidden
        />
        <span className="min-w-0 truncate text-xs font-semibold leading-4 tracking-[0.4px] text-text-primary">
          {entity.label}
        </span>
      </button>
      {expanded && expandable
        ? treeView ? (
            <MapSchemaEntityOcsfPathTree paths={entity.paths} />
          ) : (
            entity.paths.map((path) => <MapSchemaFieldRow key={path} fieldPath={path} indent={24} />)
          )
        : null}
    </>
  );
}

function MapSchemaRecommendedFieldRow({ row }: { row: MapSchemaRecommendedRow }) {
  return (
    <MapSchemaFieldRow
      fieldPath={row.name}
      label={row.name}
      indent={0}
      enumLabel={row.kind === "field" ? row.enum : undefined}
    />
  );
}

type MapSchemaMode = "basic" | "advanced";

const MAP_SCHEMA_MODE_OPTIONS: {
  id: MapSchemaMode;
  label: string;
  description: string;
}[] = [
  {
    id: "basic",
    label: "Basic Mode",
    description: "Observable entities and recommended fields to get started quickly.",
  },
  {
    id: "advanced",
    label: "Advanced Mode",
    description: "Full OCSF schema with every mappable field on the event class.",
  },
];

function MapSchemaModeDropdown({
  mode,
  onModeChange,
}: {
  mode: MapSchemaMode;
  onModeChange: (next: MapSchemaMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = MAP_SCHEMA_MODE_OPTIONS.find((option) => option.id === mode) ?? MAP_SCHEMA_MODE_OPTIONS[0]!;

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Map schema mode: ${selected.label}`}
          aria-expanded={open}
          className={cx(
            "group relative flex h-7 min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden rounded-full border px-3 text-left",
            "transition-[border-color,background-color,color,box-shadow,transform] duration-200 ease-out",
            "border-border-container bg-surface-container text-text-secondary hover:text-text-primary",
            open &&
              "border-interactive-active bg-surface-modal text-text-primary shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-interactive-active)_45%,transparent),0_8px_20px_-8px_rgba(0,0,0,0.45)]",
          )}
        >
          <span
            aria-hidden
            className={cx(
              "pointer-events-none absolute inset-y-0 left-0 w-0.5 rounded-full bg-interactive-active transition-[opacity,transform] duration-300 ease-out",
              open ? "opacity-100" : "opacity-0 -translate-x-1",
            )}
          />
          <span className="min-w-0 truncate text-[14px] font-bold leading-5 tracking-[0.4px] transition-colors duration-200">
            {selected.label}
          </span>
          <Icon
            name="chevron-down"
            size={20}
            className={cx(
              "shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              open && "rotate-180 text-interactive-active",
            )}
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className={cx(
          "map-schema-mode-menu w-[min(360px,calc(100vw-2.5rem))] overflow-hidden rounded-lg p-1.5 text-text-primary ring-0",
          "border border-interactive-active/35 bg-surface-modal",
          "shadow-[0_12px_28px_-8px_rgba(0,0,0,0.55),0_0_0_1px_color-mix(in_srgb,var(--color-interactive-active)_20%,transparent)]",
          /* Override default shadcn open/close animations — custom keyframes handle motion. */
          "data-open:!animate-none data-closed:!animate-none",
        )}
      >
        {MAP_SCHEMA_MODE_OPTIONS.map((option) => {
          const isSelected = option.id === mode;
          return (
            <DropdownMenuItem
              key={option.id}
              className={cx(
                "map-schema-mode-item flex cursor-pointer flex-col items-start gap-1 rounded-md px-3 py-2.5",
                "outline-none transition-colors duration-150 focus:bg-overlay-subtle",
                isSelected && "bg-interactive-selected/40",
              )}
              onSelect={() => onModeChange(option.id)}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={cx(
                    "text-sm font-semibold leading-[18px] transition-colors",
                    isSelected ? "text-interactive-active" : "text-text-secondary",
                  )}
                >
                  {option.label}
                </span>
                <span
                  className={cx(
                    "flex size-4 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                    isSelected
                      ? "bg-interactive-active/15 text-interactive-active scale-100 opacity-100"
                      : "scale-75 opacity-0",
                  )}
                  aria-hidden
                >
                  <Icon name="action-check" size={12} />
                </span>
              </div>
              <span className="text-xs font-normal leading-4 text-text-tertiary">{option.description}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MapSchemaSectionCaret({ open }: { open: boolean }) {
  return (
    <Icon
      name="navi-arrow-drop-down"
      size={23}
      className={cx("shrink-0 transition-transform duration-150", !open && "-rotate-90")}
      aria-hidden
    />
  );
}

function MapSchemaOverviewCard({
  eventClassId,
  mode,
  onModeChange,
  layoutResetKey = 0,
}: {
  eventClassId: string;
  mode: MapSchemaMode;
  onModeChange: (next: MapSchemaMode) => void;
  /** Bumps after Copilot maps so Basic layout resets (entities collapsed, recommended open). */
  layoutResetKey?: number;
}) {
  const [treeView, setTreeView] = useState(false);
  const [entitiesOpen, setEntitiesOpen] = useState(false);
  const [recommendedOpen, setRecommendedOpen] = useState(true);
  const [expandedEntityIds, setExpandedEntityIds] = useState<ReadonlySet<string>>(() => new Set());
  const [attributeSearchQuery, setAttributeSearchQuery] = useState("");
  const [attributesFilter, setAttributesFilter] = useState<MapSchemaAttributesFilter>("showAll");

  const selectedEventClass = searchEventById(eventClassId);

  const { accessor: schemaAccessor, isLoading: schemaLoading } = useOcsfSchemaAccessor(eventClassId);
  const mapSchemaEntities: readonly MapSchemaEntity[] = schemaAccessor.entities;

  const isAdvanced = mode === "advanced";

  useEffect(() => {
    setExpandedEntityIds(new Set());
    setTreeView(false);
    setAttributeSearchQuery("");
    setAttributesFilter("showAll");
    setEntitiesOpen(false);
    setRecommendedOpen(true);
  }, [eventClassId]);

  useEffect(() => {
    if (layoutResetKey === 0) return;
    setEntitiesOpen(false);
    setRecommendedOpen(true);
    setTreeView(false);
    setExpandedEntityIds(new Set());
    setAttributeSearchQuery("");
    setAttributesFilter("showAll");
  }, [layoutResetKey]);

  useEffect(() => {
    if (!isAdvanced) {
      setAttributeSearchQuery("");
      setAttributesFilter("showAll");
    }
  }, [isAdvanced]);

  const toggleEntity = useCallback((entityId: string) => {
    setExpandedEntityIds((current) => {
      const next = new Set(current);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      return next;
    });
  }, []);

  const handleEntitiesOpenChange = useCallback((open: boolean) => {
    setEntitiesOpen(open);
    if (!open) {
      setTreeView(false);
      setExpandedEntityIds(new Set());
    }
  }, []);

  const handleTreeViewChange = useCallback(
    (checked: boolean) => {
      setTreeView(checked);
      if (checked) {
        setExpandedEntityIds(new Set(mapSchemaEntities.map((entity) => entity.id)));
      }
    },
    [mapSchemaEntities],
  );

  const attributeSearchNormalized = attributeSearchQuery.trim().toLowerCase();
  const isSearchingAttributes = attributeSearchNormalized.length > 0;

  const filteredEntities = useMemo(() => {
    if (!isSearchingAttributes) return mapSchemaEntities;
    return mapSchemaEntities
      .map((entity) => {
        const labelMatches = entity.label.toLowerCase().includes(attributeSearchNormalized);
        if (labelMatches) return entity;
        const paths = entity.paths.filter(
          (path) =>
            ocsfPathMatchesSearch(path, attributeSearchNormalized) ||
            ocsfEnumValuesMatchSearch(schemaAccessor, path, attributeSearchNormalized),
        );
        return paths.length > 0 ? { ...entity, paths } : null;
      })
      .filter((entity): entity is MapSchemaEntity => entity != null);
  }, [attributeSearchNormalized, isSearchingAttributes, mapSchemaEntities, schemaAccessor]);

  const filteredRecommended = useMemo(() => {
    if (!isSearchingAttributes) return MAP_SCHEMA_RECOMMENDED;
    return MAP_SCHEMA_RECOMMENDED.filter((row) =>
      row.name.toLowerCase().includes(attributeSearchNormalized),
    );
  }, [attributeSearchNormalized, isSearchingAttributes]);

  useEffect(() => {
    if (!isSearchingAttributes || isAdvanced) return;
    setEntitiesOpen(true);
    setRecommendedOpen(true);
    setExpandedEntityIds(new Set(filteredEntities.map((entity) => entity.id)));
  }, [filteredEntities, isAdvanced, isSearchingAttributes, attributeSearchNormalized]);

  return (
    <TooltipProvider delayDuration={200}>
      <OcsfSchemaAccessorContext.Provider value={schemaAccessor}>
      <div className="flex min-h-0 flex-1 flex-col rounded border border-border-rule bg-surface-modal px-4 pt-2 pb-3">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0">
          <div className="flex shrink-0 items-center gap-2">
            <p className="shrink-0 text-[12px] font-bold uppercase leading-[14px] tracking-[0.4px] text-text-tertiary">
              MAP Schema
            </p>
            <MapSchemaModeDropdown mode={mode} onModeChange={onModeChange} />
          </div>
          <div className="mt-4">
            <p className="text-left text-[14px] font-bold leading-5 tracking-[0.4px] text-text-primary">
              {selectedEventClass?.label ?? "Event class"}
            </p>
          </div>
        </div>

        <div key={mode} className="map-schema-mode-body mt-3 flex min-h-0 flex-1 flex-col">
          {isAdvanced ? (
            <div className="shrink-0 border-t border-border-rule pt-3">
              <MapSchemaAttributesFilterControl value={attributesFilter} onChange={setAttributesFilter} />
            </div>
          ) : null}
          <div className={cx("shrink-0", isAdvanced ? "mt-3" : "border-t border-border-rule pt-3")}>
            <div className="w-full min-w-0">
              <Input
                variant="search"
                placeholder="Search attributes"
                value={attributeSearchQuery}
                onChange={(event) => setAttributeSearchQuery(event.target.value)}
                onClear={() => setAttributeSearchQuery("")}
                aria-label="Search attributes"
              />
            </div>
          </div>
          <div className="mt-3 shrink-0">
            <MapSchemaRequiredTimeRow />
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-px">
              {isAdvanced ? (
                <MapSchemaAdvancedShowAllList
                  searchQuery={attributeSearchQuery}
                  attributesFilter={attributesFilter}
                  isLoading={schemaLoading}
                />
              ) : (
                <>
                  <div className="flex h-7 w-full min-h-7 flex-wrap items-center gap-2 py-1">
                    <button
                      type="button"
                      onClick={() => handleEntitiesOpenChange(!entitiesOpen)}
                      aria-expanded={entitiesOpen}
                      className="flex min-w-0 shrink-0 items-center gap-2 rounded py-0.5 pr-1 text-left text-text-primary hover:bg-overlay-subtle"
                    >
                      <MapSchemaSectionCaret open={entitiesOpen} />
                      <span className="text-xs font-semibold uppercase leading-4 tracking-[0.4px]">Entities</span>
                    </button>
                    <span className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 pl-2">
                      <Checkbox
                        checked={treeView}
                        onCheckedChange={handleTreeViewChange}
                        label="Show As Tree View"
                        labelClassName="text-base-small text-text-secondary"
                      />
                    </span>
                  </div>

                  {entitiesOpen
                    ? filteredEntities.length === 0 && isSearchingAttributes
                      ? (
                          <p className="px-2 py-2 text-xs font-semibold text-text-tertiary">
                            No entities match this search.
                          </p>
                        )
                      : filteredEntities.map((entity) => (
                        <MapSchemaEntityRow
                          key={entity.id}
                          entity={entity}
                          expanded={expandedEntityIds.has(entity.id)}
                          onToggle={() => toggleEntity(entity.id)}
                          treeView={treeView}
                        />
                      ))
                    : null}

                  <div className="flex h-7 w-full min-h-7 items-center gap-2 py-1">
                    <button
                      type="button"
                      onClick={() => setRecommendedOpen((v) => !v)}
                      aria-expanded={recommendedOpen}
                      className="flex min-w-0 items-center gap-2 rounded py-0.5 pr-1 text-left text-text-primary hover:bg-overlay-subtle"
                    >
                      <MapSchemaSectionCaret open={recommendedOpen} />
                      <span className="text-xs font-semibold uppercase leading-4 tracking-[0.4px]">Recommended</span>
                    </button>
                  </div>
                  {recommendedOpen
                    ? filteredRecommended.length === 0 && isSearchingAttributes
                      ? (
                          <p className="px-2 py-2 text-xs font-semibold text-text-tertiary">
                            No recommended fields match this search.
                          </p>
                        )
                      : filteredRecommended.map((row, i) => (
                        <MapSchemaRecommendedFieldRow key={`${row.kind}-${"name" in row ? row.name : i}`} row={row} />
                      ))
                    : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
      </OcsfSchemaAccessorContext.Provider>
    </TooltipProvider>
  );
}

type AiAssistedMappingSettings = {
  suggestEventClass: boolean;
  suggestMappingsForEventClass: boolean;
};

const DEFAULT_AI_ASSISTED_MAPPING_SETTINGS: AiAssistedMappingSettings = {
  suggestEventClass: true,
  suggestMappingsForEventClass: true,
};

function AiAssistedMappingControl({
  settings,
  onSuggest,
  isMapping = false,
  enabled,
  onEnabledChange,
}: {
  settings: AiAssistedMappingSettings;
  onSuggest: (next: AiAssistedMappingSettings) => void;
  isMapping?: boolean;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(settings);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (!enabled) return;
      setDraft(settings);
    }
    setOpen(nextOpen);
  };

  const applyDraft = () => {
    onSuggest(draft);
    setOpen(false);
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Switch
        checked={enabled}
        onCheckedChange={(checked) => {
          onEnabledChange(checked);
          if (!checked) setOpen(false);
        }}
        id="copilot-mapping-enabled"
      />
      <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!enabled}
            className="focus-ring-none group h-7 gap-1.5 px-0 font-semibold text-text-primary hover:bg-transparent disabled:opacity-60"
            aria-label="Copilot mapping options"
          >
            <CopilotSparkMark className="size-[21.6px] transition-[filter] duration-150 group-hover:brightness-125 group-disabled:brightness-100" />
            <span className="text-[0.96rem] transition-colors group-hover:text-interactive-active">Copilot</span>
            <Icon name="chevron-down" size={16} className="shrink-0 text-text-secondary transition-colors group-hover:text-interactive-active" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[min(360px,calc(100vw-2.5rem))] rounded-[4px] border border-border-container bg-surface-modal p-4 text-text-primary shadow-[0_3px_14px_2px_rgba(0,0,0,0.12),0_8px_10px_1px_rgba(0,0,0,0.14),0_5px_5px_-3px_rgba(0,0,0,0.2)] ring-0"
          onCloseAutoFocus={(event) => event.preventDefault()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div role="dialog" aria-label="AI assisted mapping">
            <p className="text-sm italic leading-[18px] text-text-tertiary">
              AI assisted mapping will make best suggestions to help you quickly map your data...
            </p>
            <div className="mt-4 space-y-3">
              <Switch
                checked={draft.suggestEventClass}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({
                    ...current,
                    suggestEventClass: checked,
                    suggestMappingsForEventClass: checked ? current.suggestMappingsForEventClass : false,
                  }))
                }
                label="Suggest Event Class"
                labelClassName={
                  draft.suggestEventClass ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                }
              />
              <Switch
                checked={draft.suggestMappingsForEventClass}
                disabled={!draft.suggestEventClass}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({ ...current, suggestMappingsForEventClass: checked }))
                }
                label="Suggest Mappings for Event Class"
                labelClassName={
                  !draft.suggestEventClass
                    ? "text-text-disabled"
                    : draft.suggestMappingsForEventClass
                      ? "text-text-primary"
                      : "text-text-tertiary hover:text-text-secondary"
                }
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary-outline" size="sm" className="h-8" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="default" size="sm" className="h-8" onClick={applyDraft}>
                Suggest
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {isMapping ? (
        <Loader2
          size={16}
          strokeWidth={2}
          className="size-4 shrink-0 animate-spin text-interactive-active"
          aria-label="AI assisted mapping in progress"
        />
      ) : null}
    </div>
  );
}

function MappingToolbarV2({
  hasMappedFields,
  selectedEventClassId,
  onEventClassChange,
  isAiMapping,
  aiAssistedMappingSettings,
  onAiAssistedMappingSuggest,
  copilotEnabled,
  onCopilotEnabledChange,
  showGettingStarted,
  showAdvancedCallout,
  allowAutosave,
  onAllowAutosaveChange,
}: {
  hasMappedFields: boolean;
  selectedEventClassId: string;
  onEventClassChange: (eventClassId: string) => void;
  isAiMapping: boolean;
  aiAssistedMappingSettings: AiAssistedMappingSettings;
  onAiAssistedMappingSuggest: (settings: AiAssistedMappingSettings) => void;
  copilotEnabled: boolean;
  onCopilotEnabledChange: (enabled: boolean) => void;
  showGettingStarted: boolean;
  showAdvancedCallout: boolean;
  allowAutosave: boolean;
  onAllowAutosaveChange: (allow: boolean) => void;
}) {
  return (
    <TooltipProvider delayDuration={200}>
    <div className="bg-surface-modal">
      {showGettingStarted ? (
        <p className="mb-4 text-sm italic leading-[18px] text-text-tertiary">{MAP_REVIEW_GETTING_STARTED}</p>
      ) : null}
      {showAdvancedCallout ? (
        <p className="mb-4 text-base-semibold italic text-text-tertiary">{ADVANCED_MODE_CALLOUT}</p>
      ) : null}
      <p className="text-base-semibold text-text-primary">Event Class to Map</p>
      <div className="mt-2 flex min-h-[32px] flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <SearchEventClassPicker value={selectedEventClassId} onChange={onEventClassChange} />
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-secondary data-[state=delayed-open]:bg-overlay-subtle data-[state=delayed-open]:text-text-primary data-[state=instant-open]:bg-overlay-subtle data-[state=instant-open]:text-text-primary"
                aria-label="About event class"
              >
                <Info size={16} strokeWidth={1.5} aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              sideOffset={8}
              showArrow={false}
              className="max-w-[280px] rounded border border-border-container bg-surface-modal px-3 py-2 text-base-small text-text-primary shadow-none"
            >
              This class captures granular details of HTTP communications, enabling cross-source analysis for
              threat detection and network observability.
            </TooltipContent>
          </Tooltip>
          <AiAssistedMappingControl
            settings={aiAssistedMappingSettings}
            onSuggest={onAiAssistedMappingSuggest}
            isMapping={isAiMapping}
            enabled={copilotEnabled}
            onEnabledChange={onCopilotEnabledChange}
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2">
          <Switch
            checked={allowAutosave}
            onCheckedChange={onAllowAutosaveChange}
            label="Allow Autosave"
            labelClassName={
              allowAutosave ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
            }
          />
          <Button
            variant="ghost"
            disabled={!hasMappedFields}
            className="gap-1 text-sm font-semibold text-text-secondary hover:bg-overlay-subtle hover:text-text-primary"
          >
            <CircleX size={16} strokeWidth={1.5} aria-hidden />
            Clear All Mappings
          </Button>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}

function FieldMappingBar({
  rows,
  mapVisibility,
  onMapVisibilityChange,
  showHiddenFields,
  onShowHiddenFieldsChange,
  hasHiddenFields,
  hasMappedFields,
  onClearHiddenFields,
  sourceSearchQuery,
  onSourceSearchQueryChange,
  isAiMapping,
  table,
}: {
  rows: MappingRow[];
  mapVisibility: MapVisibilityMode;
  onMapVisibilityChange: (next: MapVisibilityMode) => void;
  showHiddenFields: boolean;
  onShowHiddenFieldsChange: (checked: boolean) => void;
  hasHiddenFields: boolean;
  hasMappedFields: boolean;
  onClearHiddenFields: () => void;
  sourceSearchQuery: string;
  onSourceSearchQueryChange: (query: string) => void;
  isAiMapping: boolean;
  table: ReactNode;
}) {
  const mapped = rows.filter(isMappedRow).length;
  return (
    <TooltipProvider delayDuration={200}>
    <div
      className={cx(
        "flex min-h-0 min-w-0 flex-1 flex-col bg-surface-modal px-0 py-4 transition-opacity duration-200",
        isAiMapping && "pointer-events-none opacity-60",
      )}
      aria-busy={isAiMapping || undefined}
    >
      <div className="shrink-0 overflow-visible px-1">
        <p className="mb-3 text-sm font-semibold text-text-secondary">
          Mapped Fields: <span className="text-text-primary">{mapped}</span>
        </p>
        <div className="grid w-full min-w-0 grid-cols-1 gap-y-3 md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] md:gap-x-0">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-[16px] md:min-w-0">
            <p className="min-w-0 text-sm font-semibold leading-[18px]">
              <span className="text-text-primary">Source: </span>
              <span className="text-text-secondary">sample-securitystuff-schema-this-long</span>
            </p>
            <p className="shrink-0 text-xs font-semibold italic leading-[18px] tracking-wide text-text-tertiary">
              Sample data shown*
            </p>
          </div>
          <div className="hidden md:block" aria-hidden />
          <div className="flex min-w-0 flex-wrap items-center justify-start gap-2">
            <p className="text-sm font-semibold leading-[18px]">
              <span className="text-text-primary">Target: </span>
              <span className="text-text-secondary">Query Data Model</span>
            </p>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-secondary data-[state=delayed-open]:bg-overlay-subtle data-[state=delayed-open]:text-text-primary data-[state=instant-open]:bg-overlay-subtle data-[state=instant-open]:text-text-primary"
                  aria-label="About query data model"
                >
                  <Info size={16} strokeWidth={1.5} aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                sideOffset={8}
                showArrow={false}
                className="max-w-[320px] rounded border border-border-container bg-surface-modal px-3 py-2 text-base-small text-text-primary shadow-none"
              >
                Query’s Data Model (QDM) is based on the Open Cybersecurity Schema Framework (OCSF). QDM aims to
                standardize cybersecurity data representation across diverse tools and platforms, facilitating more
                effective threat hunting and incident response processes.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex min-w-0 items-center gap-3 md:min-w-0">
            <div className="w-[240px] shrink-0">
              <Input
                variant="search"
                placeholder="Search source fields"
                value={sourceSearchQuery}
                onChange={(event) => onSourceSearchQueryChange(event.target.value)}
                onClear={() => onSourceSearchQueryChange("")}
                aria-label="Search source fields"
              />
            </div>
            <Switch
              checked={showHiddenFields}
              disabled={!hasHiddenFields}
              onCheckedChange={onShowHiddenFieldsChange}
              label="Show Hidden Fields"
              labelClassName={
                showHiddenFields ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
              }
            />
            {hasHiddenFields ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onClearHiddenFields}
                className="ml-auto gap-1 px-0 text-sm font-semibold text-text-secondary hover:bg-transparent hover:text-text-primary"
              >
                <CircleX size={16} strokeWidth={1.5} aria-hidden />
                Clear All Hidden Fields
              </Button>
            ) : null}
          </div>
          <div className="hidden md:block" aria-hidden />
          <div className="flex min-w-0 items-center justify-start">
            <MapVisibilityTrimode
              value={mapVisibility}
              onChange={onMapVisibilityChange}
              disabled={!hasMappedFields}
            />
          </div>
        </div>
      </div>
      <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto px-1 pb-28 pt-2">{table}</div>
    </div>
    </TooltipProvider>
  );
}

/** Amazon Athena connector wizard Step 3 — Map & Review Data (Config-Schema-v2). */
export function AmazonAthenaMapReviewStep({
  connectorId,
  onHasMappedFieldsChange,
  onMappingPreviewChange,
  allowAutosave,
  onAllowAutosaveChange,
  onMappingDirtyChange,
  mappingCleanToken = 0,
}: {
  connectorId: string;
  onHasMappedFieldsChange?: (hasMappedFields: boolean) => void;
  onMappingPreviewChange?: (preview: SchemaMappingPreviewPayload) => void;
  allowAutosave: boolean;
  onAllowAutosaveChange: (allow: boolean) => void;
  onMappingDirtyChange?: (dirty: boolean) => void;
  mappingCleanToken?: number;
}) {
  const restoreExistingMappings = hasConnectorMappings(connectorId);
  const [rows, setRows] = useState<MappingRow[]>(() =>
    restoreExistingMappings
      ? buildDemoMappedRows(INITIAL_ROWS)
      : INITIAL_ROWS.map((row) => ({ ...row })),
  );
  const [selectedEventClassId, setSelectedEventClassId] = useState(DEFAULT_EVENT_CLASS_ID);
  const mappingBaselineRef = useRef(
    mappingStateSignature(
      restoreExistingMappings
        ? buildDemoMappedRows(INITIAL_ROWS)
        : INITIAL_ROWS.map((row) => ({ ...row })),
      DEFAULT_EVENT_CLASS_ID,
    ),
  );
  const [copilotEnabled, setCopilotEnabled] = useState(true);
  const [isAiMapping, setIsAiMapping] = useState(false);
  const [aiAssistedMappingSettings, setAiAssistedMappingSettings] = useState<AiAssistedMappingSettings>(
    DEFAULT_AI_ASSISTED_MAPPING_SETTINGS,
  );
  const aiMappingRunRef = useRef(0);
  const [mapVisibility, setMapVisibility] = useState<MapVisibilityMode>("all");
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(() => new Set());
  const [showHiddenFields, setShowHiddenFields] = useState(false);
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");
  const [expandedSourceEnums, setExpandedSourceEnums] = useState<ReadonlySet<string>>(() => new Set());
  const [mapSchemaPanelWidth, setMapSchemaPanelWidth] = useState(MAP_SCHEMA_PANEL_DEFAULT_WIDTH);
  const [isResizingMapSchemaPanel, setIsResizingMapSchemaPanel] = useState(false);
  const [mapSchemaMode, setMapSchemaMode] = useState<MapSchemaMode>("basic");
  const [mapSchemaLayoutResetKey, setMapSchemaLayoutResetKey] = useState(0);
  const [pendingEventClassId, setPendingEventClassId] = useState<string | null>(null);
  const mapSchemaResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const runAiMappingDemo = useCallback((settings: AiAssistedMappingSettings) => {
    const runId = ++aiMappingRunRef.current;
    setIsAiMapping(true);
    setAiAssistedMappingSettings(settings);

    let scenario: CopilotDemoScenario | undefined;
    let targetEventClassId = selectedEventClassId;

    if (settings.suggestEventClass) {
      scenario = takeNextCopilotDemoScenario();
      targetEventClassId = scenario.eventClassId;
      setSelectedEventClassId(targetEventClassId);
    } else {
      scenario = findCopilotDemoScenarioByEventClass(selectedEventClassId);
    }

    window.setTimeout(() => {
      if (aiMappingRunRef.current !== runId) return;

      if (!settings.suggestMappingsForEventClass) {
        setRows(
          scenario
            ? rowsFromCopilotScenario(scenario, false)
            : getDemoSourceRowsForEventClass(targetEventClassId),
        );
        setMapSchemaMode("basic");
        setMapSchemaLayoutResetKey((key) => key + 1);
        setIsAiMapping(false);
        return;
      }

      if (scenario) {
        setRows(rowsFromCopilotScenario(scenario, true));
        setMapSchemaMode("basic");
        setMapSchemaLayoutResetKey((key) => key + 1);
        setIsAiMapping(false);
        return;
      }

      const sourceRows = getDemoSourceRowsForEventClass(targetEventClassId);
      void buildDemoMappedRowsForEventClass(targetEventClassId, sourceRows).then((mappedRows) => {
        if (aiMappingRunRef.current !== runId) return;
        setRows(mappedRows);
        setMapSchemaMode("basic");
        setMapSchemaLayoutResetKey((key) => key + 1);
        setIsAiMapping(false);
      });
    }, aiMappingDelayMs());
  }, [selectedEventClassId]);

  const applyEventClassChange = useCallback((eventClassId: string) => {
    aiMappingRunRef.current += 1;
    setIsAiMapping(false);
    setSelectedEventClassId(eventClassId);
    setRows(getDemoSourceRowsForEventClass(eventClassId));
  }, []);

  const handleEventClassChange = useCallback(
    (eventClassId: string) => {
      if (eventClassId === selectedEventClassId) return;
      if (rows.some(isMappedRow)) {
        setPendingEventClassId(eventClassId);
        return;
      }
      applyEventClassChange(eventClassId);
    },
    [applyEventClassChange, rows, selectedEventClassId],
  );

  const handleConfirmEventClassChange = useCallback(() => {
    if (pendingEventClassId == null) return;
    applyEventClassChange(pendingEventClassId);
    setPendingEventClassId(null);
  }, [applyEventClassChange, pendingEventClassId]);

  const handleCancelEventClassChange = useCallback(() => {
    setPendingEventClassId(null);
  }, []);

  const handleCopilotEnabledChange = useCallback((enabled: boolean) => {
    setCopilotEnabled(enabled);
    if (enabled) {
      runAiMappingDemo(DEFAULT_AI_ASSISTED_MAPPING_SETTINGS);
      return;
    }
    aiMappingRunRef.current += 1;
    setIsAiMapping(false);
    setSelectedEventClassId("");
    setRows(buildUnmappedRows(INITIAL_ROWS));
  }, [runAiMappingDemo]);

  const handleAiAssistedMappingSuggest = useCallback(
    (settings: AiAssistedMappingSettings) => {
      runAiMappingDemo(settings);
    },
    [runAiMappingDemo],
  );

  const didAutomapOnMountRef = useRef(false);
  useEffect(() => {
    if (!copilotEnabled || didAutomapOnMountRef.current) return;
    didAutomapOnMountRef.current = true;
    if (hasConnectorMappings(connectorId)) return;
    runAiMappingDemo(DEFAULT_AI_ASSISTED_MAPPING_SETTINGS);
  }, [connectorId, copilotEnabled, runAiMappingDemo]);

  useEffect(() => {
    if (!rows.some(isMappedRow)) return;
    markConnectorMappingsComplete(connectorId);
  }, [connectorId, rows]);

  const handleMapSchemaPanelResizePointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    mapSchemaResizeRef.current = { startX: event.clientX, startWidth: mapSchemaPanelWidth };
    setIsResizingMapSchemaPanel(true);
  }, [mapSchemaPanelWidth]);

  const handleMapSchemaPanelResizePointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (!mapSchemaResizeRef.current) return;
    const { startX, startWidth } = mapSchemaResizeRef.current;
    // Dragging the gutter left widens the MAP Schema panel.
    setMapSchemaPanelWidth(clampMapSchemaPanelWidth(startWidth + (startX - event.clientX)));
  }, []);

  const handleMapSchemaPanelResizePointerEnd = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    mapSchemaResizeRef.current = null;
    setIsResizingMapSchemaPanel(false);
  }, []);

  useEffect(() => {
    if (!isResizingMapSchemaPanel) return;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizingMapSchemaPanel]);

  const hasHiddenFields = hiddenFields.size > 0;

  const toggleFieldVisibility = useCallback((source: string) => {
    setHiddenFields((current) => {
      const next = new Set(current);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  }, []);

  const clearHiddenFields = useCallback(() => {
    setHiddenFields(new Set());
    setShowHiddenFields(false);
  }, []);

  useEffect(() => {
    if (hiddenFields.size === 0) setShowHiddenFields(false);
  }, [hiddenFields]);

  const hasMappedFields = useMemo(() => rows.some(isMappedRow), [rows]);

  const mappingPreview = useMemo(
    () => buildSchemaMappingPreview(rows, selectedEventClassId),
    [rows, selectedEventClassId],
  );

  useEffect(() => {
    onHasMappedFieldsChange?.(hasMappedFields);
  }, [hasMappedFields, onHasMappedFieldsChange]);

  useEffect(() => {
    mappingBaselineRef.current = mappingStateSignature(rows, selectedEventClassId);
    onMappingDirtyChange?.(false);
  }, [mappingCleanToken, onMappingDirtyChange]);

  useEffect(() => {
    const dirty = mappingStateSignature(rows, selectedEventClassId) !== mappingBaselineRef.current;
    onMappingDirtyChange?.(dirty);
  }, [rows, selectedEventClassId, onMappingDirtyChange]);

  useEffect(() => {
    onMappingPreviewChange?.(mappingPreview);
  }, [mappingPreview, onMappingPreviewChange]);

  useEffect(() => {
    if (!hasMappedFields && mapVisibility !== "all") {
      setMapVisibility("all");
    }
  }, [hasMappedFields, mapVisibility]);

  const mapOcsfFieldToSource = useCallback((source: string, fieldPath: string) => {
    const tag = ocsfFieldMappingTag(fieldPath) || formatOcsfPathLabel(fieldPath);

    setRows((current) =>
      current.map((row) => {
        if (row.source !== source) return row;
        const existingTags = row.tags ?? [];
        if (existingTags.includes(tag)) return row;
        return { ...row, mapped: true, tags: [...existingTags, tag] };
      }),
    );
  }, []);

  const mapOcsfEnumValueToSource = useCallback(
    (source: string, value: MapSchemaEnumValueDragPayload) => {
      const tag = enumValueMappingTag(value);
      setRows((current) =>
        current.map((row) => {
          if (row.source !== source) return row;
          const existingTags = row.tags ?? [];
          if (existingTags.includes(tag)) return row;
          return { ...row, mapped: true, tags: [...existingTags, tag] };
        }),
      );
    },
    [],
  );

  const toggleSourceEnumExpanded = useCallback((source: string) => {
    setExpandedSourceEnums((current) => {
      const next = new Set(current);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }, []);

  const removeTagFromSource = useCallback((source: string, tag: string) => {
    setRows((current) => {
      const updated = current.map((row) => {
        if (row.source !== source) return row;
        const nextTags = (row.tags ?? []).filter((existing) => existing !== tag);
        if (nextTags.length === 0) return { ...row, mapped: false, tags: undefined };
        return { ...row, mapped: true, tags: nextTags };
      });
      const parent = updated.find((row) => row.source === source);
      // Clearing the last parent mapping hides values and clears any value mappings.
      if (parent?.sourceEnum && !isMappedRow(parent)) {
        return updated.map((row) =>
          row.parentSource === source ? { ...row, mapped: false, tags: undefined } : row,
        );
      }
      return updated;
    });
  }, []);

  const clearRowMapping = useCallback((source: string) => {
    setRows((current) => {
      const parent = current.find((row) => row.source === source);
      return current.map((row) => {
        if (row.source === source) return { ...row, mapped: false, tags: undefined };
        if (parent?.sourceEnum && row.parentSource === source) {
          return { ...row, mapped: false, tags: undefined };
        }
        return row;
      });
    });
    setExpandedSourceEnums((current) => {
      if (!current.has(source)) return current;
      const next = new Set(current);
      next.delete(source);
      return next;
    });
  }, []);

  // Reveal customer enum values only after the parent enum is mapped.
  useEffect(() => {
    setExpandedSourceEnums((current) => {
      let changed = false;
      const next = new Set(current);
      for (const row of rows) {
        if (!row.sourceEnum) continue;
        if (isMappedRow(row)) {
          if (!next.has(row.source)) {
            next.add(row.source);
            changed = true;
          }
        } else if (next.has(row.source)) {
          next.delete(row.source);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [rows]);

  const parentMappedBySource = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const row of rows) {
      if (row.sourceEnum) map.set(row.source, isMappedRow(row));
    }
    return map;
  }, [rows]);

  const enumChildCountBySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (!row.parentSource) continue;
      map.set(row.parentSource, (map.get(row.parentSource) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const visibleRows = useMemo(() => {
    const query = sourceSearchQuery.trim().toLowerCase();

    return rows.filter((r) => {
      if (r.parentSource) {
        // Values stay hidden until the parent enum is mapped (and expanded).
        if (parentMappedBySource.get(r.parentSource) !== true) return false;
        if (!expandedSourceEnums.has(r.parentSource)) return false;
      }

      if (hiddenFields.has(r.source) && !showHiddenFields) return false;

      if (query && !r.source.toLowerCase().includes(query) && !r.sample.toLowerCase().includes(query)) {
        return false;
      }

      const mapped = isMappedRow(r);
      if (mapVisibility === "hideMapped" && mapped) return false;
      if (mapVisibility === "hideUnmapped" && !mapped) return false;
      return true;
    });
  }, [
    rows,
    mapVisibility,
    hiddenFields,
    showHiddenFields,
    sourceSearchQuery,
    expandedSourceEnums,
    parentMappedBySource,
  ]);

  const columns: DataTableColumn<MappingRow>[] = useMemo(
    () => [
      {
        id: "source",
        header: "Source",
        className: "min-w-0 py-0 pl-0 pr-2",
        cell: (r) => {
          const fieldHidden = hiddenFields.has(r.source);
          const isEnumParent = Boolean(r.sourceEnum);
          const isEnumChild = Boolean(r.parentSource);
          const enumExpanded = isEnumParent && expandedSourceEnums.has(r.source);
          const parentMapped = isEnumParent && isMappedRow(r);
          const enumChildCount = isEnumParent ? (enumChildCountBySource.get(r.source) ?? 0) : 0;
          const showNoEnumValuesError = parentMapped && enumChildCount === 0;

          return (
            <div className="flex w-full min-w-0 flex-col gap-1">
              <div
                className="w-full min-w-0"
                style={isEnumChild ? { paddingLeft: SOURCE_ENUM_VALUE_INDENT_PX } : undefined}
              >
                <div className="flex h-full min-h-7 w-full min-w-0 items-center gap-2 rounded border border-border-rule bg-surface-modal px-3 py-1">
                  {isEnumChild ? (
                    <>
                      <p className="min-w-0 flex-1 truncate text-xs font-semibold tracking-[0.4px] text-text-primary">
                        {r.sample || r.source}
                      </p>
                      <ChevronDown
                        size={14}
                        strokeWidth={1.5}
                        className="shrink-0 text-text-tertiary"
                        aria-hidden
                      />
                    </>
                  ) : (
                    <>
                      <p className="flex min-w-0 flex-1 items-center gap-1 truncate text-xs font-semibold tracking-[0.4px]">
                        <span className="min-w-0 truncate text-text-primary">{r.source}</span>
                        <SourceSampleCommonValues source={r.source} sample={r.sample} />
                      </p>
                      {isEnumParent && parentMapped && enumChildCount > 0 ? (
                        <MapSchemaExpandCollapseButton
                          expanded={enumExpanded}
                          onToggle={() => toggleSourceEnumExpanded(r.source)}
                          label={r.source}
                        />
                      ) : null}
                      <button
                        type="button"
                        className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-primary"
                        aria-label={fieldHidden ? "Show field" : "Hide field"}
                        onClick={() => toggleFieldVisibility(r.source)}
                      >
                        {fieldHidden ? (
                          <EyeOff size={16} strokeWidth={1.5} aria-hidden />
                        ) : (
                          <Eye size={16} strokeWidth={1.5} aria-hidden />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {showNoEnumValuesError ? (
                <p className="px-1 text-xs font-semibold leading-4 tracking-[0.4px] text-feedback-negative">
                  There are no enum values to map.
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "_barGap",
        header: "",
        className: "p-0",
        cell: () => null,
      },
      {
        id: "target",
        header: "Target",
        className: "min-w-0 py-0 pl-0 pr-2",
        cell: (r) => {
          const isEnumChild = Boolean(r.parentSource);
          const parentMapped = r.parentSource ? parentMappedBySource.get(r.parentSource) === true : true;
          // Enum values can only be mapped once the parent attribute is mapped.
          const acceptDrops = !isEnumChild || parentMapped;

          return (
            <div
              className="w-full min-w-0"
              style={isEnumChild ? { paddingLeft: SOURCE_ENUM_VALUE_INDENT_PX } : undefined}
            >
              <TargetMappingDropZone
                source={r.source}
                onMapField={mapOcsfFieldToSource}
                onMapEnumValue={isEnumChild ? mapOcsfEnumValueToSource : undefined}
                acceptDrops={acceptDrops}
                showClearAll={isMappedRow(r)}
                onClearAll={() => clearRowMapping(r.source)}
              >
                {isMappedRow(r) ? (
                  <div className="flex min-w-0 w-full flex-wrap gap-1">
                    {(r.tags ?? []).map((t) => (
                      <Tag key={t} onRemove={() => removeTagFromSource(r.source, t)}>
                        {t}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <span className="min-w-0 flex-1 truncate px-1 text-xs font-semibold italic tracking-[0.4px] text-text-tertiary">
                    Unmapped
                  </span>
                )}
              </TargetMappingDropZone>
            </div>
          );
        },
      },
    ],
    [
      clearRowMapping,
      enumChildCountBySource,
      expandedSourceEnums,
      hiddenFields,
      mapOcsfEnumValueToSource,
      mapOcsfFieldToSource,
      parentMappedBySource,
      removeTagFromSource,
      toggleFieldVisibility,
      toggleSourceEnumExpanded,
    ],
  );

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col bg-surface-modal md:flex-row md:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border-rule px-1 py-4">
            <MappingToolbarV2
              hasMappedFields={hasMappedFields}
              selectedEventClassId={selectedEventClassId}
              onEventClassChange={handleEventClassChange}
              isAiMapping={isAiMapping}
              aiAssistedMappingSettings={aiAssistedMappingSettings}
              onAiAssistedMappingSuggest={handleAiAssistedMappingSuggest}
              copilotEnabled={copilotEnabled}
              onCopilotEnabledChange={handleCopilotEnabledChange}
              showGettingStarted={mapSchemaMode === "basic"}
              showAdvancedCallout={mapSchemaMode === "advanced"}
              allowAutosave={allowAutosave}
              onAllowAutosaveChange={onAllowAutosaveChange}
            />
          </div>
          <FieldMappingBar
            rows={rows}
            mapVisibility={mapVisibility}
            onMapVisibilityChange={setMapVisibility}
            showHiddenFields={showHiddenFields}
            onShowHiddenFieldsChange={setShowHiddenFields}
            hasHiddenFields={hasHiddenFields}
            hasMappedFields={hasMappedFields}
            onClearHiddenFields={clearHiddenFields}
            sourceSearchQuery={sourceSearchQuery}
            onSourceSearchQueryChange={setSourceSearchQuery}
            isAiMapping={isAiMapping}
            table={
              <DataTable<MappingRow>
                caption="Map source fields from the security schema to the query data model."
                colgroup={MAPPING_FIELD_COLGROUP}
                hideHeader
                autoHeight
                className="w-full min-w-0 !overflow-visible"
                rowKey={(r) => r.source}
                rows={visibleRows}
                columns={columns}
              />
            }
          />
        </div>

        <button
          type="button"
          tabIndex={-1}
          aria-label="Resize MAP Schema panel"
          aria-orientation="vertical"
          aria-valuemin={MAP_SCHEMA_PANEL_MIN_WIDTH}
          aria-valuemax={MAP_SCHEMA_PANEL_MAX_WIDTH}
          aria-valuenow={mapSchemaPanelWidth}
          className={cx(
            "group/resize relative hidden w-3 shrink-0 cursor-col-resize touch-none border-0 bg-transparent p-0 md:block",
            "hover:bg-overlay-subtle active:bg-overlay-subtle",
            isResizingMapSchemaPanel && "bg-overlay-subtle",
          )}
          onPointerDown={handleMapSchemaPanelResizePointerDown}
          onPointerMove={handleMapSchemaPanelResizePointerMove}
          onPointerUp={handleMapSchemaPanelResizePointerEnd}
          onPointerCancel={handleMapSchemaPanelResizePointerEnd}
          onLostPointerCapture={() => {
            mapSchemaResizeRef.current = null;
            setIsResizingMapSchemaPanel(false);
          }}
        >
          <span
            className={cx(
              "pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors",
              "group-hover/resize:bg-interactive-active group-active/resize:bg-interactive-active",
              isResizingMapSchemaPanel && "bg-interactive-active",
            )}
            aria-hidden
          />
        </button>

        <div
          className={cx(
            "relative flex min-h-0 w-full shrink-0 flex-col border-t border-border-rule py-4 md:w-[var(--map-schema-panel-width)] md:max-w-[var(--map-schema-panel-width)] md:min-w-[var(--map-schema-panel-width)] md:border-t-0 md:py-4",
            !isResizingMapSchemaPanel && "md:transition-[width] duration-200 ease-out",
          )}
          style={{ "--map-schema-panel-width": `${mapSchemaPanelWidth}px` } as CSSProperties}
        >
          <MapSchemaOverviewCard
            eventClassId={selectedEventClassId}
            mode={mapSchemaMode}
            onModeChange={setMapSchemaMode}
            layoutResetKey={mapSchemaLayoutResetKey}
          />
        </div>
      </div>

      <Modal
        open={pendingEventClassId != null}
        title="Change event class?"
        onClose={handleCancelEventClassChange}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={handleCancelEventClassChange}>
              Cancel
            </Button>
            <Button type="button" variant="default" onClick={handleConfirmEventClassChange}>
              Proceed
            </Button>
          </div>
        }
      >
        You will lose your current mappings. Are you sure you want to proceed?
      </Modal>
    </>
  );
}
