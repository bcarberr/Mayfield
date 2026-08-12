import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Separator } from "@/components/shadcn/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/shadcn/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcn/tooltip";
import { Checkbox, Icon, Switch, type IconName } from "../../design-system";
import { useCopilot } from "../../context/CopilotContext";
import { CUSTOM_MAPPED_ATTRIBUTE_TOOLTIP } from "../../data/ocsfEventClassDetailSchema";
import { buildAttributeValueFsqlQuery } from "../../lib/buildEntitiesFsqlQuery";
import { ConnectorTableCell } from "./ConnectorTableCell";
import { Input } from "./Input";
import { TruncatedText } from "./TruncatedText";
import { connectorIconForInstanceName } from "../connectors/connectorInstanceIcon";
import { CopilotSparkMark } from "../SearchCopilotPanel";
import { SlideOverHeaderBackButton } from "./SlideOver";
import {
  filterAttributesBySearch,
  filterAttributesWithValues,
  setAllGroupsExpanded,
} from "./resultsDetailPanelModel";
import { JsonSyntaxHighlight } from "./JsonSyntaxHighlight";
import type {
  ResultsDetailAttributeField,
  ResultsDetailAttributeGroup,
  ResultsDetailAttributeNode,
  ResultsDetailRecord,
} from "./resultsDetailPanelTypes";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

const LINE_TAB_TRIGGER_CLASS =
  "h-auto flex-none rounded-none border-0 px-0 pb-3 text-sm font-semibold text-text-tertiary transition-colors hover:text-text-secondary [&::after]:hidden before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:bg-transparent before:transition-colors data-active:!bg-transparent data-active:before:bg-interactive-active data-active:text-text-primary data-active:shadow-none";

const DEPTH_INDENT_PX = 16;

function depthStyle(depth = 0) {
  return { paddingLeft: `${12 + depth * DEPTH_INDENT_PX}px` };
}

function eventTypeIconForLabel(label: string): { name: IconName; className: string } {
  const lower = label.toLowerCase();
  if (lower.includes("network")) {
    return { name: "ocsf-network-activity", className: "text-datavis-data-peanut-orange" };
  }
  if (lower.includes("identity") || lower.includes("iam") || lower.includes("access")) {
    return { name: "ocsf-identity-access", className: "text-datavis-data-weak-red-30" };
  }
  if (lower.includes("system") || lower.includes("process")) {
    return { name: "ocsf-system-activity", className: "text-datavis-data-smalt-green-40" };
  }
  if (lower.includes("application") || lower.includes("app")) {
    return { name: "ocsf-application-activity", className: "text-datavis-data-peanut-orange" };
  }
  if (lower.includes("vulner") || lower.includes("finding") || lower.includes("data security")) {
    return { name: "ocsf-findings", className: "text-datavis-data-smalt-green-40" };
  }
  return { name: "ocsf-discovery", className: "text-datavis-data-weak-red-30" };
}

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">{label}</p>
      <div className="mt-1 min-w-0 text-sm text-text-secondary">{children}</div>
    </div>
  );
}

