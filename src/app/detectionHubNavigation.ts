import type { NavigateFunction } from "react-router-dom";
import { ROUTES, type FederatedDetectionHubLocationState } from "./routes";

/** Navigate to Federated Detection Hub with the create-detection slide-over open. */
export function navigateToCreateDetection(navigate: NavigateFunction) {
  const state: FederatedDetectionHubLocationState = { openCreateDetection: true };
  navigate(ROUTES.federatedDetectionHub, { state });
}
