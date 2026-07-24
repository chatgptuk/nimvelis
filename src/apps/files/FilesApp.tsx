import {
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppIcon, Icon } from '../../design/Icon';
import { ROOT_DIRECTORY_ID, type VfsNode } from '../../kernel/vfs';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import './files.css';

type FilesView = 'files' | 'trash';

type ContextMenuState = {
  node: VfsNode;
  x: number;
  y: number;
};

const DOCUMENTS_ID = 'seed-documents';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function nodeIcon(node: VfsNode) {
  if (node.kind === 'directory') return <Icon name="folder" size={21} />;
  if (node.mimeType?.startsWith('image/')) return <AppIcon name="view" size={34} />;
  if (node.mimeType === 'application/pdf') return <AppIcon name="view" size={34} />;
  if (node.mimeType?.startsWith('text/')) return <AppIcon name="text" size={34} />;
  return <Icon name="file" size={21} />;
}

export function FilesApp({ system, window }: SystemAppProps) {
  const instanceData = readInstanceData(window.instanceData);
  const initialFolder =
    typeof instanceData.folderId === 'string' ? instanceData.folderId : ROOT_DIRECTORY_ID;
  const [folderId, setFolderId] = useState(initialFolder);
  const [view, setView] = useState<FilesView>('files');
  const [nodes, setNodes] = useState<VfsNode[]>([]);
  const [currentFolder, setCurrentFolder] = useState<VfsNode | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const appRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    await system.files.ready();
    if (view === 'trash') {
      setNodes(await system.files.listTrash());
      setCurrentFolder(null);
      return;
    }

    setNodes(await system.files.list(folderId));
    setCurrentFolder(
      folderId === ROOT_DIRECTORY_ID ? null : ((await system.files.get(folderId)) ?? null),
    );
  }, [folderId, system.files, view]);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => void reload(), 0);
    const unsubscribe = system.files.subscribe(() => {
      void reload();
    });
    return () => {
      globalThis.clearTimeout(timer);
      unsubscribe();
    };
  }, [reload, system.files]);

  useEffect(() => {
    system.setWindowTitle(
      window.id,
      view === 'trash' ? 'Files — Trash' : `Files — ${currentFolder?.name ?? 'Local Space'}`,
    );
  }, [currentFolder?.name, system, view, window.id]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    globalThis.addEventListener('pointerdown', closeMenu);
    return () => globalThis.removeEventListener('pointerdown', closeMenu);
  }, []);

  const visibleNodes = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return nodes;
    return nodes.filter((node) => node.name.toLocaleLowerCase().includes(query));
  }, [filter, nodes]);

  const openNode = useCallback(
    (node: VfsNode) => {
      setContextMenu(null);
      if (node.kind === 'directory') {
        if (view === 'trash') return;
        setHistory((items) => [...items, folderId]);
        setFolderId(node.id);
        setFilter('');
        return;
      }
      system.openFile(node);
    },
    [folderId, system, view],
  );

  const goBack = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setFolderId(previous);
    setFilter('');
  };

  const showFiles = (nextFolderId = ROOT_DIRECTORY_ID) => {
    setView('files');
    setFolderId(nextFolderId);
    setHistory([]);
    setFilter('');
  };

  const beginRename = (node: VfsNode) => {
    setEditingId(node.id);
    setEditingName(node.name);
    setContextMenu(null);
  };

  const finishRename = async (node: VfsNode) => {
    const name = editingName.trim();
    setEditingId(null);
    if (!name || name === node.name) return;
    await system.files.rename(node.id, name);
  };

  const createFolder = async () => {
    if (view !== 'files') return;
    const node = await system.files.mkdir(folderId, 'Untitled folder');
    setEditingId(node.id);
    setEditingName(node.name);
  };

  const createTextFile = async () => {
    if (view !== 'files') return;
    const node = await system.files.writeFile({
      parentId: folderId,
      name: 'Untitled.txt',
      data: new Blob([''], { type: 'text/plain' }),
      mimeType: 'text/plain',
    });
    system.openFile(node);
  };

  const importFiles = async (files: FileList | File[]) => {
    if (view !== 'files' || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await system.files.writeFile({
          parentId: folderId,
          name: file.name,
          data: file,
          mimeType: file.type || undefined,
        });
      }
      system.notify(`${files.length} file${files.length === 1 ? '' : 's'} imported`, 'success');
    } finally {
      setBusy(false);
      setDragging(false);
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void importFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    void importFiles(event.dataTransfer.files);
  };

  const showContextMenu = (event: MouseEvent, node: VfsNode) => {
    event.preventDefault();
    event.stopPropagation();
    const bounds = appRef.current?.getBoundingClientRect();
    setContextMenu({
      node,
      x: event.clientX - (bounds?.left ?? 0),
      y: event.clientY - (bounds?.top ?? 0),
    });
  };

  return (
    <div
      className={`files-app${dragging ? ' files-app--dragging' : ''}`}
      ref={appRef}
      onContextMenu={(event) => event.preventDefault()}
      onDragEnter={(event) => {
        event.preventDefault();
        if (view === 'files') setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={handleDrop}
    >
      <aside className="files-sidebar" aria-label="Locations">
        <div className="files-sidebar__brand">
          <AppIcon name="files" size={34} />
          <div>
            <strong>Files</strong>
            <span>On this device</span>
          </div>
        </div>
        <nav>
          <button
            className={view === 'files' && folderId === ROOT_DIRECTORY_ID ? 'is-active' : ''}
            onClick={() => showFiles()}
          >
            <Icon name="files" size={17} />
            Local Space
          </button>
          <button
            className={view === 'files' && folderId === DOCUMENTS_ID ? 'is-active' : ''}
            onClick={() => showFiles(DOCUMENTS_ID)}
          >
            <Icon name="folder" size={17} />
            Documents
          </button>
          <button
            className={view === 'trash' ? 'is-active' : ''}
            onClick={() => {
              setView('trash');
              setFilter('');
            }}
          >
            <Icon name="trash" size={17} />
            Trash
          </button>
        </nav>
        <div className="files-sidebar__storage">
          <span>Local storage</span>
          <div>
            <i />
          </div>
          <small>Private to this browser</small>
        </div>
      </aside>

      <section className="files-main">
        <header className="files-toolbar">
          <button
            className="files-toolbar__icon"
            aria-label="Go back"
            disabled={view !== 'files' || history.length === 0}
            onClick={goBack}
          >
            <Icon name="arrow-left" size={18} />
          </button>
          <div className="files-toolbar__path">
            <button onClick={() => showFiles()}>Local Space</button>
            {view === 'files' && currentFolder ? (
              <>
                <span>/</span>
                <strong>{currentFolder.name}</strong>
              </>
            ) : null}
            {view === 'trash' ? <strong>Trash</strong> : null}
          </div>
          <label className="files-toolbar__search">
            <Icon name="search" size={15} />
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter"
              aria-label="Filter files"
            />
          </label>
          {view === 'files' ? (
            <div className="files-toolbar__actions">
              <button onClick={createFolder}>
                <Icon name="folder" size={16} />
                <span>New folder</span>
              </button>
              <button onClick={createTextFile}>
                <Icon name="text" size={16} />
                <span>New text</span>
              </button>
              <button onClick={() => inputRef.current?.click()} disabled={busy}>
                <Icon name="upload" size={16} />
                <span>{busy ? 'Importing…' : 'Import'}</span>
              </button>
              <input ref={inputRef} hidden multiple type="file" onChange={handleInput} />
            </div>
          ) : (
            <button
              className="files-toolbar__empty"
              disabled={nodes.length === 0}
              onClick={() => void system.files.emptyTrash()}
            >
              Empty Trash
            </button>
          )}
        </header>

        <div className="files-list" role="grid" aria-label={view === 'trash' ? 'Trash' : 'Files'}>
          <div className="files-list__header" role="row">
            <span>Name</span>
            <span>Modified</span>
            <span>Size</span>
            <span />
          </div>
          {visibleNodes.map((node) => (
            <div
              className="files-list__row"
              key={node.id}
              role="row"
              tabIndex={0}
              onDoubleClick={() => openNode(node)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') openNode(node);
              }}
              onContextMenu={(event) => showContextMenu(event, node)}
            >
              <span className="files-list__name">
                <span className="files-list__art">{nodeIcon(node)}</span>
                {editingId === node.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onBlur={() => void finishRename(node)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void finishRename(node);
                      if (event.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(event) => event.stopPropagation()}
                  />
                ) : (
                  <button onClick={() => openNode(node)}>{node.name}</button>
                )}
              </span>
              <span>{formatDate(node.updatedAt)}</span>
              <span>{node.kind === 'directory' ? '—' : formatBytes(node.size)}</span>
              <button
                className="files-list__more"
                aria-label={`More actions for ${node.name}`}
                onClick={(event) => showContextMenu(event, node)}
              >
                <Icon name="more" size={17} />
              </button>
            </div>
          ))}
          {visibleNodes.length === 0 ? (
            <div className="files-empty">
              <Icon name={view === 'trash' ? 'trash' : 'folder'} size={34} />
              <strong>
                {filter
                  ? 'No matching items'
                  : view === 'trash'
                    ? 'Trash is empty'
                    : 'This folder is empty'}
              </strong>
              <span>
                {view === 'trash'
                  ? 'Items you remove appear here.'
                  : 'Drop files here or create a new document.'}
              </span>
            </div>
          ) : null}
        </div>

        <footer className="files-status">
          <span>
            {visibleNodes.length} item{visibleNodes.length === 1 ? '' : 's'}
          </span>
          <span>Stored locally with IndexedDB</span>
        </footer>
      </section>

      {dragging ? (
        <div className="files-drop">
          <Icon name="upload" size={34} />
          <strong>Drop to import</strong>
          <span>Your files stay on this device.</span>
        </div>
      ) : null}

      {contextMenu ? (
        <div
          className="files-context"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {view === 'files' ? (
            <>
              <button onClick={() => openNode(contextMenu.node)}>Open</button>
              <button onClick={() => beginRename(contextMenu.node)}>Rename</button>
              <div />
              <button
                className="is-danger"
                onClick={() => {
                  void system.files.trash(contextMenu.node.id);
                  setContextMenu(null);
                }}
              >
                Move to Trash
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  void system.files.restore(contextMenu.node.id);
                  setContextMenu(null);
                }}
              >
                Restore
              </button>
              <button
                className="is-danger"
                onClick={() => {
                  void system.files.deletePermanently(contextMenu.node.id);
                  setContextMenu(null);
                }}
              >
                Delete permanently
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function readInstanceData(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}
