import { Icon } from "../../design-system";
import { Button } from "./Button";

export function ColumnHeaderMenu({ label, menuLabel }: { label: string; menuLabel: string }) {
  return (
    <div className="flex w-full min-w-0 translate-y-px items-center justify-between gap-1">
      <span className="truncate">{label}</span>
      <Button
        type="button"
        variant="ghost"
        className="size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4"
        aria-label={menuLabel}
      >
        <Icon name="extra-menu" size={16} />
      </Button>
    </div>
  );
}
