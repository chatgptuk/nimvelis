import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import { ROOT_DIRECTORY_ID } from '../../kernel/vfs';
import {
  completionCandidates,
  executeTerminalCommand,
  resolvePath,
  type TerminalLineTone,
} from './command-engine';
import './terminal.css';

interface TranscriptLine {
  id: string;
  kind: 'command' | 'output';
  text: string;
  tone: TerminalLineTone;
  prompt?: string;
}

interface NetworkInformationLike {
  type?: string;
  effectiveType?: string;
}

type NetworkNavigator = Navigator & {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
};

const HISTORY_KEY = 'nimvelis.terminal.history.v1';
const HISTORY_LIMIT = 100;

const INITIAL_TRANSCRIPT: TranscriptLine[] = [
  {
    id: 'welcome-title',
    kind: 'output',
    text: 'Nimvelis Local Shell 1.0',
    tone: 'accent',
  },
  {
    id: 'welcome-boundary',
    kind: 'output',
    text: 'Browser-local commands only · host OS processes and remote shells are not exposed',
    tone: 'muted',
  },
  {
    id: 'welcome-help',
    kind: 'output',
    text: 'Type “help” for commands, or try “neofetch”, “ls”, and “apps”.',
    tone: 'normal',
  },
];

export function TerminalApp({ system, window }: SystemAppProps) {
  const initialCwd = readInitialCwd(window.instanceData);
  const [cwdId, setCwdId] = useState(initialCwd);
  const [cwdPath, setCwdPath] = useState('/');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>(INITIAL_TRANSCRIPT);
  const [history, setHistory] = useState(readHistory);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const apps = useMemo(() => system.listApps(), [system]);

  useEffect(() => {
    let active = true;
    void resolvePath(system.files, cwdId, '.').then((resolved) => {
      if (!active) return;
      setCwdId(resolved.id);
      setCwdPath(resolved.path);
    });
    return () => {
      active = false;
    };
  }, [cwdId, system.files]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    globalThis.addEventListener('online', update);
    globalThis.addEventListener('offline', update);
    return () => {
      globalThis.removeEventListener('online', update);
      globalThis.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [busy, transcript]);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => inputRef.current?.focus(), 80);
    return () => globalThis.clearTimeout(timer);
  }, []);

  const runCommand = useCallback(
    async (requestedCommand: string) => {
      const command = requestedCommand.trim();
      if (!command || busy) return;

      const commandLine: TranscriptLine = {
        id: createLineId(),
        kind: 'command',
        text: command,
        tone: 'normal',
        prompt: `local@nimvelis:${shortenPath(cwdPath)} $`,
      };
      setTranscript((lines) => [...lines, commandLine]);
      setInput('');
      setHistoryIndex(null);

      const nextHistory =
        history.at(-1) === command ? history : [...history, command].slice(-HISTORY_LIMIT);
      setHistory(nextHistory);
      persistHistory(nextHistory);
      setBusy(true);

      const result = await executeTerminalCommand(command, {
        files: system.files,
        cwdId,
        apps,
        history: nextHistory,
        timeZone: system.preferences.timeZone,
        online,
        networkType: readNetworkType(),
        openApp: system.openApp,
        openFile: system.openFile,
        close: () => system.closeWindow(window.id),
        setAppearance: system.setAppearance,
        setTimeZone: (timeZone) => system.updatePreferences({ timeZone }),
      });

      if (result.clear) {
        setTranscript([]);
      } else if (result.lines.length) {
        setTranscript((lines) => [
          ...lines,
          ...result.lines.map((line): TranscriptLine => ({
            id: createLineId(),
            kind: 'output',
            text: line.text,
            tone: line.tone ?? 'normal',
          })),
        ]);
      }

      if (result.cwd) {
        setCwdId(result.cwd.id);
        setCwdPath(result.cwd.path);
        system.updateWindowData(window.id, { cwdId: result.cwd.id });
      }
      setBusy(false);
    },
    [apps, busy, cwdId, cwdPath, history, online, system, window.id],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void runCommand(input);
  };

  const completeInput = async () => {
    const candidates = await completionCandidates(input, {
      files: system.files,
      cwdId,
      apps,
    });
    if (!candidates.length) return;
    if (candidates.length === 1 && candidates[0]) {
      setInput(applyCompletion(input, candidates[0]));
      return;
    }
    setTranscript((lines) => [
      ...lines,
      {
        id: createLineId(),
        kind: 'output',
        text: candidates.join('    '),
        tone: 'muted',
      },
    ]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!history.length) return;
      const nextIndex = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex] ?? '');
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex] ?? '');
      }
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      void completeInput();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'l') {
      event.preventDefault();
      setTranscript([]);
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'c') {
      if (input) {
        event.preventDefault();
        setTranscript((lines) => [
          ...lines,
          {
            id: createLineId(),
            kind: 'command',
            text: `${input} ^C`,
            tone: 'muted',
            prompt: `local@nimvelis:${shortenPath(cwdPath)} $`,
          },
        ]);
        setInput('');
      }
    }
  };

  const copySession = async () => {
    const text = transcript
      .map((line) => (line.kind === 'command' ? `${line.prompt} ${line.text}` : line.text))
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      system.notify('Terminal session copied', 'success');
    } catch {
      system.notify('Unable to copy the Terminal session', 'error');
    }
  };

  return (
    <div
      className="terminal-app"
      onPointerDown={(event) => {
        if (!(event.target instanceof HTMLButtonElement)) inputRef.current?.focus();
      }}
    >
      <header className="terminal-toolbar">
        <div>
          <span className={`terminal-session-dot ${online ? 'is-online' : 'is-offline'}`} />
          <span>
            <strong>LOCAL SESSION</strong>
            <small>{cwdPath}</small>
          </span>
        </div>
        <div className="terminal-toolbar__actions">
          <span>UTF-8</span>
          <button
            type="button"
            onClick={() => void copySession()}
            aria-label="Copy terminal session"
          >
            Copy
          </button>
          <button type="button" onClick={() => setTranscript([])} aria-label="Clear terminal">
            Clear
          </button>
        </div>
      </header>

      <div className="terminal-output" role="log" aria-label="Terminal output" ref={outputRef}>
        {transcript.map((line) => (
          <div
            className={`terminal-line is-${line.kind} is-${line.tone}`}
            key={line.id}
            data-terminal-line={line.kind}
          >
            {line.kind === 'command' ? (
              <span className="terminal-prompt">{line.prompt}</span>
            ) : null}
            <span>{line.text || '\u00a0'}</span>
          </div>
        ))}
        {busy ? (
          <div className="terminal-busy" aria-label="Command running">
            <span />
            <span />
            <span />
          </div>
        ) : null}
      </div>

      {!transcript.length ? (
        <div className="terminal-empty">
          <Icon name="terminal" size={23} />
          <span>Clean session</span>
          <button type="button" onClick={() => void runCommand('help')}>
            Show commands
          </button>
        </div>
      ) : null}

      <form className="terminal-composer" onSubmit={submit}>
        <label htmlFor={`terminal-input-${window.id}`}>
          <span>local@nimvelis</span>
          <small>{shortenPath(cwdPath)}</small>
          <b>$</b>
        </label>
        <input
          id={`terminal-input-${window.id}`}
          ref={inputRef}
          value={input}
          disabled={busy}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Terminal command"
          placeholder={busy ? 'Running command…' : 'Enter a local command'}
          onChange={(event) => {
            setInput(event.target.value);
            setHistoryIndex(null);
          }}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Run command">
          <Icon name="arrow-right" size={16} />
        </button>
      </form>

      <footer className="terminal-footer">
        <span>↑↓ history</span>
        <span>Tab complete</span>
        <span>Ctrl L clear</span>
        <strong>LOCAL VFS</strong>
      </footer>
    </div>
  );
}

