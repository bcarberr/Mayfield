import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Icon } from "../../design-system";

const base =
  "flex w-full min-w-0 items-center gap-1 rounded border border-border-rule bg-surface-modal px-1.5 text-sm text-text-primary outline-none transition-[box-shadow] focus-within:ring-1 focus-within:ring-interactive-active";

/** Matches secondary `Button` default height (`min-h-8`). */
const searchShell = "h-8 min-h-8 py-0";
const defaultShell = "py-0.5";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  startAdornment?: ReactNode;
  /** Search-style placeholder treatment */
  variant?: "default" | "search";
  /** When provided and the input has a value, a clear (×) button is shown on the right. */
  onClear?: () => void;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", startAdornment, variant = "default", placeholder, onClear, ...rest },
  ref,
) {
  const phClass = variant === "search" ? "placeholder:font-semibold placeholder:italic placeholder:text-text-tertiary" : "";
  const shellClass = variant === "search" ? searchShell : defaultShell;
  const inputClass =
    variant === "search"
      ? "h-full min-h-0 min-w-0 flex-1 bg-transparent py-0 pr-1 text-sm font-semibold outline-none file:border-0 file:bg-transparent"
      : "min-h-6 min-w-0 flex-1 bg-transparent py-1 pr-1 text-sm font-semibold outline-none file:border-0 file:bg-transparent";
  const effectiveAdornment = startAdornment ?? null;
  const showClear = Boolean(onClear && rest.value);
  return (
    <div className={`${base} ${shellClass} ${className}`.trim()}>
      {effectiveAdornment ? <span className="flex shrink-0 text-text-tertiary">{effectiveAdornment}</span> : null}
      <input
        ref={ref}
        placeholder={placeholder}
        className={`${inputClass} ${phClass}`}
        {...rest}
      />
      {showClear ? (
        <button
          type="button"
          tabIndex={-1}
          className="flex shrink-0 items-center justify-center text-text-tertiary hover:text-text-primary"
          onClick={onClear}
          aria-label="Clear"
        >
          <Icon name="action-cancel-clear" size={14} />
        </button>
      ) : null}
    </div>
  );
});
