import { Icon, type IconName } from "../../design-system";
import { Button } from "./Button";
import type { ColumnSortDirection } from "./useColumnSort";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

function sortToggleLabel(label: string, direction: ColumnSortDirection | null): string {
  if (direction === "asc") return `Sort ${label} descending`;
  if (direction === "desc") return `Clear ${label} sort`;
  return `Sort ${label} ascending`;
}

export function ColumnHeaderMenu({
  label,
  menuLabel,
  leadingIcon,
  sortable,
  sortDirection = null,
  onSortToggle,
}: {
  label: string;
  menuLabel: string;
  /** Renders before the label; inherits header text color via currentColor. */
  leadingIcon?: IconName;
  sortable?: boolean;
  sortDirection?: ColumnSortDirection | null;
  onSortToggle?: () => void;
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
            className={cx(
              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-text-tertiary transition-colors hover:text-interactive-active",
              sortDirection != null && "text-interactive-active",
            )}
            aria-label={sortToggleLabel(label, sortDirection)}
            aria-pressed={sortDirection != null}
            onClick={onSortToggle}
          >
            <Icon
              name={arrowDirection === "desc" ? "navi-arrow-downward" : "navi-arrow-upward"}
              size={15}
              className={cx("!h-[15.4px] !w-[15.4px]", sortDirection != null && "text-interactive-active")}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        className="size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4"
        aria-label={menuLabel}
      >
        <Icon name="extra-menu" size={16} />
      </Button>
    </div>
  );
}
