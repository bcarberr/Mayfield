import { Building2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Icon } from "../../design-system";
import { DATA_GRID_ROW_EXPAND_ICON_SIZE } from "../ui/dataGridTableStyles";
import { Button } from "@/components/shadcn/button";
import { CollapsibleTrigger } from "@/components/shadcn/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import type { AdminMember } from "./adminSettingsData";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export function MemberAvatarStack({ members, max = 4 }: { members: readonly AdminMember[]; max?: number }) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((member) => (
        <span
          key={member.id}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-datavis-card-bg text-[10px] font-bold text-white"
          style={{ backgroundColor: member.avatarColor }}
          title={member.name}
        >
          {member.initials}
        </span>
      ))}
      {overflow > 0 ? (
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-datavis-card-bg bg-surface-modal text-[10px] font-semibold text-text-secondary">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

type IconAction = "edit" | "delete" | "add";

const ICON_ACTIONS: { id: IconAction; label: string; Icon: typeof Pencil }[] = [
  { id: "edit", label: "Edit", Icon: Pencil },
  { id: "delete", label: "Delete", Icon: Trash2 },
  { id: "add", label: "Add", Icon: Plus },
];

export function AdminIconActions({
  actions = ["edit", "delete"],
  onAction,
  addLabel = "Add",
}: {
  actions?: IconAction[];
  onAction?: (action: IconAction) => void;
  addLabel?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {ICON_ACTIONS.filter((item) => actions.includes(item.id)).map(({ id, label, Icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-7 text-text-tertiary hover:text-text-primary"
              aria-label={id === "add" ? addLabel : label}
              onClick={() => onAction?.(id)}
            >
              <Icon size={14} strokeWidth={1.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{id === "add" ? addLabel : label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function TenantIcon({ className }: { className?: string }) {
  return <Building2 size={16} strokeWidth={1.5} className={cx("shrink-0 text-text-secondary", className)} />;
}

export function TeamIcon({ className }: { className?: string }) {
  return <Users size={16} strokeWidth={1.5} className={cx("shrink-0 text-text-secondary", className)} />;
}

export function AdminExpandIcon({ expanded, className }: { expanded: boolean; className?: string }) {
  return (
    <Icon
      name="navi-arrow-drop-down"
      size={DATA_GRID_ROW_EXPAND_ICON_SIZE}
      className={cx(
        "block shrink-0 text-text-tertiary transition-transform",
        expanded ? "rotate-0" : "-rotate-90",
        className,
      )}
      aria-hidden
    />
  );
}

export function AdminExpandTrigger({
  expanded,
  label,
}: {
  expanded: boolean;
  label: string;
}) {
  return (
    <CollapsibleTrigger asChild>
      <button
        type="button"
        className="inline-flex shrink-0 p-0 text-text-tertiary hover:text-text-primary"
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
      >
        <AdminExpandIcon expanded={expanded} />
      </button>
    </CollapsibleTrigger>
  );
}

export const ADMIN_TABLE_CLASS = cx(
  "w-full border-collapse text-left text-sm",
  "[&_th]:align-middle [&_td]:align-middle",
);

export const ADMIN_TABLE_CELL_CLASS = "px-3 py-2.5 align-middle";

export const ADMIN_TABLE_CELL_INNER_CLASS = "flex min-h-8 items-center";

export const ADMIN_TABLE_HEAD_CLASS = cx(
  "border-b border-datavis-gridlines bg-surface-modal text-xs font-bold uppercase tracking-wide text-text-primary",
);

export const ADMIN_TABLE_ROW_CLASS = cx(
  "border-b border-datavis-gridlines last:border-b-0 hover:bg-overlay-subtle",
);

export const ADMIN_CARD_CLASS = cx(
  "overflow-hidden rounded-[4px] border border-border-container bg-datavis-card-bg shadow-datavis-card",
);
