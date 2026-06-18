import { useEffect } from "react";
import { createPortal } from "react-dom";

export type SnackbarProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  /** Milliseconds before auto-dismiss. Defaults to 4000. Set to 0 to disable. */
  autoHideDuration?: number;
};

export function Snackbar({
  open,
  message,
  onClose,
  autoHideDuration = 4000,
}: SnackbarProps) {
  useEffect(() => {
    if (!open || autoHideDuration <= 0) return;
    const timer = window.setTimeout(onClose, autoHideDuration);
    return () => window.clearTimeout(timer);
  }, [open, autoHideDuration, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4"
      aria-live="polite"
    >
      <div
        role="status"
        className="pointer-events-auto max-w-md rounded border border-border-rule bg-surface-modal px-4 py-3 text-sm font-semibold text-text-primary shadow-[0px_5px_5px_-3px_rgba(0,0,0,0.2),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_3px_14px_2px_rgba(0,0,0,0.12)]"
      >
        {message}
      </div>
    </div>,
    document.body,
  );
}
