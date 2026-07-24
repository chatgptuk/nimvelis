import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../design/Icon';
import type { VfsNode } from '../../kernel/vfs';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import { MEMO_DIRECTORY_NAME, saveMemoFile, type MemoFileReference } from './storage';
import './memo.css';

interface MemoData {
  content: string;
  updatedAt?: string;
  fileId?: string;
  fileName?: string;
  parentId?: string;
}

export function MemoApp({ window, system }: SystemAppProps) {
  const [initialData] = useState(() => readMemoData(window.instanceData));
  const [content, setContent] = useState(initialData.content);
  const [fileNode, setFileNode] = useState<VfsNode | null>(null);
  const [hydrated, setHydrated] = useState(!initialData.fileId);
  const [saveState, setSaveState] = useState(
    initialData.fileId ? 'Loading file…' : (initialData.updatedAt ?? 'New memo'),
  );
  const fileReference = useRef<MemoFileReference>({
    fileId: initialData.fileId,
    fileName: initialData.fileName,
    parentId: initialData.parentId,
  });
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const saveRevision = useRef(0);
  const lastSavedContent = useRef<string | null>(null);
  const mounted = useRef(true);

  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);

  useEffect(() => {
    if (!initialData.fileId) return;
    let active = true;

    const loadFile = async () => {
      try {
        await system.files.ready();
        const node = await system.files.get(initialData.fileId!);
        if (!node || node.kind !== 'file') {
          if (!active) return;
          fileReference.current = {};
          setSaveState(initialData.content.trim() ? 'Restoring in Files…' : 'New memo');
          setHydrated(true);
          return;
        }
        const text = await (await system.files.readFile(node.id)).text();
        if (!active) return;
        fileReference.current = {
          fileId: node.id,
          fileName: node.name,
          parentId: node.parentId,
        };
        lastSavedContent.current = text;
        setFileNode(node);
        setContent(text);
        setSaveState(`Saved in Files › ${MEMO_DIRECTORY_NAME}`);
        setHydrated(true);
      } catch {
        if (!active) return;
        setSaveState('Unable to load saved file');
        setHydrated(true);
      }
    };

    void loadFile();
    return () => {
      active = false;
    };
  }, [initialData.content, initialData.fileId, system.files]);

  useEffect(() => {
    const firstLine = content
      .split('\n')
      .find((line) => line.trim())
      ?.trim();
    system.setWindowTitle(window.id, firstLine ? firstLine.slice(0, 42) : 'Untitled memo');
  }, [content, system, window.id]);

  useEffect(() => {
    if (!hydrated) return;
    const revision = ++saveRevision.current;

    system.updateWindowData(window.id, {
      content,
      updatedAt: fileReference.current.fileId ? 'Saved in Files' : 'New memo',
      ...fileReference.current,
    } satisfies MemoData);

    if (!fileReference.current.fileId && !content.trim()) {
      setSaveState('New memo');
      return;
    }
    if (fileReference.current.fileId && content === lastSavedContent.current) return;

    setSaveState('Saving to Files…');
    const timer = globalThis.setTimeout(() => {
      const snapshot = content;
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const node = await saveMemoFile(system.files, {
              ...fileReference.current,
              content: snapshot,
            });
            fileReference.current = {
              fileId: node.id,
              fileName: node.name,
              parentId: node.parentId,
            };
            lastSavedContent.current = snapshot;
            system.updateWindowData(window.id, {
              content: snapshot,
              updatedAt: 'Saved in Files',
              ...fileReference.current,
            } satisfies MemoData);
            if (!mounted.current) return;
            setFileNode(node);
            if (revision === saveRevision.current) {
              setSaveState(`Saved in Files › ${MEMO_DIRECTORY_NAME}`);
            }
          } catch {
            if (mounted.current && revision === saveRevision.current) {
              setSaveState('Could not save to Files');
              system.notify('Memo could not be saved to Files.', 'error');
            }
          }
        });
    }, 420);

    return () => globalThis.clearTimeout(timer);
  }, [content, hydrated, system, window.id]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const createMemo = () => {
    system.openApp('memo', {
      instanceData: { content: '' } satisfies MemoData,
    });
  };

  return (
    <div className="memo-app">
      <header className="memo-toolbar">
        <div className="memo-meta">
          <span className="memo-kicker">LOCAL MEMO</span>
          <span aria-live="polite">{saveState}</span>
        </div>
        <div className="memo-toolbar__actions">
          {fileNode ? (
            <button
              type="button"
              className="app-toolbar-button"
              onClick={() => system.openFile(fileNode)}
            >
              <Icon name="text" size={16} />
              Open file
            </button>
          ) : null}
          <button type="button" className="app-toolbar-button" onClick={createMemo}>
            <Icon name="plus" size={16} />
            New memo
          </button>
        </div>
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
        {fileNode ? (
          <button
            type="button"
            className="memo-file-location"
            title={`Open ${fileNode.name} in Text`}
            onClick={() => system.openFile(fileNode)}
          >
            Files › {MEMO_DIRECTORY_NAME} › {fileNode.name}
          </button>
        ) : null}
        <span className="memo-local-badge">
          {fileNode ? 'File saved locally' : 'On this device'}
        </span>
      </footer>
    </div>
  );
}

function readMemoData(value: unknown): MemoData {
  if (typeof value !== 'object' || value === null) return { content: '' };
  const candidate = value as Partial<MemoData>;
  return {
    content: typeof candidate.content === 'string' ? candidate.content : '',
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : undefined,
    fileId: typeof candidate.fileId === 'string' ? candidate.fileId : undefined,
    fileName: typeof candidate.fileName === 'string' ? candidate.fileName : undefined,
    parentId: typeof candidate.parentId === 'string' ? candidate.parentId : undefined,
  };
}
