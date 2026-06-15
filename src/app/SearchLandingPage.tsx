import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../design-system";
import { FsqlSearchTextarea } from "../components/FsqlSearchTextarea";
import { FsqlSearchResultsView } from "../components/search/FsqlSearchResultsView";
import { SearchQueryBuilder } from "../components/SearchQueryBuilder";
import { SearchHeaderFilters } from "../components/SearchHeaderFilters";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { V4NavThinner } from "../components/V4NavThinner";
import { Button } from "../components/ui/Button";
import connectionAbstractUrl from "../assets/connection-abstract.svg";
import { useTimeframe, type TimeframeRange } from "../context/TimeframeContext";
import { useCopilot } from "../context/CopilotContext";
import { parseFsqlTimeframe } from "../lib/fsqlTimeframeParser";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

const toolbarBtnRing = "ring-offset-surface-container";
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function cloneTimeframeRange(range: TimeframeRange): TimeframeRange {
  return { from: new Date(range.from), to: new Date(range.to) };
}

export type SearchCriteriaMode = "query-builder" | "fsql";

const SEARCH_CRITERIA_MODE_OPTIONS: readonly {
  id: SearchCriteriaMode;
  label: string;
  tooltip?: string;
}[] = [
  { id: "query-builder", label: "Query Builder" },
  { id: "fsql", label: "FSQL", tooltip: "Federated Search Query Language" },
];

