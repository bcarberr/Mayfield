import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Icon } from "../../design-system";
import { AgentAvatar } from "../ai-agents/AgentAvatar";
import {
  AGENT_GUARDRAIL_DISCLAIMER,
  AGENT_INPUT_FOOTER_DISCLAIMER,
  AI_AGENTS,
  DEFAULT_AI_AGENT_ID,
  getAiAgent,
  mockAgentResponse,
  type AiAgentDefinition,
  type AiAgentId,
} from "../ai-agents/aiAgentsData";
import { Button } from "@/components/shadcn/button";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type AgentChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentId: AiAgentId;
};

function AgentPickerCard({
  agent,
  active,
  onSelect,
}: {
  agent: AiAgentDefinition;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cx(
        "w-full rounded border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active",
        active
          ? "border-interactive-secondary-pressed bg-interactive-selected/50"
          : "border-border-container bg-surface-page hover:border-interactive-secondary-pressed hover:bg-overlay-subtle",
      )}
      aria-pressed={active}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <AgentAvatar agentId={agent.id} size={20} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-text-primary">{agent.name}</span>
            {active ? (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.4px] text-interactive-active">
                Active
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-tertiary">{agent.summary}</p>
        </div>
      </div>
    </button>
  );
}

function AgentChatBubble({ message }: { message: AgentChatMessage }) {
  const isUser = message.role === "user";
  const agent = getAiAgent(message.agentId);

  return (
    <div
      className={cx(
        "rounded border px-3 py-2.5",
        isUser ? "border-border-rule bg-surface-modal" : "border-border-rule bg-surface-container",
      )}
    >
      {!isUser ? (
        <div className="mb-2 flex items-center gap-2">
          <AgentAvatar agentId={agent.id} size={16} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.4px] text-text-tertiary">
            {agent.name}
          </span>
        </div>
      ) : null}
      <p className="text-sm leading-relaxed text-text-primary">{message.content}</p>
    </div>
  );
}

function AgentIntroContent({
  agent,
  onPromptSelect,
}: {
  agent: AiAgentDefinition;
  onPromptSelect: (prompt: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-text-secondary">{agent.longDescription}</p>
      <div
        className="rounded border border-border-container bg-badge-muted px-3 py-2.5 text-xs leading-relaxed text-text-secondary"
        role="note"
      >
        {AGENT_GUARDRAIL_DISCLAIMER}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-primary">Try asking:</p>
        {agent.examplePrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="w-full rounded border border-border-container bg-surface-container px-3 py-2.5 text-left text-sm leading-relaxed text-text-secondary transition-colors hover:border-interactive-secondary-pressed hover:bg-overlay-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive-active"
            onClick={() => onPromptSelect(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchAgentsPanel() {
  const [activeAgentId, setActiveAgentId] = useState<AiAgentId>(DEFAULT_AI_AGENT_ID);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const messageIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeAgent = getAiAgent(activeAgentId);
  const hasMessages = messages.length > 0;

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return `agent-msg-${messageIdRef.current}`;
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isThinking, activeAgentId]);

  const submitPrompt = (rawPrompt: string) => {
    const trimmed = rawPrompt.trim();
    if (!trimmed || isThinking) return;

    const agentId = activeAgentId;
    setMessages((current) => [
      ...current,
      { id: nextMessageId(), role: "user", content: trimmed, agentId },
    ]);
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-2 border-b border-border-rule px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.4px] text-text-tertiary">Choose agent</p>
        <div className="max-h-[168px] space-y-2 overflow-y-auto pr-1">
          {AI_AGENTS.map((agent) => (
            <AgentPickerCard
              key={agent.id}
              agent={agent}
              active={agent.id === activeAgentId}
              onSelect={() => handleSwitchAgent(agent.id)}
            />
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {!hasMessages && !isThinking ? (
          <AgentIntroContent agent={activeAgent} onPromptSelect={submitPrompt} />
        ) : (
          <>
            {messages
              .filter((message) => message.agentId === activeAgentId)
              .map((message) => (
                <AgentChatBubble key={message.id} message={message} />
              ))}
            {isThinking ? (
              <div className="rounded border border-border-rule bg-surface-container px-3 py-2.5 text-sm text-text-tertiary">
                Thinking...
              </div>
            ) : null}
          </>
        )}
      </div>

      <footer className="shrink-0 border-t border-border-rule px-4 py-3">
        <div className="relative rounded border border-border-rule bg-surface-container">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handlePromptKeyDown}
            rows={3}
            placeholder={`Ask ${activeAgent.name}...`}
            className="block w-full resize-none bg-transparent px-3 py-2.5 pr-10 text-sm text-text-primary outline-none placeholder:italic placeholder:text-text-tertiary"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute bottom-2 right-2 p-0 text-interactive-active hover:text-interactive-active"
            aria-label="Send agent message"
            disabled={!prompt.trim() || isThinking}
            onClick={handleSend}
          >
            <Icon name="action-prompt-arrow" size={16} />
          </Button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-text-tertiary">{AGENT_INPUT_FOOTER_DISCLAIMER}</p>
      </footer>
    </div>
  );
}
