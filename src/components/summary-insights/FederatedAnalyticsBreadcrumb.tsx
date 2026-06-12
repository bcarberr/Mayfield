import { useEffect, useId, useRef, useState } from "react";
import { Icon, type IconName } from "../../design-system";
import { Checkbox } from "../uiCheckbox";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type EventCategoryId =
  | "system-activity"
  | "findings"
  | "identity-access"
  | "network-activity"
  | "discovery"
  | "application-activity"
  | "remediation";

export type FederatedViewId = "entities-overview" | EventCategoryId;

type MenuItem = {
  id: FederatedViewId;
  label: string;
  icon: IconName;
  iconClassName: string;
};

const ENTITIES_OVERVIEW: MenuItem = {
  id: "entities-overview",
  label: "Entities Overview",
  icon: "cyclone",
  iconClassName: "text-datavis-data-smalt-green-20",
};

const EVENT_CATEGORIES: readonly MenuItem[] = [
  {
    id: "system-activity",
    label: "System Activity",
    icon: "ocsf-system-activity",
    iconClassName: "text-datavis-data-peanut-orange",
  },
  {
    id: "findings",
    label: "Findings",
    icon: "ocsf-findings",
    iconClassName: "text-datavis-data-smalt-green-40",
  },
  {
    id: "identity-access",
    label: "Identity & Access",
    icon: "ocsf-identity-access",
    iconClassName: "text-interactive-active",
  },
  {
    id: "network-activity",
    label: "Network Activity",
    icon: "ocsf-network-activity",
    iconClassName: "text-datavis-data-peanut-orange",
  },
  {
    id: "discovery",
    label: "Discovery",
    icon: "ocsf-discovery",
    iconClassName: "text-datavis-data-weak-red-30",
  },
  {
    id: "application-activity",
    label: "Application Activity",
    icon: "ocsf-application-activity",
    iconClassName: "text-datavis-data-rouge-40",
  },
  {
    id: "remediation",
    label: "Remediation",
    icon: "ocsf-remediation",
    iconClassName: "text-datavis-data-pop-teal-20",
  },
] as const;

const FEDERATED_DEFAULT_VIEW_STORAGE_KEY = "mayfield:federated-analytics-default-view";
const FALLBACK_DEFAULT_VIEW: FederatedViewId = "findings";

const ALL_FEDERATED_VIEW_IDS: readonly FederatedViewId[] = [
  "entities-overview",
  ...EVENT_CATEGORIES.map((item) => item.id),
];

function isFederatedViewId(value: string): value is FederatedViewId {
  return (ALL_FEDERATED_VIEW_IDS as readonly string[]).includes(value);
}

/** Last view marked “Set as default” in the Federated Analytics menu. */
export function readDefaultFederatedView(): FederatedViewId {
  if (typeof window === "undefined") return FALLBACK_DEFAULT_VIEW;
  try {
    const stored = window.localStorage.getItem(FEDERATED_DEFAULT_VIEW_STORAGE_KEY);
    if (stored && isFederatedViewId(stored)) return stored;
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
  return FALLBACK_DEFAULT_VIEW;
}

function persistDefaultFederatedView(view: FederatedViewId) {
  try {
    window.localStorage.setItem(FEDERATED_DEFAULT_VIEW_STORAGE_KEY, view);
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
}

const COMING_SOON_FEDERATED_VIEWS: ReadonlySet<FederatedViewId> = new Set([
  "discovery",
  "application-activity",
  "remediation",
]);

export function isComingSoonFederatedView(view: FederatedViewId): boolean {
  return COMING_SOON_FEDERATED_VIEWS.has(view);
}

export function federatedViewLabel(view: FederatedViewId): string {
  if (view === "entities-overview") return ENTITIES_OVERVIEW.label;
  return EVENT_CATEGORIES.find((item) => item.id === view)?.label ?? "Findings";
}

/**
 * Federated Analytics breadcrumb + event category menu — Figma `9320:25841` Search Events dropdown.
 */
type FederatedAnalyticsBreadcrumbProps = {
  activeView: FederatedViewId;
  onViewChange: (view: FederatedViewId) => void;
};

export function FederatedAnalyticsBreadcrumb({ activeView, onViewChange }: FederatedAnalyticsBreadcrumbProps) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [defaultViewId, setDefaultViewId] = useState<FederatedViewId>(readDefaultFederatedView);

  const defaultCheckbox = (viewId: FederatedViewId) => {
    const isDefault = defaultViewId === viewId;
    return (
      <span
        className={cx(
          "ml-2 flex shrink-0 items-center gap-2 transition-opacity",
          isDefault ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        )}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Checkbox
          checked={isDefault}
          onCheckedChange={(checked) => {
            if (!checked) return;
            setDefaultViewId(viewId);
            persistDefaultFederatedView(viewId);
          }}
          label="Set as default"
          labelClassName="text-xs font-normal text-text-primary"
        />
      </span>
    );
  };

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const selectView = (view: FederatedViewId) => {
    onViewChange(view);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className="inline-flex min-w-0 max-w-full items-center rounded py-0.5 text-left text-sm text-text-tertiary transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-interactive-active">
          Federated Analytics
          <Icon
            name="chevron-down"
            size={16}
            className={cx("shrink-0 text-interactive-active transition-transform duration-150", open && "rotate-180")}
            aria-hidden
          />
        </span>
        <span className="ml-1.5 truncate">{federatedViewLabel(activeView)}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Federated Analytics views"
          className="absolute left-0 top-[calc(100%+4px)] z-50 w-[309px] overflow-hidden rounded-[4px] border border-border-container bg-surface-modal shadow-[0_3px_14px_2px_rgba(0,0,0,0.12),0_8px_10px_1px_rgba(0,0,0,0.14),0_5px_5px_-3px_rgba(0,0,0,0.2)]"
        >
          <button
            type="button"
            role="menuitem"
            className="group flex h-12 w-full items-center gap-3 bg-surface-modal px-4 text-left transition-colors hover:bg-overlay-subtle"
            onClick={() => selectView("entities-overview")}
          >
            <Icon
              name={ENTITIES_OVERVIEW.icon}
              size={16}
              className={cx("size-4 shrink-0 [&_svg]:!size-4", ENTITIES_OVERVIEW.iconClassName)}
            />
            <span className="min-w-0 flex-1 truncate text-base-semibold text-text-primary">{ENTITIES_OVERVIEW.label}</span>
            {defaultCheckbox("entities-overview")}
          </button>

          <div className="border-t border-border-container bg-surface-modal pb-2">
            <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-[0.4px] text-text-tertiary">
              Event categories:
            </p>

            {EVENT_CATEGORIES.map((item) => {
              const selected = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  className={cx(
                    "group flex min-h-10 w-full items-center gap-3 px-4 text-left transition-colors",
                    selected ? "bg-interactive-secondary-pressed hover:bg-interactive-secondary-pressed" : "hover:bg-overlay-subtle",
                  )}
                  onClick={() => selectView(item.id)}
                >
                  <Icon
                    name={item.icon}
                    size={16}
                    className={cx("size-4 shrink-0 [&_svg]:!size-4", item.iconClassName)}
                  />
                  <span className="min-w-0 flex-1 truncate text-base-semibold text-text-primary">{item.label}</span>
                  {defaultCheckbox(item.id)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
