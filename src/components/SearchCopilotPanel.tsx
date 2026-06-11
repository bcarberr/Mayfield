import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "../design-system";
import {
  type CopilotAssistantResponse,
  type CopilotMessageBlock,
  formatCopilotResponseForCopy,
  getCopilotWelcomeResponse,
  isExecutableFsqlQuery,
  resolveCopilotPrompt,
} from "../lib/fsqlCopilotResponder";
import { Button } from "./ui/Button";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const COPILOT_PANEL_WIDTH = 360;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content?: string;
  response?: CopilotAssistantResponse;
};

function CopilotSparkMark() {
  const uid = useId().replace(/:/g, "");
  const ga = `${uid}-spark-a`;
  const gb = `${uid}-spark-b`;

  return (
    <svg width="44.8" height="35.2" viewBox="0 0 44.8 35.2" fill="none" className="shrink-0" aria-hidden>
      <defs>
        <linearGradient id={ga} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1ec1dd" />
          <stop offset="100%" stopColor="#7fe8ff" />
        </linearGradient>
        <linearGradient id={gb} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff8200" />
          <stop offset="100%" stopColor="#fac354" />
        </linearGradient>
      </defs>
      <svg x="0" y="0" width="35.2" height="35.2" viewBox="0 0 24 24">
        <path d="M12 3l1.2 4.2L17 8.5l-3.8 1.3L12 14l-1.2-4.2L7 8.5l3.8-1.3L12 3Z" fill={`url(#${ga})`} />
      </svg>
      <svg x="22.4" y="3.2" width="22.4" height="22.4" viewBox="0 0 24 24">
        <path d="M12 3l1.2 4.2L17 8.5l-3.8 1.3L12 14l-1.2-4.2L7 8.5l3.8-1.3L12 3Z" fill={`url(#${gb})`} />
      </svg>
    </svg>
  );
}

function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10v10H4V10h3zm1.5-1h8.2c.8 0 1.4.6 1.5 1.4l1.1 6.5c.1.9-.6 1.6-1.5 1.6H11l-2.2-9.5V9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 14V4H4v10h3zm1.5 1h8.2c.8 0 1.4-.6 1.5-1.4l1.1-6.5c.1-.9-.6-1.6-1.5-1.6H11l-2.2 9.5V15z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
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
              variant="secondary"
              size="small"
              className="w-full"
              onClick={() => onSendToFsqlSearch(block.text.trim())}
            >
              <Icon name="action-search" className="shrink-0 text-current" aria-hidden />
              Send to FSQL Search
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
    case "link":
      return (
        <a
          href={block.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-sm font-semibold text-interactive-active hover:underline"
        >
          {block.label}
        </a>
      );
  }
}

function CopilotMessageActions({
  response,
  onCopy,
}: {
  response?: CopilotAssistantResponse;
  onCopy: () => void;
}) {
  if (!response) return null;

  return (
    <div className="mt-3 flex items-center justify-end gap-1">
      <Button type="button" variant="ghost" className="size-7 p-0 text-text-tertiary hover:text-text-primary" aria-label="Helpful response">
        <ThumbUpIcon className="size-4" />
      </Button>
      <Button type="button" variant="ghost" className="size-7 p-0 text-text-tertiary hover:text-text-primary" aria-label="Unhelpful response">
        <ThumbDownIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="size-7 p-0 text-text-tertiary hover:text-text-primary"
        aria-label="Copy copilot message"
        onClick={onCopy}
      >
        <Icon name="action-content-copy" size={14} />
      </Button>
    </div>
  );
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
    await navigator.clipboard.writeText(formatCopilotResponseForCopy(message.response));
  };

  return (
    <div
      className={cx(
        "rounded border px-4 py-3",
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
  );
}

export type CopilotSubmitRequest = {
  id: number;
  prompt: string;
};

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
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-rule px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CopilotSparkMark />
            <span className="text-base font-semibold leading-6 text-text-primary">Copilot</span>
          </div>
          <p className="mt-1 text-sm text-text-tertiary">Search assistant copilot</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="shrink-0 p-1 text-text-tertiary hover:text-text-primary"
          aria-label="Close copilot"
          onClick={onClose}
        >
          <Icon name="close" size={20} />
        </Button>
      </header>

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
          <div className="rounded border border-border-rule bg-surface-container px-4 py-3 text-sm text-text-tertiary">
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
            className="absolute bottom-2 right-2 size-7 p-0 text-interactive-active hover:text-interactive-active"
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
          className="flex h-full w-full flex-col items-center px-1 pt-4 text-text-primary transition-colors hover:bg-overlay-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-active"
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
