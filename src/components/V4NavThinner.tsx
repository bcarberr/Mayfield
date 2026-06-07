import type { ImgHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

import { Icon, type IconName } from "../design-system";
import logomarkA from "../assets/nav-v4/logomark-a.svg?url";
import logomarkB from "../assets/nav-v4/logomark-b.svg?url";
import logomarkFsA from "../assets/nav-v4/logomark-fs-a.svg?url";
import logomarkFsB from "../assets/nav-v4/logomark-fs-b.svg?url";
import connectorsFigmaSvg from "../assets/nav-v4/connectors-figma.svg?raw";
import summaryInsightsSvg from "../assets/nav-v4/summary-insights.svg?raw";
import vector1Svg from "../assets/nav-v4/vector-1.svg?raw";
import vector2Svg from "../assets/nav-v4/vector-2.svg?raw";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** ~20px rail glyphs (Tailwind `size-5` = 1.25rem). */
const NAV_ICON = "size-5";
const RAIL_ICON_PX = 20;

function NavRailIcon({ name }: { name: IconName }) {
  return <Icon name={name} size={RAIL_ICON_PX} className="nav-rail-icon shrink-0 text-current" aria-hidden />;
}

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
  children,
  className,
  active,
  to,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  /** Shows the rounded rail highlight behind the icon (current section). */
  active?: boolean;
  /** When set, navigates via client-side routing instead of an inert control. */
  to?: string;
}) {
  const shared = cx(
    "relative flex size-10 shrink-0 items-center justify-center bg-transparent p-0",
    "rounded-sm transition-[color,background-color] duration-150 ease-out",
    !active && "text-nav-icon hover:bg-nav-overlay-subtle hover:text-nav-icon-hover",
    active && "text-nav-icon-active hover:text-nav-icon-active",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-icon-active focus-visible:ring-offset-0 focus-visible:ring-offset-nav-bg",
    to && "no-underline",
    className,
  );

  const body = (
    <>
      {active ? (
        <div className="absolute top-1 left-1 size-8 rounded-md bg-nav-highlight" aria-hidden />
      ) : null}
      <span className="relative z-[1] flex size-full items-center justify-center text-current">{children}</span>
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
    <button type="button" title={title} aria-current={active ? "page" : undefined} className={shared}>
      {body}
    </button>
  );
}

/** Icons on the thin vertical rail; drives which slot shows the active highlight. */
export type V4NavActiveSection =
  | "summary"
  | "search"
  | "connectors"
  | "detections"
  | "intel"
  | "tools"
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

export function V4NavThinner({
  variant = "federated-search",
  activeSection,
  navTargets,
}: V4NavThinnerProps) {
  const isFederated = variant === "federated-search";
  const resolvedActive: V4NavActiveSection | undefined =
    activeSection ?? (isFederated ? "search" : undefined);

  return (
    <aside className="flex h-full min-h-0 w-10 shrink-0 flex-col items-center border-r border-black/30 bg-nav-bg">
      <div className="flex h-10 w-full shrink-0 items-center justify-center" aria-label="Product home">
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

      <NavSlot title="Summary & insights" active={resolvedActive === "summary"} to={navTargets?.summary}>
        {isFederated ? (
          <NavSvgInline svg={vector2Svg} className={NAV_ICON} />
        ) : (
          <NavSvgInline svg={summaryInsightsSvg} className={NAV_ICON} />
        )}
      </NavSlot>

      <NavSlot title="Search" active={resolvedActive === "search"} to={navTargets?.search}>
        <NavSvgInline svg={vector1Svg} className={NAV_ICON} />
      </NavSlot>

      <NavSlot title="Connectors" active={resolvedActive === "connectors"} to={navTargets?.connectors}>
        <NavSvgInline svg={connectorsFigmaSvg} className={NAV_ICON} />
      </NavSlot>

      <NavSlot title="Detections" active={resolvedActive === "detections"} to={navTargets?.detections}>
        <NavRailIcon name="nav-detections" />
      </NavSlot>

      <NavSlot title="Intel" active={resolvedActive === "intel"} to={navTargets?.intel}>
        <NavRailIcon name="nav-investigations-outline" />
      </NavSlot>

      <NavSlot title="Tools" active={resolvedActive === "tools"} to={navTargets?.tools}>
        <NavRailIcon name="nav-tools" />
      </NavSlot>

      <div className="min-h-0 flex-1" aria-hidden />

      <NavSlot title="Addons" active={resolvedActive === "addons"} to={navTargets?.addons}>
        <NavRailIcon name="nav-integrations" />
      </NavSlot>
      <NavSlot title="Admin Settings" active={resolvedActive === "adminSettings"} to={navTargets?.adminSettings}>
        <NavRailIcon name="nav-tenant-settings" />
      </NavSlot>
    </aside>
  );
}
