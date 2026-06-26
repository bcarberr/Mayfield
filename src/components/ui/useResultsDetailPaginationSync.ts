import { useEffect } from "react";
import { DATA_GRID_DETAIL_ROW_ATTR } from "./dataGridDetailRowHighlight";

export function useResultsDetailPaginationSync({
  activeId,
  isOpen,
  rows,
  page,
  setPage,
  pageSize,
}: {
  activeId: string | null;
  isOpen: boolean;
  rows: readonly { id: string }[];
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
}) {
  useEffect(() => {
    if (!isOpen || !activeId) return;

    const rowIndex = rows.findIndex((row) => row.id === activeId);
    if (rowIndex < 0) return;

    const targetPage = Math.floor(rowIndex / pageSize);
    if (targetPage !== page) {
      setPage(targetPage);
    }

    const scrollTimer = window.setTimeout(() => {
      const rowElement = document.querySelector(
        `[${DATA_GRID_DETAIL_ROW_ATTR}="${CSS.escape(activeId)}"]`,
      );
      rowElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 0);

    return () => window.clearTimeout(scrollTimer);
  }, [activeId, isOpen, rows, page, setPage, pageSize]);
}
