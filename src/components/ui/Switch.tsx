import { useId, type ReactNode } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type SwitchProps = {
  /** Controlled checked state */
  checked: boolean;
  disabled?: boolean;
  label?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  /** Optional stable id; otherwise `useId` is used for label association */
  id?: string;
};

/**
 * Query DS Switch (Figma: component `1509:4265`, e.g. light/off `1603:3601`).
 * 36×18px track, 12px thumb. Themes follow `data-theme` via `tokens.css` / `--color-*`.
 * Interactive hover/pressed use `--color-primary-hover` and `--color-primary-pressed`.
 */
export function Switch({ checked, disabled, label, onCheckedChange, className, id: idProp }: SwitchProps) {
  const uid = useId().replace(/:/g, "");
  const switchId = idProp ?? uid;
  const toggle = () => {
    if (disabled || !onCheckedChange) return;
    onCheckedChange(!checked);
  };
  const interactive = Boolean(onCheckedChange) && !disabled;

  const track = (
    <span
      aria-hidden
      className={cx(
        "pointer-events-none absolute inset-0 rounded-[9px] transition-colors duration-150 ease-out",
        disabled &&
          (checked
            ? "bg-[var(--color-switch-track-on-disabled)]"
            : "border border-solid border-[var(--color-switch-off-disabled)] bg-transparent"),
        !disabled &&
          checked &&
          cx(
            "bg-interactive-active",
            "enabled:group-hover:bg-[var(--color-primary-hover)] enabled:group-active:bg-[var(--color-primary-pressed)]",
          ),
        !disabled &&
          !checked &&
          cx(
            "border border-solid border-text-tertiary bg-transparent",
            "enabled:group-hover:border-[var(--color-primary-hover)] enabled:group-active:border-[var(--color-primary-pressed)]",
          ),
      )}
    />
  );

  const thumb = (
    <span
      aria-hidden
      className={cx(
        "pointer-events-none absolute top-[3px] size-3 rounded-full transition-[left,background-color] duration-150 ease-out",
        disabled && checked && "left-[21px] bg-[var(--color-switch-thumb-on-disabled)]",
        disabled && !checked && "left-1 bg-[var(--color-switch-off-disabled)]",
        !disabled && checked && "left-[21px] bg-text-on-primary",
        !disabled &&
          !checked &&
          cx(
            "left-1 bg-text-tertiary",
            "enabled:group-hover:bg-[var(--color-primary-hover)] enabled:group-active:bg-[var(--color-primary-pressed)]",
          ),
      )}
    />
  );

  const control = (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={toggle}
      className={cx(
        "group relative h-[18px] w-9 shrink-0 overflow-hidden rounded-[9px] p-0 outline-none",
        "focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-modal",
        interactive ? "cursor-pointer" : "cursor-default",
      )}
    >
      {track}
      {thumb}
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
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      {control}
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
