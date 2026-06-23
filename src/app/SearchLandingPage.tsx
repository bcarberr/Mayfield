import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookSearch, CircleX, Plus, Search } from "lucide-react";
import { Icon } from "../design-system";
import { ROUTES } from "./routes";
import { FsqlSearchTextarea } from "../components/FsqlSearchTextarea";
import { FsqlSearchResultsView } from "../components/search/FsqlSearchResultsView";
import { SearchQueryBuilder } from "../components/SearchQueryBuilder";
import { SearchHeaderFilters } from "../components/SearchHeaderFilters";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { V4NavThinner } from "../components/V4NavThinner";

import connectionAbstractUrl from "../assets/connection-abstract.svg";
import { useTimeframe } from "../context/TimeframeContext";
import { useSearch, type SearchCriteriaMode } from "../context/SearchContext";
import { parseFsqlTimeframe, applyTimeframeToFsqlQuery, timeframeRangesEqual } from "../lib/fsqlTimeframeParser";
import { FsqlSearchLoadingPanel } from "../components/search/FsqlSearchLoadingPanel";
import { Button } from "@/components/shadcn/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible";
import { Label } from "@/components/shadcn/label";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn/radio-group";
import { Separator } from "@/components/shadcn/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcn/tooltip";
import { cn } from "@/lib/utils";
import { NAV_RAIL_TARGETS } from "./navRailTargets";
import {
  CreateDetectionSlideOver,
  type NewDetectionPayload,
} from "../components/federated-detection-hub/CreateDetectionSlideOver";
import { PageSlideOver, FORM_CONTENT_SLIDE_OVER_PANEL_CLASS } from "../components/ui/SlideOver";
import { Snackbar } from "../components/ui/Snackbar";
import { useDetectionHub } from "../context/DetectionHubContext";

const TOOLBAR_SECONDARY_BTN_CLASS = "shrink-0 ring-offset-surface-page";
const TOOLBAR_ICON_CLASS = "size-3.5 shrink-0 text-current";
const TOOLBAR_PRIMARY_BUTTON_CLASS =
  "h-8 shrink-0 bg-interactive-active text-text-on-primary hover:bg-interactive-active/90 focus-visible:ring-interactive-active ring-offset-surface-page";

const SEARCH_CRITERIA_MODE_OPTIONS: readonly {
  id: SearchCriteriaMode;
  label: string;
  tooltip?: string;
}[] = [
  { id: "fsql", label: "FSQL", tooltip: "Federated Search Query Language" },
  { id: "query-builder", label: "Query Builder" },
];

