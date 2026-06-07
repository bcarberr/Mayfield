/** Client routes — keep in sync with `App` route definitions. */
export const ROUTES = {
  connectors: "/connectors",
  search: "/search",
  federatedDetectionHub: "/federated-detection-hub",
  summaryInsights: "/summary-insights",
  dataPipelines: "/data-pipelines",
  aiAgents: "/ai-agents",
  settings: "/settings",
  addons: "/addons",
  adminSettings: "/admin-settings",
} as const;

/** Default landing page — rendered at `/` and aliased at `ROUTES.summaryInsights`. */
export const DEFAULT_ROUTE = ROUTES.summaryInsights;

/** Query param that opens the connector setup slide-over on `ROUTES.connectors`. */
export const CONNECTOR_SETUP_SEARCH_PARAM = "setup";

export function connectorsSetupSearchParams(connectorId = "new"): Record<string, string> {
  return { [CONNECTOR_SETUP_SEARCH_PARAM]: connectorId };
}
