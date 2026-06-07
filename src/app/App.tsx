import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "./routes";

const ConnectorsPage = lazy(() => import("./ConnectorsPage").then((m) => ({ default: m.ConnectorsPage })));
const SearchLandingPage = lazy(() => import("./SearchLandingPage").then((m) => ({ default: m.SearchLandingPage })));
const SummaryInsightsPage = lazy(() =>
  import("./SummaryInsightsPage").then((m) => ({ default: m.SummaryInsightsPage })),
);
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
    <div className="h-full min-h-screen min-h-0">
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to={ROUTES.connectors} replace />} />
          <Route path={ROUTES.connectors} element={<ConnectorsPage />} />
          <Route path={ROUTES.addons} element={<WorkspacePlaceholderPage activeSection="addons" title="Addons" />} />
          <Route path={ROUTES.search} element={<SearchLandingPage />} />
          <Route path={ROUTES.summaryInsights} element={<SummaryInsightsPage />} />
          <Route
            path={ROUTES.detections}
            element={<WorkspacePlaceholderPage activeSection="detections" title="Detections" />}
          />
          <Route path={ROUTES.intel} element={<WorkspacePlaceholderPage activeSection="intel" title="Intel" />} />
          <Route path={ROUTES.tools} element={<WorkspacePlaceholderPage activeSection="tools" title="Tools" />} />
          <Route
            path={ROUTES.adminSettings}
            element={<WorkspacePlaceholderPage activeSection="adminSettings" title="Admin Settings" />}
          />
        </Routes>
      </Suspense>
    </div>
  );
}
