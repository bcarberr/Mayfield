import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent, type ReactNode } from "react";
import { CircleX, Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { Checkbox, Icon } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcn/tooltip";
import {
  getMapSchemaEntitiesForEventClass,
  type MapSchemaEntity,
} from "../../data/httpActivityMapSchemaEntities";
import {
  formatOcsfPathLabel,
  getOcsfEntityCategoryDescription,
  getOcsfFieldDescription,
  ocsfFieldMappingTag,
} from "../../data/ocsfFieldDescriptions";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Input } from "../ui/Input";
import { Switch } from "../ui/Switch";
import { CopilotSparkMark } from "../SearchCopilotPanel";
import { SearchEventClassPicker } from "../SearchEventClassPicker";
import { searchEventById } from "../../data/searchEntityOptions";

const MAP_SCHEMA_DRAG_MIME = "application/x-query-map-field";

const MAP_SCHEMA_PANEL_DEFAULT_WIDTH = 300;
const MAP_SCHEMA_PANEL_MIN_WIDTH = 240;
const MAP_SCHEMA_PANEL_MAX_WIDTH = 520;
const MAP_SCHEMA_TREE_INDENT_PX = 12;

function clampMapSchemaPanelWidth(width: number) {
  return Math.round(Math.min(MAP_SCHEMA_PANEL_MAX_WIDTH, Math.max(MAP_SCHEMA_PANEL_MIN_WIDTH, width)));
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

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
}: {
  value: MapVisibilityMode;
  onChange: (next: MapVisibilityMode) => void;
}) {
  const gid = useId().replace(/:/g, "");
  const leftRadioId = `${gid}-radio-left`;
  const midRadioId = `${gid}-radio-mid`;
  const rightRadioId = `${gid}-radio-right`;

  return (
    <div
      role="radiogroup"
      aria-label="Filter rows by mapping status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      <label
        htmlFor={leftRadioId}
        className={cx(
          "cursor-pointer select-none text-sm font-semibold leading-[18px] underline-offset-2",
          value === "hideMapped" ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary",
        )}
      >
        Hide Mapped
      </label>

      <div
        className={cx(
          "relative h-[18px] w-12 shrink-0 overflow-hidden rounded-full px-[3px] transition-colors duration-150 ease-out",
          value === "all" && "border border-solid border-border-rule bg-transparent",
          (value === "hideMapped" || value === "hideUnmapped") &&
            "border-0 bg-interactive-active hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-pressed)]",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "pointer-events-none absolute top-1/2 z-0 size-3 rounded-full transition-[left,transform,background-color] duration-200 ease-out",
            value === "all" && "bg-border-container",
            (value === "hideMapped" || value === "hideUnmapped") && "bg-text-on-primary",
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
          tabIndex={0}
          onClick={() => onChange("hideMapped")}
          className="absolute inset-y-0 left-0 z-[1] w-1/3 cursor-pointer rounded-l-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal"
        />
        <button
          id={midRadioId}
          type="button"
          role="radio"
          aria-checked={value === "all"}
          aria-label="Show all rows"
          tabIndex={0}
          onClick={() => onChange("all")}
          className="absolute inset-y-0 left-1/3 z-[1] w-1/3 cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal"
        />
        <button
          id={rightRadioId}
          type="button"
          role="radio"
          aria-checked={value === "hideUnmapped"}
          aria-label="Show only mapped fields"
          tabIndex={0}
          onClick={() => onChange("hideUnmapped")}
          className="absolute inset-y-0 left-2/3 z-[1] w-1/3 cursor-pointer rounded-r-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal"
        />
      </div>

      <label
        htmlFor={rightRadioId}
        className={cx(
          "cursor-pointer select-none text-sm font-semibold leading-[18px] underline-offset-2",
          value === "hideUnmapped" ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary",
        )}
      >
        Hide Unmapped
      </label>
    </div>
  );
}

const INITIAL_ROWS: MappingRow[] = [
  { source: "action", sample: "allow_st*", mapped: false },
  { source: "appclass", sample: "gostringsam*", mapped: false },
  { source: "appname", sample: "thisApp_name*", mapped: false },
  { source: "bwclassname", sample: "thbwe_junk_classname*", mapped: false },
  { source: "bytes_in", sample: "1024", mapped: false },
  { source: "bytes_out", sample: "2048", mapped: false },
  { source: "client_ip", sample: "10.0.0.1", mapped: false },
  { source: "dest_port", sample: "443", mapped: false },
  { source: "duration_ms", sample: "42", mapped: false },
  { source: "hostname", sample: "web-01.internal", mapped: false },
  { source: "http_method", sample: "GET", mapped: false },
  { source: "http_status", sample: "200", mapped: false },
  { source: "protocol", sample: "HTTPS", mapped: false },
  { source: "request_path", sample: "/api/v1/health", mapped: false },
  { source: "user_agent", sample: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", mapped: false },
];

const DEFAULT_EVENT_CLASS_ID = "http_activity";

/** Demo OCSF target tags — ~93% of source fields mapped (all except `bwclassname`). */
const DEMO_SOURCE_FIELD_TAGS: Record<string, string[]> = {
  action: ["activity_name"],
  appclass: ["category_name"],
  appname: ["type_name"],
  bytes_in: ["traffic_bytes_in"],
  bytes_out: ["traffic_bytes_out"],
  client_ip: ["src_endpoint_ip"],
  dest_port: ["dst_endpoint_port"],
  duration_ms: ["time"],
  hostname: ["dst_endpoint_domain"],
  http_method: ["http_request_http_method"],
  http_status: ["http_response_code"],
  protocol: ["http_request_version"],
  request_path: ["http_request_url"],
  user_agent: ["http_request_user_agent"],
};

function aiMappingDelayMs(): number {
  return 6000 + Math.floor(Math.random() * 2001);
}

function buildDemoMappedRows(sourceRows: readonly MappingRow[]): MappingRow[] {
  return sourceRows.map((row) => {
    const tags = DEMO_SOURCE_FIELD_TAGS[row.source];
    if (!tags?.length) return { ...row, mapped: false, tags: undefined };
    return { ...row, mapped: true, tags: [...tags] };
  });
}

function buildUnmappedRows(sourceRows: readonly MappingRow[]): MappingRow[] {
  return sourceRows.map((row) => ({ ...row, mapped: false, tags: undefined }));
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

function MapSchemaDraggableFieldRow({
  fieldPath,
  label,
  indent = 24,
  enumLabel,
  suffix,
  onDragStart,
}: {
  fieldPath: string;
  label?: string;
  indent?: number;
  enumLabel?: boolean;
  suffix?: ReactNode;
  onDragStart?: (event: DragEvent<HTMLDivElement>, fieldPath: string) => void;
}) {
  const displayLabel = label ?? formatOcsfPathLabel(fieldPath);

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(MAP_SCHEMA_DRAG_MIME, fieldPath);
        event.dataTransfer.setData("text/plain", fieldPath);
        event.dataTransfer.effectAllowed = "copy";
        onDragStart?.(event, fieldPath);
      }}
      className="flex h-7 w-full min-w-0 cursor-grab items-center gap-2 rounded py-1 active:cursor-grabbing hover:bg-overlay-subtle"
      style={{ paddingLeft: `${indent}px` }}
    >
      <MapSchemaFieldInfoPopover fieldPath={fieldPath} label={displayLabel} />
      <Icon name="action-drag-indicator" size={11} className="shrink-0 text-text-tertiary" aria-hidden />
      <span className="min-w-0 truncate text-xs font-semibold leading-4 tracking-[0.4px] text-text-primary">
        {enumLabel ? (
          <>
            <span>{displayLabel} </span>
            <span className="font-semibold italic text-[#b4b0ff]">enum</span>
          </>
        ) : (
          displayLabel
        )}
      </span>
      {suffix}
    </div>
  );
}

function MapSchemaRequiredTimeRow() {
  return (
    <MapSchemaDraggableFieldRow
      fieldPath="time"
      label="time*"
      indent={0}
      suffix={<span className="shrink-0 font-semibold italic text-accent-required">required</span>}
    />
  );
}

type OcsfPathTreeNode = {
  segment: string;
  fullPath?: string;
  children: OcsfPathTreeNode[];
};

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

  return toArray(root);
}

