import { Icon } from "../../design-system";
import { connectorIconForInstanceName } from "../connectors/connectorInstanceIcon";
import { TruncatedText } from "./TruncatedText";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export function ConnectorTableCell({
  name,
  className,
  textClassName = "text-sm text-text-secondary",
}: {
  name: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cx("inline-flex min-w-0 items-center gap-2", className)}>
      <Icon
        name={connectorIconForInstanceName(name)}
        size={24}
        className="size-6 shrink-0 [&_svg]:!size-6"
        aria-hidden
      />
      <TruncatedText className={textClassName} wrapperClassName="min-w-0 flex-1">
        {name}
      </TruncatedText>
    </span>
  );
}
