import type { ReactNode } from "react";
import { Icon } from "../../design-system";
import type { ConnectorSelectionCounts } from "../connectors/connectorEnabledState";
import { formatConnectorSelectionCount } from "../connectors/connectorEnabledState";
import { cx } from "../summary-insights/datavisCard";
import {
  PageSlideOver,
  SlideOverHeaderBackButton,
  THREE_QUARTER_VIEWPORT_SLIDE_OVER_PANEL_CLASS,
} from "../ui/SlideOver";
import { CONNECTOR_SUMMARY_ROWS, type ConnectorSummaryRow } from "./connectorSummaryData";
import {
  ConnectorPartialErrorsIcon,
  ConnectorPartialMaxIcon,
  ConnectorQuerySuccessIcon,
} from "./ConnectorSummaryResultIcons";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { TooltipProvider } from "@/components/shadcn/tooltip";

const SUMMARY_STAT_CARD_CLASS =
  "rounded-[4px] border border-border-container bg-datavis-card-bg px-6 py-5 text-left shadow-datavis-card";

function SummaryStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={SUMMARY_STAT_CARD_CLASS}>
      <p className="text-xs font-bold uppercase tracking-wide text-text-primary">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">{value}</p>
    </div>
  );
}

function StatusNotePopover({
  note,
  children,
  ariaLabel,
}: {
  note: string;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-h-0 gap-1.5 p-0 font-semibold hover:bg-transparent"
          aria-label={ariaLabel}
        >
          {children}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-w-xs border-border-container bg-surface-modal p-3 text-sm font-semibold text-feedback-info ring-1 ring-border-container"
      >
        {note}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QueryStatusCell({ row }: { row: ConnectorSummaryRow }) {
  if (row.queryStatus === "not-planned") {
    return (
      <span className="text-tbl-head uppercase text-feedback-caution">NOT PLANNED *</span>
    );
  }

  return <ConnectorQuerySuccessIcon />;
}

function ResultIndicator({ row }: { row: ConnectorSummaryRow }) {
  if (row.resultKind === "no-data") {
    return <span className="text-tbl-head uppercase text-text-primary">NO DATA</span>;
  }

  if (row.resultKind === "not-applicable") {
    return <span className="text-sm text-text-secondary">—</span>;
  }

  if (row.resultKind === "success") {
    return <ConnectorQuerySuccessIcon />;
  }

  if (row.resultKind === "partial-max") {
    return <ConnectorPartialMaxIcon />;
  }

  if (row.resultKind === "partial-errors") {
    return <ConnectorPartialErrorsIcon />;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <ConnectorPartialErrorsIcon />
      <span className="text-tbl-head uppercase text-interactive-active">MAX</span>
    </span>
  );
}

export function ConnectorSummaryPanel({
  open,
  onClose,
  connectorsSelected,
  queriesCompleted,
  returningResults,
}: {
  open: boolean;
  onClose: () => void;
  connectorsSelected: ConnectorSelectionCounts;
  queriesCompleted: number;
  returningResults: number;
}) {
  return (
    <PageSlideOver
      open={open}
      onClose={onClose}
      ariaLabel="Connector Summary"
      panelClassName={THREE_QUARTER_VIEWPORT_SLIDE_OVER_PANEL_CLASS}
    >
      <TooltipProvider>
        <div className="flex h-full min-h-0 flex-col bg-surface-modal text-text-primary">
          <header className="shrink-0 border-b border-border-rule bg-surface-modal px-6 pt-5 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <SlideOverHeaderBackButton onClose={onClose} className="" />
                <h1 className="text-[24px] font-bold leading-8 tracking-[0.7px] text-text-primary">
                  Connector Summary
                </h1>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="size-8 shrink-0 rounded-2xl p-1"
                aria-label="Close connector summary panel"
                onClick={onClose}
              >
                <Icon name="close" size={24} aria-hidden />
              </Button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-6 pt-6">
              <div className={cx("grid grid-cols-1 gap-4 sm:grid-cols-3")}>
                <SummaryStatCard
                  label="Connectors Selected"
                  value={formatConnectorSelectionCount(connectorsSelected)}
                />
                <SummaryStatCard label="Connector Queries Completed" value={queriesCompleted} />
                <SummaryStatCard label="Connectors Returning Results" value={returningResults} />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-6 pt-6 pb-6">
              <div className="rounded-[4px] border border-border-container bg-datavis-card-bg shadow-datavis-card">
                <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
                  <colgroup>
                    <col className="w-1/3" />
                    <col className="w-1/3" />
                    <col className="w-1/3" />
                  </colgroup>
                  <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-b [&_th]:border-datavis-gridlines [&_th]:bg-surface-table-row-header">
                    <tr>
                      <th
                        scope="col"
                        className="h-10 border-r border-datavis-gridlines px-4 text-left text-tbl-head uppercase text-text-primary"
                      >
                        Connector
                      </th>
                      <th
                        scope="col"
                        className="h-10 border-r border-datavis-gridlines px-4 text-center text-tbl-head uppercase text-text-primary"
                      >
                        Query Status
                      </th>
                      <th
                        scope="col"
                        className="h-10 px-4 text-center text-tbl-head uppercase text-text-primary"
                      >
                        Results
                      </th>
                    </tr>
                  </thead>
                <tbody>
                  {CONNECTOR_SUMMARY_ROWS.map((row) => (
                    <tr key={row.id} className="hover:bg-overlay-subtle">
                      <td className="border-b border-r border-datavis-gridlines px-4 py-3 text-left align-middle">
                        <span className="inline-flex min-w-0 items-center gap-3">
                          <Icon
                            name={row.icon}
                            size={24}
                            className="size-6 shrink-0 [&>svg]:!size-6"
                            aria-hidden
                          />
                          <span className="min-w-0 text-sm font-semibold text-text-primary">
                            {row.name}
                            {row.limit != null ? (
                              <span className="font-normal text-text-tertiary"> (Limit: {row.limit})</span>
                            ) : null}
                          </span>
                        </span>
                      </td>
                      <td className="border-b border-r border-datavis-gridlines px-4 py-3 text-center align-middle">
                        <div className="flex justify-center">
                          <QueryStatusCell row={row} />
                        </div>
                      </td>
                      <td className="border-b border-datavis-gridlines px-4 py-3 align-middle">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                          <span aria-hidden />
                          <StatusNotePopover
                            note={row.statusNote}
                            ariaLabel={`Status details for ${row.name}`}
                          >
                            <ResultIndicator row={row} />
                          </StatusNotePopover>
                          <div className="flex justify-end">
                            {row.showView ? (
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-sm font-semibold text-interactive-active"
                              >
                                View
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </TooltipProvider>
    </PageSlideOver>
  );
}
