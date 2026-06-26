import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../../design-system";
import { useCopilot, useCopilotLayoutInset } from "../../context/CopilotContext";
import { Button } from "@/components/shadcn/button";

export type SlideOverProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible name when the panel has no visible title element. */
  ariaLabel?: string;
  /** When true, covers the left nav rail with the same scrim so rail items are not interactive. */
  dimNav?: boolean;
  /** Optional classes for the sliding panel (e.g. max width). */
  panelClassName?: string;
};

/** Panel payload for {@link ContentAreaSlideOverHost} — matches Search copilot layout below page header. */
export type ContentAreaSlideOverState = {
  ariaLabel: string;
  onClose: () => void;
  panel: ReactNode;
  panelClassName?: string;
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Header back chevron — use in slide-over panel title rows (Add Connector, setup, etc.). */
export function SlideOverHeaderBackButton({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cx("size-8 shrink-0 rounded-2xl p-1", className)}
      aria-label="Close panel"
      title="Close"
      onClick={onClose}
    >
      <Icon name="navi-chevron-left" size={20} aria-hidden />
    </Button>
  );
}

function SlideOverPanelFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("relative flex h-full min-h-0 flex-col overflow-visible", className)}>
      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

/** Panel width for connector setup / add flows — full content column (container minus `w-10` nav rail). */
export const CONNECTOR_PAGE_SLIDE_OVER_PANEL_CLASS = "w-[calc(100%-2.5rem)] max-w-none shrink-0";

/** Full container width — panel and scrim cover nav rail and entire available area. */
export const FULL_VIEWPORT_SLIDE_OVER_PANEL_CLASS = "w-full max-w-none shrink-0";

/** Three-quarter container width — full scrim with panel aligned right (~75%). */
export const THREE_QUARTER_VIEWPORT_SLIDE_OVER_PANEL_CLASS = "w-[75%] max-w-none shrink-0";

/** max-w-2xl form column (42rem) + 24px horizontal padding on each side (48px total). */
export const FORM_CONTENT_SLIDE_OVER_PANEL_CLASS = "w-[calc(42rem+48px)] max-w-none shrink-0";

/** Floating footer wrapper — sticky action cluster at bottom-right of slide-over panels. */
export const SLIDE_OVER_FLOATING_FOOTER_WRAPPER_CLASS =
  "pointer-events-none absolute bottom-0 right-0 z-20 flex justify-end p-4";

/** Floating footer panel — matches Add Connector / Create Detection footer chrome. */
export const SLIDE_OVER_FLOATING_FOOTER_PANEL_CLASS =
  "pointer-events-auto flex items-center gap-2 rounded-tl-lg rounded-bl-lg bg-surface-container/80 px-3 py-2.5 shadow-lg ring-1 ring-border-container backdrop-blur-sm";

/** Figma default action control — 32px total height for slide-over footer buttons. */
export const SLIDE_OVER_FOOTER_BUTTON_CLASS =
  "box-border h-8 min-h-8 max-h-8 shrink-0 py-0 leading-[14px]";

/** Cancel-style ghost control in floating footers — 32px height, compact horizontal padding. */
export const SLIDE_OVER_FOOTER_GHOST_BUTTON_CLASS = cx(
  SLIDE_OVER_FOOTER_BUTTON_CLASS,
  "gap-1 px-1 text-text-secondary hover:text-text-primary",
);

/**
 * Full-viewport modal drawer — scrim covers nav + page header; panel slides in from the right at full height.
 * Figma Modal Scrim + page drawer (`1718:21521`, `1718:21522`).
 */
export function PageSlideOver({
  open,
  onClose,
  children,
  ariaLabel = "Panel",
  panelClassName = CONNECTOR_PAGE_SLIDE_OVER_PANEL_CLASS,
}: Omit<SlideOverProps, "dimNav">) {
  const copilotInset = useCopilotLayoutInset();
  const { isResizingCopilot } = useCopilot();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={cx(
        "fixed inset-y-0 left-0 z-50 flex overflow-hidden",
        !isResizingCopilot && "transition-[right] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
      )}
      style={{ right: copilotInset }}
    >
      <button
        type="button"
        className="absolute inset-0 animate-overlay-scrim-in bg-overlay-scrim"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cx(
          "relative z-10 ml-auto flex h-full min-h-0 animate-slide-over-in flex-col overflow-visible border-l border-border-rule bg-surface-modal shadow-[-4px_0_24px_rgba(0,0,0,0.25)]",
          panelClassName ?? CONNECTOR_PAGE_SLIDE_OVER_PANEL_CLASS,
        )}
      >
        <SlideOverPanelFrame>{children}</SlideOverPanelFrame>
      </aside>
    </div>,
    document.body,
  );
}

/**
 * Content-column drawer host — main area + right aside below `SearchTopHeader`,
 * aligned to the header rule line (same pattern as `SearchCopilotAside`).
 */
export function ContentAreaSlideOverHost({
  slideOver,
  children,
}: {
  slideOver: ContentAreaSlideOverState | null;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!slideOver) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") slideOver.onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [slideOver]);

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
        {slideOver ? (
          <button
            type="button"
            className="absolute inset-0 z-30 animate-overlay-scrim-in bg-overlay-scrim"
            aria-label="Close panel"
            onClick={slideOver.onClose}
          />
        ) : null}
      </div>
      {slideOver ? (
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={slideOver.ariaLabel}
          className={cx(
            "relative z-40 mr-5 flex h-full shrink-0 animate-slide-over-in flex-col overflow-visible border-l border-r border-border-rule bg-surface-modal",
            slideOver.panelClassName ?? "w-[min(100%,480px)]",
          )}
        >
          <SlideOverPanelFrame>{slideOver.panel}</SlideOverPanelFrame>
        </aside>
      ) : null}
    </div>
  );
}

/**
 * Full-height panel that slides in over the main content column.
 * Parent must be `position: relative` with bounded height.
 */
export function SlideOver({
  open,
  onClose,
  children,
  ariaLabel = "Panel",
  dimNav = false,
  panelClassName,
}: SlideOverProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {dimNav ? (
        <button
          type="button"
          className="fixed inset-y-0 left-0 z-40 w-10 animate-overlay-scrim-in bg-overlay-scrim"
          aria-label="Close panel"
          onClick={onClose}
        />
      ) : null}
      <div className="absolute inset-0 z-40 flex min-h-0 overflow-hidden">
        <button
          type="button"
          className="absolute inset-0 animate-overlay-scrim-in bg-overlay-scrim"
          aria-label="Close panel"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          className={cx(
            "relative z-10 ml-auto flex h-full min-h-0 w-full animate-slide-over-in flex-col overflow-visible bg-surface-modal shadow-[-4px_0_24px_rgba(0,0,0,0.25)]",
            panelClassName,
          )}
        >
          <SlideOverPanelFrame>{children}</SlideOverPanelFrame>
        </div>
      </div>
    </>
  );
}
