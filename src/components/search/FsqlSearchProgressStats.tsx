import { useState, type ReactNode } from "react";
import { Icon } from "../../design-system";
import {
  formatConnectorSelectionCount,
  useConnectorSelectionCounts,
} from "../connectors/connectorEnabledState";
import { cx } from "../summary-insights/datavisCard";
import { ConnectorSummaryPanel } from "./ConnectorSummaryPanel";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import type { FsqlSearchProgressState } from "./useFsqlSearchProgress";

const SEARCH_PROGRESS_STAT_CARD_CLASS =
  "rounded-[4px] border border-border-container bg-datavis-card-bg px-6 py-5 text-left shadow-datavis-card";

function ProgressSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-8 shrink-0 animate-spin text-interactive-active", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SearchProgressStatCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={SEARCH_PROGRESS_STAT_CARD_CLASS} aria-label={label}>
      <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ConnectorProgressValue({
  complete,
  count,
  onOpenPanel,
  panelLabel,
}: {
  complete: boolean;
  count: number;
  onOpenPanel: () => void;
  panelLabel: string;
}) {
  return (
    <div className="flex min-h-9 items-center gap-3">
      {complete ? (
        <span className="text-3xl font-bold tabular-nums text-text-primary">{count}</span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="size-8 shrink-0 p-0 text-interactive-active hover:bg-overlay-subtle hover:text-interactive-active"
        aria-label={panelLabel}
        onClick={onOpenPanel}
      >
        <Icon name="action-open-in-new" size={14.4} className="size-[14.4px] shrink-0 [&>svg]:!size-[14.4px]" aria-hidden />
      </Button>
      {!complete ? <ProgressSpinner className="size-5" /> : null}
    </div>
  );
}

export function FsqlSearchProgressStats({ progress }: { progress: FsqlSearchProgressState }) {
  const connectorCounts = useConnectorSelectionCounts();
  const [summaryPanelOpen, setSummaryPanelOpen] = useState(false);

  return (
    <>
      <div
        className={cx("grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4")}
        role="status"
        aria-live="polite"
        aria-label="Search progress"
      >
        <SearchProgressStatCard label="Total Results">
          <p className="text-3xl font-bold tabular-nums text-text-primary">
            {progress.displayedTotalResults.toLocaleString()}
          </p>
        </SearchProgressStatCard>

        <SearchProgressStatCard label="Connectors Selected">
          <p className="text-3xl font-bold tabular-nums text-text-primary">
            {formatConnectorSelectionCount(connectorCounts)}
          </p>
        </SearchProgressStatCard>

        <SearchProgressStatCard label="Connector Queries Completed">
          <ConnectorProgressValue
            complete={progress.queriesCompleted}
            count={progress.queriesCompletedCount}
            panelLabel="Open connector summary"
            onOpenPanel={() => setSummaryPanelOpen(true)}
          />
        </SearchProgressStatCard>

        <SearchProgressStatCard label="Connectors Returning Results">
          <ConnectorProgressValue
            complete={progress.returningResultsComplete}
            count={progress.returningResultsCount}
            panelLabel="Open connector summary"
            onOpenPanel={() => setSummaryPanelOpen(true)}
          />
        </SearchProgressStatCard>
      </div>

      <ConnectorSummaryPanel
        open={summaryPanelOpen}
        onClose={() => setSummaryPanelOpen(false)}
        connectorsSelected={connectorCounts}
        queriesCompleted={progress.queriesCompletedCount}
        returningResults={progress.returningResultsCount}
      />
    </>
  );
}
