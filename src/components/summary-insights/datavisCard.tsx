import type { ReactNode } from "react";
import { Icon } from "../../design-system";
import { Button } from "../ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";

export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Horizontal rule using Datavis/Gridlines; inset 20px per side by default. */
export function DatavisGridlineRule({ inset = true }: { inset?: boolean }) {
  return <div className={cx("h-px shrink-0 bg-datavis-gridlines", inset && "mx-[20px]")} aria-hidden />;
}

export function InsightCard({
  title,
  children,
  headerActions,
  fillHeight = false,
  compact = false,
  stretch = false,
}: {
  title?: string;
  children: ReactNode;
  headerActions?: ReactNode;
  /** When true, card stretches to fill a grid/flex parent (e.g. findings chart row). */
  fillHeight?: boolean;
  /** Reduced header/body padding for compact dashboard widget rows. */
  compact?: boolean;
  /** Match sibling height in a stretched grid row without forcing full-page flex growth. */
  stretch?: boolean;
}) {
  return (
    <section
      className={cx(
        "flex min-w-0 flex-col overflow-hidden rounded-[4px] border border-border-container",
        "bg-datavis-card-bg shadow-[0_1px_5px_rgba(0,0,0,0.2),0_2px_2px_rgba(0,0,0,0.14)]",
        fillHeight ? "min-h-0 flex-1 lg:h-full" : stretch ? "h-full" : "shrink-0",
      )}
    >
      {title || headerActions ? (
        <>
          <header
            className={cx(
              "flex shrink-0 items-center gap-3 bg-datavis-card-bg px-4 sm:px-5",
              title ? "justify-between" : "justify-end",
              compact ? "py-2.5" : "py-3",
            )}
          >
            {title ? (
              <h2 className="min-w-0 truncate text-base-semibold text-text-primary">{title}</h2>
            ) : null}
            {headerActions ?? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="shrink-0 p-1 text-text-tertiary hover:text-text-primary" aria-label="Chart options">
                    <Icon name="navi-more-vert" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Chart options</TooltipContent>
              </Tooltip>
            )}
          </header>
          <DatavisGridlineRule />
        </>
      ) : null}
      <div
        className={cx(
          "flex flex-col bg-datavis-card-bg sm:px-4",
          compact ? "px-3 py-3.5" : "px-3 pb-4 pt-3",
          fillHeight || stretch ? "min-h-0 flex-1" : "shrink-0",
        )}
      >
        {children}
      </div>
    </section>
  );
}
