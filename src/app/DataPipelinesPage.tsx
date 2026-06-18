import { useEffect, useState } from "react";
import { Icon } from "../design-system";
import { DataPipelinesDashboard } from "../components/data-pipelines/DataPipelinesDashboard";
import { SearchTopHeader } from "../components/SearchTopHeader";
import { Button } from "@/components/shadcn/button";
import { Input } from "../components/ui/Input";
import { V4NavThinner } from "../components/V4NavThinner";
import { NAV_RAIL_TARGETS } from "./navRailTargets";

/**
 * Security Data Pipeline workspace — Figma `6582:59669` (Data Pipeline).
 */
export function DataPipelinesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const previous = document.title;
    document.title = "Security Data Pipeline";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 bg-surface-page text-text-primary">
      <V4NavThinner variant="federated-search" activeSection="dataPipelines" navTargets={NAV_RAIL_TARGETS} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SearchTopHeader
          title="Security Data Pipeline"
          chromeSurface="page"
          headerAfterTitle={
            <div className="w-[240px] shrink-0">
              <Input
                variant="search"
                placeholder="Search Pipelines"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="!bg-surface-container"
                aria-label="Search pipelines"
              />
            </div>
          }
          titleTrailing={
            <div className="flex items-center gap-4" role="toolbar" aria-label="Pipeline actions">
              <Button type="button" variant="secondary-outline" className="h-8 shrink-0 ring-offset-surface-page">
                <Icon
                  name="action-add"
                  size={12}
                  className="size-3 shrink-0 text-current [&>svg]:!size-[12px]"
                  aria-hidden
                />
                Add Data Pipeline
              </Button>
              <Button type="button" variant="secondary-outline" className="h-8 shrink-0 ring-offset-surface-page">
                <Icon
                  name="action-file-download"
                  size={12}
                  className="size-3 shrink-0 text-current [&>svg]:!size-[12px]"
                  aria-hidden
                />
                Export Data Pipeline
              </Button>
            </div>
          }
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-auto px-5 py-6">
          <DataPipelinesDashboard searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
        </main>
      </div>
    </div>
  );
}
