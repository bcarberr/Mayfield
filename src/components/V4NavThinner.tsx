import { useState, type ImgHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SHOW_ADDONS_NAV, SHOW_AI_AGENTS_PAGE, SHOW_DESIGN_SYSTEM_NAV } from "../app/navRailConfig";
import { Icon } from "../design-system";

import logomarkA from "../assets/nav-v4/logomark-a.svg?url";
import logomarkB from "../assets/nav-v4/logomark-b.svg?url";
import logomarkFsA from "../assets/nav-v4/logomark-fs-a.svg?url";
import logomarkFsB from "../assets/nav-v4/logomark-fs-b.svg?url";
import addonsSvg from "../assets/nav-v4/addons.svg?raw";
import adminSettingsSvg from "../assets/nav-v4/admin-settings.svg?raw";
import aiAgentsSvg from "../assets/nav-v4/ai-agents.svg?raw";
import chatIntercomSvg from "../assets/nav-v4/chat-intercom.svg?raw";
import connectorsFigmaSvg from "../assets/nav-v4/connectors-figma.svg?raw";
import federatedDetectionHubSvg from "../assets/nav-v4/federated-detection-hub.svg?raw";
import dataMobilitySvg from "../assets/nav-v4/data-mobility.svg?raw";
import searchSvg from "../assets/nav-v4/search.svg?raw";
import settingsSvg from "../assets/nav-v4/settings.svg?raw";
import summaryInsightsSvg from "../assets/nav-v4/summary-insights.svg?raw";
import { ThemeToggle } from "./ThemeToggle";
import { ROUTES } from "../app/routes";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const NAV_RAIL_COLLAPSED_WIDTH = "w-10";
const NAV_RAIL_EXPANDED_WIDTH = "w-[13.75rem]";
const NAV_RAIL_STORAGE_KEY = "mayfield.nav-rail.expanded";

