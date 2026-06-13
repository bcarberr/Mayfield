import { type KeyboardEvent, useEffect, useRef } from "react";
import { Icon } from "../design-system";
import { Button } from "./ui/Button";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

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
      <textarea
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
        className="min-h-10 w-full resize-none rounded border border-border-rule bg-surface-modal px-3 py-2.5 pr-12 text-sm leading-relaxed text-text-primary outline-none transition-[border-color,box-shadow] placeholder:italic placeholder:text-text-tertiary focus:border-interactive-active focus:ring-1 focus:ring-interactive-active"
      />
      <Button
        type="button"
        variant="ghost"
        className={cx(
          "absolute bottom-3 right-3 size-7 p-0 transition-colors",
          hasValue
            ? "text-interactive-active hover:text-interactive-active"
            : "text-text-tertiary hover:text-text-tertiary",
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