function SearchCriteriaModeRadios({
  value,
  onChange,
}: {
  value: SearchCriteriaMode;
  onChange: (next: SearchCriteriaMode) => void;
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onChange(next as SearchCriteriaMode)}
      aria-label="Search criteria mode"
      className="flex flex-wrap items-center gap-4"
    >
      {SEARCH_CRITERIA_MODE_OPTIONS.map((option) => {
        const fieldId = `search-criteria-mode-${option.id}`;
        const optionControl = (
          <div className="flex items-center gap-2">
            <RadioGroupItem value={option.id} id={fieldId} />
            <Label
              htmlFor={fieldId}
              className="cursor-pointer text-sm font-semibold leading-5 tracking-[0.4px] text-text-primary"
            >
              {option.label}
            </Label>
          </div>
        );

        if (!option.tooltip) {
          return <div key={option.id}>{optionControl}</div>;
        }

        return (
          <Tooltip key={option.id}>
            <TooltipTrigger asChild>{optionControl}</TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs font-semibold">
              {option.tooltip}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </RadioGroup>
  );
}

function SearchToolbarActions({
  criteriaMode,
  onCriteriaModeChange,
  criteriaOpen,
  onCriteriaOpenChange,
  fsqlQuery,
  lastExecutedFsqlQuery,
  onFsqlQueryChange,
  queryBuilderKey,
  queryBuilderValid,
  qbHasRun,
  onQueryBuilderValidChange,
  onClearSearch,
  onFsqlSearch,
  onQbSearch,
  onConvertToFsql,
  onCreateDetection,
  fsqlSearching,
  fsqlSearchExecuted,
}: {
  criteriaMode: SearchCriteriaMode;
  onCriteriaModeChange: (mode: SearchCriteriaMode) => void;
  criteriaOpen: boolean;
  onCriteriaOpenChange: (open: boolean) => void;
  fsqlQuery: string;
  lastExecutedFsqlQuery: string;
  onFsqlQueryChange: (query: string) => void;
  queryBuilderKey: number;
  queryBuilderValid: boolean;
  qbHasRun: boolean;
  onQueryBuilderValidChange: (valid: boolean) => void;
  onClearSearch: () => void;
  onFsqlSearch: () => void;
  onQbSearch: () => void;
  onConvertToFsql: (query: string) => void;
  onCreateDetection: () => void;
  fsqlSearching: boolean;
  fsqlSearchExecuted: boolean;
}) {
  const isFsql = criteriaMode === "fsql";
  const hasFsqlQuery = fsqlQuery.trim().length > 0;
  const queryChangedFromLastRun = fsqlQuery.trim() !== lastExecutedFsqlQuery.trim();
  // Disabled while results are showing for the current query, or while a search is in flight.
  const fsqlSearchEnabled =
    hasFsqlQuery &&
    !fsqlSearching &&
    (!fsqlSearchExecuted || queryChangedFromLastRun);
  const qbSearchEnabled = queryBuilderValid && !qbHasRun;

  return (
    <Collapsible
      open={criteriaOpen}
      onOpenChange={onCriteriaOpenChange}
      className="relative z-50 flex shrink-0 flex-col bg-surface-page"
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
        role="toolbar"
        aria-label="Search actions"
      >
        <div className="flex flex-wrap items-center gap-4">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto gap-2 rounded px-1 py-1 font-semibold tracking-[0.4px] text-text-primary hover:bg-overlay-subtle ring-offset-surface-page"
              aria-controls="search-criteria-panel"
            >
              <Icon
                name="chevron-down"
                size={18}
                className={cn(
                  "shrink-0 transition-transform duration-200",
                  criteriaOpen ? "rotate-0" : "-rotate-90",
                )}
                aria-hidden
              />
              Search Criteria
            </Button>
          </CollapsibleTrigger>
          <SearchCriteriaModeRadios value={criteriaMode} onChange={onCriteriaModeChange} />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          {isFsql ? (
            <>
              <Button
                type="button"
                variant="secondary-outline"
                className={TOOLBAR_SECONDARY_BTN_CLASS}
                disabled={!hasFsqlQuery}
                onClick={onClearSearch}
              >
                <CircleX size={14} strokeWidth={1.5} className={TOOLBAR_ICON_CLASS} aria-hidden />
                Clear Search
              </Button>
              <Button
                type="button"
                variant="secondary-outline"
                className={TOOLBAR_SECONDARY_BTN_CLASS}
                disabled={!hasFsqlQuery}
                onClick={onCreateDetection}
              >
                <Plus size={14} strokeWidth={1.5} className={TOOLBAR_ICON_CLASS} aria-hidden />
                Create New Detection
              </Button>
              <Button type="button" variant="secondary-outline" className={TOOLBAR_SECONDARY_BTN_CLASS} disabled={!hasFsqlQuery}>
                <BookSearch size={14} strokeWidth={1.5} className={TOOLBAR_ICON_CLASS} aria-hidden />
                Save Search
              </Button>
              <Button
                type="button"
                className={TOOLBAR_PRIMARY_BUTTON_CLASS}
                disabled={!fsqlSearchEnabled}
                onClick={onFsqlSearch}
              >
                <Search size={14} strokeWidth={1.5} className={TOOLBAR_ICON_CLASS} aria-hidden />
                Search
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary-outline"
                className={TOOLBAR_SECONDARY_BTN_CLASS}
                disabled={!queryBuilderValid}
                onClick={onClearSearch}
              >
                <CircleX size={14} strokeWidth={1.5} className={TOOLBAR_ICON_CLASS} aria-hidden />
                Clear Search
              </Button>
              <Button
                type="button"
                variant="secondary-outline"
                className={TOOLBAR_SECONDARY_BTN_CLASS}
                disabled={!queryBuilderValid}
                onClick={onCreateDetection}
              >
                <Plus size={14} strokeWidth={1.5} className={TOOLBAR_ICON_CLASS} aria-hidden />
                Create New Detection
              </Button>
              <Button type="button" variant="secondary-outline" className={TOOLBAR_SECONDARY_BTN_CLASS} disabled={!queryBuilderValid}>
                <BookSearch size={14} strokeWidth={1.5} className={TOOLBAR_ICON_CLASS} aria-hidden />
                Save Search
              </Button>
              <Button
                type="button"
                className={TOOLBAR_PRIMARY_BUTTON_CLASS}
                disabled={!qbSearchEnabled}
                onClick={onQbSearch}
              >
                <Search size={14} strokeWidth={1.5} className={TOOLBAR_ICON_CLASS} aria-hidden />
                Search
              </Button>
            </>
          )}
        </div>
      </div>

      <CollapsibleContent
        id="search-criteria-panel"
        role="region"
        aria-label="Search criteria options"
        className="px-6 py-4 data-[state=closed]:py-0"
      >
        {isFsql ? (
          <FsqlSearchTextarea value={fsqlQuery} onChange={onFsqlQueryChange} onSearch={onFsqlSearch} />
        ) : (
          <SearchQueryBuilder
            key={queryBuilderKey}
            onValidityChange={onQueryBuilderValidChange}
            onConvertToFsql={onConvertToFsql}
          />
        )}
      </CollapsibleContent>
      <div className="px-6">
        <Separator className="bg-border-rule" />
      </div>
      {fsqlSearching ? <FsqlSearchLoadingPanel /> : null}
    </Collapsible>
  );
}

/**
 * Federated search entry screen — query builder, FSQL, and Copilot assistant.
 */
export function SearchLandingPage() {
  const { registerCreatedDetection } = useDetectionHub();
  const [createDetectionOpen, setCreateDetectionOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<ReactNode>("");
  const [qbHasRun, setQbHasRun] = useState(false);
  const location = useLocation();
  const prevLocationKeyRef = useRef(location.key);
  const { range: timeframe, setRange: setTimeframeRange } = useTimeframe();
  const {
    criteriaMode,
    setCriteriaMode,
    criteriaOpen,
    setCriteriaOpen,
    fsqlQuery,
    setFsqlQuery,
    queryBuilderKey,
    queryBuilderValid,
    setQueryBuilderValid,
    fsqlSearchExecuted,
    fsqlSearching,
    searchInitialTimeframe,
    fsqlSearchDetectionName,
    setFsqlSearchDetectionName,
    lastExecutedFsqlQuery,
    setLastExecutedFsqlQuery,
    skipTimeframeFsqlSyncOnce,
    setSkipTimeframeFsqlSyncOnce,
    beginFsqlSearch,
    clearSearch,
  } = useSearch();
  const skipTimeframeToFsqlSyncRef = useRef(false);
  const fsqlQueryRef = useRef(fsqlQuery);
  fsqlQueryRef.current = fsqlQuery;
  // Read skipTimeframeFsqlSyncOnce via ref so the sync effect doesn't re-run when
  // it clears the flag (clearing via setState would add it to deps and fire a second run
  // that appends SINCE to fsqlQuery, making it differ from lastExecutedFsqlQuery).
  const skipTimeframeFsqlSyncOnceRef = useRef(skipTimeframeFsqlSyncOnce);
  skipTimeframeFsqlSyncOnceRef.current = skipTimeframeFsqlSyncOnce;
  const fsqlSearchExecutedRef = useRef(fsqlSearchExecuted);
  fsqlSearchExecutedRef.current = fsqlSearchExecuted;

  const executeFsqlSearch = () => {
    if (!fsqlQuery.trim()) return;
    setFsqlSearchDetectionName(null);
    const parsedTimeframe = parseFsqlTimeframe(fsqlQuery);
    const searchTimeframe = parsedTimeframe ?? timeframe;
    if (parsedTimeframe) {
      skipTimeframeToFsqlSyncRef.current = true;
      setTimeframeRange(parsedTimeframe);
    }
    const normalizedQuery = applyTimeframeToFsqlQuery(fsqlQuery, searchTimeframe);
    if (normalizedQuery !== fsqlQuery) {
      skipTimeframeToFsqlSyncRef.current = true;
      setFsqlQuery(normalizedQuery);
    }
    setLastExecutedFsqlQuery(normalizedQuery.trim());
    beginFsqlSearch(normalizedQuery, searchTimeframe);
  };

  const handleFsqlQueryChange = (query: string) => {
    setFsqlQuery(query);
    const parsedTimeframe = parseFsqlTimeframe(query);
    if (parsedTimeframe) {
      skipTimeframeToFsqlSyncRef.current = true;
      setTimeframeRange(parsedTimeframe);
    }
  };

  useEffect(() => {
    if (criteriaMode !== "fsql") return;
    const query = fsqlQueryRef.current;
    if (!query.trim()) return;
    if (skipTimeframeToFsqlSyncRef.current || skipTimeframeFsqlSyncOnceRef.current) {
      skipTimeframeToFsqlSyncRef.current = false;
      setSkipTimeframeFsqlSyncOnce(false);
      return;
    }

    const parsedFromQuery = parseFsqlTimeframe(query);
    if (parsedFromQuery && timeframeRangesEqual(parsedFromQuery, timeframe)) return;

    const nextQuery = applyTimeframeToFsqlQuery(query, timeframe);
    if (nextQuery !== query) {
      skipTimeframeToFsqlSyncRef.current = true;
      setFsqlQuery(nextQuery);
      if (fsqlSearchExecutedRef.current) {
        setLastExecutedFsqlQuery(nextQuery.trim());
      }
    }
  // skipTimeframeFsqlSyncOnce intentionally excluded from deps — read via ref above so
  // clearing it with setSkipTimeframeFsqlSyncOnce(false) doesn't trigger a second run.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteriaMode, timeframe.from.getTime(), timeframe.to.getTime(), timeframe, setSkipTimeframeFsqlSyncOnce, setFsqlQuery, setLastExecutedFsqlQuery]);

  // Clicking the Federated Search nav icon while already on this page pushes a new
  // history entry (same pathname, new key). Detect that and reset to the clean slate.
  useEffect(() => {
    const prevKey = prevLocationKeyRef.current;
    prevLocationKeyRef.current = location.key;
    if (prevKey === location.key) return; // no change (initial mount or non-nav re-render)
    clearSearch("fsql");
    setQbHasRun(false);
    setCriteriaMode("fsql");
  }, [location.key, clearSearch, setCriteriaMode]);

  const handleConvertToFsql = (query: string) => {
    setFsqlQuery(query);
    const parsedTimeframe = parseFsqlTimeframe(query);
    if (parsedTimeframe) {
      skipTimeframeToFsqlSyncRef.current = true;
      setTimeframeRange(parsedTimeframe);
    }
    setCriteriaMode("fsql");
    setCriteriaOpen(true);
  };

  const handleClearSearch = () => {
    setLastExecutedFsqlQuery("");
    setQbHasRun(false);
    clearSearch(criteriaMode);
  };

  const handleQbSearch = () => {
    setQbHasRun(true);
  };

  const handleCriteriaModeChange = (mode: SearchCriteriaMode) => {
    setCriteriaMode(mode);
    setCriteriaOpen(true);
  };

  const handleCreateDetection = () => {
    setCreateDetectionOpen(true);
  };

  const handleCloseCreateDetection = useCallback(() => {
    setCreateDetectionOpen(false);
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const handleDetectionSavedFromSearch = useCallback(
    (payload: NewDetectionPayload) => {
      const createdRow = registerCreatedDetection(payload);
      setCreateDetectionOpen(false);
      setSnackbarMessage(
        <>
          &ldquo;{createdRow.name}&rdquo; has been created and can now be managed in{" "}
          <Link
            to={ROUTES.federatedDetectionHub}
            state={{ focusManageDetections: true }}
            className="text-interactive-active underline underline-offset-2 hover:text-interactive-active/90"
            onClick={handleCloseSnackbar}
          >
            Managed Detections
          </Link>
          .
        </>,
      );
      setSnackbarOpen(true);
    },
    [handleCloseSnackbar, registerCreatedDetection],
  );

  return (
    <TooltipProvider>
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner variant="federated-search" activeSection="search" navTargets={NAV_RAIL_TARGETS} />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader
          chromeSurface="page"
          headerAfterTitle={<SearchHeaderFilters />}
        />
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <SearchToolbarActions
            criteriaMode={criteriaMode}
            onCriteriaModeChange={handleCriteriaModeChange}
            criteriaOpen={criteriaOpen}
            onCriteriaOpenChange={setCriteriaOpen}
            fsqlQuery={fsqlQuery}
            onFsqlQueryChange={handleFsqlQueryChange}
            queryBuilderKey={queryBuilderKey}
            queryBuilderValid={queryBuilderValid}
            qbHasRun={qbHasRun}
            onQueryBuilderValidChange={(valid) => { setQbHasRun(false); setQueryBuilderValid(valid); }}
            lastExecutedFsqlQuery={lastExecutedFsqlQuery}
            onClearSearch={handleClearSearch}
            onFsqlSearch={executeFsqlSearch}
            onQbSearch={handleQbSearch}
            onConvertToFsql={handleConvertToFsql}
            onCreateDetection={handleCreateDetection}
            fsqlSearching={fsqlSearching}
            fsqlSearchExecuted={fsqlSearchExecuted}
          />

          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            {!(criteriaMode === "fsql" && fsqlSearchExecuted) && (
              <div
                className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden [html[data-theme=light]_&]:opacity-50"
                aria-hidden
              >
                <img
                  src={connectionAbstractUrl}
                  alt=""
                  className="h-full w-full object-cover object-bottom"
                  draggable={false}
                />
              </div>
            )}

            {criteriaMode === "fsql" && fsqlSearchExecuted ? (
              <FsqlSearchResultsView
                searchInitialTimeframe={searchInitialTimeframe}
                detectionName={fsqlSearchDetectionName}
              />
            ) : (
              <main
                className="relative z-[1] flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-12 sm:py-16 md:py-20"
                aria-label="Search workspace"
              >
                <div className="mt-[60px] flex w-full max-w-[720px] flex-col items-stretch">
                  <h1 className="text-center text-3xl font-bold leading-9 tracking-[0.5px] text-text-primary sm:text-4xl sm:leading-tight">
                    Welcome Bonnie Carberry!
                  </h1>
                  <p className="mx-auto mt-4 max-w-[560px] text-center text-base leading-6 text-text-secondary">
                    Query every connected source from a single field. Combine field paths, identifiers, and
                    plain-language terms in one search.
                  </p>

                  <section className="mt-14 pt-10 text-text-tertiary" aria-labelledby="search-tips-heading">
                    <h2 id="search-tips-heading" className="text-base-semibold text-text-primary">
                      Search tips
                    </h2>
                    <ul className="mt-4 space-y-3 text-base-small">
                      <li className="flex gap-3">
                        <span className="mt-0.5 shrink-0 font-semibold">•</span>
                        <span>
                          Narrow by connector or dataset name — matching behaves like the mapping workspace quick
                          filters.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-0.5 shrink-0 font-semibold">•</span>
                        <span>
                          Use field paths (for example{" "}
                          <span className="font-mono text-text-tertiary">event.action</span>) to jump to schema-aligned
                          results.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="mt-0.5 shrink-0 font-semibold">•</span>
                        <span>Combine plain-language phrases with identifiers from your normalized model.</span>
                      </li>
                    </ul>
                  </section>
                </div>
              </main>
            )}
          </div>
        </div>
      </div>

      <PageSlideOver
        open={createDetectionOpen}
        onClose={handleCloseCreateDetection}
        ariaLabel="Create New Detection"
        panelClassName={FORM_CONTENT_SLIDE_OVER_PANEL_CLASS}
      >
        <CreateDetectionSlideOver
          key="search-create-detection"
          onClose={handleCloseCreateDetection}
          onSave={handleDetectionSavedFromSearch}
        />
      </PageSlideOver>

      <Snackbar open={snackbarOpen} message={snackbarMessage} onClose={handleCloseSnackbar} />
    </div>
    </TooltipProvider>
  );
}
