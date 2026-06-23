import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { useCopilot } from "../../context/CopilotContext";
import { useSearch } from "../../context/SearchContext";
import { useTimeframe } from "../../context/TimeframeContext";
import { parseFsqlTimeframe, applyTimeframeToFsqlQuery } from "../../lib/fsqlTimeframeParser";

/**
 * Consumes cross-page pending FSQL launches (copilot, findings).
 * Lives under SearchProvider so search state is applied even before SearchLandingPage mounts.
 */
export function PendingFsqlSearchLauncher() {
  const { pendingFsqlSearch, setPendingFsqlSearch } = useCopilot();
  const navigate = useNavigate();
  const location = useLocation();
  const { range: timeframe, setRange: setTimeframeRange } = useTimeframe();
  const {
    setFsqlQuery,
    setCriteriaMode,
    setCriteriaOpen,
    setFsqlSearchDetectionName,
    setLastExecutedFsqlQuery,
    setSkipTimeframeFsqlSyncOnce,
    beginFsqlSearch,
    clearSearch,
    searchSessionKey,
    completedSearchSessionKey,
    markSearchSessionComplete,
  } = useSearch();

  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (!pendingFsqlSearch) return;

    const { query, autoExecute, detectionName } = pendingFsqlSearch;
    setPendingFsqlSearch(null);

    const parsedTimeframe = parseFsqlTimeframe(query);
    const searchTimeframe = parsedTimeframe ?? timeframe;
    if (parsedTimeframe) {
      setTimeframeRange(parsedTimeframe);
    }
    setSkipTimeframeFsqlSyncOnce(true);

    const normalizedQuery = applyTimeframeToFsqlQuery(query, searchTimeframe);
    setFsqlQuery(normalizedQuery);
    setFsqlSearchDetectionName(detectionName ?? null);

    setCriteriaMode("fsql");
    setCriteriaOpen(true);

    if (location.pathname !== ROUTES.search) {
      navigate(ROUTES.search);
    }

    if (autoExecute && normalizedQuery.trim()) {
      setLastExecutedFsqlQuery(normalizedQuery.trim());
      beginFsqlSearch(normalizedQuery, searchTimeframe);
    } else if (normalizedQuery.trim()) {
      setLastExecutedFsqlQuery("");
      clearSearch("fsql");
      setFsqlQuery(normalizedQuery);
      setFsqlSearchDetectionName(detectionName ?? null);
    }
  }, [
    pendingFsqlSearch,
    setPendingFsqlSearch,
    setFsqlQuery,
    setFsqlSearchDetectionName,
    setCriteriaMode,
    setCriteriaOpen,
    setLastExecutedFsqlQuery,
    setSkipTimeframeFsqlSyncOnce,
    beginFsqlSearch,
    clearSearch,
    timeframe,
    setTimeframeRange,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    const previous = prevPathRef.current;
    prevPathRef.current = location.pathname;

    if (previous === ROUTES.search && location.pathname !== ROUTES.search) {
      if (searchSessionKey && completedSearchSessionKey !== searchSessionKey) {
        markSearchSessionComplete(searchSessionKey);
      }
    }
  }, [location.pathname, searchSessionKey, completedSearchSessionKey, markSearchSessionComplete]);

  return null;
}
