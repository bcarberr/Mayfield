/** Client routes — keep in sync with `App` route definitions. */
export const ROUTES = {
  connectors: "/connectors",
  search: "/search",
  federatedDetectionHub: "/federated-detection-hub",
  summaryInsights: "/summary-insights",
  dataPipelines: "/data-pipelines",
  /** Hidden when `SHOW_AI_AGENTS_PAGE` is false — see `navRailConfig.ts`. */
  aiAgents: "/ai-agents",
  settings: "/settings",
  addons: "/addons",
  adminSettings: "/admin-settings",
} as const;

/** Default landing page — rendered at `/` and aliased at `ROUTES.summaryInsights`. */
export const DEFAULT_ROUTE = ROUTES.summaryInsights;

/** `location.state` when opening connectors as a header slide-over panel. */
export type ConnectorsLocationState = {
  background?: { pathname: string; search: string; hash: string };
  connectorsVariant?: "panel";
};

export function connectorsPanelLocationState(background: {
  pathname: string;
  search: string;
  hash: string;
}): ConnectorsLocationState {
  return { background, connectorsVariant: "panel" };
}

/** `location.state` when opening Federated Detection Hub actions from other pages. */
export type FederatedDetectionHubLocationState = {
  openCreateDetection?: boolean;
  focusManageDetections?: boolean;
};

/** Query param that opens the connector setup slide-over on `ROUTES.connectors`. */
export const CONNECTOR_SETUP_SEARCH_PARAM = "setup";

export function connectorsSetupSearchParams(connectorId = "new"): Record<string, string> {
  return { [CONNECTOR_SETUP_SEARCH_PARAM]: connectorId };
}