function MapSchemaOcsfPathTreeRow({
  segment,
  fieldPath,
  depth,
  isLeaf,
}: {
  segment: string;
  fieldPath: string;
  depth: number;
  isLeaf: boolean;
}) {
  const label = segment.toLowerCase();

  return (
    <div
      draggable={isLeaf}
      onDragStart={
        isLeaf
          ? (event) => {
              event.dataTransfer.setData(MAP_SCHEMA_DRAG_MIME, fieldPath);
              event.dataTransfer.setData("text/plain", fieldPath);
              event.dataTransfer.effectAllowed = "copy";
            }
          : undefined
      }
      style={depth > 0 ? { paddingLeft: `${depth * MAP_SCHEMA_TREE_INDENT_PX}px` } : undefined}
      className={cx(
        "flex h-7 w-full min-w-0 items-center gap-2 rounded py-0.5 hover:bg-overlay-subtle",
        isLeaf && "cursor-grab active:cursor-grabbing",
      )}
    >
      <MapSchemaFieldInfoPopover fieldPath={fieldPath} label={label} />
      {isLeaf ? (
        <Icon name="action-drag-indicator" size={11} className="shrink-0 text-text-tertiary" aria-hidden />
      ) : (
        <span className="inline-block w-[11px] shrink-0" aria-hidden />
      )}
      <span className="min-w-0 truncate text-xs font-semibold leading-4 tracking-[0.4px] text-text-primary">
        {depth > 0 ? (
          <>
            <span className="text-text-tertiary">- </span>
            {label}
          </>
        ) : (
          label
        )}
      </span>
      <span className="shrink-0 text-xs font-semibold leading-4 text-text-tertiary" aria-hidden>
        -
      </span>
    </div>
  );
}

