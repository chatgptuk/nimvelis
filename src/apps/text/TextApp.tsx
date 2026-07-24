import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { Icon } from '../../design/Icon';
import { ROOT_DIRECTORY_ID, isTextMimeType, type VfsNode } from '../../kernel/vfs';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import './text.css';

type SaveState = 'loading' | 'clean' | 'dirty' | 'saving' | 'saved' | 'error';

interface EditorTab {
  tabId: string;
  fileId: string | null;
  parentId: string;
  fileName: string;
  text: string;
  saveState: SaveState;
  revision: number;
}

interface VersionSnapshot {
  savedAt: number;
  text: string;
}

function defaultFileName(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : 'Untitled.txt';
}

export function TextApp({ system, window }: SystemAppProps) {
  const instanceData = readInstanceData(window.instanceData);
  const initialFileId = typeof instanceData.fileId === 'string' ? instanceData.fileId : null;
  const [initialTabId] = useState(createTabId);
  const [tabs, setTabs] = useState<EditorTab[]>([
    {
      tabId: initialTabId,
      fileId: initialFileId,
      parentId: ROOT_DIRECTORY_ID,
      fileName: defaultFileName(instanceData.fileName),
      text: '',
      saveState: initialFileId ? 'loading' : 'clean',
      revision: 0,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState(initialTabId);
  const [findOpen, setFindOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [preview, setPreview] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentFiles, setRecentFiles] = useState<VfsNode[]>([]);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionRevision, setVersionRevision] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const saveSequence = useRef(new Map<string, number>());
  const activeTab = tabs.find((tab) => tab.tabId === activeTabId) ?? tabs[0];
  void versionRevision;
  const versions = readVersions(activeTab?.fileId ?? null);

  useEffect(() => {
    if (!initialFileId) return;
    let active = true;
    const load = async () => {
      await system.files.ready();
      const [node, blob] = await Promise.all([
        system.files.get(initialFileId),
        system.files.readFile(initialFileId),
      ]);
      if (!active) return;
      if (!node || !blob) {
        updateTab(setTabs, initialTabId, { saveState: 'error' });
        system.notify('This document could not be found.', 'error');
        return;
      }
      updateTab(setTabs, initialTabId, {
        fileId: node.id,
        parentId: node.parentId ?? ROOT_DIRECTORY_ID,
        fileName: node.name,
        text: await blob.text(),
        saveState: 'clean',
      });
      system.setWindowTitle(window.id, node.name);
      void system.files.touch(node.id);
    };
    void load();
    return () => {
      active = false;
    };
  }, [initialFileId, initialTabId, system, window.id]);

  useEffect(() => {
    if (!activeTab) return;
    system.setWindowTitle(window.id, activeTab.fileName);
  }, [activeTab, system, window.id]);

  const saveTab = async (tabId: string) => {
    const tab = tabs.find((candidate) => candidate.tabId === tabId);
    if (!tab || tab.saveState === 'loading') return;
    const currentSequence = (saveSequence.current.get(tabId) ?? 0) + 1;
    saveSequence.current.set(tabId, currentSequence);
    const savedRevision = tab.revision;
    updateTab(setTabs, tabId, { saveState: 'saving' });
    try {
      const mimeType = tab.fileName.toLocaleLowerCase().endsWith('.md')
        ? 'text/markdown'
        : 'text/plain';
      const node = await system.files.writeFile({
        id: tab.fileId ?? undefined,
        parentId: tab.parentId,
        name: defaultFileName(tab.fileName),
        data: new Blob([tab.text], { type: mimeType }),
        mimeType,
      });
      if (currentSequence !== saveSequence.current.get(tabId)) return;
      setTabs((items) =>
        items.map((candidate) =>
          candidate.tabId === tabId
            ? {
                ...candidate,
                fileId: node.id,
                fileName: node.name,
                saveState: candidate.revision === savedRevision ? 'saved' : 'dirty',
              }
            : candidate,
        ),
      );
      writeVersion(node.id, tab.text);
      setVersionRevision((revision) => revision + 1);
      if (tabId === activeTabId) {
        system.setWindowTitle(window.id, node.name);
        system.updateWindowData(window.id, { fileId: node.id, fileName: node.name });
      }
    } catch {
      if (currentSequence === saveSequence.current.get(tabId)) {
        updateTab(setTabs, tabId, { saveState: 'error' });
      }
    }
  };

  useEffect(() => {
    if (!activeTab || activeTab.saveState !== 'dirty') return;
    const timer = globalThis.setTimeout(() => {
      void saveTab(activeTab.tabId);
    }, 650);
    return () => globalThis.clearTimeout(timer);
  });

  const updateActiveTab = (patch: Partial<EditorTab>) => {
    if (!activeTab) return;
    setTabs((items) =>
      items.map((tab) =>
        tab.tabId === activeTab.tabId
          ? {
              ...tab,
              ...patch,
              revision: tab.revision + 1,
              saveState: 'dirty',
            }
          : tab,
      ),
    );
  };

  const addDraftTab = () => {
    if (activeTab?.saveState === 'dirty') void saveTab(activeTab.tabId);
    const tabId = createTabId();
    setTabs((items) => [
      ...items,
      {
        tabId,
        fileId: null,
        parentId: ROOT_DIRECTORY_ID,
        fileName: 'Untitled.txt',
        text: '',
        saveState: 'clean',
        revision: 0,
      },
    ]);
    setActiveTabId(tabId);
    system.updateWindowData(window.id, { fileName: 'Untitled.txt' });
    setPreview(false);
  };

  const closeTab = (tabId: string) => {
    const closing = tabs.find((tab) => tab.tabId === tabId);
    if (closing?.saveState === 'dirty') void saveTab(tabId);
    const index = tabs.findIndex((tab) => tab.tabId === tabId);
    if (tabs.length === 1) {
      const next = {
        tabId: createTabId(),
        fileId: null,
        parentId: ROOT_DIRECTORY_ID,
        fileName: 'Untitled.txt',
        text: '',
        saveState: 'clean' as const,
        revision: 0,
      };
      setTabs([next]);
      setActiveTabId(next.tabId);
      system.updateWindowData(window.id, { fileName: next.fileName });
      return;
    }
    const remaining = tabs.filter((tab) => tab.tabId !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      const next = remaining[Math.max(0, index - 1)] ?? remaining[0];
      setActiveTabId(next.tabId);
      system.updateWindowData(window.id, {
        fileId: next.fileId,
        fileName: next.fileName,
      });
    }
  };

  const loadRecentFiles = async () => {
    const nodes = await system.files.listRecent(20);
    setRecentFiles(nodes.filter((node) => node.kind === 'file' && isTextMimeType(node.mimeType)));
    setRecentOpen((open) => !open);
    setVersionsOpen(false);
  };

  const openRecentFile = async (node: VfsNode) => {
    if (activeTab?.saveState === 'dirty') void saveTab(activeTab.tabId);
    const existing = tabs.find((tab) => tab.fileId === node.id);
    if (existing) {
      setActiveTabId(existing.tabId);
      setRecentOpen(false);
      return;
    }
    const blob = await system.files.readFile(node.id);
    const tab: EditorTab = {
      tabId: createTabId(),
      fileId: node.id,
      parentId: node.parentId,
      fileName: node.name,
      text: await blob.text(),
      saveState: 'clean',
      revision: 0,
    };
    setTabs((items) => [...items, tab]);
    setActiveTabId(tab.tabId);
    system.updateWindowData(window.id, { fileId: node.id, fileName: node.name });
    setRecentOpen(false);
    void system.files.touch(node.id);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!window.focused) return;
      const command = event.metaKey || event.ctrlKey;
      const key = event.key.toLocaleLowerCase();
      if (command && key === 's') {
        event.preventDefault();
        if (activeTab) void saveTab(activeTab.tabId);
      }
      if (command && key === 'f') {
        event.preventDefault();
        setFindOpen(true);
        queueMicrotask(() => findInputRef.current?.focus());
      }
      if (command && key === 'n') {
        event.preventDefault();
        addDraftTab();
      }
      if (event.key === 'Escape' && findOpen) setFindOpen(false);
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  });

  const findNext = () => {
    if (!activeTab || !findText) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const content = activeTab.text.toLocaleLowerCase();
    const query = findText.toLocaleLowerCase();
    let index = content.indexOf(query, textarea.selectionEnd);
    if (index < 0) index = content.indexOf(query);
    if (index < 0) return;
    textarea.focus();
    textarea.setSelectionRange(index, index + findText.length);
  };

  const replaceCurrent = () => {
    if (!activeTab || !findText) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = activeTab.text.slice(selectionStart, selectionEnd);
    if (selected.toLocaleLowerCase() !== findText.toLocaleLowerCase()) {
      findNext();
      return;
    }
    updateActiveTab({
      text:
        activeTab.text.slice(0, selectionStart) + replaceText + activeTab.text.slice(selectionEnd),
    });
    queueMicrotask(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionStart + replaceText.length);
    });
  };

  const replaceAll = () => {
    if (!activeTab || !findText) return;
    const expression = new RegExp(escapeRegExp(findText), 'giu');
    updateActiveTab({ text: activeTab.text.replace(expression, replaceText) });
  };

  const download = () => {
    if (!activeTab) return;
    const url = URL.createObjectURL(
      new Blob([activeTab.text], { type: 'text/plain;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = defaultFileName(activeTab.fileName);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const restoreVersion = (version: VersionSnapshot) => {
    updateActiveTab({ text: version.text });
    setVersionsOpen(false);
    system.notify('Version restored. It will auto-save as the latest copy.', 'success');
  };

  const wordCount = useMemo(() => {
    const content = activeTab?.text.trim() ?? '';
    return content ? content.split(/\s+/u).length : 0;
  }, [activeTab?.text]);
  const findCount =
    activeTab && findText
      ? activeTab.text.toLocaleLowerCase().split(findText.toLocaleLowerCase()).length - 1
      : 0;
  const stateLabel = activeTab ? saveStateLabel(activeTab.saveState) : 'Ready';
  const isMarkdown = activeTab?.fileName.toLocaleLowerCase().endsWith('.md') ?? false;

  if (!activeTab) return null;

  return (
    <div className={`text-app ${findOpen ? 'has-find' : ''}`}>
      <div className="text-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            className={tab.tabId === activeTabId ? 'is-active' : ''}
            key={tab.tabId}
            role="tab"
            aria-selected={tab.tabId === activeTabId}
            onClick={() => {
              if (activeTab.saveState === 'dirty' && tab.tabId !== activeTabId) {
                void saveTab(activeTab.tabId);
              }
              setActiveTabId(tab.tabId);
              system.updateWindowData(window.id, {
                fileId: tab.fileId,
                fileName: tab.fileName,
              });
              setPreview(false);
            }}
          >
            <Icon name="text" size={14} />
            <span>{tab.fileName}</span>
            {tab.saveState === 'dirty' || tab.saveState === 'saving' ? <i /> : null}
            <span
              className="text-tabs__close"
              role="button"
              tabIndex={0}
              aria-label={`Close ${tab.fileName}`}
              onClick={(event) => {
                event.stopPropagation();
                closeTab(tab.tabId);
              }}
            >
              <Icon name="close" size={10} />
            </span>
          </button>
        ))}
        <button className="text-tabs__add" aria-label="New tab" onClick={addDraftTab}>
          <Icon name="plus" size={14} />
        </button>
      </div>

      <header className="text-toolbar">
        <label>
          <span>File name</span>
          <input
            value={activeTab.fileName}
            aria-label="File name"
            onChange={(event) => updateActiveTab({ fileName: event.target.value })}
          />
        </label>
        <div className={`text-toolbar__state text-toolbar__state--${activeTab.saveState}`}>
          <i />
          {stateLabel}
        </div>
        <div className="text-toolbar__menu">
          <button onClick={() => void loadRecentFiles()}>
            <Icon name="window" size={15} />
            Recent
          </button>
          {recentOpen ? (
            <div className="text-popover">
              <strong>Recent text files</strong>
              {recentFiles.map((node) => (
                <button key={node.id} onClick={() => void openRecentFile(node)}>
                  <Icon name="text" size={14} />
                  <span>{node.name}</span>
                </button>
              ))}
              {recentFiles.length === 0 ? <small>No recent text files</small> : null}
            </div>
          ) : null}
        </div>
        <button
          className={findOpen ? 'is-active' : ''}
          onClick={() => {
            setFindOpen((open) => !open);
            queueMicrotask(() => findInputRef.current?.focus());
          }}
        >
          <Icon name="search" size={15} />
          Find
        </button>
        <button
          className={preview ? 'is-active' : ''}
          onClick={() => setPreview((visible) => !visible)}
          title={isMarkdown ? 'Toggle Markdown preview' : 'Preview as Markdown'}
        >
          <Icon name="view" size={15} />
          Preview
        </button>
        <div className="text-toolbar__menu">
          <button
            disabled={!activeTab.fileId}
            onClick={() => {
              setVersionsOpen((open) => !open);
              setRecentOpen(false);
            }}
          >
            Versions
          </button>
          {versionsOpen ? (
            <div className="text-popover text-popover--versions">
              <strong>Local snapshots</strong>
              {versions.map((version) => (
                <button key={version.savedAt} onClick={() => restoreVersion(version)}>
                  <Icon name="restore" size={14} />
                  <span>{formatVersionDate(version.savedAt)}</span>
                </button>
              ))}
              {versions.length === 0 ? <small>No earlier snapshots yet</small> : null}
            </div>
          ) : null}
        </div>
        <button
          onClick={() => void saveTab(activeTab.tabId)}
          disabled={activeTab.saveState === 'loading' || activeTab.saveState === 'saving'}
        >
          Save
        </button>
        <button onClick={download}>
          <Icon name="download" size={16} />
          Export
        </button>
      </header>

      {findOpen ? (
        <div className="text-find">
          <label>
            <Icon name="search" size={14} />
            <input
              ref={findInputRef}
              value={findText}
              placeholder="Find"
              aria-label="Find text"
              onChange={(event) => setFindText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') findNext();
                if (event.key === 'Escape') setFindOpen(false);
              }}
            />
            <small>{findText ? `${findCount} found` : ''}</small>
          </label>
          <button onClick={findNext}>Next</button>
          <label>
            <input
              value={replaceText}
              placeholder="Replace"
              aria-label="Replace text"
              onChange={(event) => setReplaceText(event.target.value)}
            />
          </label>
          <button onClick={replaceCurrent}>Replace</button>
          <button onClick={replaceAll}>All</button>
          <button aria-label="Close find" onClick={() => setFindOpen(false)}>
            <Icon name="close" size={12} />
          </button>
        </div>
      ) : null}

      <div className={`text-workspace ${preview ? 'has-preview' : ''}`}>
        <textarea
          ref={textareaRef}
          className="text-editor"
          value={activeTab.text}
          autoFocus
          spellCheck
          aria-label="Document content"
          placeholder="Start writing…"
          onChange={(event) => updateActiveTab({ text: event.target.value })}
        />
        {preview ? <MarkdownPreview text={activeTab.text} /> : null}
      </div>

      <footer className="text-status">
        <span>{wordCount} words</span>
        <span>{activeTab.text.length} characters</span>
        <span>{isMarkdown ? 'Markdown' : 'Plain text'} · Local auto-save · ⌘/Ctrl F</span>
      </footer>
    </div>
  );
}

