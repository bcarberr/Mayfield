import { lazy, Suspense, useCallback } from "react";
import { matchPath, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { TimeframeProvider } from "../context/TimeframeContext";
import { CopilotProvider, useCopilot } from "../context/CopilotContext";
import { SearchProvider } from "../context/SearchContext";
import { SearchCopilotSidePanel } from "../components/SearchCopilotPanel";
import { DEFAULT_ROUTE, ROUTES, type ConnectorsLocationState } from "./routes";
import { SHOW_AI_AGENTS_PAGE } from "./navRailConfig";

const ConnectorsPage = lazy(() => import("./ConnectorsPage").then((m) => ({ default: m.ConnectorsPage })));
const ConnectorsPanelSlideOver = lazy(() =>
  import("./ConnectorsPage").then((m) => ({ default: m.ConnectorsPanelSlideOver })),
);
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
const AiAgentsPage = SHOW_AI_AGENTS_PAGE
  ? lazy(() => import("./AiAgentsPage").then((m) => ({ default: m.AiAgentsPage })))
  : null;
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

function AppShell() {
  const { open, setOpen, setPendingFsqlSearch } = useCopilot();
  const location = useLocation();
  const navigate = useNavigate();
  const navState = location.state as ConnectorsLocationState | null;

  const connectorsPanelOpen =
    Boolean(matchPath({ path: ROUTES.connectors, end: true }, location.pathname)) &&
    navState?.connectorsVariant === "panel";
  const routesLocation = connectorsPanelOpen
    ? (navState?.background ?? { pathname: DEFAULT_ROUTE, search: "", hash: "", state: null, key: "default" })
    : location;

  const closeConnectorsPanel = useCallback(() => {
    const background = navState?.background;
    if (background) {
      navigate(
        { pathname: background.pathname, search: background.search, hash: background.hash },
        { replace: true },
      );
      return;
    }
    navigate(DEFAULT_ROUTE, { replace: true });
  }, [navState?.background, navigate]);

  const handleSendToFsqlSearch = useCallback(
    (query: string) => {
      setPendingFsqlSearch({ query });
      navigate(ROUTES.search);
    },
    [setPendingFsqlSearch, navigate],
  );
  return (
    <div className="flex h-full min-h-screen">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <Suspense fallback={<RouteFallback />}>
          <Routes location={routesLocation}>
            <Route path="/" element={<SummaryInsightsPage />} />
            <Route path={ROUTES.connectors} element={<ConnectorsPage />} />
            {/* Hidden from nav when SHOW_ADDONS_NAV is false — see navRailConfig.ts */}
            <Route path={ROUTES.addons} element={<WorkspacePlaceholderPage activeSection="addons" title="Addons" />} />
            <Route path={ROUTES.search} element={<SearchLandingPage />} />
            <Route path={ROUTES.federatedDetectionHub} element={<FederatedDetectionHubPage />} />
            <Route path={ROUTES.summaryInsights} element={<SummaryInsightsPage />} />
            <Route path={ROUTES.dataPipelines} element={<DataPipelinesPage />} />
            {SHOW_AI_AGENTS_PAGE && AiAgentsPage ? (
              <Route path={ROUTES.aiAgents} element={<AiAgentsPage />} />
            ) : null}
            <Route path={ROUTES.settings} element={<SettingsPage />} />
            <Route
              path={ROUTES.adminSettings}
              element={<WorkspacePlaceholderPage activeSection="adminSettings" title="Admin Settings" />}
            />
          </Routes>
        </Suspense>
        {connectorsPanelOpen ? (
          <Suspense fallback={null}>
            <ConnectorsPanelSlideOver open onClose={closeConnectorsPanel} />
          </Suspense>
        ) : null}
      </div>
      <SearchCopilotSidePanel open={open} onOpenChange={setOpen} onSendToFsqlSearch={handleSendToFsqlSearch} />
    </div>
  );
}

export function App() {
  return (
    <TimeframeProvider>
      <CopilotProvider>
        <SearchProvider>
          <AppShell />
        </SearchProvider>
      </CopilotProvider>
    </TimeframeProvider>
  );
}
