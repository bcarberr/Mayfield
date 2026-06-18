import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FilterColumnPanelTool } from "../components/ui/FilterColumnPanel";
import type { TimeframeRange } from "./TimeframeContext";

export type SearchCriteriaMode = "query-builder" | "fsql";

const FSQL_SEARCH_LOADING_MS = 4_800;

function cloneTimeframeRange(range: TimeframeRange): TimeframeRange {
  return { from: new Date(range.from), to: new Date(range.to) };
}

type SearchContextValue = {
  criteriaMode: SearchCriteriaMode;
  setCriteriaMode: (mode: SearchCriteriaMode) => void;
  criteriaOpen: boolean;
  setCriteriaOpen: (open: boolean) => void;
  fsqlQuery: string;
  setFsqlQuery: (query: string) => void;
  queryBuilderKey: number;
  bumpQueryBuilderKey: () => void;
  queryBuilderValid: boolean;
  setQueryBuilderValid: (valid: boolean) => void;
  fsqlSearchExecuted: boolean;
  fsqlSearching: boolean;
  searchInitialTimeframe: TimeframeRange | null;
  fsqlSearchDetectionName: string | null;
  setFsqlSearchDetectionName: (name: string | null) => void;
  beginFsqlSearch: (query: string, searchTimeframe: TimeframeRange) => void;
  clearSearch: (mode: SearchCriteriaMode) => void;
  resultsFilterQuery: string;
  setResultsFilterQuery: (query: string) => void;
  resultsTableTool: FilterColumnPanelTool | null;
  setResultsTableTool: (tool: FilterColumnPanelTool | null) => void;
  resultsChartZoomed: boolean;
  setResultsChartZoomed: (zoomed: boolean) => void;
  resultsPage: number;
  setResultsPage: (page: number) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [criteriaMode, setCriteriaMode] = useState<SearchCriteriaMode>("fsql");
  const [criteriaOpen, setCriteriaOpen] = useState(true);
  const [fsqlQuery, setFsqlQuery] = useState("");
  const [queryBuilderKey, setQueryBuilderKey] = useState(0);
  const [queryBuilderValid, setQueryBuilderValid] = useState(false);
  const [fsqlSearchExecuted, setFsqlSearchExecuted] = useState(false);
  const [fsqlSearching, setFsqlSearching] = useState(false);
  const [searchInitialTimeframe, setSearchInitialTimeframe] = useState<TimeframeRange | null>(null);
  const [fsqlSearchDetectionName, setFsqlSearchDetectionName] = useState<string | null>(null);
  const [resultsFilterQuery, setResultsFilterQuery] = useState("");
  const [resultsTableTool, setResultsTableTool] = useState<FilterColumnPanelTool | null>(null);
  const [resultsChartZoomed, setResultsChartZoomed] = useState(false);
  const [resultsPage, setResultsPage] = useState(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetResultsViewState = useCallback(() => {
    setResultsFilterQuery("");
    setResultsTableTool(null);
    setResultsChartZoomed(false);
    setResultsPage(0);
  }, []);

  const beginFsqlSearch = useCallback(
    (query: string, searchTimeframe: TimeframeRange) => {
      if (!query.trim()) return;
      resetResultsViewState();
      setSearchInitialTimeframe(cloneTimeframeRange(searchTimeframe));
      setCriteriaOpen(true);
      setFsqlSearchExecuted(true);
      setFsqlSearching(true);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setFsqlSearching(false);
        setCriteriaOpen(false);
        searchTimerRef.current = null;
      }, FSQL_SEARCH_LOADING_MS);
    },
    [resetResultsViewState],
  );

  const clearSearch = useCallback(
    (mode: SearchCriteriaMode) => {
      if (mode === "fsql") {
        setFsqlQuery("");
        setFsqlSearchExecuted(false);
        setFsqlSearching(false);
        setSearchInitialTimeframe(null);
        setFsqlSearchDetectionName(null);
        resetResultsViewState();
        if (searchTimerRef.current) {
          clearTimeout(searchTimerRef.current);
          searchTimerRef.current = null;
        }
      } else {
        setQueryBuilderKey((key) => key + 1);
        setQueryBuilderValid(false);
      }
      setCriteriaOpen(true);
    },
    [resetResultsViewState],
  );

  const bumpQueryBuilderKey = useCallback(() => {
    setQueryBuilderKey((key) => key + 1);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const value: SearchContextValue = {
    criteriaMode,
    setCriteriaMode,
    criteriaOpen,
    setCriteriaOpen,
    fsqlQuery,
    setFsqlQuery,
    queryBuilderKey,
    bumpQueryBuilderKey,
    queryBuilderValid,
    setQueryBuilderValid,
    fsqlSearchExecuted,
    fsqlSearching,
    searchInitialTimeframe,
    fsqlSearchDetectionName,
    setFsqlSearchDetectionName,
    beginFsqlSearch,
    clearSearch,
    resultsFilterQuery,
    setResultsFilterQuery,
    resultsTableTool,
    setResultsTableTool,
    resultsChartZoomed,
    setResultsChartZoomed,
    resultsPage,
    setResultsPage,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
