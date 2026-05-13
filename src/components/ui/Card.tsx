import { type HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Extra emphasis (border + container bg) */
  elevated?: boolean;
};

export function Card({ className = "", elevated, children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded border border-border-rule bg-surface-modal p-3 ${elevated ? "bg-surface-container shadow-sm" : ""} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
