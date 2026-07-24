import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import './memo.css';

interface MemoData {
  content: string;
  updatedAt?: string;
}

export function MemoApp({ window, system }: SystemAppProps) {
  const initialData = readMemoData(window.instanceData);
  const [content, setContent] = useState(initialData.content);
  const [saveState, setSaveState] = useState(initialData.updatedAt ?? 'Saved locally');

  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);

  useEffect(() => {
    const timer = windowGlobal.setTimeout(() => {
      system.updateWindowData(window.id, {
        content,
        updatedAt: 'Saved just now',
      } satisfies MemoData);
      const firstLine = content
        .split('\n')
        .find((line) => line.trim())
        ?.trim();
      system.setWindowTitle(window.id, firstLine ? firstLine.slice(0, 42) : 'Untitled memo');
      setSaveState('Saved just now');
    }, 240);

    return () => windowGlobal.clearTimeout(timer);
  }, [content, system, window.id]);

  const createMemo = () => {
    system.openApp('memo', {
      instanceData: { content: '', updatedAt: 'New memo' } satisfies MemoData,
    });
  };

  return (
    <div className="memo-app">
      <header className="memo-toolbar">
        <div className="memo-meta">
          <span className="memo-kicker">LOCAL MEMO</span>
          <span aria-live="polite">{saveState}</span>
        </div>
        <button type="button" className="app-toolbar-button" onClick={createMemo}>
          <Icon name="plus" size={16} />
          New memo
        </button>
      </header>
      <textarea
        className="memo-editor"
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setSaveState('Saving…');
        }}
        spellCheck
        aria-label="Memo content"
        placeholder="Start with a thought…"
      />
      <footer className="memo-footer">
        <span>{wordCount} words</span>
        <span>{content.length} characters</span>
        <span className="memo-local-badge">On this device</span>
      </footer>
    </div>
  );
}

const windowGlobal = globalThis.window;

function readMemoData(value: unknown): MemoData {
  if (typeof value !== 'object' || value === null) return { content: '' };
  const candidate = value as Partial<MemoData>;
  return {
    content: typeof candidate.content === 'string' ? candidate.content : '',
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : undefined,
  };
}
