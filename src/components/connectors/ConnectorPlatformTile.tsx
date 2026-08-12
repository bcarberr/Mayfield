import { Icon } from "../../design-system";
import type { ConnectorPlatformType } from "./connectorPlatformTypes";

export type ConnectorPlatformTileProps = {
  platform: ConnectorPlatformType;
  onSelect: () => void;
};

/** Figma `1718:22340` — add-connector catalog tile (251×144). */
export function ConnectorPlatformTile({ platform, onSelect }: ConnectorPlatformTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-[144px] w-[251px] flex-col items-center justify-center gap-3 rounded border border-border-container bg-surface-container px-4 pt-2 pb-3 text-left shadow-datavis-card transition-colors hover:border-border-rule hover:bg-overlay-subtle"
    >
      <Icon
        name={platform.icon}
        size={72}
        className="size-[72px] shrink-0 [&_svg]:!size-[72px]"
        aria-hidden
      />
      <span className="truncate text-sm font-semibold tracking-[0.4px] text-interactive-active">
        {platform.name}
      </span>
    </button>
  );
}
