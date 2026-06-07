import { forwardRef, type ButtonHTMLAttributes } from "react";

/** Disabled label/icon — `tokens.css` `--color-button-disabled-label` (#737373 dark, #c9c9c9 light). */
const disabledLabel =
  "disabled:!text-[color:var(--color-button-disabled-label)] disabled:[&_svg]:!text-[color:var(--color-button-disabled-label)]";

/** Descendant SVGs (e.g. `Icon`) render at the default 18×18 slot inside every button. */
const base =
  "inline-flex items-center justify-center gap-2 rounded font-semibold text-sm tracking-[0.4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:!size-[18px] [&_svg]:shrink-0";

const secondaryBase = `box-border gap-1 rounded-[4px] border bg-transparent px-3 leading-[14px] text-interactive-active transition-[background-color,border-color,color,opacity] hover:bg-interactive-secondary-hover hover:border-interactive-active active:border-interactive-secondary-pressed active:bg-interactive-secondary-pressed disabled:!border-border-rule disabled:opacity-100 disabled:bg-transparent disabled:hover:!border-border-rule disabled:hover:!bg-transparent ${disabledLabel}`;

const variants = {
  primary:
    "bg-interactive-active px-3 py-2 text-text-on-primary hover:opacity-90 active:opacity-100 disabled:opacity-50",
  tertiary: `gap-1 px-1 py-2 text-text-secondary hover:bg-overlay-subtle disabled:!opacity-100 ${disabledLabel}`,
  ghost: `gap-1 rounded-full p-1 text-text-primary hover:bg-overlay-subtle disabled:!opacity-100 ${disabledLabel}`,
} as const;

/** Figma `421:2658` `Button_Secondary` — Default `421:4443`, Small `421:4441`. */
const secondarySizes = {
  default:
    "min-h-8 border-interactive-secondary-pressed py-[7px] hover:text-text-primary active:text-text-primary",
  small:
    "h-6 min-h-6 border-interactive-secondary-pressed py-[3px] hover:text-text-primary active:text-text-primary",
} as const;

export type ButtonVariant = keyof typeof variants | "secondary";
export type ButtonSize = keyof typeof secondarySizes;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Secondary only — Figma Small is 24px (`421:4441`). */
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "primary", size = "default", type = "button", ...rest },
  ref,
) {
  const variantClass =
    variant === "secondary" ? `${secondaryBase} ${secondarySizes[size]}` : variants[variant];

  return <button ref={ref} type={type} className={`${base} ${variantClass} ${className}`.trim()} {...rest} />;
});