function AttributeValueCell({
  field,
  onSearchValue,
}: {
  field: ResultsDetailAttributeField;
  onSearchValue: (field: ResultsDetailAttributeField) => void;
}) {
  const searchable = Boolean(field.value?.trim()) && field.value !== "—";

  return (
    <span className="inline-flex min-w-0 max-w-full items-center">
      <TruncatedText className="text-sm text-text-primary" wrapperClassName="min-w-0">
        {field.value}
      </TruncatedText>
      {searchable ? (
        <button
          type="button"
          className="ml-4 shrink-0 text-text-tertiary transition-colors hover:text-interactive-active"
          aria-label={`Search for ${field.value}`}
          title="Search"
          onClick={() => onSearchValue(field)}
        >
          <Search size={14} strokeWidth={1.5} className="size-3.5 shrink-0 text-current" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}

function AttributeLabel({ attribute, customMapped }: { attribute: string; customMapped?: boolean }) {
  if (!customMapped) {
    return <span className="block truncate text-sm text-text-secondary">{attribute}</span>;
  }

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-0.5">
      <span className="truncate text-sm text-datavis-data-pop-teal-20">{attribute}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="shrink-0 cursor-help text-sm leading-none text-datavis-data-pop-teal-20"
            aria-label={`${attribute} — custom mapped field`}
          >
            *
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left leading-snug">
          {CUSTOM_MAPPED_ATTRIBUTE_TOOLTIP}
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

function AttributeFieldRow({
  field,
  onSearchValue,
}: {
  field: ResultsDetailAttributeField;
  onSearchValue: (field: ResultsDetailAttributeField) => void;
}) {
  return (
    <tr className="h-10 border-b border-datavis-gridlines">
      <td className="w-[42%] max-w-0 py-2 align-middle" style={depthStyle(field.depth)}>
        <AttributeLabel attribute={field.attribute} customMapped={field.customMapped} />
      </td>
      <td className="max-w-0 px-3 py-2 align-middle">
        <AttributeValueCell field={field} onSearchValue={onSearchValue} />
      </td>
    </tr>
  );
}

function AttributeGroupSection({
  group,
  onSearchValue,
}: {
  group: ResultsDetailAttributeGroup;
  onSearchValue: (field: ResultsDetailAttributeField) => void;
}) {
  const [open, setOpen] = useState(group.defaultOpen ?? false);

  useEffect(() => {
    setOpen(group.defaultOpen ?? false);
  }, [group.defaultOpen]);

  return (
    <>
      <tr className="h-8 border-b border-datavis-gridlines bg-datavis-card-bg">
        <td colSpan={2} className="py-1 pr-2" style={depthStyle(group.depth)}>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-1 text-left text-sm font-semibold text-text-primary hover:text-interactive-active"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <Icon
              name="navi-chevron-right"
              size={16}
              className={cx(
                "size-4 shrink-0 transition-transform [&_svg]:!size-4",
                open && "rotate-90",
              )}
              aria-hidden
            />
            {group.label}
          </button>
        </td>
      </tr>
      {open ? <AttributeRows nodes={group.children} onSearchValue={onSearchValue} /> : null}
    </>
  );
}

function AttributeRows({
  nodes,
  onSearchValue,
}: {
  nodes: readonly ResultsDetailAttributeNode[];
  onSearchValue: (field: ResultsDetailAttributeField) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        if (node.type === "group") {
          return <AttributeGroupSection key={node.id} group={node} onSearchValue={onSearchValue} />;
        }
        return <AttributeFieldRow key={node.id} field={node} onSearchValue={onSearchValue} />;
      })}
    </>
  );
}

function AttributesTable({
  nodes,
  onSearchValue,
}: {
  nodes: readonly ResultsDetailAttributeNode[];
  onSearchValue: (field: ResultsDetailAttributeField) => void;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-datavis-gridlines bg-datavis-card-bg">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="h-8 border-b border-datavis-gridlines bg-datavis-card-bg">
            <th
              scope="col"
              className="w-[42%] px-3 text-left text-xs font-bold uppercase tracking-wide text-text-tertiary"
            >
              Attribute
            </th>
            <th
              scope="col"
              className="px-3 text-left text-xs font-bold uppercase tracking-wide text-text-tertiary"
            >
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          <AttributeRows nodes={nodes} onSearchValue={onSearchValue} />
        </tbody>
      </table>
    </div>
  );
}

export function ResultsDetailPanel({
  record,
  recordIndex,
  recordTotal,
  onClose,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}: {
  record: ResultsDetailRecord;
  recordIndex: number;
  recordTotal: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}) {
  const { open: copilotOpen, setOpen: setCopilotOpen, setPendingFsqlSearch } = useCopilot();
  const [expandAll, setExpandAll] = useState(true);
  const [onlyWithValues, setOnlyWithValues] = useState(false);
  const [attributeSearchQuery, setAttributeSearchQuery] = useState("");
  const eventTypeIcon = eventTypeIconForLabel(record.eventType);

  const handleAttributeValueSearch = useCallback(
    (field: ResultsDetailAttributeField) => {
      const query = buildAttributeValueFsqlQuery(field.id, field.attribute, field.value);
      if (!query.trim()) return;
      setPendingFsqlSearch({ query, autoExecute: true });
    },
    [setPendingFsqlSearch],
  );

  const visibleAttributes = useMemo(() => {
    let nodes = setAllGroupsExpanded(record.attributes, expandAll);
    if (onlyWithValues) nodes = filterAttributesWithValues(nodes);
    if (attributeSearchQuery.trim()) nodes = filterAttributesBySearch(nodes, attributeSearchQuery);
    return nodes;
  }, [record.attributes, expandAll, onlyWithValues, attributeSearchQuery]);

  return (
    <TooltipProvider>
    <div className="flex h-full min-h-0 flex-col text-text-primary">
      <header className="shrink-0 border-b border-border-rule px-6 py-3">
        <div className="flex items-start gap-2">
          <SlideOverHeaderBackButton onClose={onClose} className="mt-0.5" />
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <Icon
              name={connectorIconForInstanceName(record.connector)}
              size={24}
              className="mt-0.5 size-6 shrink-0 [&_svg]:!size-6"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-page-title font-bold text-text-primary">{record.title}</h2>
              <p className="mt-0.5 truncate text-sm tabular-nums text-text-primary">{record.headerTitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-1 whitespace-nowrap text-sm tabular-nums text-text-secondary">
              {recordIndex + 1} of {recordTotal}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="size-8 shrink-0 p-1 text-text-tertiary hover:text-text-primary disabled:opacity-40"
              aria-label="Previous result"
              disabled={!canGoPrev}
              onClick={onPrev}
            >
              <Icon name="navi-chevron-left" size={20} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="size-8 shrink-0 p-1 text-text-tertiary hover:text-text-primary disabled:opacity-40"
              aria-label="Next result"
              disabled={!canGoNext}
              onClick={onNext}
            >
              <Icon name="navi-chevron-right" size={20} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="size-8 shrink-0 p-1 text-text-tertiary hover:text-text-primary"
              aria-label="Close panel"
              onClick={onClose}
            >
              <Icon name="close" size={20} aria-hidden />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <MetaItem label="Vulnerability">
            <span className="inline-flex min-w-0 items-center gap-2">
              <Icon
                name={eventTypeIcon.name}
                size={16}
                className={cx("size-4 shrink-0 [&_svg]:!size-4", eventTypeIcon.className)}
                aria-hidden
              />
              <span className="truncate">{record.eventType}</span>
            </span>
          </MetaItem>
          <MetaItem label="Owner">
            <span className="truncate">{record.owner ?? "—"}</span>
          </MetaItem>
          <MetaItem label="Connector">
            <ConnectorTableCell name={record.connector} textClassName="text-sm text-text-secondary" />
          </MetaItem>
          <MetaItem label="Connector Alias Name">
            <span className="truncate">{record.connectionAlias ?? "—"}</span>
          </MetaItem>
        </div>
      </header>

      <Tabs defaultValue="attributes" className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-end gap-2 px-6 pt-2">
          <TabsList
            variant="line"
            className="h-auto w-auto gap-6 rounded-none bg-transparent p-0"
            aria-label="Event detail views"
          >
            <TabsTrigger value="attributes" className={LINE_TAB_TRIGGER_CLASS}>
              Attributes
            </TabsTrigger>
            <TabsTrigger value="qdm" className={LINE_TAB_TRIGGER_CLASS}>
              QDM JSON
            </TabsTrigger>
          </TabsList>
          <Separator orientation="vertical" className="mb-3 h-5 bg-border-container" />
          <button
            type="button"
            className="mb-0 inline-flex items-center gap-1.5 pb-3 text-sm font-semibold text-text-tertiary transition-colors hover:text-text-secondary"
            aria-label={copilotOpen ? "Close AI Copilot and Agents" : "Investigate with AI Copilot and Agents"}
            aria-expanded={copilotOpen}
            onClick={() => setCopilotOpen((open) => !open)}
          >
            <CopilotSparkMark
              className={cx(
                "size-[14px] brightness-110 transition-[filter] duration-150",
                copilotOpen && "brightness-[1.21]",
              )}
            />
            Investigate
          </button>
        </div>

        <TabsContent value="attributes" className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="w-full min-w-[200px] max-w-[300px] shrink-0">
              <Input
                variant="search"
                placeholder="Search attributes"
                value={attributeSearchQuery}
                onChange={(event) => setAttributeSearchQuery(event.target.value)}
                onClear={() => setAttributeSearchQuery("")}
                className="!bg-datavis-card-bg"
                aria-label="Search attributes"
              />
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-3">
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  checked={expandAll}
                  onCheckedChange={setExpandAll}
                  aria-label="Expand all attribute groups"
                />
                <span className="text-sm text-text-secondary">Expand all</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={onlyWithValues}
                  onCheckedChange={(checked) => setOnlyWithValues(checked === true)}
                  aria-label="Show only fields with data"
                />
                <span className="text-sm text-text-secondary">Show only fields with data</span>
              </label>
            </div>
          </div>

          <AttributesTable nodes={visibleAttributes} onSearchValue={handleAttributeValueSearch} />

          {record.relatedFindings?.length ? (
            <Collapsible className="mt-4">
              <div className="overflow-hidden rounded-sm border border-datavis-gridlines bg-datavis-card-bg">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-semibold text-text-primary hover:bg-surface-container-low"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon name="navi-chevron-right" size={16} className="size-4 [&_svg]:!size-4" aria-hidden />
                      Related Findings
                    </span>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-bold tabular-nums text-text-secondary">
                      {record.relatedFindings.length}
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="border-t border-datavis-gridlines">
                    {record.relatedFindings.map((finding) => (
                      <li
                        key={finding.id}
                        className="border-b border-datavis-gridlines px-3 py-2.5 text-sm text-interactive-active last:border-b-0"
                      >
                        {finding.label}
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ) : null}
        </TabsContent>

        <TabsContent value="qdm" className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <JsonSyntaxHighlight
            json={record.qdmJson}
            className="rounded-sm border border-datavis-gridlines bg-datavis-card-bg p-4"
          />
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
}
