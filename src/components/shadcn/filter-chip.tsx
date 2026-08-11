import * as React from "react"
import { CircleX } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { Icon } from "@/design-system"
import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex h-[26px] max-w-full items-center gap-1 rounded-[14px] border py-1 pl-2 pr-2 text-xs font-semibold tracking-[0.4px] text-text-primary transition-[opacity,box-shadow,border-color,background-color]",
  {
    variants: {
      active: {
        true: "border-border-rule bg-surface-modal hover:border-interactive-active hover:bg-interactive-selected",
        false: "border-border-container bg-surface-container opacity-80",
      },
      draggable: {
        true: "pl-0",
        false: "",
      },
    },
    defaultVariants: {
      active: true,
      draggable: false,
    },
  },
)

function FilterChipToggle({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`Toggle ${label} filter`}
      disabled={disabled}
      className={cn(
        "relative box-border h-[11px] w-[22px] shrink-0 rounded-[9px] border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-transparent bg-interactive-active" : "border-text-tertiary bg-transparent",
      )}
      onClick={(event) => {
        event.stopPropagation()
        onCheckedChange?.(!checked)
      }}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 size-[7px] -translate-y-1/2 rounded-full transition-[left,background-color]",
          checked ? "left-[12px] bg-surface-page" : "left-[1px] bg-text-tertiary",
        )}
      />
    </button>
  )
}

function FilterChipDragHandle({
  label,
  isDragging,
  className,
}: {
  label: string
  isDragging?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "group/handle flex shrink-0 cursor-grab items-center rounded-l-[14px] py-1 pl-2 pr-1 active:cursor-grabbing",
        "transition-colors hover:bg-interactive-active/15",
        isDragging && "cursor-grabbing bg-interactive-active/15",
        className,
      )}
      title={`Drag to reorder ${label}`}
      aria-hidden
    >
      <Icon
        name="action-drag-indicator"
        size={11}
        className={cn(
          "shrink-0 transition-colors",
          isDragging
            ? "text-interactive-active"
            : "text-text-tertiary group-hover/handle:text-interactive-active",
        )}
      />
    </span>
  )
}

type FilterChipProps = Omit<React.ComponentProps<"div">, "onChange"> &
  VariantProps<typeof filterChipVariants> & {
    label: string
    disabled?: boolean
    /** Toggle-style chip — shows check icon and mini switch. */
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    /** Removable chip — shows dismiss control instead of toggle. */
    onRemove?: () => void
    showCheckIcon?: boolean
    isDragging?: boolean
    isDragOver?: boolean
    ringOffsetClassName?: string
  }

function FilterChip({
  className,
  label,
  active,
  draggable,
  checked,
  onCheckedChange,
  onRemove,
  showCheckIcon = true,
  isDragging = false,
  isDragOver = false,
  ringOffsetClassName = "ring-offset-surface-page",
  disabled = false,
  ...props
}: FilterChipProps) {
  const isToggleChip = onRemove == null
  const isActive = isToggleChip ? (checked ?? active ?? true) : (active ?? true)

  return (
    <div
      data-slot="filter-chip"
      data-active={isActive}
      className={cn(
        filterChipVariants({ active: isActive, draggable }),
        disabled && "pointer-events-none opacity-50",
        isDragging && "opacity-50",
        isDragOver && !isDragging && cn("ring-1 ring-border-rule ring-offset-1", ringOffsetClassName),
        className,
      )}
      {...props}
    >
      {draggable ? <FilterChipDragHandle label={label} isDragging={isDragging} /> : null}
      {isToggleChip && showCheckIcon ? (
        <Icon
          name="action-check"
          size={10}
          className="size-2.5 shrink-0 text-text-primary [&>svg]:!size-[10px]"
          aria-hidden
        />
      ) : null}
      <span className="max-w-[12rem] truncate">{label}</span>
      {isToggleChip ? (
        <FilterChipToggle
          checked={isActive}
          onCheckedChange={onCheckedChange}
          label={label}
          disabled={disabled}
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          className="ml-0.5 shrink-0 rounded p-0.5 text-text-tertiary hover:bg-overlay-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-interactive-active"
          aria-label={`Remove ${label} filter`}
          onClick={(event) => {
            event.stopPropagation()
            onRemove?.()
          }}
        >
          <CircleX size={12} strokeWidth={1.5} aria-hidden />
        </button>
      )}
    </div>
  )
}

export { FilterChip, FilterChipDragHandle, FilterChipToggle, filterChipVariants }
