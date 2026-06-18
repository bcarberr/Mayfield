import { Icon } from "../../design-system";
import { Button } from "@/components/shadcn/button";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Standard export action for datagrid section headers (Figma-aligned). */
export function DataGridExportButton({
  label = "Export All",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Button type="button" variant="secondary-outline" className={cx("ml-auto shrink-0 gap-1.5", className)}>
      <Icon
        name="action-file-download"
        size={12}
        className="size-3 shrink-0 text-current [&>svg]:!size-[12px]"
        aria-hidden
      />
      {label}
    </Button>
  );
}