function MarkdownPreview({ text }: { text: string }) {
  const lines = text.split('\n');
  let inCode = false;
  const rendered: ReactNode[] = [];
  const codeLines: string[] = [];

  const flushCode = (key: number) => {
    if (!codeLines.length) return;
    rendered.push(
      <pre key={`code-${key}`}>
        <code>{codeLines.join('\n')}</code>
      </pre>,
    );
    codeLines.length = 0;
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCode) flushCode(index);
      inCode = !inCode;
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }
    const heading = /^(#{1,3})\s+(.+)$/u.exec(line);
    if (heading) {
      const content = renderInline(heading[2], index);
      if (heading[1].length === 1) rendered.push(<h1 key={index}>{content}</h1>);
      else if (heading[1].length === 2) rendered.push(<h2 key={index}>{content}</h2>);
      else rendered.push(<h3 key={index}>{content}</h3>);
      return;
    }
    if (/^[-*]\s+/u.test(line)) {
      rendered.push(<li key={index}>{renderInline(line.replace(/^[-*]\s+/u, ''), index)}</li>);
      return;
    }
    if (line.startsWith('> ')) {
      rendered.push(<blockquote key={index}>{renderInline(line.slice(2), index)}</blockquote>);
      return;
    }
    if (!line.trim()) rendered.push(<br key={index} />);
    else rendered.push(<p key={index}>{renderInline(line, index)}</p>);
  });
  flushCode(lines.length);

  return (
    <article className="markdown-preview" aria-label="Markdown preview">
      {rendered.length ? (
        rendered
      ) : (
        <span className="markdown-preview__empty">Nothing to preview yet.</span>
      )}
    </article>
  );
}

