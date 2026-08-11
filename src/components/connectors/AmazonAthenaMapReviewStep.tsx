import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent, type ReactNode } from "react";
import { CircleX, Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { Checkbox, Icon } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcn/tooltip";
import {
  getMapSchemaEntitiesForEventClass,
  type MapSchemaEntity,
} from "../../data/httpActivityMapSchemaEntities";
import {
  getHttpActivityEnumValues,
  getHttpActivityFullSchemaPaths,
  isHttpActivityArrayField,
  isHttpActivityEnumField,
  isHttpActivitySimpleMappableField,
} from "../../data/httpActivityFullSchema";
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
} from "../../data/httpActivityDemoSourceFields";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Input } from "../ui/Input";
import { Switch } from "../ui/Switch";
import { CopilotSparkMark } from "../SearchCopilotPanel";
import { SearchEventClassPicker } from "../SearchEventClassPicker";
import { searchEventById } from "../../data/searchEntityOptions";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const MAP_SCHEMA_DRAG_MIME = "application/x-query-map-field";

const MAP_SCHEMA_PANEL_DEFAULT_WIDTH = 300;
const MAP_SCHEMA_PANEL_MIN_WIDTH = 240;
const MAP_SCHEMA_PANEL_MAX_WIDTH = 520;
const MAP_SCHEMA_TREE_INDENT_PX = 12;
const MAP_SCHEMA_MOVE_SLOT_CLASS = "inline-flex w-[11px] shrink-0 items-center justify-center";
const MAP_SCHEMA_TREE_SLOT_CLASS = "inline-flex w-3 shrink-0 items-start justify-center";

function clampMapSchemaPanelWidth(width: number) {
  return Math.round(Math.min(MAP_SCHEMA_PANEL_MAX_WIDTH, Math.max(MAP_SCHEMA_PANEL_MIN_WIDTH, width)));
}

export const ADVANCED_MODE_CALLOUT =
  "Advanced Mode allows mapping of more details and will give more context for investigations and threat hunting.";

type MappingRow = {
  source: string;
  sample: string;
  mapped: boolean;
  tags?: string[];
};

