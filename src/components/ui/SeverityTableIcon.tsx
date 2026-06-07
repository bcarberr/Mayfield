import { Icon, type SeverityShapeIconName } from "../../design-system";

/** 12px-tall severity glyph slot for data grid severity columns. */
export function SeverityTableIcon({ name, color }: { name: SeverityShapeIconName; color: string }) {
  return (
    <span className="inline-flex h-3 shrink-0 items-center [&_svg]:block">
      <Icon name={name} size={12} style={{ color }} aria-hidden />
    </span>
  );
}
