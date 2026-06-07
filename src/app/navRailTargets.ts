import type { V4NavActiveSection } from "../components/V4NavThinner";
import { ROUTES } from "./routes";

/** Paths for every linked item on `V4NavThinner` (federated rail). */
export const NAV_RAIL_TARGETS: Partial<Record<V4NavActiveSection, string>> = {
  summary: ROUTES.summaryInsights,
  search: ROUTES.search,
  federatedDetectionHub: ROUTES.federatedDetectionHub,
  connectors: ROUTES.connectors,
  dataPipelines: ROUTES.dataPipelines,
  aiAgents: ROUTES.aiAgents,
  settings: ROUTES.settings,
  addons: ROUTES.addons,
  adminSettings: ROUTES.adminSettings,
};
