import type { HTMLAttributes } from "react";
import type { LucideIcon as LucideIconType } from "lucide-react";

export type LucideIconProps = {
  icon: LucideIconType;
  size?: number;
  strokeWidth?: number;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export function LucideIcon({
  icon: Comp,
  size = 18,
  strokeWidth = 1.5,
  className,
  style,
  ...rest
}: LucideIconProps) {
  const spanClass = ["inline-flex shrink-0 items-center justify-center", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span {...rest} className={spanClass} style={{ lineHeight: 0, ...style }}>
      <Comp size={size} strokeWidth={strokeWidth} />
    </span>
  );
}
