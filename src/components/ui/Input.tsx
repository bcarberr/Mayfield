import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

const base =
  "flex w-full min-w-0 items-center gap-1 rounded border border-border-rule bg-surface-modal px-1.5 text-sm text-text-primary outline-none transition-[box-shadow] focus-within:ring-1 focus-within:ring-interactive-active";

/** Matches secondary `Button` default height (`min-h-8`). */
const searchShell = "h-8 min-h-8 py-0";
const defaultShell = "py-0.5";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  startAdornment?: ReactNode;
  /** Search-style placeholder treatment */
  variant?: "default" | "search";
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", startAdornment, variant = "default", placeholder, ...rest },
  ref,
) {
  const phClass = variant === "search" ? "placeholder:font-semibold placeholder:italic placeholder:text-text-tertiary" : "";
  const shellClass = variant === "search" ? searchShell : defaultShell;
  const inputClass =
    variant === "search"
      ? "h-full min-h-0 min-w-0 flex-1 bg-transparent py-0 pr-1 text-sm font-semibold outline-none file:border-0 file:bg-transparent"
      : "min-h-6 min-w-0 flex-1 bg-transparent py-1 pr-1 text-sm font-semibold outline-none file:border-0 file:bg-transparent";
  return (
    <div className={`${base} ${shellClass} ${className}`.trim()}>
      {startAdornment ? <span className="flex shrink-0 text-text-tertiary">{startAdornment}</span> : null}
      <input
        ref={ref}
        placeholder={placeholder}
        className={`${inputClass} ${phClass}`}
        {...rest}
      />
    </div>
  );
});
