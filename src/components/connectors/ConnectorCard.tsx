import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, Switch } from "../../design-system";
import { Button } from "@/components/shadcn/button";
import type { ConnectorInstance } from "./connectorsData";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type ConnectorCardProps = {
  connector: ConnectorInstance;
  onEnabledChange: (enabled: boolean) => void;
  onConfigure?: () => void;
};

export function ConnectorCard({ connector, onEnabledChange, onConfigure }: ConnectorCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const menu =
    menuOpen && buttonRef.current
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${connector.instanceName}`}
            className="fixed z-50 min-w-[9rem] rounded border border-border-container bg-surface-modal py-1 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
            style={{
              top: buttonRef.current.getBoundingClientRect().bottom + 4,
              left: buttonRef.current.getBoundingClientRect().right,
              transform: "translateX(-100%)",
            }}
          >
            {onConfigure ? (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-1.5 text-left text-sm text-text-secondary transition-colors hover:bg-overlay-subtle hover:text-text-primary"
                onClick={() => {
                  setMenuOpen(false);
                  onConfigure();
                }}
              >
                Configure
              </button>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <article
      className={cx(
        "relative flex min-h-[104px] min-w-0 gap-3 rounded-[4px] border border-border-container bg-surface-container p-4 shadow-datavis-card",
        !connector.enabled && "opacity-70",
      )}
    >
      <Icon
        name={connector.icon}
        size={72}
        className="size-[72px] shrink-0 [&_svg]:!size-[72px]"
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 truncate pt-0.5 text-sm font-semibold tracking-[0.4px] text-interactive-active">
            {connector.instanceName}
          </p>
          <Switch checked={connector.enabled} onCheckedChange={onEnabledChange} />
          <Button
            ref={buttonRef}
            type="button"
            variant="ghost"
            className="size-7 shrink-0 p-0 text-text-tertiary hover:text-text-primary [&_svg]:!size-4"
            aria-label={`Actions for ${connector.instanceName}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name="navi-more-vert" size={16} />
          </Button>
        </div>

        <div className="mt-auto border-t border-border-rule pt-3">
          <p className="truncate text-sm tracking-[0.4px] text-text-tertiary">{connector.connectorType}</p>
        </div>
      </div>
      {menu}
    </article>
  );
}
