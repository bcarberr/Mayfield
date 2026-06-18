type EventCategoryId =
  | "system-activity"
  | "findings"
  | "identity-access"
  | "network-activity"
  | "discovery"
  | "application-activity"
  | "remediation";

export type FederatedViewId = "entities-overview" | EventCategoryId;

const ENTITIES_OVERVIEW_LABEL = "Entities Overview";

const EVENT_CATEGORY_LABELS: Record<EventCategoryId, string> = {
  "system-activity": "System Activity",
  findings: "Findings",
  "identity-access": "Identity & Access",
  "network-activity": "Network Activity",
  discovery: "Discovery",
  "application-activity": "Application Activity",
  remediation: "Remediation",
};

const FEDERATED_DEFAULT_VIEW_STORAGE_KEY = "mayfield:federated-analytics-default-view";
const FALLBACK_DEFAULT_VIEW: FederatedViewId = "findings";

const ALL_FEDERATED_VIEW_IDS: readonly FederatedViewId[] = [
  "entities-overview",
  ...Object.keys(EVENT_CATEGORY_LABELS) as EventCategoryId[],
];

function isFederatedViewId(value: string): value is FederatedViewId {
  return (ALL_FEDERATED_VIEW_IDS as readonly string[]).includes(value);
}

/** Default Federated Analytics tab on load (persisted from prior “set as default” if any). */
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

const COMING_SOON_FEDERATED_VIEWS: ReadonlySet<FederatedViewId> = new Set([]);

export function isComingSoonFederatedView(view: FederatedViewId): boolean {
  return COMING_SOON_FEDERATED_VIEWS.has(view);
}

export function federatedViewLabel(view: FederatedViewId): string {
  if (view === "entities-overview") return ENTITIES_OVERVIEW_LABEL;
  return EVENT_CATEGORY_LABELS[view] ?? "Findings";
}

/** Tab order and labels for the Federated Analytics shell (matches Detection Hub line tabs). */
export const FEDERATED_ANALYTICS_TABS: readonly { id: FederatedViewId; tabLabel: string }[] = [
  { id: "findings", tabLabel: "Findings" },
  { id: "system-activity", tabLabel: "System Activity" },
  { id: "identity-access", tabLabel: "Identity & Access" },
  { id: "network-activity", tabLabel: "Network Activity" },
  { id: "discovery", tabLabel: "Discovery" },
  { id: "application-activity", tabLabel: "Application Activity" },
  { id: "remediation", tabLabel: "Remediation" },
  { id: "entities-overview", tabLabel: "Entities" },
];
