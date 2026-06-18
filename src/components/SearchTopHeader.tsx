import type { ReactNode } from "react";
import { Icon } from "../design-system";
import { CopilotSparkMark } from "./SearchCopilotPanel";
import { useCopilot } from "../context/CopilotContext";
import { Button } from "@/components/shadcn/button";
import { Separator } from "@/components/shadcn/separator";
import { cn } from "@/lib/utils";

/** Top-header action glyphs: ~10% larger and brighter than the default 18px / disabled tone. */
const HEADER_ACTION_ICON_SIZE = 20;
const HEADER_ACTION_ICON_CLASS = "brightness-110 [&_svg]:!size-5";
const HEADER_COPILOT_ICON_CLASS = "h-[1.925rem] w-[1.925rem] brightness-110";

export type SearchTopHeaderProps = {
  /** Page title (defaults to Federated Search). */
  title?: string;
  /** Content rendered 32px right of the page title (e.g. search field, filter controls). */
  headerAfterTitle?: ReactNode;
  /** Page actions rendered 32px left of the help icons (e.g. primary buttons). */
  titleTrailing?: ReactNode;
  /** Content rendered after the account avatar (e.g. copilot trigger). */
  accountTrailing?: ReactNode;
  className?: string;
  /** Header + focus ring offset surface — `page` matches Figma Page BG. */
  chromeSurface?: "container" | "page";
};

/**
 * Search workspace chrome — Figma Config-Schema-v2 node `7876-102758`.
 * Left: page title + optional search; right: actions, help, alerts, divider, account.
 */
export function SearchTopHeader({
  title = "Federated Search",
  headerAfterTitle,
  titleTrailing,
  accountTrailing,
  className,
  chromeSurface = "container",
}: SearchTopHeaderProps) {
  const { open: copilotOpen, setOpen: setCopilotOpen } = useCopilot();
  const bg = chromeSurface === "page" ? "bg-surface-page" : "bg-surface-container";
  const ringOffset =
    chromeSurface === "page" ? "focus-visible:ring-offset-surface-page" : "focus-visible:ring-offset-surface-container";

  const headerActions = (
    <>
      {titleTrailing ? <div className="mr-0 flex shrink-0 items-center lg:mr-8">{titleTrailing}</div> : null}
      <div className="flex items-center gap-0 sm:gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "text-text-disabled hover:bg-overlay-subtle hover:text-text-disabled [&_svg]:text-current",
            ringOffset,
          )}
          aria-label="Help"
        >
          <Icon name="nav-quick-help" size={HEADER_ACTION_ICON_SIZE} className={HEADER_ACTION_ICON_CLASS} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "text-text-disabled hover:bg-overlay-subtle hover:text-text-disabled [&_svg]:text-current",
            ringOffset,
          )}
          aria-label="Notifications"
        >
          <Icon name="nav-notifications" size={HEADER_ACTION_ICON_SIZE} className={HEADER_ACTION_ICON_CLASS} />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-6 bg-border-container" />
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className={cn(
          "size-9 shrink-0 rounded-full border-border-container bg-nav-highlight text-xs font-bold tracking-[0.4px] text-text-primary [html[data-theme=light]_&]:text-text-on-primary hover:bg-interactive-secondary-pressed/80",
          ringOffset,
        )}
        aria-label="Account menu"
      >
        BC
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className={cn("group size-9 shrink-0 rounded-full", ringOffset)}
        aria-label={copilotOpen ? "Close assistant panel" : "Open AI Copilot & Agents"}
        aria-expanded={copilotOpen}
        onClick={() => setCopilotOpen((open) => !open)}
      >
        <CopilotSparkMark
          className={cn(
            HEADER_COPILOT_ICON_CLASS,
            "transition-[filter] duration-150 group-hover:brightness-125",
            copilotOpen && "brightness-[1.21]",
          )}
        />
      </Button>
      {accountTrailing ? <div className="flex shrink-0 items-center">{accountTrailing}</div> : null}
    </>
  );

  return (
    <header className={cn("shrink-0", bg, className)}>
      <div className="flex flex-col gap-4 px-5 py-2 lg:min-h-12 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-1 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex w-full min-w-0 items-center justify-between gap-3 lg:w-auto lg:shrink-0">
            <h1 className="min-w-0 truncate text-page-title text-text-primary">{title}</h1>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:hidden">{headerActions}</div>
          </div>

          {headerAfterTitle ? (
            <div className="w-full min-w-0 lg:min-w-0 lg:flex-1">{headerAfterTitle}</div>
          ) : null}
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:gap-3 lg:flex">{headerActions}</div>
      </div>
      <Separator className="mx-5 bg-border-rule" />
    </header>
  );
}
