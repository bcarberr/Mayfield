import { useId } from "react";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Label } from "@/components/shadcn/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/shadcn/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { cn } from "@/lib/utils";
import { useDataGridPageSizePreference } from "./useDataGridPageSizePreference";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function getPaginationItems(page: number, pageCount: number): (number | "ellipsis")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  const items: (number | "ellipsis")[] = [0];
  const start = Math.max(1, page - 1);
  const end = Math.min(pageCount - 2, page + 1);

  if (start > 1) items.push("ellipsis");
  for (let index = start; index <= end; index += 1) items.push(index);
  if (end < pageCount - 2) items.push("ellipsis");
  items.push(pageCount - 1);

  return items;
}

/** Extends footer under the filter-column rail when the table sits beside FilterColumnPanel. */
export const DATA_GRID_FOOTER_BLEED_CLASS = "!-ml-8 !w-[calc(100%+2rem)]";

export type DataGridPaginationProps = {
  page: number;
  pageCount: number;
  itemCount: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  showPageControls?: boolean;
  /** Span full datagrid card width when rendered beside FilterColumnPanel. */
  bleed?: boolean;
  className?: string;
};

export function DataGridPagination({
  page,
  pageCount,
  itemCount,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  showPageControls = pageCount > 1,
  bleed = false,
  className,
}: DataGridPaginationProps) {
  const syncCheckboxId = useId();
  const { syncAllGrids, setSyncAllGrids } = useDataGridPageSizePreference();
  const items = getPaginationItems(page, pageCount);
  const rangeStart = itemCount === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(itemCount, (page + 1) * pageSize);

  return (
    <div
      className={cx(
        "flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-datavis-gridlines bg-datavis-card-bg px-4 py-2.5 sm:px-5",
        bleed && DATA_GRID_FOOTER_BLEED_CLASS,
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-base-small text-text-tertiary">
          {showPageControls ? (
            <>
              Page {page + 1} of {pageCount}
              <span className="hidden sm:inline">
                {" "}
                · {rangeStart}–{rangeEnd} of {itemCount}
              </span>
            </>
          ) : (
            <>
              {itemCount} result{itemCount === 1 ? "" : "s"}
            </>
          )}
        </p>
        <div className="flex items-center gap-2 text-base-small text-text-tertiary">
          <span aria-hidden>Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger
              className="h-8 rounded border-border-container bg-surface-container text-text-primary"
              aria-label="Rows per page"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={syncCheckboxId}
            checked={syncAllGrids}
            onCheckedChange={(checked) => setSyncAllGrids(checked === true, pageSize)}
          />
          <Label
            htmlFor={syncCheckboxId}
            className="cursor-pointer text-base-small font-normal text-text-tertiary"
          >
            Set for all datagrids
          </Label>
        </div>
      </div>
      {showPageControls ? (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={page === 0}
                className={cn(
                  "h-8 text-text-secondary hover:text-text-primary",
                  page === 0 && "pointer-events-none opacity-50",
                )}
                onClick={(event) => {
                  event.preventDefault();
                  if (page > 0) onPageChange(page - 1);
                }}
              />
            </PaginationItem>
            {items.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis className="text-text-tertiary" />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === page}
                    className={cn(
                      "h-8 min-w-8 text-text-secondary hover:text-text-primary",
                      item === page && "border-interactive-active text-text-primary",
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      onPageChange(item);
                    }}
                  >
                    {item + 1}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={page >= pageCount - 1}
                className={cn(
                  "h-8 text-text-secondary hover:text-text-primary",
                  page >= pageCount - 1 && "pointer-events-none opacity-50",
                )}
                onClick={(event) => {
                  event.preventDefault();
                  if (page < pageCount - 1) onPageChange(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
