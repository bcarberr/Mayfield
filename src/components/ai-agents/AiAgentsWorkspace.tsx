import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Icon } from "../../design-system";
import aiAgentsNavSvg from "../../assets/nav-v4/ai-agents.svg?raw";
import { Button } from "@/components/shadcn/button";
import { AgentAvatar } from "./AgentAvatar";
import {
  AGENT_GUARDRAIL_DISCLAIMER,
  AGENT_INPUT_FOOTER_DISCLAIMER,
  AI_AGENTS,
  DEFAULT_AI_AGENT_ID,
  getAiAgent,
  mockAgentResponse,
  type AiAgentDefinition,
  type AiAgentId,
} from "./aiAgentsData";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const AGENTS_SIDEBAR_WIDTH = 340;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentId: AiAgentId;
};

function NavSvgInline({ svg, className }: { svg: string; className?: string }) {
  return (
    <span
      className={cx("inline-flex shrink-0 [&>svg]:size-full", className)}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function ScopeTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border-container bg-surface-modal px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
      {label}
    </span>
  );
}

function GuardrailBanner() {
  return (
    <div
      className="flex gap-3 rounded border border-border-container bg-badge-muted px-4 py-3"
      role="note"
      aria-label="Agent guardrails"
    >
      <Icon name="action-announcement" size={18} className="mt-0.5 shrink-0 text-feedback-caution" aria-hidden />
      <p className="text-sm leading-relaxed text-text-secondary">{AGENT_GUARDRAIL_DISCLAIMER}</p>
    </div>
  );
}

