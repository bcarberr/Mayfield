import type { CSSProperties, ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Icon } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
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

const WIDGET_OPTION_ITEMS = ["Export widget", "Pin to dashboard"] as const;

const MENU_ITEM_CLASS =
  "cursor-pointer text-text-secondary focus:bg-overlay-subtle focus:text-text-primary";

export type WidgetVisualizationOption = {
  id: string;
  label: string;
};

export type InsightCardVisualizationConfig = {
  value: string;
  options: readonly WidgetVisualizationOption[];
  onChange: (id: string) => void;
};

export type InsightCardExpandConfig = {
  expanded: boolean;
  onToggle: () => void;
};

/** Overflow menu for insight/chart widget headers (ellipsis → export / pin / viz). */
export function InsightCardHeaderActions({
  visualization,
  expand,
}: {
  visualization?: InsightCardVisualizationConfig;
  /** Horizontal expand control — Lucide Maximize2 / Minimize2. */
  expand?: InsightCardExpandConfig;
} = {}) {
  const showVisualization = Boolean(visualization && visualization.options.length >= 2);

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {expand ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="shrink-0 p-1 text-text-tertiary hover:text-text-primary"
              aria-label={expand.expanded ? "Collapse widget width" : "Expand widget width"}
              aria-pressed={expand.expanded}
              onClick={expand.onToggle}
            >
              {expand.expanded ? (
                <Minimize2 size={16} strokeWidth={1.5} />
              ) : (
                <Maximize2 size={16} strokeWidth={1.5} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{expand.expanded ? "Collapse width" : "Expand width"}</TooltipContent>
        </Tooltip>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 p-1 text-text-tertiary hover:text-text-primary"
            aria-label="Widget options"
          >
            <Icon name="navi-more-vert" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[11rem] rounded border border-border-container bg-surface-modal py-1 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
        >
          {WIDGET_OPTION_ITEMS.map((label) => (
            <DropdownMenuItem key={label} className={MENU_ITEM_CLASS}>
              {label}
            </DropdownMenuItem>
          ))}
          {showVisualization && visualization ? (
            <>
              <DropdownMenuSeparator className="bg-border-container" />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className={MENU_ITEM_CLASS}>
                  Change visualization
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="min-w-[10rem] rounded border border-border-container bg-surface-modal py-1 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                  <DropdownMenuRadioGroup
                    value={visualization.value}
                    onValueChange={visualization.onChange}
                  >
                    {visualization.options.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.id}
                        value={option.id}
                        className={MENU_ITEM_CLASS}
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function InsightCard({
  title,
  children,
  headerActions,
  fillHeight = false,
  compact = false,
  stretch = false,
  className,
  style,
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
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      className={cx(
        "flex min-w-0 flex-col overflow-hidden rounded-[4px] border border-border-container",
        "bg-datavis-card-bg shadow-datavis-card",
        fillHeight ? "min-h-0 flex-1 lg:h-full" : stretch ? "h-full" : "shrink-0",
        className,
      )}
      style={style}
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
            {headerActions ?? <InsightCardHeaderActions />}
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
