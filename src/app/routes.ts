/** Client routes — keep in sync with `App` route definitions. */
export const ROUTES = {
  connectors: "/connectors",
  search: "/search",
  summaryInsights: "/summary-insights",
  detections: "/detections",
  intel: "/intel",
  tools: "/tools",
  addons: "/addons",
  adminSettings: "/admin-settings",
} as const;

/** Query param that opens the connector setup slide-over on `ROUTES.connectors`. */
export const CONNECTOR_SETUP_SEARCH_PARAM = "setup";

export function connectorsSetupSearchParams(connectorId = "new"): Record<string, string> {
  return { [CONNECTOR_SETUP_SEARCH_PARAM]: connectorId };
}
