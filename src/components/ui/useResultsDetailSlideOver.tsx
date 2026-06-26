import { useCallback, useMemo, useRef, useState } from "react";
import {
  PageSlideOver,
  THREE_QUARTER_VIEWPORT_SLIDE_OVER_PANEL_CLASS,
} from "./SlideOver";
import { ResultsDetailPanel } from "./ResultsDetailPanel";
import { asResultsDetailSourceRow, buildResultsDetailRecord } from "./resultsDetailPanelModel";

export type ResultsDetailRowInput = {
  id: string;
  title: string;
  time: string;
  connector: string;
  description?: string;
  eventClass?: string;
  category?: string;
  eventType?: string;
  activity?: string;
  status?: string;
  severity?: string;
};

export function useResultsDetailSlideOver(rows: readonly ResultsDetailRowInput[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeIndex = activeId != null ? rows.findIndex((row) => row.id === activeId) : -1;
  const activeRow = activeIndex >= 0 ? rows[activeIndex] : undefined;

  // Lazily materialize only the active row's record (avoids building all records on every filter change)
  const activeRecord = useMemo(
    () => (activeRow != null ? buildResultsDetailRecord(asResultsDetailSourceRow(activeRow)) : undefined),
    [activeRow],
  );

  // Cache last valid record so the panel stays visible when the active row is filtered out of the current view
  const lastActiveRecordRef = useRef<ReturnType<typeof buildResultsDetailRecord> | undefined>(undefined);
  if (activeRecord !== undefined) lastActiveRecordRef.current = activeRecord;
  const displayRecord = activeRecord ?? lastActiveRecordRef.current;

  const open = useCallback((id: string) => setActiveId(id), []);
  const close = useCallback(() => setActiveId(null), []);

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < rows.length - 1;

  const goPrev = useCallback(() => {
    if (activeIndex > 0) setActiveId(rows[activeIndex - 1].id);
  }, [activeIndex, rows]);

  const goNext = useCallback(() => {
    if (activeIndex >= 0 && activeIndex < rows.length - 1) {
      setActiveId(rows[activeIndex + 1].id);
    }
  }, [activeIndex, rows]);

  return {
    open,
    close,
    activeId,
    isOpen: activeId != null && displayRecord != null,
    activeRecord: displayRecord,
    activeIndex,
    total: rows.length,
    canGoPrev,
    canGoNext,
    goPrev,
    goNext,
  };
}

export type ResultsDetailSlideOverProps = ReturnType<typeof useResultsDetailSlideOver>;

export function ResultsDetailSlideOver({
  isOpen,
  close,
  activeRecord,
  activeIndex,
  total,
  canGoPrev,
  canGoNext,
  goPrev,
  goNext,
}: ResultsDetailSlideOverProps) {
  if (!activeRecord) return null;

  return (
    <PageSlideOver
      open={isOpen}
      onClose={close}
      ariaLabel="Event details"
      panelClassName={THREE_QUARTER_VIEWPORT_SLIDE_OVER_PANEL_CLASS}
    >
      <ResultsDetailPanel
        record={activeRecord}
        recordIndex={activeIndex}
        recordTotal={total}
        onClose={close}
        onPrev={goPrev}
        onNext={goNext}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
      />
    </PageSlideOver>
  );
}
