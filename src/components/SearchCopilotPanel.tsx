import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Copy, Search, ThumbsDown, ThumbsUp } from "lucide-react";
import { Icon } from "../design-system";
import {
  type CopilotAssistantResponse,
  type CopilotMessageBlock,
  extractFsqlFromCopilotResponse,
  formatCopilotResponseForCopy,
  getCopilotWelcomeResponse,
  isExecutableFsqlQuery,
  resolveCopilotPrompt,
} from "../lib/fsqlCopilotResponder";
import { Button } from "@/components/shadcn/button";
import { DEFAULT_COPILOT_PANEL_WIDTH, useCopilot } from "../context/CopilotContext";
import { SearchAgentsPanel } from "./search/SearchAgentsPanel";
import aiAgentsNavSvg from "../assets/nav-v4/ai-agents.svg?raw";
import copilotSparklesUrl from "../assets/icons/copilot-sparkles.svg?url";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const COPILOT_ACTION_BTN_CLASS =
  "size-7 p-0 text-text-tertiary hover:bg-overlay-subtle hover:text-text-primary active:bg-interactive-secondary-pressed active:text-text-primary disabled:pointer-events-none disabled:!opacity-40";

const COPILOT_PANEL_WIDTH = DEFAULT_COPILOT_PANEL_WIDTH;
const COPILOT_PANEL_MIN_WIDTH = 280;
const COPILOT_PANEL_MAX_WIDTH = 640;

function clampCopilotPanelWidth(width: number) {
  return Math.round(Math.min(COPILOT_PANEL_MAX_WIDTH, Math.max(COPILOT_PANEL_MIN_WIDTH, width)));
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content?: string;
  response?: CopilotAssistantResponse;
};

function CopilotSparkMark({ className }: { className?: string }) {
  return (
    <img
      src={copilotSparklesUrl}
      alt=""
      aria-hidden
      draggable={false}
      className={cx("block shrink-0 object-contain", className)}
    />
  );
}

