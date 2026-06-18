import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../design-system";
import { connectorsPanelLocationState, ROUTES } from "../app/routes";
import { ConnectorSelectionCountText } from "./connectors/ConnectorSelectionCountText";
import { TimeframeFilterDropdown } from "./TimeframeFilterDropdown";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { cn } from "@/lib/utils";

const HEADER_FILTER_TRIGGER_CLASS =
  "h-auto max-w-full gap-1.5 rounded px-0 py-0.5 font-semibold text-interactive-active hover:bg-transparent hover:text-[var(--color-primary-hover)] active:text-[var(--color-primary-pressed)] lg:inline-flex lg:w-auto";

const HEADER_FILTER_ICON_CLASS = "size-4 shrink-0 text-current [&_svg]:!size-4";
const HEADER_FILTER_ICON_LG_CLASS = "size-[18.4px] shrink-0 text-current [&_svg]:!size-[18.4px]";

type HeaderFilterTriggerProps = {
  icon: IconName;
  label: string;
  value?: ReactNode;
  largeIcon?: boolean;
};

function HeaderFilterTrigger({ icon, label, value, largeIcon = false }: HeaderFilterTriggerProps) {
  return (
    <>
      <Icon
        name={icon}
        size={largeIcon ? 18.4 : 16}
        className={largeIcon ? HEADER_FILTER_ICON_LG_CLASS : HEADER_FILTER_ICON_CLASS}
        aria-hidden
      />
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">{label}</span>
      {value ? (
        <Badge
          variant="secondary"
          className="ml-0.5 h-auto max-w-[12rem] truncate rounded px-2 py-1 text-sm font-semibold text-text-primary lg:max-w-none"
        >
          {value}
        </Badge>
      ) : null}
    </>
  );
}

type SearchHeaderFilterDropdownProps = {
  icon: IconName;
  label: string;
  menuLabel: string;
  value?: ReactNode;
  largeIcon?: boolean;
  /** When set, opens the panel instead of toggling a placeholder menu. */
  onActivate?: () => void;
};

function SearchHeaderFilterDropdown({
  icon,
  label,
  menuLabel,
  value,
  largeIcon,
  onActivate,
}: SearchHeaderFilterDropdownProps) {
  if (onActivate) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={cn(HEADER_FILTER_TRIGGER_CLASS, "w-full justify-start text-left lg:w-auto")}
        aria-label={`${menuLabel} filter`}
        onClick={onActivate}
      >
        <HeaderFilterTrigger icon={icon} label={label} value={value} largeIcon={largeIcon} />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(HEADER_FILTER_TRIGGER_CLASS, "w-full justify-start text-left lg:w-auto")}
          aria-label={`${menuLabel} filter`}
        >
          <HeaderFilterTrigger icon={icon} label={label} value={value} largeIcon={largeIcon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[220px] border-border-container bg-surface-modal text-text-primary"
      >
        <DropdownMenuLabel className="text-xs font-bold uppercase tracking-[0.4px] text-text-tertiary">
          {menuLabel}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border-container" />
        <DropdownMenuItem className="cursor-pointer text-text-secondary focus:bg-overlay-subtle focus:text-text-primary">
          Recent search one
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-text-secondary focus:bg-overlay-subtle focus:text-text-primary">
          Recent search two
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-text-secondary focus:bg-overlay-subtle focus:text-text-primary">
          Saved search
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        largeIcon
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
