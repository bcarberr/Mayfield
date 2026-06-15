import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../design-system";
import { connectorsPanelLocationState, ROUTES } from "../app/routes";
import { ConnectorSelectionCountText } from "./connectors/ConnectorSelectionCountText";
import { TimeframeFilterDropdown } from "./TimeframeFilterDropdown";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const HEADER_FILTER_INTERACTIVE =
  "text-interactive-active transition-colors group-hover:text-[var(--color-primary-hover)] group-active:text-[var(--color-primary-pressed)]";

type SearchHeaderFilterDropdownProps = {
  icon: IconName;
  label: string;
  menuLabel: string;
  value?: ReactNode;
  /** When set, opens the panel instead of toggling a placeholder menu. */
  onActivate?: () => void;
};

/** Generic header filter trigger — menu content to be defined later. */
function SearchHeaderFilterDropdown({
  icon,
  label,
  menuLabel,
  value,
  onActivate,
}: SearchHeaderFilterDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      aria-haspopup={onActivate ? undefined : "menu"}
      aria-expanded={onActivate ? undefined : open}
      aria-label={`${menuLabel} filter`}
      className="group flex w-full max-w-full items-center gap-1.5 rounded py-0.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container lg:inline-flex lg:w-auto"
      onClick={() => {
        if (onActivate) {
          onActivate();
          return;
        }
        setOpen((current) => !current);
      }}
    >
      <Icon name={icon} size={16} className={cx("shrink-0", HEADER_FILTER_INTERACTIVE)} aria-hidden />
      <span className={cx("inline-flex shrink-0 items-center gap-1 text-sm font-semibold", HEADER_FILTER_INTERACTIVE)}>
        {label}
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
  const location = useLocation();
  const navigate = useNavigate();

  const openConnectorsPanel = () => {
    navigate(ROUTES.connectors, {
      state: connectorsPanelLocationState({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      }),
    });
  };

  return (
    <div
      className="flex w-full flex-col items-start gap-3 lg:w-auto lg:flex-row lg:flex-nowrap lg:items-center lg:gap-4"
      role="group"
      aria-label="Search filters"
    >
      <SearchHeaderFilterDropdown
        icon="connectors"
        label="Connectors"
        menuLabel="Connectors"
        value={<ConnectorSelectionCountText />}
        onActivate={openConnectorsPanel}
      />
      <TimeframeFilterDropdown />
      <SearchHeaderFilterDropdown
        icon="nav-star"
        label="Saved/Recent Searches"
        menuLabel="Saved and recent searches"
      />
    </div>
  );
}
