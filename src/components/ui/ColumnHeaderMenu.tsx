import { Icon, type IconName } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import type { ColumnSortDirection } from "./useColumnSort";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";

export function ColumnHeaderMenu({
  label,
  menuLabel,
  leadingIcon,
  sortable,
  sortDirection = null,
  onSortToggle,
  onSortSet,
}: {
  label: string;
  menuLabel: string;
  leadingIcon?: IconName;
  sortable?: boolean;
  sortDirection?: ColumnSortDirection | null;
  onSortToggle?: () => void;
  onSortSet?: (direction: ColumnSortDirection | null) => void;
}) {
  const arrowDirection = sortDirection === "desc" ? "desc" : "asc";

  return (
    <div className="flex w-full min-w-0 translate-y-px items-center justify-between gap-1">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {leadingIcon ? <Icon name={leadingIcon} size={14} className="shrink-0" aria-hidden /> : null}
        <span className="truncate">{label}</span>
        {sortable ? (
          <button
            type="button"
            className={[
              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-text-tertiary transition-colors hover:text-interactive-active",
              sortDirection != null && "text-interactive-active",
            ].filter(Boolean).join(" ")}
            aria-label={sortDirection === "asc" ? `Sort ${label} descending` : sortDirection === "desc" ? `Clear ${label} sort` : `Sort ${label} ascending`}
            aria-pressed={sortDirection != null}
            onClick={onSortToggle}
          >
            <Icon
              name={arrowDirection === "desc" ? "navi-arrow-downward" : "navi-arrow-upward"}
              size={15}
              className={["!h-[15.4px] !w-[15.4px]", sortDirection != null && "text-interactive-active"].filter(Boolean).join(" ")}
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4"
            aria-label={menuLabel}
          >
            <Icon name="extra-menu" size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[148px] border-border-container bg-surface-container text-text-primary ring-0"
        >
          {sortable && (
            <>
              <DropdownMenuCheckboxItem
                checked={sortDirection === "asc"}
                onCheckedChange={() => onSortSet?.("asc")}
                className="text-text-secondary focus:bg-overlay-subtle focus:text-text-primary"
              >
                Sort A → Z
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortDirection === "desc"}
                onCheckedChange={() => onSortSet?.("desc")}
                className="text-text-secondary focus:bg-overlay-subtle focus:text-text-primary"
              >
                Sort Z → A
              </DropdownMenuCheckboxItem>
              {sortDirection !== null && (
                <DropdownMenuItem
                  onClick={() => onSortSet?.(null)}
                  className="text-text-tertiary focus:bg-overlay-subtle focus:text-text-primary"
                >
                  Clear sort
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-border-container" />
            </>
          )}
          <DropdownMenuItem
            disabled
            className="text-text-tertiary focus:bg-overlay-subtle focus:text-text-primary"
          >
            Hide column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