function renderInline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/gu);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${key}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${key}-${index}`}>{part.slice(1, -1)}</code>;
    }
    return <Fragment key={`${key}-${index}`}>{part}</Fragment>;
  });
}

function updateTab(
  setter: Dispatch<SetStateAction<EditorTab[]>>,
  tabId: string,
  patch: Partial<EditorTab>,
) {
  setter((tabs) => tabs.map((tab) => (tab.tabId === tabId ? { ...tab, ...patch } : tab)));
}

function saveStateLabel(state: SaveState) {
  return {
    loading: 'Loading…',
    clean: 'Up to date',
    dirty: 'Editing…',
    saving: 'Saving…',
    saved: 'Saved locally',
    error: 'Could not save',
  }[state];
}

function createTabId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function versionKey(fileId: string) {
  return `nimvelis.text.versions.${fileId}`;
}

function readVersions(fileId: string | null) {
  if (!fileId) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(versionKey(fileId)) ?? '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is VersionSnapshot =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.savedAt === 'number' &&
          typeof item.text === 'string',
      )
      .slice(0, 8);
  } catch {
    return [];
  }
}

function writeVersion(fileId: string, text: string) {
  if (text.length > 250_000) return;
  try {
    const current = readVersions(fileId);
    if (current[0]?.text === text) return;
    localStorage.setItem(
      versionKey(fileId),
      JSON.stringify([{ savedAt: Date.now(), text }, ...current].slice(0, 8)),
    );
  } catch {
    // Version snapshots are a best-effort recovery layer; the file itself is already saved.
  }
}

function formatVersionDate(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function readInstanceData(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}
