import { Icon } from "../../design-system";
import { Button } from "./Button";

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
    <Button type="button" variant="secondary" className={cx("ml-auto shrink-0 gap-1.5", className)}>
      <Icon name="action-file-download" size={18} aria-hidden />
      {label}
    </Button>
  );
}