function isMappedRow(r: MappingRow): boolean {
  return Boolean(r.mapped && r.tags?.length);
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
          className="absolute inset-y-0 left-0 z-[1] w-1/3 cursor-pointer rounded-l-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal disabled:cursor-not-allowed"
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
          className="absolute inset-y-0 left-1/3 z-[1] w-1/3 cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal disabled:cursor-not-allowed"
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
          className="absolute inset-y-0 left-2/3 z-[1] w-1/3 cursor-pointer rounded-r-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal disabled:cursor-not-allowed"
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
          className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive-active data-[state=delayed-open]:bg-overlay-subtle data-[state=delayed-open]:text-text-primary data-[state=instant-open]:bg-overlay-subtle data-[state=instant-open]:text-text-primary"
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
      className="shrink-0 rounded p-0 text-text-tertiary hover:text-text-primary"
      aria-expanded={expanded}
      aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      <Icon name={expanded ? "action-remove" : "action-add"} size={8} className="block" aria-hidden />
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
      <MapSchemaMoveSlot active={showMove} />
      {showTreeBranch ? <MapSchemaTreeSlot show /> : null}
      <span
        className={cx(
          "inline-flex min-w-0 flex-1 items-center gap-1 truncate text-xs font-semibold leading-4 tracking-[0.4px]",
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
        event.dataTransfer.setData(MAP_SCHEMA_DRAG_MIME, fieldPath);
        event.dataTransfer.setData("text/plain", fieldPath);
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
}: {
  fieldPath: string;
  label?: string;
  indent?: number;
  showParentDrag?: boolean;
  showTreeBranch?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const displayLabel = label ?? formatOcsfPathLabel(fieldPath);
  const enumValues = getHttpActivityEnumValues(fieldPath);

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
        ? enumValues.map((value) => (
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
  if (isHttpActivityEnumField(fieldPath) && getHttpActivityEnumValues(fieldPath).length > 0) {
    return <MapSchemaExpandableEnumFieldRow fieldPath={fieldPath} label={label} indent={indent} />;
  }

  return (
    <MapSchemaDraggableFieldRow
      fieldPath={fieldPath}
      label={label}
      indent={indent}
      enumLabel={enumLabel ?? isHttpActivityEnumField(fieldPath)}
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
  if (isHttpActivityEnumField(fieldPath)) {
    return <span className="font-semibold italic text-[#b4b0ff]">enum</span>;
  }
  if (isHttpActivityArrayField(fieldPath)) {
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
  const label = isEnumValue ? segment : segment.toLowerCase();
  const isMappable = isHttpActivitySimpleMappableField(fieldPath, {
    hasPathChildren,
    isEnumValue,
  });
  const showTypeSuffix =
    !isEnumValue &&
    (isHttpActivityEnumField(fieldPath) || isHttpActivityArrayField(fieldPath)) &&
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
}: {
  node: OcsfPathTreeNode;
  depth: number;
  pathPrefix: readonly string[];
  pathKey: string;
  expandedPaths: ReadonlySet<string>;
  onToggleExpand: (pathKey: string) => void;
}) {
  const segments = [...pathPrefix, node.segment];
  const fieldPath = node.fullPath ?? segments.join(".").toLowerCase();
  const hasPathChildren = node.children.length > 0;

  if (
    !hasPathChildren &&
    isHttpActivityEnumField(fieldPath) &&
    getHttpActivityEnumValues(fieldPath).length > 0
  ) {
    return (
      <MapSchemaExpandableEnumFieldRow
        fieldPath={fieldPath}
        indent={depth * MAP_SCHEMA_TREE_INDENT_PX}
        showParentDrag={false}
        showTreeBranch={depth > 0}
        defaultExpanded
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
}: {
  paths: readonly string[];
  className?: string;
  defaultExpandAll?: boolean;
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
          depth={0}
          expandedPaths={expandedPaths}
          onToggleExpand={toggleExpanded}
        />
      ))}
    </div>
  );
}

function MapSchemaEntityOcsfPathTree({ paths }: { paths: readonly string[] }) {
  return <MapSchemaExpandablePathTree paths={paths} defaultExpandAll />;
}

function TargetMappingDropZone({
  source,
  onMapField,
  onClearAll,
  showClearAll,
  children,
}: {
  source: string;
  onMapField: (source: string, fieldPath: string) => void;
  onClearAll?: () => void;
  showClearAll?: boolean;
  children: ReactNode;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(MAP_SCHEMA_DRAG_MIME)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        const fieldPath = event.dataTransfer.getData(MAP_SCHEMA_DRAG_MIME);
        if (fieldPath) onMapField(source, fieldPath);
      }}
      className={cx(
        "flex min-h-7 w-full min-w-0 items-center gap-1 rounded border border-border-rule bg-surface-modal px-3 py-1 transition-shadow",
        isDragOver && "ring-2 ring-inset ring-interactive-active",
      )}
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
          expandable && "hover:bg-overlay-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive-active",
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
  const selected = MAP_SCHEMA_MODE_OPTIONS.find((option) => option.id === mode) ?? MAP_SCHEMA_MODE_OPTIONS[0]!;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Map schema mode: ${selected.label}`}
          className={cx(
            "flex h-7 min-w-0 flex-1 items-center justify-between gap-2 rounded-full border px-3 text-left transition-colors",
            "border-border-container bg-surface-container text-text-secondary hover:text-text-primary",
          )}
        >
          <span className="min-w-0 truncate text-[14px] font-bold leading-5 tracking-[0.4px]">{selected.label}</span>
          <Icon name="chevron-down" size={20} className="shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[min(360px,calc(100vw-2.5rem))] rounded-[4px] border border-border-container bg-surface-modal p-2 text-text-primary shadow-[0_3px_14px_2px_rgba(0,0,0,0.12),0_8px_10px_1px_rgba(0,0,0,0.14),0_5px_5px_-3px_rgba(0,0,0,0.2)] ring-0"
      >
        {MAP_SCHEMA_MODE_OPTIONS.map((option) => {
          const isSelected = option.id === mode;
          return (
            <DropdownMenuItem
              key={option.id}
              className="flex cursor-pointer flex-col items-start gap-1 rounded px-3 py-2 focus:bg-overlay-subtle"
              onSelect={() => onModeChange(option.id)}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={cx(
                    "text-sm font-semibold leading-[18px]",
                    isSelected ? "text-text-primary" : "text-text-secondary",
                  )}
                >
                  {option.label}
                </span>
                {isSelected ? (
                  <Icon name="action-check" size={12} className="shrink-0 text-interactive-active" aria-hidden />
                ) : null}
              </div>
              <span className="text-xs font-normal leading-4 text-text-tertiary">{option.description}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MapSchemaOverviewCard({
  eventClassId,
  mode,
  onModeChange,
}: {
  eventClassId: string;
  mode: MapSchemaMode;
  onModeChange: (next: MapSchemaMode) => void;
}) {
  const [treeView, setTreeView] = useState(false);
  const [entitiesOpen, setEntitiesOpen] = useState(true);
  const [recommendedOpen, setRecommendedOpen] = useState(true);
  const [expandedEntityIds, setExpandedEntityIds] = useState<ReadonlySet<string>>(() => new Set());

  const selectedEventClass = searchEventById(eventClassId);

  const mapSchemaEntities = useMemo(
    () =>
      eventClassId === "http_activity" ? getMapSchemaEntitiesForEventClass("http_activity") : [],
    [eventClassId],
  );

  const fullSchemaPaths = useMemo(
    () => (eventClassId === "http_activity" ? getHttpActivityFullSchemaPaths() : []),
    [eventClassId],
  );

  const isAdvanced = mode === "advanced";
  const supportsSchema = eventClassId === "http_activity";

  useEffect(() => {
    setExpandedEntityIds(new Set());
    setTreeView(false);
  }, [eventClassId]);

  const toggleEntity = useCallback((entityId: string) => {
    setExpandedEntityIds((current) => {
      const next = new Set(current);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      return next;
    });
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

  return (
    <TooltipProvider delayDuration={200}>
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
          {isAdvanced ? (
            <>
              <div className="mt-3 border-t border-border-rule pt-3">
                <button
                  type="button"
                  className="flex w-full items-center gap-1 rounded py-0.5 text-left text-sm font-semibold leading-[18px] hover:bg-overlay-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive-active"
                  aria-haspopup="listbox"
                  aria-label="Attributes filter"
                >
                  <span className="text-text-primary">Attributes:</span>
                  <span className="text-interactive-active">Show All</span>
                  <Icon name="chevron-down" size={12} className="ml-0.5 shrink-0 text-interactive-active" aria-hidden />
                </button>
              </div>
              <div className="mt-3">
                <div className="w-[240px] shrink-0">
                  <Input
                    variant="search"
                    readOnly
                    tabIndex={-1}
                    placeholder="Search attributes"
                    className="border-border-rule px-1.5"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mt-3 border-t border-border-rule pt-3">
                <div className="w-[240px] shrink-0">
                  <Input
                    variant="search"
                    readOnly
                    tabIndex={-1}
                    placeholder="Search attributes"
                    className="border-border-rule px-1.5"
                  />
                </div>
              </div>
              <div className="mt-3">
                <MapSchemaRequiredTimeRow />
              </div>
            </>
          )}
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-px">
            {isAdvanced ? (
              <>
                {!supportsSchema ? (
                  <p className="py-2 text-xs font-semibold text-text-tertiary">
                    Full OCSF schema is available for HTTP Activity.
                  </p>
                ) : (
                  <>
                    <MapSchemaRequiredTimeRow />
                    <MapSchemaExpandablePathTree paths={fullSchemaPaths} />
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex h-7 w-full min-h-7 flex-wrap items-center gap-2 py-1">
                  <button
                    type="button"
                    onClick={() => setEntitiesOpen((v) => !v)}
                    aria-expanded={entitiesOpen}
                    className="flex min-w-0 shrink-0 items-center gap-2 rounded py-0.5 pr-1 text-left text-text-primary hover:bg-overlay-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive-active"
                  >
                    <Icon
                      name="chevron-down"
                      size={12}
                      className={cx("shrink-0 transition-transform duration-150", !entitiesOpen && "-rotate-90")}
                      aria-hidden
                    />
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
                  ? mapSchemaEntities.map((entity) => (
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
                    className="flex min-w-0 items-center gap-2 rounded py-0.5 pr-1 text-left text-text-primary hover:bg-overlay-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive-active"
                  >
                    <Icon
                      name="chevron-down"
                      size={12}
                      className={cx("shrink-0 transition-transform duration-150", !recommendedOpen && "-rotate-90")}
                      aria-hidden
                    />
                    <span className="text-xs font-semibold uppercase leading-4 tracking-[0.4px]">Recommended</span>
                  </button>
                </div>
                {recommendedOpen
                  ? MAP_SCHEMA_RECOMMENDED.map((row, i) => (
                      <MapSchemaRecommendedFieldRow key={`${row.kind}-${"name" in row ? row.name : i}`} row={row} />
                    ))
                  : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
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
            className="group h-7 gap-1.5 px-0 font-semibold text-text-primary hover:bg-transparent disabled:opacity-60"
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
}: {
  hasMappedFields: boolean;
  selectedEventClassId: string;
  onEventClassChange: (eventClassId: string) => void;
  isAiMapping: boolean;
  aiAssistedMappingSettings: AiAssistedMappingSettings;
  onAiAssistedMappingSuggest: (settings: AiAssistedMappingSettings) => void;
  copilotEnabled: boolean;
  onCopilotEnabledChange: (enabled: boolean) => void;
}) {
  const [allowAutosave, setAllowAutosave] = useState(true);
  return (
    <div className="bg-surface-modal">
      <p className="text-base-semibold text-text-primary">Event Class to Map</p>
      <div className="mt-2 flex min-h-[32px] flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <SearchEventClassPicker value={selectedEventClassId} onChange={onEventClassChange} />
          <button
            type="button"
            className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-secondary"
            aria-label="About event class"
          >
            <Info size={16} strokeWidth={1.5} aria-hidden />
          </button>
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
            onCheckedChange={setAllowAutosave}
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
  table: ReactNode;
}) {
  const mapped = rows.filter(isMappedRow).length;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-modal px-0 py-4">
      <div className="shrink-0">
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
            <Info size={16} strokeWidth={1.5} className="shrink-0 text-text-tertiary" aria-label="About query data model" />
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
      <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto px-0 pb-28 pt-2">{table}</div>
    </div>
  );
}

/** Amazon Athena connector wizard Step 3 — Map & Review Data (Config-Schema-v2). */
export function AmazonAthenaMapReviewStep({
  onHasMappedFieldsChange,
}: {
  onHasMappedFieldsChange?: (hasMappedFields: boolean) => void;
}) {
  const [rows, setRows] = useState<MappingRow[]>(() => INITIAL_ROWS.map((row) => ({ ...row })));
  const [selectedEventClassId, setSelectedEventClassId] = useState(DEFAULT_EVENT_CLASS_ID);
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
  const [mapSchemaPanelWidth, setMapSchemaPanelWidth] = useState(MAP_SCHEMA_PANEL_DEFAULT_WIDTH);
  const [isResizingMapSchemaPanel, setIsResizingMapSchemaPanel] = useState(false);
  const [mapSchemaMode, setMapSchemaMode] = useState<MapSchemaMode>("basic");
  const mapSchemaResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const runAiMappingDemo = useCallback((settings: AiAssistedMappingSettings) => {
    const runId = ++aiMappingRunRef.current;
    setIsAiMapping(true);
    setAiAssistedMappingSettings(settings);

    if (settings.suggestEventClass) {
      setSelectedEventClassId(DEFAULT_EVENT_CLASS_ID);
    }

    window.setTimeout(() => {
      if (aiMappingRunRef.current !== runId) return;

      setRows(
        settings.suggestMappingsForEventClass
          ? buildDemoMappedRows(INITIAL_ROWS)
          : buildUnmappedRows(INITIAL_ROWS),
      );
      setIsAiMapping(false);
    }, aiMappingDelayMs());
  }, []);

  const handleEventClassChange = useCallback((eventClassId: string) => {
    aiMappingRunRef.current += 1;
    setIsAiMapping(false);
    setSelectedEventClassId(eventClassId);
    setRows(buildUnmappedRows(INITIAL_ROWS));
  }, []);

  const handleCopilotEnabledChange = useCallback((enabled: boolean) => {
    setCopilotEnabled(enabled);
    if (enabled) {
      setSelectedEventClassId(DEFAULT_EVENT_CLASS_ID);
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
    runAiMappingDemo(DEFAULT_AI_ASSISTED_MAPPING_SETTINGS);
  }, [copilotEnabled, runAiMappingDemo]);

  const handleMapSchemaPanelResizePointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    mapSchemaResizeRef.current = { startX: event.clientX, startWidth: mapSchemaPanelWidth };
    setIsResizingMapSchemaPanel(true);
  }, [mapSchemaPanelWidth]);

  const handleMapSchemaPanelResizePointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (!mapSchemaResizeRef.current) return;
    const { startX, startWidth } = mapSchemaResizeRef.current;
    setMapSchemaPanelWidth(clampMapSchemaPanelWidth(startWidth + (startX - event.clientX)));
  }, []);

  const handleMapSchemaPanelResizePointerEnd = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    mapSchemaResizeRef.current = null;
    setIsResizingMapSchemaPanel(false);
  }, []);

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

  useEffect(() => {
    onHasMappedFieldsChange?.(hasMappedFields);
  }, [hasMappedFields, onHasMappedFieldsChange]);

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

  const removeTagFromSource = useCallback((source: string, tag: string) => {
    setRows((current) =>
      current.map((row) => {
        if (row.source !== source) return row;
        const nextTags = (row.tags ?? []).filter((existing) => existing !== tag);
        if (nextTags.length === 0) return { ...row, mapped: false, tags: undefined };
        return { ...row, mapped: true, tags: nextTags };
      }),
    );
  }, []);

  const clearRowMapping = useCallback((source: string) => {
    setRows((current) =>
      current.map((row) => (row.source === source ? { ...row, mapped: false, tags: undefined } : row)),
    );
  }, []);

  const visibleRows = useMemo(() => {
    const query = sourceSearchQuery.trim().toLowerCase();

    return rows.filter((r) => {
      if (hiddenFields.has(r.source) && !showHiddenFields) return false;

      if (query && !r.source.toLowerCase().includes(query) && !r.sample.toLowerCase().includes(query)) {
        return false;
      }

      const mapped = isMappedRow(r);
      if (mapVisibility === "hideMapped" && mapped) return false;
      if (mapVisibility === "hideUnmapped" && !mapped) return false;
      return true;
    });
  }, [rows, mapVisibility, hiddenFields, showHiddenFields, sourceSearchQuery]);

  const columns: DataTableColumn<MappingRow>[] = useMemo(
    () => [
      {
        id: "source",
        header: "Source",
        className: "min-w-0 py-2 pl-0 pr-2 align-middle",
        cell: (r) => {
          const fieldHidden = hiddenFields.has(r.source);

          return (
            <div className="flex min-h-7 w-full min-w-0 items-center gap-2 rounded border border-border-rule bg-surface-modal px-3 py-1">
              <p className="min-w-0 flex-1 truncate text-xs font-semibold tracking-[0.4px]">
                <span className="text-text-primary">{r.source}</span>
                <span className="whitespace-pre"> </span>
                <span className="font-semibold italic text-text-tertiary">{r.sample}</span>
              </p>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-primary"
                aria-label={fieldHidden ? "Show field" : "Hide field"}
                onClick={() => toggleFieldVisibility(r.source)}
              >
                {fieldHidden ? (
                  <EyeOff size={20} strokeWidth={1.5} aria-hidden />
                ) : (
                  <Eye size={20} strokeWidth={1.5} aria-hidden />
                )}
              </button>
            </div>
          );
        },
      },
      {
        id: "_barGap",
        header: "",
        className: "p-0 align-middle",
        cell: () => null,
      },
      {
        id: "target",
        header: "Target",
        className: "min-w-0 py-2 pl-0 pr-2 align-middle",
        cell: (r) => (
          <TargetMappingDropZone
            source={r.source}
            onMapField={mapOcsfFieldToSource}
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
        ),
      },
    ],
    [clearRowMapping, hiddenFields, mapOcsfFieldToSource, removeTagFromSource, toggleFieldVisibility],
  );

  return (
    <>
      {mapSchemaMode === "advanced" ? (
        <p className="shrink-0 py-3 text-base-semibold italic text-text-tertiary">{ADVANCED_MODE_CALLOUT}</p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col bg-surface-modal md:flex-row md:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border-rule px-0 py-4">
            <MappingToolbarV2
              hasMappedFields={hasMappedFields}
              selectedEventClassId={selectedEventClassId}
              onEventClassChange={handleEventClassChange}
              isAiMapping={isAiMapping}
              aiAssistedMappingSettings={aiAssistedMappingSettings}
              onAiAssistedMappingSuggest={handleAiAssistedMappingSuggest}
              copilotEnabled={copilotEnabled}
              onCopilotEnabledChange={handleCopilotEnabledChange}
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
            table={
              <DataTable<MappingRow>
                caption="Map source fields from the security schema to the query data model."
                colgroup={MAPPING_FIELD_COLGROUP}
                hideHeader
                className="w-full min-w-0"
                rowKey={(r) => r.source}
                rows={visibleRows}
                columns={columns}
              />
            }
          />
        </div>

        <div
          className={cx(
            "relative flex min-h-0 w-full shrink-0 flex-col border-t border-border-rule py-4 md:w-[var(--map-schema-panel-width)] md:max-w-[var(--map-schema-panel-width)] md:min-w-[var(--map-schema-panel-width)] md:border-t-0 md:py-4 md:pl-4",
            !isResizingMapSchemaPanel && "md:transition-[width] duration-200 ease-out",
          )}
          style={{ "--map-schema-panel-width": `${mapSchemaPanelWidth}px` } as CSSProperties}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Resize MAP Schema panel"
            aria-orientation="vertical"
            aria-valuemin={MAP_SCHEMA_PANEL_MIN_WIDTH}
            aria-valuemax={MAP_SCHEMA_PANEL_MAX_WIDTH}
            aria-valuenow={mapSchemaPanelWidth}
            className={cx(
              "group/resize absolute -left-1.5 top-0 z-10 hidden h-full w-3 cursor-col-resize touch-none border-0 bg-transparent p-0 md:block",
              "hover:bg-overlay-subtle active:bg-overlay-subtle",
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
              className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/resize:bg-interactive-active group-active/resize:bg-interactive-active"
              aria-hidden
            />
          </button>
          <MapSchemaOverviewCard
            eventClassId={selectedEventClassId}
            mode={mapSchemaMode}
            onModeChange={setMapSchemaMode}
          />
        </div>
      </div>
    </>
  );
}
