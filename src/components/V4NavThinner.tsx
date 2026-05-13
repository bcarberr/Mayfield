import type { ImgHTMLAttributes, ReactNode } from "react";

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
import vectorFederated from "../assets/nav-v4/vector-federated.svg?url";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

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
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      className={cx(
        "relative flex size-10 shrink-0 items-center justify-center bg-transparent p-0 text-text-secondary transition-colors hover:bg-overlay-subtle hover:text-text-primary",
        className,
      )}
    >
      {children}
    </button>
  );
}

export type V4NavThinnerProps = {
  /** `federated-search` matches Figma `v4 Nav-thinner` + frame `40a` (active search pill). */
  variant?: "federated-search" | "settings";
};

export function V4NavThinner({ variant = "federated-search" }: V4NavThinnerProps) {
  const isFederated = variant === "federated-search";

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

      <NavSlot title="Summary & insights">
        {isFederated ? (
          <NavImg src={vector2} alt="" className="h-[19px] w-5 object-contain" />
        ) : (
          <NavImg src={summaryInsights} alt="" className="h-8 w-8 object-contain" />
        )}
      </NavSlot>

      {isFederated ? (
        <NavSlot title="Search">
          <div className="absolute top-1 left-1 size-8 rounded bg-nav-highlight" aria-hidden />
          <NavImg src={vectorFederated} alt="" className="relative z-[1] size-[18px]" />
        </NavSlot>
      ) : (
        <NavSlot title="Search">
          <NavImg src={vector1} alt="" className="size-[18px]" />
        </NavSlot>
      )}

      <NavSlot title="Connectors">
        <NavImg src={connectorsFigma} alt="" className="size-6" />
      </NavSlot>

      <NavSlot title="Detections">
        <NavImg src={detectionsA} alt="" className="size-10 min-h-10 min-w-10" />
      </NavSlot>

      <NavSlot title="Intel">
        <NavImg src={detectionsB} alt="" className="size-10 min-h-10 min-w-10" />
      </NavSlot>

      <NavSlot title="Settings">
        <NavImg src={isFederated ? detectionsFs : detectionsC} alt="" className="size-10 min-h-10 min-w-10" />
      </NavSlot>

      <div className="min-h-0 flex-1" aria-hidden />

      <NavSlot title="Chat">
        <NavImg src={navVector} alt="" className="size-[18px]" />
      </NavSlot>
    </aside>
  );
}
