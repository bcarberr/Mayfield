import { useState } from "react";
import { Icon } from "../design-system";
import { SearchEntityEventSelect } from "../components/SearchEntityEventSelect";
import { SearchHeaderFilters } from "../components/SearchHeaderFilters";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { V4NavThinner } from "../components/V4NavThinner";
import { Button } from "../components/ui/Button";
import connectionAbstractUrl from "../assets/connection-abstract.svg";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

const toolbarBtnRing = "ring-offset-surface-container";

function SearchToolbarActions() {
  const [criteriaOpen, setCriteriaOpen] = useState(true);

  return (
    <div className="flex shrink-0 flex-col bg-surface-container">
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
        role="toolbar"
        aria-label="Search actions"
      >
        <button
          type="button"
          aria-expanded={criteriaOpen}
          aria-controls="search-criteria-panel"
          className="flex items-center gap-2 rounded py-1 pr-1 text-left text-sm font-semibold leading-5 tracking-[0.4px] text-text-primary transition-colors hover:bg-overlay-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
          onClick={() => setCriteriaOpen((o) => !o)}
        >
          <Icon
            name="chevron-down"
            size={18}
            className={`shrink-0 text-text-primary transition-transform duration-150 ease-out ${criteriaOpen ? "" : "-rotate-90"}`}
            aria-hidden
          />
          Search Criteria
        </button>

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" className={toolbarBtnRing} disabled>
            <Icon name="action-time" className="shrink-0 text-current" aria-hidden />
            Schedule Search
          </Button>
          <Button type="button" variant="secondary" className={toolbarBtnRing} disabled>
            <Icon name="action-saved-search" className="shrink-0 text-current" aria-hidden />
            Save Search
          </Button>
          <Button type="button" variant="secondary" className={toolbarBtnRing} disabled>
            <Icon name="action-cancel-clear" className="shrink-0 text-current" aria-hidden />
            Clear Search
          </Button>
        </div>
      </div>

      {criteriaOpen ? (
        <div
          id="search-criteria-panel"
          role="region"
          aria-label="Search criteria options"
          className="px-5 py-4"
        >
          <SearchEntityEventSelect aria-label="Select Entity or Event" className="max-w-[360px]" />
        </div>
      ) : null}
      <div className="mx-[20px] h-px shrink-0 bg-border-rule" aria-hidden />
    </div>
  );
}

/**
 * Federated search entry screen — welcome hero and guidance copy.
 */
export function SearchLandingPage() {
  return (
    <div className="flex h-full min-h-0 bg-surface-container text-text-primary">
      <V4NavThinner
        variant="federated-search"
        activeSection="search"
        navTargets={NAV_RAIL_TARGETS}
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader headerAfterTitle={<SearchHeaderFilters />} />
        <SearchToolbarActions />

        <div className="relative min-h-0 flex-1 overflow-hidden">
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

          <main className="relative z-[1] flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-12 sm:py-16 md:py-20">
            <div className="mt-[60px] flex w-full max-w-[720px] flex-col items-stretch">
              <h1 className="text-center text-3xl font-bold leading-9 tracking-[0.5px] text-text-primary sm:text-4xl sm:leading-tight">
                Welcome Bonnie Carberry!
              </h1>
              <p className="mx-auto mt-4 max-w-[560px] text-center text-base leading-6 text-text-secondary">
                Query every connected source from a single field. Combine field paths, identifiers, and plain-language
                terms in one search.
              </p>

              <section
                className="mt-14 pt-10 text-text-tertiary"
                aria-labelledby="search-tips-heading"
              >
                <h2 id="search-tips-heading" className="text-base-semibold text-text-primary">
                  Search tips
                </h2>
                <ul className="mt-4 space-y-3 text-base-small">
                  <li className="flex gap-3">
                    <span className="mt-0.5 shrink-0 font-semibold">•</span>
                    <span>
                      Narrow by connector or dataset name — matching behaves like the mapping workspace quick filters.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 shrink-0 font-semibold">•</span>
                    <span>
                      Use field paths (for example{" "}
                      <span className="font-mono text-text-tertiary">event.action</span>) to jump to schema-aligned results.
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
      </div>
    </div>
  );
}