/** Inline SVG from disk so `fill="currentColor"` picks up rail `text-*` from the parent `NavSlot`. */
function NavSvgInline({ svg, className }: { svg: string; className?: string }) {
  return (
    <span
      className={cx(
        "nav-rail-icon pointer-events-none inline-flex shrink-0 select-none text-current [&>svg]:block [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:overflow-visible",
        className,
      )}
      // eslint-disable-next-line react/no-danger -- trusted local asset markup
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function NavImg({
  src,
  alt = "",
  className,
  ...rest
}: { src: string; alt?: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={cx("pointer-events-none block max-h-full max-w-full select-none", className)}
      {...rest}
    />
  );
}

function NavSlot({
  title,
  label,
  children,
  className,
  active,
  to,
  expanded,
}: {
  title: string;
  /** Visible label when expanded; defaults to `title`. */
  label?: string;
  children: ReactNode;
  className?: string;
  /** Shows the rounded rail highlight behind the icon (current section). */
  active?: boolean;
  /** When set, navigates via client-side routing instead of an inert control. */
  to?: string;
  /** When true, show the section label beside the icon. */
  expanded?: boolean;
}) {
  const displayLabel = label ?? title;
  const shared = cx(
    "relative flex h-10 shrink-0 items-center bg-transparent",
    "rounded-sm transition-[color,background-color] duration-150 ease-out",
    expanded ? "w-full gap-2 px-2" : "size-10 justify-center p-0",
    !active && "text-nav-icon hover:bg-nav-overlay-subtle hover:text-nav-icon-hover",
    active && "text-nav-icon-active hover:text-nav-icon-active",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nav-icon-active",
    to && "no-underline",
    className,
  );

  const body = (
    <>
      {active ? (
        <div
          className={cx(
            "absolute rounded-md bg-nav-highlight",
            expanded ? "inset-x-1 inset-y-1" : "top-1 left-1 size-8",
          )}
          aria-hidden
        />
      ) : null}
      <span
        className={cx(
          "relative z-[1] flex shrink-0 items-center justify-center text-current",
          expanded ? "size-10" : "size-full",
        )}
      >
        {children}
      </span>
      {expanded ? (
        <span className="relative z-[1] min-w-0 flex-1 truncate text-left text-sm font-semibold leading-5">
          {displayLabel}
        </span>
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        title={title}
        aria-label={title}
        aria-current={active ? "page" : undefined}
        className={shared}
      >
        {body}
      </Link>
    );
  }

  return (
    <button type="button" title={title} aria-label={title} aria-current={active ? "page" : undefined} className={shared}>
      {body}
    </button>
  );
}

function readStoredExpanded(): boolean {
  try {
    return window.localStorage.getItem(NAV_RAIL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Icons on the thin vertical rail; drives which slot shows the active highlight. */
export type V4NavActiveSection =
  | "summary"
  | "search"
  | "federatedDetectionHub"
  | "connectors"
  | "dataPipelines"
  | "aiAgents"
  | "settings"
  | "addons"
  | "adminSettings";

export type V4NavThinnerProps = {
  /** `federated-search` matches Figma `v4 Nav-thinner` + frame `40a` (active search pill). */
  variant?: "federated-search" | "settings";
  /** Which item is highlighted; defaults to Search when `variant` is `federated-search`. */
  activeSection?: V4NavActiveSection;
  /** SPA paths for rail items that should navigate (others stay as buttons). */
  navTargets?: Partial<Record<V4NavActiveSection, string>>;
};

/**
 * Thin vertical nav rail — Figma `6582:59669` (`v4 Nav-thinner`).
 * Icon assets exported from the same frame; sizes match Figma slot geometry.
 * Chevron at the bottom expands the rail so section names are visible.
 */
export function V4NavThinner({
  variant = "federated-search",
  activeSection,
  navTargets,
}: V4NavThinnerProps) {
  const isFederated = variant === "federated-search";
  const resolvedActive: V4NavActiveSection | undefined =
    activeSection ?? (isFederated ? "search" : undefined);
  const [expanded, setExpanded] = useState(readStoredExpanded);

  const toggleExpanded = () => {
    setExpanded((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(NAV_RAIL_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore quota / private mode */
      }
      return next;
    });
  };

  return (
    <aside
      className={cx(
        "flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-black/30 bg-nav-bg",
        "transition-[width] duration-200 ease-out",
        expanded ? NAV_RAIL_EXPANDED_WIDTH : cx(NAV_RAIL_COLLAPSED_WIDTH, "items-center"),
      )}
      data-expanded={expanded ? "true" : "false"}
    >
      <div
        className={cx(
          "flex h-10 w-full shrink-0 items-center",
          expanded ? "justify-start px-3" : "justify-center",
        )}
        aria-label="Product home"
      >
        {isFederated ? (
          <div className="flex h-4 w-[22px] items-end justify-center gap-px">
            <NavImg src={logomarkFsA} alt="" className="h-4 w-2.5 object-contain object-left-bottom" />
            <NavImg src={logomarkFsB} alt="" className="h-4 w-4 object-contain" />
          </div>
        ) : (
          <div className="flex h-4 w-[22px] items-end justify-center gap-px">
            <NavImg src={logomarkA} alt="" className="h-4 w-3 object-contain object-bottom" />
            <NavImg src={logomarkB} alt="" className="h-4 w-3.5 object-contain object-bottom" />
          </div>
        )}
      </div>

      <div className={cx("flex w-full flex-col", expanded ? "px-1" : "items-center")}>
        <NavSlot
          title="Federated Analytics"
          label="Analytics"
          active={resolvedActive === "summary"}
          to={navTargets?.summary}
          expanded={expanded}
        >
          <NavSvgInline svg={summaryInsightsSvg} className="size-10" />
        </NavSlot>

        <NavSlot
          title="Federated Search"
          label="Search"
          active={resolvedActive === "search"}
          to={navTargets?.search}
          expanded={expanded}
        >
          <NavSvgInline svg={searchSvg} className="size-10" />
        </NavSlot>

        <NavSlot
          title="Federated Detection Hub"
          label="Detection Hub"
          active={resolvedActive === "federatedDetectionHub"}
          to={navTargets?.federatedDetectionHub}
          expanded={expanded}
        >
          <NavSvgInline svg={federatedDetectionHubSvg} className="h-[27px] w-7" />
        </NavSlot>

        <NavSlot
          title="Connectors"
          active={resolvedActive === "connectors"}
          to={navTargets?.connectors}
          expanded={expanded}
        >
          <NavSvgInline svg={connectorsFigmaSvg} className="size-6" />
        </NavSlot>

        <NavSlot
          title="Data Pipeline"
          active={resolvedActive === "dataPipelines"}
          to={navTargets?.dataPipelines}
          expanded={expanded}
        >
          <NavSvgInline svg={dataMobilitySvg} className="h-4 w-6" />
        </NavSlot>

        {SHOW_AI_AGENTS_PAGE ? (
          <NavSlot
            title="AI Agents"
            active={resolvedActive === "aiAgents"}
            to={navTargets?.aiAgents}
            expanded={expanded}
          >
            <NavSvgInline svg={aiAgentsSvg} className="h-6 w-[18px]" />
          </NavSlot>
        ) : null}

        {SHOW_ADDONS_NAV ? (
          <NavSlot title="Addons" active={resolvedActive === "addons"} to={navTargets?.addons} expanded={expanded}>
            <NavSvgInline svg={addonsSvg} className="h-[23px] w-[25px]" />
          </NavSlot>
        ) : null}

        <NavSlot
          title="Admin Settings"
          active={resolvedActive === "adminSettings"}
          to={navTargets?.adminSettings}
          expanded={expanded}
        >
          <NavSvgInline svg={adminSettingsSvg} className="size-[25px]" />
        </NavSlot>

        <NavSlot
          title="Settings"
          active={resolvedActive === "settings"}
          to={navTargets?.settings}
          expanded={expanded}
        >
          <NavSvgInline svg={settingsSvg} className="size-6" />
        </NavSlot>

        <button
          type="button"
          title={expanded ? "Collapse navigation" : "Expand navigation"}
          aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
          aria-expanded={expanded}
          onClick={toggleExpanded}
          className={cx(
            "relative flex h-10 shrink-0 items-center rounded-sm bg-transparent",
            "text-nav-icon transition-[color,background-color] duration-150 ease-out",
            "hover:bg-nav-overlay-subtle hover:text-nav-icon-hover",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nav-icon-active",
            expanded ? "w-full gap-2 px-2" : "size-10 justify-center p-0",
          )}
        >
          <span className={cx("flex shrink-0 items-center justify-center", expanded ? "size-10" : "size-full")}>
            <Icon
              name={expanded ? "navi-chevron-left" : "navi-chevron-right"}
              size={18}
              className="block"
              aria-hidden
            />
          </span>
          {expanded ? (
            <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold leading-5">Collapse</span>
          ) : null}
        </button>
      </div>

      <div className="min-h-0 flex-1" aria-hidden />

      <div className={cx("flex w-full flex-col", expanded ? "px-1" : "items-center")}>
        <Link
          to={ROUTES.designSystem}
          aria-label="Design system"
          title="Design system"
          className={cx(
            "relative flex h-10 shrink-0 items-center rounded-sm transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nav-icon-active",
            expanded ? "w-full gap-2 px-2" : "size-10 justify-center",
            SHOW_DESIGN_SYSTEM_NAV
              ? "text-nav-icon hover:bg-nav-overlay-subtle hover:text-nav-icon-hover"
              : "opacity-0 hover:bg-transparent focus-visible:opacity-100",
          )}
        >
          <span className={cx("flex shrink-0 items-center justify-center", expanded ? "size-8" : "size-full")}>
            <div className="size-[18px] rounded-full bg-white/5 ring-1 ring-inset ring-white/10" aria-hidden />
          </span>
          {expanded && SHOW_DESIGN_SYSTEM_NAV ? (
            <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold leading-5">Design system</span>
          ) : null}
        </Link>

        <ThemeToggle
          className={cx(expanded && "h-10 w-full justify-start gap-2 px-2")}
          label={expanded ? "Theme" : undefined}
        />

        <NavSlot title="Chat" expanded={expanded}>
          <NavSvgInline svg={chatIntercomSvg} className="size-[18px]" />
        </NavSlot>
      </div>
    </aside>
  );
}
