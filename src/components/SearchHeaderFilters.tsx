import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "../design-system";
import { TimeframeFilterDropdown } from "./TimeframeFilterDropdown";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type SearchHeaderFilterDropdownProps = {
  icon: IconName;
  label: string;
  menuLabel: string;
  showChevron?: boolean;
  value?: ReactNode;
};

/** Generic header filter trigger — menu content to be defined later. */
function SearchHeaderFilterDropdown({
  icon,
  label,
  menuLabel,
  showChevron = false,
  value,
}: SearchHeaderFilterDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={`${menuLabel} filter`}
      className="inline-flex max-w-full items-center gap-1.5 rounded py-0.5 text-left transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
      onClick={() => setOpen((current) => !current)}
    >
      <Icon name={icon} size={16} className="shrink-0 text-interactive-active" aria-hidden />
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-interactive-active">
        {label}
        {showChevron ? (
          <Icon
            name="chevron-down"
            size={16}
            className={cx("shrink-0 text-interactive-active transition-transform duration-150", open && "rotate-180")}
            aria-hidden
          />
        ) : null}
      </span>
      {value ? (
        <span className="ml-0.5 shrink-0 rounded bg-surface-container px-2 py-1 text-sm font-semibold text-text-primary">
          {value}
        </span>
      ) : null}
    </button>
  );
}

/** Federated Search header filters — Figma search workspace filter row. */
export function SearchHeaderFilters() {
  return (
    <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Search filters">
      <SearchHeaderFilterDropdown
        icon="connectors"
        label="Connectors"
        menuLabel="Connectors"
        showChevron
        value="17 of 17"
      />
      <TimeframeFilterDropdown />
      <SearchHeaderFilterDropdown
        icon="nav-star"
        label="Saved/Recent Searches"
        menuLabel="Saved and recent searches"
        showChevron
      />
    </div>
  );
}
