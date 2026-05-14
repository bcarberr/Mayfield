import { useId, type ReactNode } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type SwitchProps = {
  /** Controlled on state */
  on: boolean;
  /** Optional label to the right of the control */
  label?: ReactNode;
  onCheckedChange?: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Toggle from Query DS (Figma v1 — Switch, e.g. node 1603:3694).
 * Track 36×18px, thumb 12px; off = tertiary border + thumb; on = interactive-active + #FAFAFA thumb.
 */
export function Switch({ on, label, onCheckedChange, disabled, className }: SwitchProps) {
  const switchId = useId().replace(/:/g, "");
  const toggle = () => {
    if (disabled || !onCheckedChange) return;
    onCheckedChange(!on);
  };
  const interactive = Boolean(onCheckedChange) && !disabled;

  const control = (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={on}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={toggle}
      className={cx(
        "relative h-[18px] w-9 shrink-0 overflow-hidden rounded-[9px] p-0 outline-none",
        "focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal",
        interactive ? "cursor-pointer" : "cursor-default",
      )}
    >
      <span
        aria-hidden
        className={cx(
          "pointer-events-none absolute inset-0 rounded-[9px] transition-colors",
          on ? "bg-interactive-active" : "border border-solid border-text-tertiary bg-transparent",
        )}
      />
      <span
        aria-hidden
        className={cx(
          "pointer-events-none absolute top-[3px] size-3 rounded-full transition-[left]",
          on ? "left-[21px] bg-[#fafafa]" : "left-1 bg-text-tertiary",
        )}
      />
    </button>
  );

  if (label == null || label === false) {
    return <span className={cx("inline-flex shrink-0", className)}>{control}</span>;
  }

  return (
    <label
      htmlFor={switchId}
      className={cx(
        "inline-flex items-center gap-2",
        interactive && "cursor-pointer",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {control}
      <span className="text-sm font-semibold leading-[18px] text-text-tertiary">{label}</span>
    </label>
  );
}