function CopilotMessageActions({
  response,
  onCopy,
}: {
  response?: CopilotAssistantResponse;
  onCopy: () => void;
}) {
  if (!response) return null;

  const hasCopyContent = Boolean(extractFsqlFromCopilotResponse(response) || formatCopilotResponseForCopy(response));

  return (
    <div className="mt-3 flex items-center justify-end gap-1">
      <Button type="button" variant="ghost" size="icon-sm" className={COPILOT_ACTION_BTN_CLASS} aria-label="Helpful response">
        <ThumbsUp size={14} strokeWidth={1.5} className="text-current" aria-hidden />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" className={COPILOT_ACTION_BTN_CLASS} aria-label="Unhelpful response">
        <ThumbsDown size={14} strokeWidth={1.5} className="text-current" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={COPILOT_ACTION_BTN_CLASS}
        aria-label="Copy message"
        disabled={!hasCopyContent}
        onClick={onCopy}
      >
        <Copy size={14} strokeWidth={1.5} className="text-current" aria-hidden />
      </Button>
    </div>
  );
}
function CopilotResponseBlock({
  block,
  onSendToFsqlSearch,
}: {
  block: CopilotMessageBlock;
  onSendToFsqlSearch?: (query: string) => void;
}) {
  switch (block.type) {
    case "text":
      return <p className="text-sm leading-relaxed text-text-primary">{block.text}</p>;
    case "code": {
      const canSendToSearch =
        block.language === "fsql" && isExecutableFsqlQuery(block.text) && onSendToFsqlSearch;

      return (
        <div className="space-y-2">
          <pre className="overflow-x-auto rounded border border-border-rule bg-surface-modal px-3 py-2 text-xs leading-relaxed text-text-primary">
            <code>{block.text}</code>
          </pre>
          {canSendToSearch ? (
            <Button
              type="button"
              variant="secondary-outline"
              size="sm"
              className="w-full"
              onClick={() => onSendToFsqlSearch(block.text.trim())}
            >
              <Search size={16} strokeWidth={1.5} className="shrink-0 text-current" aria-hidden />
              Send to Query
            </Button>
          ) : null}
        </div>
      );
    }
    case "list":
      return (
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
  }
}

function CopilotMessageBubble({
  message,
  onSuggestionClick,
  onSendToFsqlSearch,
}: {
  message: ChatMessage;
  onSuggestionClick?: (prompt: string) => void;
  onSendToFsqlSearch?: (query: string) => void;
}) {
  const isUser = message.role === "user";

  const handleCopy = async () => {
    if (!message.response) return;
    const content = extractFsqlFromCopilotResponse(message.response) || formatCopilotResponseForCopy(message.response);
    if (!content) return;
    await navigator.clipboard.writeText(content);
  };

  return (
    <div className={cx(isUser ? "ml-12" : "mr-12")}>
    <div
      className={cx(
        "rounded-[8px] border px-4 py-3",
        isUser
          ? "border-border-rule bg-surface-modal"
          : "border-border-rule bg-surface-container",
      )}
    >
      {isUser ? (
        <p className="text-sm leading-relaxed text-text-primary">{message.content}</p>
      ) : (
        <div className="space-y-3">
          {message.response?.blocks.map((block, index) => {
            if (block.type === "list" && message.id === "welcome") {
              return (
                <ul key={`${message.id}-list-${index}`} className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary">
                  {block.items.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className="text-left hover:text-text-primary hover:underline"
                        onClick={() => onSuggestionClick?.(item)}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <CopilotResponseBlock
                key={`${message.id}-${index}`}
                block={block}
                onSendToFsqlSearch={onSendToFsqlSearch}
              />
            );
          })}
          <CopilotMessageActions response={message.response} onCopy={handleCopy} />
        </div>
      )}
    </div>
    </div>
  );
}

export type CopilotSubmitRequest = {
  id: number;
  prompt: string;
};

type AssistantPanelMode = "copilot" | "agents";

const ASSISTANT_MODE_OPTIONS: readonly { id: AssistantPanelMode; label: string }[] = [
  { id: "copilot", label: "Copilot" },
  { id: "agents", label: "Agents" },
];

function NavSvgInline({ svg, className }: { svg: string; className?: string }) {
  return (
    <span
      className={cx("inline-flex shrink-0 [&>svg]:size-full", className)}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function AssistantModeSwitch({
  value,
  onChange,
}: {
  value: AssistantPanelMode;
  onChange: (mode: AssistantPanelMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Assistant mode"
      className="flex rounded border border-border-rule bg-surface-container p-0.5"
    >
      {ASSISTANT_MODE_OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cx(
              "flex-1 rounded px-3 py-1.5 text-sm font-semibold leading-5 transition-colors",
              selected
                ? "bg-surface-modal text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary",
            )}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function CopilotChatView({
  fsqlQuery = "",
  submitRequest,
  onSendToFsqlSearch,
}: {
  fsqlQuery?: string;
  submitRequest?: CopilotSubmitRequest | null;
  onSendToFsqlSearch?: (query: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", response: getCopilotWelcomeResponse() },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const lastSubmitRequestIdRef = useRef<number | null>(null);

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return `msg-${messageIdRef.current}`;
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isThinking]);

  const submitPrompt = useCallback(
    (rawPrompt: string) => {
      const trimmed = rawPrompt.trim();
      if (!trimmed || isThinking) return;

      const userMessage: ChatMessage = {
        id: nextMessageId(),
        role: "user",
        content: trimmed,
      };

      setMessages((current) => [...current, userMessage]);
      setPrompt("");
      setIsThinking(true);

      window.setTimeout(() => {
        const response = resolveCopilotPrompt(trimmed, fsqlQuery);
        setMessages((current) => [
          ...current,
          { id: nextMessageId(), role: "assistant", response },
        ]);
        setIsThinking(false);
      }, 450);
    },
    [fsqlQuery, isThinking],
  );

  useEffect(() => {
    if (!submitRequest || submitRequest.id === lastSubmitRequestIdRef.current) return;
    lastSubmitRequestIdRef.current = submitRequest.id;
    submitPrompt(submitRequest.prompt);
  }, [submitRequest, submitPrompt]);

  const handleSend = () => submitPrompt(prompt);

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <CopilotMessageBubble
            key={message.id}
            message={message}
            onSuggestionClick={submitPrompt}
            onSendToFsqlSearch={onSendToFsqlSearch}
          />
        ))}
        {isThinking ? (
          <div className="rounded-[8px] border border-border-rule bg-surface-container px-4 py-3 text-sm text-text-tertiary">
            Thinking...
          </div>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-border-rule px-4 py-3">
        <div className="relative rounded border border-border-rule bg-surface-container">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handlePromptKeyDown}
            rows={3}
            placeholder="Ask me anything about search..."
            className="block w-full resize-none bg-transparent px-3 py-2.5 pr-10 text-sm text-text-primary outline-none placeholder:italic placeholder:text-text-tertiary"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute bottom-2 right-2 p-0 text-interactive-active hover:text-interactive-active"
            aria-label="Send copilot message"
            disabled={!prompt.trim() || isThinking}
            onClick={handleSend}
          >
            <Icon name="action-prompt-arrow" size={16} />
          </Button>
        </div>
      </footer>
    </div>
  );
}

export function SearchAssistantPanel({
  onClose,
  fsqlQuery = "",
  submitRequest,
  onSendToFsqlSearch,
}: {
  onClose: () => void;
  fsqlQuery?: string;
  submitRequest?: CopilotSubmitRequest | null;
  onSendToFsqlSearch?: (query: string) => void;
}) {
  const [mode, setMode] = useState<AssistantPanelMode>("copilot");

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex shrink-0 flex-col gap-3 border-b border-border-rule px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {mode === "copilot" ? (
                <CopilotSparkMark className="size-[18px]" />
              ) : (
                <NavSvgInline svg={aiAgentsNavSvg} className="size-[18px] text-interactive-active" />
              )}
              <span className="text-base font-semibold leading-6 text-text-primary">
                {mode === "copilot" ? "Copilot" : "Agents"}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-tertiary">
              {mode === "copilot" ? "Search assistant copilot" : "Choose a specialist agent"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 p-1 text-text-tertiary hover:text-text-primary"
            aria-label="Close assistant panel"
            onClick={onClose}
          >
            <Icon name="close" size={20} />
          </Button>
        </div>
        <AssistantModeSwitch value={mode} onChange={setMode} />
      </header>

      {mode === "copilot" ? (
        <CopilotChatView
          fsqlQuery={fsqlQuery}
          submitRequest={submitRequest}
          onSendToFsqlSearch={onSendToFsqlSearch}
        />
      ) : (
        <SearchAgentsPanel />
      )}
    </div>
  );
}

/** @deprecated Internal copilot shell — use {@link SearchAssistantPanel}. */
function SearchCopilotPanel({
  onClose,
  fsqlQuery = "",
  submitRequest,
  onSendToFsqlSearch,
}: {
  onClose: () => void;
  fsqlQuery?: string;
  submitRequest?: CopilotSubmitRequest | null;
  onSendToFsqlSearch?: (query: string) => void;
}) {
  return (
    <SearchAssistantPanel
      onClose={onClose}
      fsqlQuery={fsqlQuery}
      submitRequest={submitRequest}
      onSendToFsqlSearch={onSendToFsqlSearch}
    />
  );
}

export function SearchCopilotSidePanel({
  open,
  onOpenChange,
  fsqlQuery = "",
  submitRequest,
  onSendToFsqlSearch,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fsqlQuery?: string;
  submitRequest?: CopilotSubmitRequest | null;
  onSendToFsqlSearch?: (query: string) => void;
}) {
  const { panelWidth: contextPanelWidth, setPanelWidth: setCopilotPanelWidth, setIsResizingCopilot } = useCopilot();
  const [panelWidth, setPanelWidth] = useState(() => contextPanelWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    setCopilotPanelWidth(panelWidth);
  }, [panelWidth, setCopilotPanelWidth]);

  const handleResizePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeDragRef.current = { startX: event.clientX, startWidth: panelWidth };
    setIsResizing(true);
    setIsResizingCopilot(true);
  };

  const handleResizePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizeDragRef.current) return;
    const { startX, startWidth } = resizeDragRef.current;
    setPanelWidth(clampCopilotPanelWidth(startWidth + (startX - event.clientX)));
  };

  const handleResizePointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resizeDragRef.current = null;
    setIsResizing(false);
    setIsResizingCopilot(false);
  };

  return (
    <aside
      className={cx(
        "relative flex h-full shrink-0 flex-col overflow-hidden bg-surface-modal",
        open ? "border-l border-border-rule" : "border-l-0",
        !isResizing && "transition-[width,border-color] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
      )}
      style={{ width: open ? panelWidth : 0 }}
      aria-label="Search assistant copilot"
      aria-hidden={!open}
    >
      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Resize assistant panel"
          aria-orientation="vertical"
          aria-valuemin={COPILOT_PANEL_MIN_WIDTH}
          aria-valuemax={COPILOT_PANEL_MAX_WIDTH}
          aria-valuenow={panelWidth}
          className={cx(
            "group/resize absolute -left-1.5 top-0 z-10 h-full w-3 cursor-col-resize touch-none border-0 bg-transparent p-0",
            "hover:bg-overlay-subtle active:bg-overlay-subtle",
          )}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerEnd}
          onPointerCancel={handleResizePointerEnd}
          onLostPointerCapture={() => {
            resizeDragRef.current = null;
            setIsResizing(false);
            setIsResizingCopilot(false);
          }}
        >
          <span
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/resize:bg-interactive-active group-active/resize:bg-interactive-active"
            aria-hidden
          />
        </button>
      ) : null}
      <div
        className={cx("flex h-full flex-col", !open && "invisible")}
        style={{ width: panelWidth, minWidth: panelWidth }}
      >
        {open ? (
          <SearchAssistantPanel
            onClose={() => onOpenChange(false)}
            fsqlQuery={fsqlQuery}
            submitRequest={submitRequest}
            onSendToFsqlSearch={onSendToFsqlSearch}
          />
        ) : null}
      </div>
    </aside>
  );
}