function AgentIntroPanel({
  agent,
  onPromptSelect,
}: {
  agent: AiAgentDefinition;
  onPromptSelect: (prompt: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-center gap-2">
        <AgentAvatar agentId={agent.id} size={24} />
        <h2 className="text-page-title text-text-primary">{agent.name}</h2>
      </div>

      <p className="text-sm leading-relaxed text-text-secondary">{agent.longDescription}</p>

      <div className="flex flex-wrap gap-2">
        {agent.scopeTags.map((tag) => (
          <ScopeTag key={tag} label={tag} />
        ))}
      </div>

      <GuardrailBanner />

      <div className="space-y-3">
        <p className="text-sm font-semibold text-text-primary">Try asking:</p>
        <div className="flex flex-col gap-2">
          {agent.examplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="rounded border border-border-container bg-surface-container px-4 py-3 text-left text-sm leading-relaxed text-text-secondary transition-colors hover:border-interactive-secondary-pressed hover:bg-overlay-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
              onClick={() => onPromptSelect(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentsSidebar({
  open,
  activeAgentId,
  onOpenChange,
  onSwitchAgent,
}: {
  open: boolean;
  activeAgentId: AiAgentId;
  onOpenChange: (open: boolean) => void;
  onSwitchAgent: (agentId: AiAgentId) => void;
}) {
  if (!open) {
    return (
      <aside
        className="relative mr-5 flex h-full w-12 shrink-0 flex-col overflow-hidden border-l border-r border-border-rule bg-surface-modal"
        aria-label="Agents"
      >
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center text-text-tertiary transition-colors hover:bg-overlay-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-active"
          aria-label="Expand agents panel"
          onClick={() => onOpenChange(true)}
        >
          <Icon name="nav-expand" size={16} />
        </button>
        <div className="flex flex-1 flex-col items-center gap-3 px-1 py-3">
          {AI_AGENTS.map((agent) => (
            <button
              key={agent.id}
              type="button"
              className={cx(
                "rounded p-1 transition-colors hover:bg-overlay-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active",
                activeAgentId === agent.id && "bg-interactive-selected",
              )}
              aria-label={`Switch to ${agent.name}`}
              title={agent.name}
              onClick={() => onSwitchAgent(agent.id)}
            >
              <AgentAvatar agentId={agent.id} size={20} />
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="relative mr-5 flex h-full shrink-0 flex-col overflow-hidden border-l border-r border-border-rule bg-surface-modal"
      style={{ width: AGENTS_SIDEBAR_WIDTH, minWidth: AGENTS_SIDEBAR_WIDTH }}
      aria-label="Agents"
    >
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border-rule px-4">
        <div className="flex min-w-0 items-center gap-2">
          <NavSvgInline svg={aiAgentsNavSvg} className="size-[18px] text-interactive-active" />
          <span className="text-base-semibold text-text-primary">Agents</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="p-0 text-text-tertiary hover:text-text-primary"
          aria-label="Collapse agents panel"
          onClick={() => onOpenChange(false)}
        >
          <Icon name="nav-collapse" size={16} />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {AI_AGENTS.map((agent) => {
          const isActive = agent.id === activeAgentId;
          return (
            <div
              key={agent.id}
              className={cx(
                "rounded border px-3 py-3",
                isActive
                  ? "border-interactive-secondary-pressed bg-interactive-selected/50"
                  : "border-border-container bg-surface-page",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <AgentAvatar agentId={agent.id} size={20} />
                  <p className="truncate text-sm font-semibold text-text-primary">{agent.name}</p>
                </div>
                {isActive ? (
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.4px] text-interactive-active">
                    Active
                  </span>
                ) : (
                  <button
                    type="button"
                    className="shrink-0 text-xs font-semibold uppercase tracking-[0.4px] text-interactive-active transition-colors hover:text-interactive-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
                    aria-label={`Switch to ${agent.name}`}
                    onClick={() => onSwitchAgent(agent.id)}
                  >
                    Switch
                  </button>
                )}
              </div>
              <p className="text-xs leading-relaxed text-text-tertiary">{agent.summary}</p>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const agent = getAiAgent(message.agentId);

  return (
    <div className={cx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[min(100%,640px)] rounded border px-4 py-3",
          isUser ? "border-border-rule bg-surface-modal" : "border-border-rule bg-surface-container",
        )}
      >
        {!isUser ? (
          <div className="mb-2 flex items-center gap-2">
            <AgentAvatar agentId={agent.id} size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.4px] text-text-tertiary">
              {agent.name}
            </span>
          </div>
        ) : null}
        <p className="text-sm leading-relaxed text-text-primary">{message.content}</p>
      </div>
    </div>
  );
}

export function AiAgentsWorkspace() {
  const [activeAgentId, setActiveAgentId] = useState<AiAgentId>(DEFAULT_AI_AGENT_ID);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const messageIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeAgent = getAiAgent(activeAgentId);
  const hasMessages = messages.length > 0;

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return `msg-${messageIdRef.current}`;
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isThinking]);

  const submitPrompt = (rawPrompt: string) => {
    const trimmed = rawPrompt.trim();
    if (!trimmed || isThinking) return;

    const agentId = activeAgentId;
    const userMessage: ChatMessage = {
      id: nextMessageId(),
      role: "user",
      content: trimmed,
      agentId,
    };

    setMessages((current) => [...current, userMessage]);
    setPrompt("");
    setIsThinking(true);

    window.setTimeout(() => {
      const agent = getAiAgent(agentId);
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(),
          role: "assistant",
          content: mockAgentResponse(agent, trimmed),
          agentId,
        },
      ]);
      setIsThinking(false);
    }, 450);
  };

  const handleSend = () => submitPrompt(prompt);

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleSwitchAgent = (agentId: AiAgentId) => {
    setActiveAgentId(agentId);
  };

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-page">
        {hasMessages ? (
          <div className="flex shrink-0 items-center gap-2 border-b border-border-rule px-6 py-3">
            <AgentAvatar agentId={activeAgent.id} size={22} />
            <span className="text-base-semibold text-text-primary">{activeAgent.name}</span>
          </div>
        ) : null}

        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6">
          {!hasMessages && !isThinking ? (
            <AgentIntroPanel agent={activeAgent} onPromptSelect={submitPrompt} />
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
              {isThinking ? (
                <div className="max-w-[min(100%,640px)] rounded border border-border-rule bg-surface-container px-4 py-3 text-sm text-text-tertiary">
                  Thinking...
                </div>
              ) : null}
            </div>
          )}
        </div>

        <footer className="shrink-0 px-6 pb-5 pt-3">
          <div className="relative rounded border border-border-rule bg-surface-container">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handlePromptKeyDown}
              rows={1}
              placeholder="How can I help you..."
              className="block min-h-11 w-full resize-none bg-transparent py-3 pl-4 pr-12 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2 p-0 text-interactive-active hover:text-interactive-primary-hover"
              aria-label="Send message"
              disabled={!prompt.trim() || isThinking}
              onClick={handleSend}
            >
              <Icon name="action-prompt-arrow" size={18} />
            </Button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-text-tertiary">{AGENT_INPUT_FOOTER_DISCLAIMER}</p>
        </footer>
      </section>

      <AgentsSidebar
        open={sidebarOpen}
        activeAgentId={activeAgentId}
        onOpenChange={setSidebarOpen}
        onSwitchAgent={handleSwitchAgent}
      />
    </div>
  );
}
