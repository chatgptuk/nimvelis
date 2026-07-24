import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../design/Icon';
import { ROOT_DIRECTORY_ID } from '../../kernel/vfs';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import './text.css';

type SaveState = 'loading' | 'clean' | 'dirty' | 'saving' | 'saved' | 'error';

function defaultFileName(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : 'Untitled.txt';
}

export function TextApp({ system, window }: SystemAppProps) {
  const instanceData = readInstanceData(window.instanceData);
  const initialFileId = typeof instanceData.fileId === 'string' ? instanceData.fileId : null;
  const [fileId, setFileId] = useState<string | null>(initialFileId);
  const [parentId, setParentId] = useState(ROOT_DIRECTORY_ID);
  const [fileName, setFileName] = useState(defaultFileName(instanceData.fileName));
  const [text, setText] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const hydrated = useRef(false);
  const revision = useRef(0);
  const saveSequence = useRef(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      await system.files.ready();
      if (!initialFileId) {
        if (!active) return;
        hydrated.current = true;
        setSaveState('clean');
        return;
      }

      const [node, blob] = await Promise.all([
        system.files.get(initialFileId),
        system.files.readFile(initialFileId),
      ]);
      if (!active) return;

      if (!node || !blob) {
        hydrated.current = true;
        setSaveState('error');
        system.notify('This document could not be found.', 'error');
        return;
      }

      setParentId(node.parentId ?? ROOT_DIRECTORY_ID);
      setFileName(node.name);
      setText(await blob.text());
      system.setWindowTitle(window.id, node.name);
      hydrated.current = true;
      setSaveState('clean');
    };

    void load();
    return () => {
      active = false;
    };
  }, [initialFileId, system, window.id]);

  const save = async () => {
    if (!hydrated.current) return;
    const currentSequence = ++saveSequence.current;
    const savedRevision = revision.current;
    setSaveState('saving');
    try {
      const node = await system.files.writeFile({
        id: fileId ?? undefined,
        parentId,
        name: defaultFileName(fileName),
        data: new Blob([text], { type: 'text/plain' }),
        mimeType: 'text/plain',
      });
      if (currentSequence !== saveSequence.current) return;
      setFileId(node.id);
      setFileName(node.name);
      system.setWindowTitle(window.id, node.name);
      setSaveState(revision.current === savedRevision ? 'saved' : 'dirty');
    } catch {
      if (currentSequence === saveSequence.current) setSaveState('error');
    }
  };

  useEffect(() => {
    if (!hydrated.current || saveState !== 'dirty') return;
    const timer = globalThis.setTimeout(() => {
      void save();
    }, 650);
    return () => globalThis.clearTimeout(timer);
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 's') {
        event.preventDefault();
        void save();
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  });

  const markDirty = () => {
    if (!hydrated.current) return;
    revision.current += 1;
    setSaveState('dirty');
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = defaultFileName(fileName);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = useMemo(() => {
    const content = text.trim();
    return content ? content.split(/\s+/u).length : 0;
  }, [text]);

  const stateLabel = {
    loading: 'Loading…',
    clean: 'Up to date',
    dirty: 'Editing…',
    saving: 'Saving…',
    saved: 'Saved locally',
    error: 'Could not save',
  }[saveState];

  return (
    <div className="text-app">
      <header className="text-toolbar">
        <label>
          <span>File name</span>
          <input
            value={fileName}
            aria-label="File name"
            onChange={(event) => {
              setFileName(event.target.value);
              markDirty();
            }}
          />
        </label>
        <div className={`text-toolbar__state text-toolbar__state--${saveState}`}>
          <i />
          {stateLabel}
        </div>
        <button
          onClick={() => void save()}
          disabled={saveState === 'loading' || saveState === 'saving'}
        >
          Save
        </button>
        <button onClick={download}>
          <Icon name="download" size={16} />
          Export
        </button>
      </header>
      <textarea
        className="text-editor"
        value={text}
        autoFocus
        spellCheck
        aria-label="Document content"
        placeholder="Start writing…"
        onChange={(event) => {
          setText(event.target.value);
          markDirty();
        }}
      />
      <footer className="text-status">
        <span>{wordCount} words</span>
        <span>{text.length} characters</span>
        <span>Plain text · Local auto-save</span>
      </footer>
    </div>
  );
}

function readInstanceData(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}