/** @deprecated Use {@link SearchCopilotSidePanel} — copilot docks as a resizable right rail. */
export function SearchCopilotFullPage({
  open,
  onOpenChange,
  fsqlQuery = "",
  submitRequest,
  onSendToFsqlSearch,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fsqlQuery?: string;
  submitRequest?: CopilotSubmitRequest | null;
  onSendToFsqlSearch?: (query: string) => void;
}) {
  return (
    <SearchCopilotSidePanel
      open={open}
      onOpenChange={onOpenChange}
      fsqlQuery={fsqlQuery}
      submitRequest={submitRequest}
      onSendToFsqlSearch={onSendToFsqlSearch}
    />
  );
}

export { CopilotSparkMark };

/** @deprecated Side-rail copilot — use header trigger with {@link SearchCopilotFullPage}. */
export function SearchCopilotAside({
  open,
  onOpenChange,
  fsqlQuery = "",
  submitRequest,
  onSendToFsqlSearch,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fsqlQuery?: string;
  submitRequest?: CopilotSubmitRequest | null;
  onSendToFsqlSearch?: (query: string) => void;
}) {
  return (
    <aside
      className={cx(
        "relative mr-[20px] h-full shrink-0 overflow-hidden border-l border-r border-border-rule bg-surface-modal transition-[width] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
        open ? "w-[min(100%,360px)]" : "w-12",
      )}
      aria-label="Search assistant copilot"
    >
      {!open ? (
        <button
          type="button"
          className="flex h-full w-full flex-col items-center px-1 pt-4 text-text-primary transition-colors hover:bg-overlay-subtle"
          aria-label="Open search copilot"
          onClick={() => onOpenChange(true)}
        >
          <CopilotSparkMark />
        </button>
      ) : (
        <div
          className="h-full animate-slide-over-in"
          style={{ width: COPILOT_PANEL_WIDTH, minWidth: COPILOT_PANEL_WIDTH }}
        >
          <SearchCopilotPanel
            onClose={() => onOpenChange(false)}
            fsqlQuery={fsqlQuery}
            submitRequest={submitRequest}
            onSendToFsqlSearch={onSendToFsqlSearch}
          />
        </div>
      )}
    </aside>
  );
}
