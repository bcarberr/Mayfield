import { Icon } from "../design-system";
import { Button } from "./ui/Button";
import { ThemeToggle } from "./ThemeToggle";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type SearchTopHeaderProps = {
  /** Page title (defaults to Federated Search). */
  title?: string;
  className?: string;
};

/**
 * Search workspace chrome — Figma Config-Schema-v2 node `7876-102758`.
 * Left: page title; right: theme, help, alerts, divider, account.
 */
export function SearchTopHeader({ title = "Federated Search", className }: SearchTopHeaderProps) {
  return (
    <header className={cx("shrink-0 bg-surface-container", className)}>
      <div className="flex min-h-12 items-center justify-between gap-3 px-5 py-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-page-title text-text-primary">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="flex items-center gap-0 sm:gap-1">
            <Button
              variant="ghost"
              className="text-text-disabled hover:bg-overlay-subtle hover:text-text-disabled [&_svg]:text-current focus-visible:ring-offset-surface-container"
              aria-label="Help"
            >
              <Icon name="nav-quick-help" />
            </Button>
            <Button
              variant="ghost"
              className="text-text-disabled hover:bg-overlay-subtle hover:text-text-disabled [&_svg]:text-current focus-visible:ring-offset-surface-container"
              aria-label="Notifications"
            >
              <Icon name="nav-notifications" />
            </Button>
          </div>
          <span className="h-6 w-px shrink-0 bg-border-container" aria-hidden />
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-container bg-nav-highlight text-xs font-bold tracking-[0.4px] text-text-primary [html[data-theme=light]_&]:text-text-on-primary transition-colors hover:bg-interactive-secondary-pressed/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
            aria-label="Account menu"
          >
            BC
          </button>
        </div>
      </div>
      <div className="mx-5 h-px shrink-0 bg-border-rule" aria-hidden />
    </header>
  );
}
