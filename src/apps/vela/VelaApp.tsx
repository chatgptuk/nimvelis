import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AppIcon, Icon } from '../../design/Icon';
import { MarkdownContent } from '../../design/MarkdownContent';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import { readVelaResponse } from './stream';
import './vela.css';

type VelaRole = 'user' | 'assistant';
type VelaMessageState = 'complete' | 'streaming' | 'error';

interface VelaMessage {
  id: string;
  role: VelaRole;
  content: string;
  createdAt: number;
  state: VelaMessageState;
}

const STORAGE_KEY = 'nimvelis.aurora.vela';
const HISTORY_LIMIT = 30;
const REQUEST_HISTORY_LIMIT = 18;
const WELCOME_MESSAGE =
  'Hello — I’m Vela. I can help you think, write, plan, and explain things without leaving Nimvelis.';
const SUGGESTIONS = [
  'Turn a rough idea into a clear plan',
  'Help me write a concise project update',
  'Explain a difficult topic simply',
] as const;
const VELA_MODEL = {
  id: 'gemma-4-26b',
  label: 'Gemma 4 26B',
  detail: 'Deep',
  modelId: '@cf/google/gemma-4-26b-a4b-it',
} as const;

export function VelaApp({ system }: SystemAppProps) {
  const [messages, setMessages] = useState<VelaMessage[]>(readHistory);
  const [draft, setDraft] = useState('');
  const [responseModel, setResponseModel] = useState<string>(VELA_MODEL.modelId);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isResponding = messages.some((message) => message.state === 'streaming');
  const requestMessages = useMemo(
    () =>
      messages
        .filter((message) => message.state === 'complete')
        .slice(-REQUEST_HISTORY_LIMIT)
        .map(({ role, content }) => ({ role, content })),
    [messages],
  );

  useEffect(() => {
    const saved = messages.filter((message) => message.state === 'complete').slice(-HISTORY_LIMIT);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // The conversation remains available for this open session.
    }
  }, [messages]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [messages]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const send = async (suggestion?: string) => {
    const content = (suggestion ?? draft).trim();
    if (!content || isResponding) return;

    const userMessage = createMessage('user', content);
    const assistantMessage = createMessage('assistant', '', 'streaming');
    const nextRequest = [...requestMessages, { role: 'user' as const, content }].slice(
      -REQUEST_HISTORY_LIMIT,
    );

    setDraft('');
    setMessages((current) => [...current, userMessage, assistantMessage].slice(-HISTORY_LIMIT));
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/vela/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextRequest, model: VELA_MODEL.id }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => null);
        const message =
          isRecord(errorBody) && typeof errorBody.error === 'string'
            ? errorBody.error
            : `Vela could not respond (${response.status}).`;
        throw new Error(message);
      }

      const usedModel = response.headers.get('X-Nimvelis-AI-Model');
      if (usedModel) setResponseModel(usedModel);

      let received = '';
      await readVelaResponse(response, (chunk) => {
        received += chunk;
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id ? { ...message, content: received } : message,
          ),
        );
      });

      if (!received.trim()) throw new Error('Workers AI returned an empty response.');
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id ? { ...message, state: 'complete' } : message,
        ),
      );
    } catch (error) {
      if (controller.signal.aborted) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content: message.content || 'Response stopped.',
                  state: 'complete',
                }
              : message,
          ),
        );
      } else {
        const errorMessage =
          error instanceof Error ? error.message : 'Vela is temporarily unavailable.';
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: errorMessage, state: 'error' }
              : message,
          ),
        );
        system.notify(errorMessage, 'error');
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const clearConversation = () => {
    if (messages.length > 1 && !globalThis.confirm('Clear this Vela conversation?')) return;
    abortRef.current?.abort();
    setMessages([createWelcomeMessage()]);
    setDraft('');
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <div className="vela-app">
      <header className="vela-hero">
        <div className="vela-identity">
          <span className="vela-orb" aria-hidden="true">
            <AppIcon name="vela" size={48} />
          </span>
          <span>
            <small>NIMVELIS INTELLIGENCE</small>
            <strong>Vela</strong>
            <span>Text assistant powered by Workers AI</span>
          </span>
        </div>
        <div className="vela-hero__actions">
          <div className="vela-model" aria-label="Vela model">
            <span>Model</span>
            <strong title={VELA_MODEL.modelId}>
              {VELA_MODEL.label} · {VELA_MODEL.detail}
            </strong>
          </div>
          <button type="button" className="vela-clear" onClick={clearConversation}>
            <Icon name="plus" size={15} />
            New chat
          </button>
        </div>
      </header>

      <div className="vela-conversation" ref={scrollRef} aria-live="polite">
        {messages.map((message) => (
          <article
            className={`vela-message vela-message--${message.role} ${
              message.state === 'error' ? 'is-error' : ''
            }`}
            key={message.id}
          >
            <span className="vela-message__role">{message.role === 'user' ? 'You' : 'Vela'}</span>
            <div>
              {message.content ? (
                message.role === 'assistant' && message.state !== 'error' ? (
                  <MarkdownContent
                    text={message.content}
                    className="vela-markdown"
                    ariaLabel="Vela response"
                  />
                ) : (
                  <p>{message.content}</p>
                )
              ) : (
                <span className="vela-thinking" aria-label="Vela is thinking">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </div>
            {message.role === 'assistant' &&
            message.content &&
            message.state !== 'streaming' &&
            message.state !== 'error' ? (
              <button
                type="button"
                className="vela-copy"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(message.content);
                    system.notify('Vela response copied', 'success');
                  } catch {
                    system.notify('Clipboard access is unavailable', 'error');
                  }
                }}
              >
                Copy
              </button>
            ) : null}
          </article>
        ))}

        {messages.length === 1 ? (
          <div className="vela-suggestions" aria-label="Suggested prompts">
            {SUGGESTIONS.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => {
                  void send(suggestion);
                }}
              >
                <Icon name="sparkle" size={15} />
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <footer className="vela-composer">
        <div className="vela-composer__box">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 6_000))}
            onKeyDown={handleDraftKeyDown}
            placeholder="Message Vela…"
            aria-label="Message Vela"
            rows={2}
            disabled={isResponding}
          />
          {isResponding ? (
            <button
              type="button"
              className="vela-send is-stop"
              aria-label="Stop Vela response"
              onClick={() => abortRef.current?.abort()}
            >
              <span />
            </button>
          ) : (
            <button
              type="button"
              className="vela-send"
              aria-label="Send message"
              disabled={!draft.trim()}
              onClick={() => {
                void send();
              }}
            >
              <Icon name="chevron" size={18} />
            </button>
          )}
        </div>
        <div className="vela-privacy">
          <span>
            Prompts are sent to Cloudflare Workers AI. Nimvelis does not send your local files.
          </span>
          <span title={responseModel}>{VELA_MODEL.label} · local history</span>
        </div>
      </footer>
    </div>
  );
}

function readHistory(): VelaMessage[] {
  if (typeof localStorage === 'undefined') return [createWelcomeMessage()];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!Array.isArray(parsed)) return [createWelcomeMessage()];
    const messages = parsed.flatMap((candidate): VelaMessage[] => {
      if (!isRecord(candidate)) return [];
      if (candidate.role !== 'user' && candidate.role !== 'assistant') return [];
      if (typeof candidate.content !== 'string' || !candidate.content.trim()) return [];
      return [
        {
          id: typeof candidate.id === 'string' ? candidate.id : createId(),
          role: candidate.role,
          content: candidate.content.slice(0, 12_000),
          createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : Date.now(),
          state: 'complete',
        },
      ];
    });
    return messages.length ? messages.slice(-HISTORY_LIMIT) : [createWelcomeMessage()];
  } catch {
    return [createWelcomeMessage()];
  }
}

function createWelcomeMessage(): VelaMessage {
  return createMessage('assistant', WELCOME_MESSAGE);
}

function createMessage(
  role: VelaRole,
  content: string,
  state: VelaMessageState = 'complete',
): VelaMessage {
  return { id: createId(), role, content, createdAt: Date.now(), state };
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
