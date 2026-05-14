import { useId, type ReactNode } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width={10} height={10} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6L5 8.5L10 2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IndeterminateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width={10} height={8} viewBox="0 0 12 10" fill="none" aria-hidden>
      <path d="M2 5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export type CheckboxProps = {
  /** Controlled checked state (`false` when `indeterminate` is shown) */
  checked: boolean;
  /** Renders the indeterminate (mixed) state; first toggle typically clears this to checked */
  indeterminate?: boolean;
  disabled?: boolean;
  label?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  id?: string;
};

/**
 * Query DS Checkbox (Figma `1509:3673`, e.g. light default checked `1509:3672`).
 * 16×16px control. Themes use `tokens.css` semantic `--color-*`.
 */
export function Checkbox({
  checked,
  indeterminate = false,
  disabled,
  label,
  onCheckedChange,
  className,
  id: idProp,
}: CheckboxProps) {
  const uid = useId().replace(/:/g, "");
  const boxId = idProp ?? uid;
  const interactive = Boolean(onCheckedChange) && !disabled;

  const toggle = () => {
    if (disabled || !onCheckedChange) return;
    if (indeterminate) onCheckedChange(true);
    else onCheckedChange(!checked);
  };

  const filled = checked || indeterminate;

  const box = (
    <button
      id={boxId}
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={toggle}
      className={cx(
        "relative box-border flex size-4 shrink-0 items-center justify-center rounded-sm outline-none transition-colors duration-150 ease-out",
        "focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal",
        interactive ? "cursor-pointer" : "cursor-default",
        disabled &&
          !filled &&
          "border border-solid border-[var(--color-switch-off-disabled)] bg-transparent",
        disabled &&
          filled &&
          "border-0 bg-[var(--color-switch-track-on-disabled)] text-[var(--color-switch-thumb-on-disabled)]",
        !disabled &&
          !filled &&
          cx(
            "border border-solid border-text-tertiary bg-transparent",
            "enabled:hover:border-[var(--color-primary-hover)] enabled:active:border-[var(--color-primary-pressed)]",
          ),
        !disabled &&
          filled &&
          cx(
            "border-0 bg-interactive-active text-text-on-primary",
            "enabled:hover:bg-[var(--color-primary-hover)] enabled:active:bg-[var(--color-primary-pressed)]",
          ),
      )}
    >
      {checked && !indeterminate ? <CheckIcon className="pointer-events-none" /> : null}
      {indeterminate ? <IndeterminateIcon className="pointer-events-none" /> : null}
    </button>
  );

  if (label == null || label === false) {
    return <span className={cx("inline-flex shrink-0", className)}>{box}</span>;
  }

  return (
    <label
      htmlFor={boxId}
      className={cx(
        "inline-flex items-center gap-2",
        interactive && "cursor-pointer",
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      {box}
      <span
        className={cx(
          "text-sm font-semibold leading-[18px] text-text-tertiary",
          disabled && "opacity-60",
        )}
      >
        {label}
      </span>
    </label>
  );
}
