import { type ReactNode, useEffect, useId } from "react";
import { Icon } from "../../design-system";
import { Button } from "@/components/shadcn/button";

export type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, footer, onClose }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay-scrim"
        aria-label="Dismiss overlay"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col rounded-md border border-border-rule bg-surface-modal shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-rule px-4 py-3">
          <h2 id={titleId} className="text-base font-bold tracking-wide text-text-primary">
            {title}
          </h2>
          <Button type="button" variant="ghost" size="icon" aria-label="Close dialog" onClick={onClose}>
            <Icon name="close" size={20} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm text-text-secondary">{children}</div>
        {footer ? <div className="border-t border-border-rule px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
