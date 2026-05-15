import { forwardRef, type ButtonHTMLAttributes } from "react";

/** Disabled label/icon — `tokens.css` `--color-button-disabled-label` (#737373 dark, #c9c9c9 light). */
const disabledLabel =
  "disabled:!text-[color:var(--color-button-disabled-label)] disabled:[&_svg]:!text-[color:var(--color-button-disabled-label)]";

/** Descendant SVGs (e.g. `Icon`) render at the default 18×18 slot inside every button. */
const base =
  "inline-flex items-center justify-center gap-2 rounded font-semibold text-sm tracking-[0.4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:!size-[18px] [&_svg]:shrink-0";

const variants = {
  primary:
    "bg-interactive-active px-3 py-2 text-text-on-primary hover:opacity-90 active:opacity-100 disabled:opacity-50",
  /**
   * Query DS `Button_Secondary` — Default size — Figma `421:4505`
   * (Dark · disabled + icon: border/text rules-lines `#737373`, h 32, px 12 py 7, gap 4, radius 4).
   */
  secondary:
    `box-border min-h-8 gap-1 rounded-[4px] border border-interactive-active bg-transparent px-3 py-[7px] leading-[14px] text-interactive-active transition-[background-color,border-color,color,opacity] hover:bg-interactive-secondary-hover hover:border-interactive-active active:border-interactive-secondary-pressed active:bg-interactive-secondary-pressed disabled:!border-border-rule disabled:opacity-100 disabled:bg-transparent disabled:hover:!border-border-rule disabled:hover:!bg-transparent ${disabledLabel}`,
  tertiary: `gap-1 px-1 py-2 text-text-secondary hover:bg-overlay-subtle disabled:!opacity-100 ${disabledLabel}`,
  ghost: `gap-1 rounded-full p-1 text-text-primary hover:bg-overlay-subtle disabled:!opacity-100 ${disabledLabel}`,
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
