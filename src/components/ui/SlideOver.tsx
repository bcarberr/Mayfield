import { type ReactNode, useEffect } from "react";

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
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
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
            "relative z-40 mr-5 flex h-full w-[min(100%,480px)] shrink-0 animate-slide-over-in flex-col overflow-hidden border-l border-r border-border-rule bg-surface-modal",
            slideOver.panelClassName,
          )}
        >
          {slideOver.panel}
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
          "relative z-10 ml-auto flex h-full min-h-0 w-full animate-slide-over-in flex-col bg-surface-modal shadow-[-4px_0_24px_rgba(0,0,0,0.25)]",
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>
    </>
  );
}