function readInitialCwd(value: unknown) {
  if (!value || typeof value !== 'object') return ROOT_DIRECTORY_ID;
  return typeof (value as { cwdId?: unknown }).cwdId === 'string'
    ? (value as { cwdId: string }).cwdId
    : ROOT_DIRECTORY_ID;
}

function readHistory(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(stored)
      ? stored.filter((item): item is string => typeof item === 'string').slice(-HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function persistHistory(history: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-HISTORY_LIMIT)));
  } catch {
    // Command history is a convenience; the shell remains usable when storage is unavailable.
  }
}

function readNetworkType() {
  const deviceNavigator = navigator as NetworkNavigator;
  const connection =
    deviceNavigator.connection ?? deviceNavigator.mozConnection ?? deviceNavigator.webkitConnection;
  if (!connection) return undefined;
  const type = connection.type && connection.type !== 'unknown' ? connection.type : undefined;
  return type ?? connection.effectiveType;
}

function applyCompletion(input: string, candidate: string) {
  const trimmed = input.trimStart();
  if (!trimmed.includes(' ')) return `${candidate} `;
  const lastSpace = input.lastIndexOf(' ');
  const prefix = input.slice(0, lastSpace + 1);
  const value = candidate.includes(' ') ? `"${candidate}"` : candidate;
  return `${prefix}${value}${candidate.endsWith('/') ? '' : ' '}`;
}

function shortenPath(path: string) {
  if (path === '/') return '~';
  const segments = path.split('/').filter(Boolean);
  return segments.length > 2 ? `…/${segments.slice(-2).join('/')}` : path;
}

function createLineId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
