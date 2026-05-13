import { forwardRef, type ButtonHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center gap-1 rounded font-semibold text-sm tracking-[0.4px] transition-colors focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-interactive-active px-3 py-2 text-text-on-primary hover:opacity-90",
  secondary:
    "border border-interactive-secondary-pressed bg-transparent px-3 py-2 text-interactive-active hover:bg-interactive-active/10",
  tertiary: "px-1 py-2 text-text-secondary hover:bg-overlay-subtle",
  ghost: "rounded-full p-1 text-text-primary hover:bg-overlay-subtle",
} as const;

export type ButtonVariant = keyof typeof variants;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "primary", type = "button", ...rest },
  ref,
) {
  return <button ref={ref} type={type} className={`${base} ${variants[variant]} ${className}`.trim()} {...rest} />;
});
