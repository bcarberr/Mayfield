import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { TimeframeProvider } from "../context/TimeframeContext";
import { ROUTES } from "./routes";

const ConnectorsPage = lazy(() => import("./ConnectorsPage").then((m) => ({ default: m.ConnectorsPage })));
const SearchLandingPage = lazy(() => import("./SearchLandingPage").then((m) => ({ default: m.SearchLandingPage })));
const SummaryInsightsPage = lazy(() =>
  import("./SummaryInsightsPage").then((m) => ({ default: m.SummaryInsightsPage })),
);
const DataPipelinesPage = lazy(() =>
  import("./DataPipelinesPage").then((m) => ({ default: m.DataPipelinesPage })),
);
const FederatedDetectionHubPage = lazy(() =>
  import("./FederatedDetectionHubPage").then((m) => ({ default: m.FederatedDetectionHubPage })),
);
const AiAgentsPage = lazy(() => import("./AiAgentsPage").then((m) => ({ default: m.AiAgentsPage })));
const SettingsPage = lazy(() => import("./SettingsPage").then((m) => ({ default: m.SettingsPage })));
const WorkspacePlaceholderPage = lazy(() =>
  import("./WorkspacePlaceholderPage").then((m) => ({ default: m.WorkspacePlaceholderPage })),
);

function RouteFallback() {
  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-surface-page text-sm text-text-secondary">
      Loading…
    </div>
  );
}

export function App() {
  return (
    <TimeframeProvider>
    <div className="h-full min-h-screen min-h-0">
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<SummaryInsightsPage />} />
          <Route path={ROUTES.connectors} element={<ConnectorsPage />} />
          <Route path={ROUTES.addons} element={<WorkspacePlaceholderPage activeSection="addons" title="Addons" />} />
          <Route path={ROUTES.search} element={<SearchLandingPage />} />
          <Route path={ROUTES.federatedDetectionHub} element={<FederatedDetectionHubPage />} />
          <Route path={ROUTES.summaryInsights} element={<SummaryInsightsPage />} />
          <Route path={ROUTES.dataPipelines} element={<DataPipelinesPage />} />
          <Route path={ROUTES.aiAgents} element={<AiAgentsPage />} />
          <Route path={ROUTES.settings} element={<SettingsPage />} />
          <Route
            path={ROUTES.adminSettings}
            element={<WorkspacePlaceholderPage activeSection="adminSettings" title="Admin Settings" />}
          />
        </Routes>
      </Suspense>
    </div>
    </TimeframeProvider>
  );
}
