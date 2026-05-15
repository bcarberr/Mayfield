import type { ImgHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

import logomarkA from "../assets/nav-v4/logomark-a.svg?url";
import logomarkB from "../assets/nav-v4/logomark-b.svg?url";
import logomarkFsA from "../assets/nav-v4/logomark-fs-a.svg?url";
import logomarkFsB from "../assets/nav-v4/logomark-fs-b.svg?url";
import connectorsFigma from "../assets/nav-v4/connectors-figma.svg?url";
import detectionsA from "../assets/nav-v4/detections-a.svg?url";
import detectionsB from "../assets/nav-v4/detections-b.svg?url";
import detectionsC from "../assets/nav-v4/detections-c.svg?url";
import detectionsFs from "../assets/nav-v4/detections-fs.svg?url";
import navVector from "../assets/nav-v4/nav-vector.svg?url";
import summaryInsights from "../assets/nav-v4/summary-insights.svg?url";
import vector1 from "../assets/nav-v4/vector-1.svg?url";
import vector2 from "../assets/nav-v4/vector-2.svg?url";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Connectors hub glyph in interactive cyan (matches `vector-federated` / primary actions). */
function ConnectorsNavIconActive() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="pointer-events-none block size-6 shrink-0 select-none text-interactive-active"
    >
      <path
        fill="currentColor"
        d="M12 2C11.4696 2 10.9609 2.21071 10.5858 2.58579C10.2107 2.96086 10 3.46957 10 4C10.0003 4.35081 10.0928 4.69537 10.2683 4.9991C10.4439 5.30284 10.6962 5.55507 11 5.73047V8.14258C11.322 8.05858 11.653 8 12 8C12.347 8 12.678 8.05858 13 8.14258V5.72852C13.3035 5.55328 13.5557 5.30136 13.7312 4.998C13.9067 4.69463 13.9994 4.35047 14 4C14 3.46957 13.7893 2.96086 13.4142 2.58579C13.0391 2.21071 12.5304 2 12 2ZM4 6C3.46957 6 2.96086 6.21071 2.58579 6.58579C2.21071 6.96086 2 7.46957 2 8C2 8.53043 2.21071 9.03914 2.58579 9.41421C2.96086 9.78929 3.46957 10 4 10C4.39178 9.99961 4.77482 9.88415 5.10156 9.66797L8.0918 11.1641C8.2358 10.4871 8.55905 9.88386 8.99805 9.38086L5.99414 7.87891C5.96332 7.37075 5.73987 6.89347 5.36934 6.54435C4.99881 6.19523 4.50909 6.00056 4 6ZM20 6C19.4909 6.00056 19.0012 6.19523 18.6307 6.54435C18.2601 6.89347 18.0367 7.37075 18.0059 7.87891L15.002 9.38281C15.441 9.88481 15.7642 10.4871 15.9082 11.1641L18.9004 9.66797C19.2266 9.88378 19.6089 9.99922 20 10C20.5304 10 21.0391 9.78929 21.4142 9.41421C21.7893 9.03914 22 8.53043 22 8C22 7.46957 21.7893 6.96086 21.4142 6.58579C21.0391 6.21071 20.5304 6 20 6ZM12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10ZM8.0918 12.8359L5.09961 14.332C4.77342 14.1162 4.39112 14.0008 4 14C3.46957 14 2.96086 14.2107 2.58579 14.5858C2.21071 14.9609 2 15.4696 2 16C2 16.5304 2.21071 17.0391 2.58579 17.4142C2.96086 17.7893 3.46957 18 4 18C4.50909 17.9994 4.99881 17.8048 5.36934 17.4556C5.73987 17.1065 5.96332 16.6293 5.99414 16.1211L8.99805 14.6172C8.55905 14.1152 8.2358 13.5129 8.0918 12.8359ZM15.9082 12.8379C15.7642 13.5139 15.441 14.1161 15.002 14.6191L18.0059 16.1211C18.0367 16.6293 18.2601 17.1065 18.6307 17.4556C19.0012 17.8048 19.4909 17.9994 20 18C20.5304 18 21.0391 17.7893 21.4142 17.4142C21.7893 17.0391 22 16.5304 22 16C22 15.4696 21.7893 14.9609 21.4142 14.5858C21.0391 14.2107 20.5304 14 20 14C19.6082 14.0004 19.2252 14.1158 18.8984 14.332L15.9082 12.8379ZM11 15.8574V18.2715C10.6965 18.4467 10.4443 18.6986 10.2688 19.002C10.0933 19.3054 10.0006 19.6495 10 20C10 20.5304 10.2107 21.0391 10.5858 21.4142C10.9609 21.7893 11.4696 22 12 22C12.5304 22 13.0391 21.7893 13.4142 21.4142C13.7893 21.0391 14 20.5304 14 20C13.9997 19.6492 13.9072 19.3046 13.7317 19.0009C13.5561 18.6972 13.3038 18.4449 13 18.2695V15.8574C12.678 15.9414 12.347 16 12 16C11.653 16 11.322 15.9414 11 15.8574Z"
      />
    </svg>
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
    "relative flex size-10 shrink-0 items-center justify-center bg-transparent p-0 text-text-secondary transition-colors hover:bg-overlay-subtle hover:text-text-primary",
    active && "text-text-primary",
    to && "no-underline",
    className,
  );

  const body =
    active ? (
      <>
        <div className="absolute top-1 left-1 size-8 rounded bg-nav-highlight" aria-hidden />
        <span className="relative z-[1] flex size-full items-center justify-center">{children}</span>
      </>
    ) : (
      children
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
  | "settings"
  | "chat";

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
          <NavImg src={vector2} alt="" className="h-[19px] w-5 object-contain" />
        ) : (
          <NavImg src={summaryInsights} alt="" className="h-8 w-8 object-contain" />
        )}
      </NavSlot>

      <NavSlot title="Search" active={resolvedActive === "search"} to={navTargets?.search}>
        <NavImg src={vector1} alt="" className="size-[18px]" />
      </NavSlot>

      <NavSlot title="Connectors" active={resolvedActive === "connectors"} to={navTargets?.connectors}>
        {resolvedActive === "connectors" ? (
          <ConnectorsNavIconActive />
        ) : (
          <NavImg src={connectorsFigma} alt="" className="size-6" />
        )}
      </NavSlot>

      <NavSlot title="Detections" active={resolvedActive === "detections"} to={navTargets?.detections}>
        <NavImg src={detectionsA} alt="" className="size-10 min-h-10 min-w-10" />
      </NavSlot>

      <NavSlot title="Intel" active={resolvedActive === "intel"} to={navTargets?.intel}>
        <NavImg src={detectionsB} alt="" className="size-10 min-h-10 min-w-10" />
      </NavSlot>

      <NavSlot title="Settings" active={resolvedActive === "settings"} to={navTargets?.settings}>
        <NavImg src={isFederated ? detectionsFs : detectionsC} alt="" className="size-10 min-h-10 min-w-10" />
      </NavSlot>

      <div className="min-h-0 flex-1" aria-hidden />

      <NavSlot title="Chat" active={resolvedActive === "chat"} to={navTargets?.chat}>
        <NavImg src={navVector} alt="" className="size-[18px]" />
      </NavSlot>
    </aside>
  );
}