function MapSchemaOcsfPathTreeBranch({
  node,
  depth,
  pathPrefix,
}: {
  node: OcsfPathTreeNode;
  depth: number;
  pathPrefix: readonly string[];
}) {
  const segments = [...pathPrefix, node.segment];
  const fieldPath = node.fullPath ?? segments.join(".").toLowerCase();
  const isLeaf = node.children.length === 0;

  return (
    <>
      <MapSchemaOcsfPathTreeRow segment={node.segment} fieldPath={fieldPath} depth={depth} isLeaf={isLeaf} />
      {node.children.map((child) => (
        <MapSchemaOcsfPathTreeBranch
          key={`${fieldPath}-${child.segment}`}
          node={child}
          pathPrefix={segments}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

function MapSchemaEntityOcsfPathTree({ paths }: { paths: readonly string[] }) {
  const tree = useMemo(() => buildOcsfPathTree(paths), [paths]);

  if (tree.length === 0) return null;

  return (
    <div className="flex flex-col pl-6">
      {tree.map((node) => (
        <MapSchemaOcsfPathTreeBranch key={node.segment} node={node} pathPrefix={[]} depth={0} />
      ))}
    </div>
  );
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
        <MapSchemaFieldInfoPopover
          label={entity.label}
          description={getOcsfEntityCategoryDescription(entity)}
        />
        <span className="min-w-0 truncate text-xs font-semibold leading-4 tracking-[0.4px] text-text-primary">
          {entity.label}
        </span>
      </button>
      {expanded && expandable
        ? treeView ? (
            <MapSchemaEntityOcsfPathTree paths={entity.paths} />
          ) : (
            entity.paths.map((path) => <MapSchemaDraggableFieldRow key={path} fieldPath={path} />)
          )
        : null}
    </>
  );
}

function MapSchemaRecommendedFieldRow({ row }: { row: MapSchemaRecommendedRow }) {
  return (
    <MapSchemaDraggableFieldRow
      fieldPath={row.name}
      label={row.name}
      indent={0}
      enumLabel={row.kind === "field" ? row.enum : undefined}
    />
  );
}

function MapSchemaOverviewCard({ eventClassId }: { eventClassId: string }) {
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

  const toggleEntity = useCallback((entityId: string) => {
    setExpandedEntityIds((current) => {
      const next = new Set(current);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      return next;
    });
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-0 flex-1 flex-col rounded border border-border-rule bg-surface-modal px-4 pt-2 pb-3">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0">
          <div className="flex shrink-0 items-center gap-2">
            <p className="shrink-0 text-[12px] font-bold uppercase leading-[14px] tracking-[0.4px] text-text-tertiary">
              MAP Schema
            </p>
            <button
              type="button"
              aria-label="Map schema mode: Basic Mode"
              className={cx(
                "flex h-7 min-w-0 flex-1 items-center justify-between gap-2 rounded-full border px-3 text-left transition-colors",
                "border-border-container bg-surface-container text-text-secondary hover:text-text-primary",
              )}
            >
              <span className="min-w-0 truncate text-[14px] font-bold leading-5 tracking-[0.4px]">Basic Mode</span>
              <Icon name="chevron-down" size={20} className="shrink-0" />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-left text-[14px] font-bold leading-5 tracking-[0.4px] text-text-primary">
              {selectedEventClass?.label ?? "Event class"}
            </p>
          </div>
          <div className="mt-3 border-t border-border-rule pt-3">
            <div className="w-[240px] shrink-0">
              <Input
                variant="search"
                readOnly
                tabIndex={-1}
                placeholder="Search"
                className="border-border-rule px-1.5"
              />
            </div>
          </div>
          <div className="mt-3">
            <MapSchemaRequiredTimeRow />
          </div>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-px">
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
                  onCheckedChange={setTreeView}
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
}: {
  settings: AiAssistedMappingSettings;
  onSuggest: (next: AiAssistedMappingSettings) => void;
  isMapping?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(settings);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
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
      <CopilotSparkMark className="size-[21.6px]" />
      <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary-outline"
            size="sm"
            className="h-7 gap-1 border-border-rule bg-surface-modal px-2 font-semibold text-text-primary"
            aria-label="AI assisted mapping options"
          >
            AI Assisted Mapping
            <Icon name="chevron-down" size={16} className="shrink-0 text-text-secondary" />
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
                label="Suggest Mappings for Suggested Event Class"
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
}: {
  hasMappedFields: boolean;
  selectedEventClassId: string;
  onEventClassChange: (eventClassId: string) => void;
  isAiMapping: boolean;
  aiAssistedMappingSettings: AiAssistedMappingSettings;
  onAiAssistedMappingSuggest: (settings: AiAssistedMappingSettings) => void;
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
        <div className="grid w-full min-w-0 grid-cols-1 gap-y-3 md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)_4rem] md:gap-x-0">
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
          <div className="hidden md:block" aria-hidden />

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
          </div>
          <div className="hidden md:block" aria-hidden />
          <div className="flex min-w-0 items-center justify-start">
            <MapVisibilityTrimode value={mapVisibility} onChange={onMapVisibilityChange} />
          </div>
          <div className="hidden md:block" aria-hidden />
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
  const [isAiMapping, setIsAiMapping] = useState(true);
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

  useEffect(() => {
    runAiMappingDemo(DEFAULT_AI_ASSISTED_MAPPING_SETTINGS);
    return () => {
      aiMappingRunRef.current += 1;
    };
  }, [runAiMappingDemo]);

  const handleEventClassChange = useCallback((eventClassId: string) => {
    aiMappingRunRef.current += 1;
    setIsAiMapping(false);
    setSelectedEventClassId(eventClassId);
    setRows(buildUnmappedRows(INITIAL_ROWS));
  }, []);

  const handleAiAssistedMappingSuggest = useCallback(
    (settings: AiAssistedMappingSettings) => {
      runAiMappingDemo(settings);
    },
    [runAiMappingDemo],
  );

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
        setShowHiddenFields(true);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (hiddenFields.size === 0) setShowHiddenFields(false);
  }, [hiddenFields]);

  const hasMappedFields = useMemo(() => rows.some(isMappedRow), [rows]);

  useEffect(() => {
    onHasMappedFieldsChange?.(hasMappedFields);
  }, [hasMappedFields, onHasMappedFieldsChange]);

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
      <p className="shrink-0 py-3 text-base-semibold italic text-text-tertiary">{ADVANCED_MODE_CALLOUT}</p>

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
            />
          </div>
          <FieldMappingBar
            rows={rows}
            mapVisibility={mapVisibility}
            onMapVisibilityChange={setMapVisibility}
            showHiddenFields={showHiddenFields}
            onShowHiddenFieldsChange={setShowHiddenFields}
            hasHiddenFields={hasHiddenFields}
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
          <MapSchemaOverviewCard eventClassId={selectedEventClassId} />
        </div>
      </div>
    </>
  );
}
