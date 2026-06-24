import { useCallback, useState } from "react";
import { Info } from "lucide-react";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/shadcn/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { ROLE_PERMISSION_SETS, type PermissionItem } from "./adminSettingsData";
import { ADMIN_CARD_CLASS, AdminExpandTrigger } from "./AdminSettingsShared";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

function clonePermissionTree(items: readonly PermissionItem[]): PermissionItem[] {
  return items.map((item) => ({
    ...item,
    children: item.children ? clonePermissionTree(item.children) : undefined,
  }));
}

function cloneRoleSets() {
  return ROLE_PERMISSION_SETS.map((role) => ({
    ...role,
    columns: role.columns.map((column) => ({
      groups: clonePermissionTree(column.groups),
    })),
  }));
}

function updatePermissionInTree(
  items: readonly PermissionItem[],
  permissionId: string,
  checked: boolean,
  cascade: boolean,
): PermissionItem[] {
  return items.map((item) => {
    if (item.id === permissionId) {
      return {
        ...item,
        checked,
        children: cascade && item.children
          ? item.children.map((child) => ({ ...child, checked }))
          : item.children,
      };
    }
    if (item.children) {
      return {
        ...item,
        children: updatePermissionInTree(item.children, permissionId, checked, cascade),
      };
    }
    return item;
  });
}

function PermissionCheckbox({
  item,
  depth = 0,
  onToggle,
}: {
  item: PermissionItem;
  depth?: number;
  onToggle: (id: string, checked: boolean, hasChildren: boolean) => void;
}) {
  return (
    <div className={cx(depth > 0 && "pl-5")}>
      <label className="flex cursor-pointer items-start gap-2 py-1">
        <Checkbox
          checked={item.checked}
          onCheckedChange={(value) => onToggle(item.id, value === true, Boolean(item.children?.length))}
          className="mt-0.5"
          aria-label={item.label}
        />
        <span
          className={cx(
            "text-sm leading-snug",
            depth === 0 ? "font-semibold text-text-primary" : "text-text-secondary",
          )}
        >
          {item.label}
        </span>
      </label>
      {item.children?.map((child) => (
        <PermissionCheckbox key={child.id} item={child} depth={depth + 1} onToggle={onToggle} />
      ))}
    </div>
  );
}

function RolePermissionPanel({
  roleId,
  title,
  columns,
  onToggle,
}: {
  roleId: string;
  title: string;
  columns: ReturnType<typeof cloneRoleSets>[number]["columns"];
  onToggle: (roleId: string, permissionId: string, checked: boolean, hasChildren: boolean) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={ADMIN_CARD_CLASS}>
      <div className="flex items-center gap-2 border-b border-datavis-gridlines px-4 py-3">
        <AdminExpandTrigger expanded={open} label={title} />
        <span className="min-w-0 flex-1 text-sm font-semibold text-text-primary">{title}</span>
        <Tooltip>
          <TooltipTrigger className="inline-flex cursor-default items-center focus-visible:outline-none">
            <Info size={12} className="text-text-tertiary" aria-label={`About ${title} permissions`} />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[240px]">
            Configure permissions assigned to users with the {title} role.
          </TooltipContent>
        </Tooltip>
      </div>
      <CollapsibleContent className="px-4 py-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {columns.map((column, columnIndex) => (
            <div key={`${roleId}-col-${columnIndex}`} className="flex min-w-0 flex-col gap-4">
              {column.groups.map((group) => (
                <PermissionCheckbox
                  key={group.id}
                  item={group}
                  onToggle={(id, checked, hasChildren) => onToggle(roleId, id, checked, hasChildren)}
                />
              ))}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function RolePermissionsTabContent() {
  const [roleSets, setRoleSets] = useState(cloneRoleSets);

  const handleToggle = useCallback(
    (roleId: string, permissionId: string, checked: boolean, hasChildren: boolean) => {
      setRoleSets((prev) =>
        prev.map((role) => {
          if (role.id !== roleId) return role;
          return {
            ...role,
            columns: role.columns.map((column) => ({
              groups: updatePermissionInTree(column.groups, permissionId, checked, hasChildren),
            })),
          };
        }),
      );
    },
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      {roleSets.map((role) => (
        <RolePermissionPanel
          key={role.id}
          roleId={role.id}
          title={role.title}
          columns={role.columns}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