function SearchCriteriaRadioOption({
  groupName,
  option,
  checked,
  onSelect,
}: {
  groupName: string;
  option: (typeof SEARCH_CRITERIA_MODE_OPTIONS)[number];
  checked: boolean;
  onSelect: () => void;
}) {
  const labelRef = useRef<HTMLLabelElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isHovered || !option.tooltip || !labelRef.current) {
      setPopoverStyle(null);
      return;
    }

    const updatePosition = () => {
      const rect = labelRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPopoverStyle({
        top: rect.top - 8,
        left: rect.left,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isHovered, option.tooltip]);

  const showPopover = Boolean(option.tooltip && isHovered && popoverStyle);

  return (
    <>
      <label
        ref={labelRef}
        className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold leading-5 tracking-[0.4px] text-text-primary"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <input
          type="radio"
          name={groupName}
          value={option.id}
          checked={checked}
          onChange={onSelect}
          className="size-4 shrink-0 accent-interactive-active"
          aria-describedby={option.tooltip ? `${groupName}-${option.id}-tooltip` : undefined}
        />
        {option.label}
      </label>
      {showPopover
        ? createPortal(
            <div
              id={`${groupName}-${option.id}-tooltip`}
              role="tooltip"
              className="pointer-events-none fixed z-[100] max-w-xs -translate-y-full rounded bg-[#424242] px-2 py-1.5 text-xs font-semibold leading-snug text-[#f5f5f5] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              style={{ top: popoverStyle!.top, left: popoverStyle!.left }}
            >
              {option.tooltip}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function SearchCriteriaModeRadios({
  value,
  onChange,
}: {
  value: SearchCriteriaMode;
  onChange: (next: SearchCriteriaMode) => void;
}) {
  const groupName = useId();

  return (
    <div role="radiogroup" aria-label="Search criteria mode" className="flex flex-wrap items-center gap-4">
      {SEARCH_CRITERIA_MODE_OPTIONS.map((option) => (
        <SearchCriteriaRadioOption
          key={option.id}
          groupName={groupName}
          option={option}
          checked={value === option.id}
          onSelect={() => onChange(option.id)}
        />
      ))}
    </div>
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
}) {
  const isFsql = criteriaMode === "fsql";
  const hasFsqlQuery = fsqlQuery.trim().length > 0;
  const canSearch = isFsql ? hasFsqlQuery : queryBuilderValid;

  return (
    <div className="flex shrink-0 flex-col bg-surface-container">
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
        role="toolbar"
        aria-label="Search actions"
      >
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            aria-expanded={criteriaOpen}
            aria-controls="search-criteria-panel"
            className="flex items-center gap-2 rounded py-1 pr-1 text-left text-sm font-semibold leading-5 tracking-[0.4px] text-text-primary transition-colors hover:bg-overlay-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
            onClick={() => onCriteriaOpenChange(!criteriaOpen)}
          >
            <Icon
              name="chevron-down"
              size={18}
              className={cx("shrink-0 transition-transform duration-200", criteriaOpen ? "rotate-0" : "-rotate-90")}
              aria-hidden
            />
            Search Criteria
          </button>
          <SearchCriteriaModeRadios value={criteriaMode} onChange={onCriteriaModeChange} />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          {isFsql ? (
            <>
              <Button
                type="button"
                variant="secondary"
                className={toolbarBtnRing}
                disabled={!hasFsqlQuery}
                onClick={onClearSearch}
              >
                <Icon name="action-cancel-clear" className="shrink-0 text-current" aria-hidden />
                Clear Search
              </Button>
              <Button type="button" variant="secondary" className={toolbarBtnRing} disabled={!hasFsqlQuery}>
                Create New Detection
              </Button>
              <Button type="button" variant="secondary" className={toolbarBtnRing} disabled={!hasFsqlQuery}>
                <Icon name="action-saved-search" className="shrink-0 text-current" aria-hidden />
                Save Search
              </Button>
              <Button
                type="button"
                variant="primary"
                className={toolbarBtnRing}
                disabled={!hasFsqlQuery}
                onClick={onFsqlSearch}
              >
                <Icon name="action-search" className="shrink-0 text-current" aria-hidden />
                Search
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                className={toolbarBtnRing}
                disabled={!queryBuilderValid}
                onClick={onClearSearch}
              >
                <Icon name="action-cancel-clear" className="shrink-0 text-current" aria-hidden />
                Clear Search
              </Button>
              <Button type="button" variant="secondary" className={toolbarBtnRing} disabled={!queryBuilderValid}>
                Create New Detection
              </Button>
              <Button type="button" variant="secondary" className={toolbarBtnRing} disabled={!queryBuilderValid}>
                <Icon name="action-saved-search" className="shrink-0 text-current" aria-hidden />
                Save Search
              </Button>
              <Button type="button" variant="primary" className={toolbarBtnRing} disabled={!canSearch}>
                <Icon name="action-search" className="shrink-0 text-current" aria-hidden />
                Search
              </Button>
            </>
          )}
        </div>
      </div>

      {criteriaOpen ? (
        <div
          id="search-criteria-panel"
          role="region"
          aria-label="Search criteria options"
          className="px-5 py-4"
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
        </div>
      ) : null}
      <div className="mx-[20px] h-px shrink-0 bg-border-rule" aria-hidden />
    </div>
  );
}

/**
 * Federated search entry screen — query builder, FSQL, and Copilot assistant.
 */
export function SearchLandingPage() {
  const { range: timeframe, setRange: setTimeframeRange } = useTimeframe();
  const { pendingFsqlQuery, setPendingFsqlQuery } = useCopilot();
  const [criteriaMode, setCriteriaMode] = useState<SearchCriteriaMode>("query-builder");
  const [criteriaOpen, setCriteriaOpen] = useState(true);
  const [fsqlQuery, setFsqlQuery] = useState("");
  const [queryBuilderKey, setQueryBuilderKey] = useState(0);
  const [queryBuilderValid, setQueryBuilderValid] = useState(false);
  const [fsqlSearchExecuted, setFsqlSearchExecuted] = useState(false);
  const [fsqlSearching, setFsqlSearching] = useState(false);
  const [searchInitialTimeframe, setSearchInitialTimeframe] = useState<TimeframeRange | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pendingFsqlQuery) return;
    setFsqlQuery(pendingFsqlQuery);
    const parsedTimeframe = parseFsqlTimeframe(pendingFsqlQuery);
    if (parsedTimeframe) setTimeframeRange(parsedTimeframe);
    setCriteriaMode("fsql");
    setCriteriaOpen(true);
    setPendingFsqlQuery(null);
  }, [pendingFsqlQuery, setPendingFsqlQuery, setTimeframeRange]);

  const executeFsqlSearch = () => {
    if (!fsqlQuery.trim()) return;
    const parsedTimeframe = parseFsqlTimeframe(fsqlQuery);
    const searchTimeframe = parsedTimeframe ?? timeframe;
    if (parsedTimeframe) setTimeframeRange(parsedTimeframe);
    setSearchInitialTimeframe(cloneTimeframeRange(searchTimeframe));
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setFsqlSearchExecuted(true);
    setFsqlSearching(true);
    searchTimerRef.current = setTimeout(() => {
      setFsqlSearching(false);
      setCriteriaOpen(false);
      searchTimerRef.current = null;
    }, 450);
  };

  const handleFsqlQueryChange = (query: string) => {
    setFsqlQuery(query);
    const parsedTimeframe = parseFsqlTimeframe(query);
    if (parsedTimeframe) setTimeframeRange(parsedTimeframe);
  };

  const handleConvertToFsql = (query: string) => {
    setFsqlQuery(query);
    const parsedTimeframe = parseFsqlTimeframe(query);
    if (parsedTimeframe) setTimeframeRange(parsedTimeframe);
    setCriteriaMode("fsql");
    setCriteriaOpen(true);
  };

  const handleClearSearch = () => {
    if (criteriaMode === "fsql") {
      setFsqlQuery("");
      setFsqlSearchExecuted(false);
      setFsqlSearching(false);
      setSearchInitialTimeframe(null);
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
      return;
    }
    setQueryBuilderKey((key) => key + 1);
    setQueryBuilderValid(false);
  };

  const handleCriteriaModeChange = (mode: SearchCriteriaMode) => {
    setCriteriaMode(mode);
    setCriteriaOpen(true);
  };

  return (
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
          />

          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            {criteriaMode === "fsql" ? (
              fsqlSearchExecuted ? (
                <FsqlSearchResultsView
                  isSearching={fsqlSearching}
                  searchInitialTimeframe={searchInitialTimeframe}
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
  );
}
