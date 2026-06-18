import { type KeyboardEvent, useEffect, useRef } from "react";
import { Icon } from "../design-system";
import { Button } from "@/components/shadcn/button";
import { Textarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/utils";

const MIN_HEIGHT_PX = 40;
const MAX_HEIGHT_PX = 240;

function syncTextareaHeight(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  const nextHeight = Math.min(Math.max(textarea.scrollHeight, MIN_HEIGHT_PX), MAX_HEIGHT_PX);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > MAX_HEIGHT_PX ? "auto" : "hidden";
}

export function FsqlSearchTextarea({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasValue = value.trim().length > 0;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    syncTextareaHeight(textarea);
  }, [value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleResize = () => syncTextareaHeight(textarea);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (hasValue) onSearch();
          }
        }}
        rows={1}
        placeholder="Search using our FSQL"
        className={cn(
          "field-sizing-fixed min-h-10 max-h-60 resize-none rounded border-border-rule bg-surface-modal px-3 py-2.5 pr-12 text-sm leading-relaxed text-text-primary shadow-none",
          "placeholder:italic placeholder:text-text-tertiary focus-visible:border-interactive-active focus-visible:ring-1 focus-visible:ring-interactive-active dark:bg-surface-modal",
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          "absolute bottom-3 right-3 size-7",
          hasValue
            ? "text-interactive-active hover:bg-overlay-subtle hover:text-interactive-active"
            : "text-text-tertiary hover:bg-transparent hover:text-text-tertiary",
        )}
        aria-label="Run FSQL search"
        disabled={!hasValue}
        onClick={onSearch}
      >
        <Icon name="action-prompt-arrow" size={16} />
      </Button>
    </div>
  );
}
