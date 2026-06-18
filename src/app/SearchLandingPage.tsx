import { useEffect, useRef } from "react";
import { Icon } from "../design-system";
import { FsqlSearchTextarea } from "../components/FsqlSearchTextarea";
import { FsqlSearchResultsView } from "../components/search/FsqlSearchResultsView";
import { SearchQueryBuilder } from "../components/SearchQueryBuilder";
import { SearchHeaderFilters } from "../components/SearchHeaderFilters";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { V4NavThinner } from "../components/V4NavThinner";
import { Button as UiButton } from "../components/ui/Button";
import connectionAbstractUrl from "../assets/connection-abstract.svg";
import { useTimeframe } from "../context/TimeframeContext";
import { useCopilot } from "../context/CopilotContext";
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

const toolbarBtnRing = "focus-visible:ring-offset-surface-container";
const TOOLBAR_PRIMARY_BUTTON_CLASS =
  "bg-interactive-active text-text-on-primary hover:bg-interactive-active/90 focus-visible:ring-interactive-active";

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
  onFsqlQueryChange,
  queryBuilderKey,
  queryBuilderValid,
  onQueryBuilderValidChange,
  onClearSearch,
  onFsqlSearch,
  onConvertToFsql,
  fsqlSearching,
}: {
  criteriaMode: SearchCriteriaMode;
  onCriteriaModeChange: (mode: SearchCriteriaMode) => void;
  criteriaOpen: boolean;
  onCriteriaOpenChange: (open: boolean) => void;
  fsqlQuery: string;
  onFsqlQueryChange: (query: string) => void;
  queryBuilderKey: number;
  queryBuilderValid: boolean;
  onQueryBuilderValidChange: (valid: boolean) => void;
  onClearSearch: () => void;
  onFsqlSearch: () => void;
  onConvertToFsql: (query: string) => void;
  fsqlSearching: boolean;
}) {
  const isFsql = criteriaMode === "fsql";
  const hasFsqlQuery = fsqlQuery.trim().length > 0;
  const canSearch = isFsql ? hasFsqlQuery : queryBuilderValid;

  return (
    <Collapsible
      open={criteriaOpen}
      onOpenChange={onCriteriaOpenChange}
      className="relative z-50 flex shrink-0 flex-col bg-surface-container"
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
        role="toolbar"
        aria-label="Search actions"
      >
        <div className="flex flex-wrap items-center gap-4">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "h-auto gap-2 rounded px-1 py-1 font-semibold tracking-[0.4px] text-text-primary hover:bg-overlay-subtle",
                toolbarBtnRing,
              )}
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
              <UiButton
                type="button"
                variant="secondary"
                className={toolbarBtnRing}
                disabled={!hasFsqlQuery}
                onClick={onClearSearch}
              >
                <Icon name="action-cancel-clear" className="shrink-0 text-current" aria-hidden />
                Clear Search
              </UiButton>
              <UiButton type="button" variant="secondary" className={toolbarBtnRing} disabled={!hasFsqlQuery}>
                Create New Detection
              </UiButton>
              <UiButton type="button" variant="secondary" className={toolbarBtnRing} disabled={!hasFsqlQuery}>
                <Icon name="action-saved-search" className="shrink-0 text-current" aria-hidden />
                Save Search
              </UiButton>
              <Button
                type="button"
                className={cn(TOOLBAR_PRIMARY_BUTTON_CLASS, toolbarBtnRing)}
                disabled={!hasFsqlQuery}
                onClick={onFsqlSearch}
              >
                <Icon name="action-search" className="shrink-0 text-current" aria-hidden />
                Search
              </Button>
            </>
          ) : (
            <>
              <UiButton
                type="button"
                variant="secondary"
                className={toolbarBtnRing}
                disabled={!queryBuilderValid}
                onClick={onClearSearch}
              >
                <Icon name="action-cancel-clear" className="shrink-0 text-current" aria-hidden />
                Clear Search
              </UiButton>
              <UiButton type="button" variant="secondary" className={toolbarBtnRing} disabled={!queryBuilderValid}>
                Create New Detection
              </UiButton>
              <UiButton type="button" variant="secondary" className={toolbarBtnRing} disabled={!queryBuilderValid}>
                <Icon name="action-saved-search" className="shrink-0 text-current" aria-hidden />
                Save Search
              </UiButton>
              <Button type="button" className={cn(TOOLBAR_PRIMARY_BUTTON_CLASS, toolbarBtnRing)} disabled={!canSearch}>
                <Icon name="action-search" className="shrink-0 text-current" aria-hidden />
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
        className="px-5 py-4 data-[state=closed]:py-0"
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
      <div className="pl-5 pr-6">
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
  const { range: timeframe, setRange: setTimeframeRange } = useTimeframe();
  const { pendingFsqlSearch, setPendingFsqlSearch } = useCopilot();
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
    beginFsqlSearch,
    clearSearch,
  } = useSearch();
  const skipTimeframeToFsqlSyncRef = useRef(false);
  const fsqlQueryRef = useRef(fsqlQuery);
  fsqlQueryRef.current = fsqlQuery;

  useEffect(() => {
    if (!pendingFsqlSearch) return;
    const { query, autoExecute, detectionName } = pendingFsqlSearch;
    setFsqlQuery(query);
    setFsqlSearchDetectionName(detectionName ?? null);
    const parsedTimeframe = parseFsqlTimeframe(query);
    const searchTimeframe = parsedTimeframe ?? timeframe;
    if (parsedTimeframe) {
      skipTimeframeToFsqlSyncRef.current = true;
      setTimeframeRange(parsedTimeframe);
    }
    setCriteriaMode("fsql");
    setCriteriaOpen(true);
    setPendingFsqlSearch(null);

    if (autoExecute && query.trim()) {
      beginFsqlSearch(query, searchTimeframe);
    } else {
      clearSearch("fsql");
      setFsqlQuery(query);
      setFsqlSearchDetectionName(detectionName ?? null);
    }
  }, [
    pendingFsqlSearch,
    setPendingFsqlSearch,
    setTimeframeRange,
    timeframe,
    beginFsqlSearch,
    clearSearch,
    setCriteriaMode,
    setCriteriaOpen,
    setFsqlQuery,
    setFsqlSearchDetectionName,
  ]);

  const executeFsqlSearch = () => {
    if (!fsqlQuery.trim()) return;
    setFsqlSearchDetectionName(null);
    const parsedTimeframe = parseFsqlTimeframe(fsqlQuery);
    const searchTimeframe = parsedTimeframe ?? timeframe;
    if (parsedTimeframe) {
      skipTimeframeToFsqlSyncRef.current = true;
      setTimeframeRange(parsedTimeframe);
    }
    beginFsqlSearch(fsqlQuery, searchTimeframe);
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
    if (skipTimeframeToFsqlSyncRef.current) {
      skipTimeframeToFsqlSyncRef.current = false;
      return;
    }

    const parsedFromQuery = parseFsqlTimeframe(query);
    if (parsedFromQuery && timeframeRangesEqual(parsedFromQuery, timeframe)) return;

    const nextQuery = applyTimeframeToFsqlQuery(query, timeframe);
    if (nextQuery !== query) {
      skipTimeframeToFsqlSyncRef.current = true;
      setFsqlQuery(nextQuery);
    }
  }, [criteriaMode, timeframe.from.getTime(), timeframe.to.getTime(), timeframe]);

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
    clearSearch(criteriaMode);
  };

  const handleCriteriaModeChange = (mode: SearchCriteriaMode) => {
    setCriteriaMode(mode);
    setCriteriaOpen(true);
  };

  return (
    <TooltipProvider>
    <div className="flex h-full min-h-0 bg-surface-container text-text-primary">
      <V4NavThinner variant="federated-search" activeSection="search" navTargets={NAV_RAIL_TARGETS} />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader
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
            onQueryBuilderValidChange={setQueryBuilderValid}
            onClearSearch={handleClearSearch}
            onFsqlSearch={executeFsqlSearch}
            onConvertToFsql={handleConvertToFsql}
            fsqlSearching={fsqlSearching}
          />

          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            {criteriaMode === "fsql" ? (
              fsqlSearchExecuted && !fsqlSearching ? (
                <FsqlSearchResultsView
                  searchInitialTimeframe={searchInitialTimeframe}
                  detectionName={fsqlSearchDetectionName}
                />
              ) : (
                <div className="min-h-0 min-w-0 flex-1 bg-surface-container" aria-label="FSQL search workspace" />
              )
            ) : (
              <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
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

                <main
                  className="relative z-[1] flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-12 sm:py-16 md:py-20"
                  aria-label="Query builder search workspace"
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
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
    </TooltipProvider>
  );
}
