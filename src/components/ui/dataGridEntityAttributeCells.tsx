import type { CSSProperties } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { TruncatedText } from "./TruncatedText";
import {
  ENTITY_ATTRIBUTE_VISIBLE_COUNT,
  getEntityAttributeDemoValues,
  isEntityAttributeColumn,
} from "./dataGridEntityAttributes";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

function DataGridEntityAttributeCellContent({
  rowId,
  columnId,
}: {
  rowId: string;
  columnId: string;
}) {
  const values = getEntityAttributeDemoValues(rowId, columnId);

  if (!values.length) {
    return <TruncatedText className="text-sm text-text-secondary">—</TruncatedText>;
  }

  if (values.length <= ENTITY_ATTRIBUTE_VISIBLE_COUNT) {
    return <TruncatedText className="text-sm text-text-secondary">{values.join(", ")}</TruncatedText>;
  }

  const visibleText = values.slice(0, ENTITY_ATTRIBUTE_VISIBLE_COUNT).join(", ");

  return (
    <div className="flex min-w-0 max-w-full items-center gap-0.5">
      <TruncatedText className="min-w-0 flex-1 text-sm text-text-secondary" wrapperClassName="min-w-0 flex-1">
        {visibleText}
      </TruncatedText>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="shrink-0 px-0.5 text-sm font-semibold text-text-tertiary transition-colors hover:text-interactive-active"
            aria-label={`Show all ${values.length} values`}
          >
            …
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-64 min-w-[180px] overflow-y-auto border-border-container bg-surface-container text-text-primary ring-0"
        >
          {values.map((value) => (
            <DropdownMenuItem
              key={value}
              disabled
              className="cursor-default text-sm text-text-secondary focus:bg-overlay-subtle focus:text-text-primary"
            >
              {value}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Body cell for optional catalog columns — entity attributes render demo values. */
export function renderDataGridEntityOrEmptyBodyCell({
  columnId,
  rowId,
  colIndex,
  colStyle,
  className,
}: {
  columnId: string;
  rowId: string;
  colIndex: number;
  colStyle: (index: number) => CSSProperties;
  className?: string;
}) {
  return (
    <td key={columnId} style={colStyle(colIndex)} className={cx(className, "min-w-0")}>
      {isEntityAttributeColumn(columnId) ? (
        <DataGridEntityAttributeCellContent rowId={rowId} columnId={columnId} />
      ) : (
        <TruncatedText className="text-sm text-text-secondary">—</TruncatedText>
      )}
    </td>
  );
}
