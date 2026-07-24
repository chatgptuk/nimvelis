import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
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

type FilesView = 'files' | 'trash' | 'recent' | 'favorites';
type ViewMode = 'list' | 'grid';
type SortMode = 'name' | 'modified' | 'size';

type ContextMenuState = {
  node: VfsNode;
  x: number;
  y: number;
};

interface FileClipboard {
  ids: string[];
  mode: 'copy' | 'cut';
}

const DOCUMENTS_ID = 'seed-documents';
const INTERNAL_DRAG_TYPE = 'application/x-nimvelis-node';
let fileClipboard: FileClipboard | null = null;

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
  const initialView = isFilesView(instanceData.view) ? instanceData.view : 'files';
  const [folderId, setFolderId] = useState(initialFolder);
  const [view, setView] = useState<FilesView>(initialView);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [nodes, setNodes] = useState<VfsNode[]>([]);
  const [currentFolder, setCurrentFolder] = useState<VfsNode | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggingExternal, setDraggingExternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [moveIds, setMoveIds] = useState<string[] | null>(null);
  const [directories, setDirectories] = useState<VfsNode[]>([]);
  const [undoIds, setUndoIds] = useState<string[]>([]);
  const [clipboardAvailable, setClipboardAvailable] = useState(() => fileClipboard !== null);
  const inputRef = useRef<HTMLInputElement>(null);
  const appRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    await system.files.ready();
    if (view === 'trash') {
      setNodes(await system.files.listTrash());
      setCurrentFolder(null);
      return;
    }
    if (view === 'recent') {
      setNodes(await system.files.listRecent());
      setCurrentFolder(null);
      return;
    }
    if (view === 'favorites') {
      setNodes(await system.files.listFavorites());
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
    const title =
      view === 'files'
        ? (currentFolder?.name ?? 'Local Space')
        : { trash: 'Trash', recent: 'Recent', favorites: 'Favorites' }[view];
    system.setWindowTitle(window.id, `Files — ${title}`);
  }, [currentFolder?.name, system, view, window.id]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    globalThis.addEventListener('pointerdown', closeMenu);
    return () => globalThis.removeEventListener('pointerdown', closeMenu);
  }, []);

  const visibleNodes = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase();
    const filtered = query
      ? nodes.filter((node) => node.name.toLocaleLowerCase().includes(query))
      : nodes;
    return [...filtered].sort((left, right) => {
      const directoriesFirst =
        Number(right.kind === 'directory') - Number(left.kind === 'directory');
      if (directoriesFirst) return directoriesFirst;
      if (sortMode === 'modified') return right.updatedAt - left.updatedAt;
      if (sortMode === 'size') return right.size - left.size;
      return left.name.localeCompare(right.name);
    });
  }, [filter, nodes, sortMode]);

  const selectedNodes = useMemo(
    () => visibleNodes.filter((node) => selectedIds.has(node.id)),
    [selectedIds, visibleNodes],
  );

  const openNode = useCallback(
    (node: VfsNode) => {
      setContextMenu(null);
      if (node.kind === 'directory') {
        if (view !== 'files') {
          setView('files');
          setHistory([]);
        } else {
          setHistory((items) => [...items, folderId]);
        }
        setFolderId(node.id);
        setFilter('');
        setSelectedIds(new Set());
        return;
      }
      system.openFile(node);
    },
    [folderId, system, view],
  );

  const selectNode = (event: MouseEvent, node: VfsNode) => {
    const index = visibleNodes.findIndex((candidate) => candidate.id === node.id);
    const anchorIndex = visibleNodes.findIndex((candidate) => candidate.id === selectionAnchor);
    if (event.shiftKey && anchorIndex >= 0 && index >= 0) {
      const [start, end] = anchorIndex < index ? [anchorIndex, index] : [index, anchorIndex];
      setSelectedIds(new Set(visibleNodes.slice(start, end + 1).map((candidate) => candidate.id)));
      return;
    }
    if (event.metaKey || event.ctrlKey) {
      setSelectedIds((selection) => {
        const next = new Set(selection);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
      setSelectionAnchor(node.id);
      return;
    }
    setSelectedIds(new Set([node.id]));
    setSelectionAnchor(node.id);
  };

  const goBack = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setFolderId(previous);
    setFilter('');
    setSelectedIds(new Set());
  };

  const showFiles = (nextFolderId = ROOT_DIRECTORY_ID) => {
    setView('files');
    setFolderId(nextFolderId);
    setHistory([]);
    setFilter('');
    setSelectedIds(new Set());
  };

  const showSmartView = (nextView: Exclude<FilesView, 'files'>) => {
    setView(nextView);
    setFilter('');
    setSelectedIds(new Set());
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
    try {
      await system.files.rename(node.id, name);
    } catch (error) {
      system.notify(error instanceof Error ? error.message : 'Unable to rename item.', 'error');
    }
  };

  const createFolder = async () => {
    if (view !== 'files') return;
    const node = await system.files.mkdir(folderId, 'Untitled folder');
    setEditingId(node.id);
    setEditingName(node.name);
    setSelectedIds(new Set([node.id]));
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
      setDraggingExternal(false);
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void importFiles(event.target.files);
    event.target.value = '';
  };

  const copySelection = (mode: FileClipboard['mode']) => {
    const ids = selectedIds.size ? [...selectedIds] : contextMenu ? [contextMenu.node.id] : [];
    if (!ids.length) return;
    fileClipboard = { ids, mode };
    setClipboardAvailable(true);
    system.notify(
      `${ids.length} item${ids.length === 1 ? '' : 's'} ${mode === 'cut' ? 'cut' : 'copied'}`,
    );
    setContextMenu(null);
  };

  const paste = async () => {
    if (view !== 'files' || !fileClipboard) return;
    const clipboard = fileClipboard;
    setBusy(true);
    try {
      for (const id of clipboard.ids) {
        if (clipboard.mode === 'copy') await system.files.copy(id, folderId);
        else await system.files.move(id, folderId);
      }
      if (clipboard.mode === 'cut') fileClipboard = null;
      if (clipboard.mode === 'cut') setClipboardAvailable(false);
      system.notify(
        `${clipboard.ids.length} item${clipboard.ids.length === 1 ? '' : 's'} pasted`,
        'success',
      );
    } catch (error) {
      system.notify(error instanceof Error ? error.message : 'Unable to paste items.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const trashSelection = async (ids = [...selectedIds]) => {
    if (!ids.length) return;
    for (const id of ids) await system.files.trash(id);
    setUndoIds(ids);
    setSelectedIds(new Set());
    setContextMenu(null);
  };

  const undoTrash = async () => {
    for (const id of undoIds) await system.files.restore(id);
    system.notify('Move to Trash undone', 'success');
    setUndoIds([]);
  };

  const openMoveDialog = async (ids = [...selectedIds]) => {
    if (!ids.length) return;
    setDirectories(await system.files.listDirectories());
    setMoveIds(ids);
    setContextMenu(null);
  };

  const moveTo = async (destinationId: string) => {
    if (!moveIds) return;
    try {
      for (const id of moveIds) await system.files.move(id, destinationId);
      system.notify(`${moveIds.length} item${moveIds.length === 1 ? '' : 's'} moved`, 'success');
      setSelectedIds(new Set());
    } catch (error) {
      system.notify(error instanceof Error ? error.message : 'Unable to move items.', 'error');
    } finally {
      setMoveIds(null);
    }
  };

  const dropInternalItems = async (destinationId: string, draggedId: string) => {
    const ids = selectedIds.has(draggedId) ? [...selectedIds] : [draggedId];
    try {
      for (const id of ids) await system.files.move(id, destinationId);
      system.notify(`${ids.length} item${ids.length === 1 ? '' : 's'} moved`, 'success');
      setSelectedIds(new Set());
    } catch (error) {
      system.notify(error instanceof Error ? error.message : 'Unable to move items.', 'error');
    }
  };

  const showContextMenu = (event: MouseEvent, node: VfsNode) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedIds.has(node.id)) {
      setSelectedIds(new Set([node.id]));
      setSelectionAnchor(node.id);
    }
    const bounds = appRef.current?.getBoundingClientRect();
    setContextMenu({
      node,
      x: event.clientX - (bounds?.left ?? 0),
      y: event.clientY - (bounds?.top ?? 0),
    });
  };

  const handleAppKeyDown = (event: KeyboardEvent) => {
    const target = event.target;
    if (target instanceof HTMLInputElement) return;
    const command = event.metaKey || event.ctrlKey;
    const key = event.key.toLocaleLowerCase();
    if (command && key === 'a') {
      event.preventDefault();
      setSelectedIds(new Set(visibleNodes.map((node) => node.id)));
    }
    if (command && key === 'c') copySelection('copy');
    if (command && key === 'x' && view === 'files') copySelection('cut');
    if (command && key === 'v' && view === 'files') void paste();
    if (event.key === 'Delete' && view === 'files') void trashSelection();
    if (event.key === 'F2' && selectedNodes.length === 1) beginRename(selectedNodes[0]);
    if (event.key === 'Enter' && selectedNodes.length === 1) openNode(selectedNodes[0]);
  };

  const currentTitle =
    view === 'files'
      ? (currentFolder?.name ?? 'Local Space')
      : { trash: 'Trash', recent: 'Recent', favorites: 'Favorites' }[view];

  return (
    <div
      className={`files-app${draggingExternal ? ' files-app--dragging' : ''}`}
      ref={appRef}
      tabIndex={-1}
      onKeyDown={handleAppKeyDown}
      onContextMenu={(event) => event.preventDefault()}
      onDragEnter={(event) => {
        event.preventDefault();
        if (view === 'files' && event.dataTransfer.types.includes('Files')) {
          setDraggingExternal(true);
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDraggingExternal(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const draggedId = event.dataTransfer.getData(INTERNAL_DRAG_TYPE);
        if (draggedId && view === 'files') void dropInternalItems(folderId, draggedId);
        else void importFiles(event.dataTransfer.files);
      }}
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
            className={view === 'recent' ? 'is-active' : ''}
            onClick={() => showSmartView('recent')}
          >
            <Icon name="window" size={17} />
            Recent
          </button>
          <button
            className={view === 'favorites' ? 'is-active' : ''}
            onClick={() => showSmartView('favorites')}
          >
            <Icon name="sparkle" size={17} />
            Favorites
          </button>
          <button
            className={view === 'trash' ? 'is-active' : ''}
            onClick={() => showSmartView('trash')}
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
            <span>/</span>
            <strong>{currentTitle}</strong>
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
          <select
            className="files-toolbar__select"
            value={sortMode}
            aria-label="Sort files"
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="name">Name</option>
            <option value="modified">Modified</option>
            <option value="size">Size</option>
          </select>
          <div className="files-view-toggle" aria-label="View">
            <button
              className={viewMode === 'list' ? 'is-active' : ''}
              aria-label="List view"
              onClick={() => setViewMode('list')}
            >
              ≡
            </button>
            <button
              className={viewMode === 'grid' ? 'is-active' : ''}
              aria-label="Grid view"
              onClick={() => setViewMode('grid')}
            >
              ▦
            </button>
          </div>
          {view === 'files' ? (
            <div className="files-toolbar__actions">
              {selectedIds.size ? (
                <>
                  <button onClick={() => copySelection('copy')}>Copy</button>
                  <button onClick={() => void openMoveDialog()}>Move</button>
                  <button onClick={() => void trashSelection()}>
                    <Icon name="trash" size={15} />
                    <span>Trash</span>
                  </button>
                </>
              ) : (
                <>
                  {clipboardAvailable ? (
                    <button aria-label="Paste items" title="Paste" onClick={() => void paste()}>
                      <Icon name="plus" size={16} />
                      <span>Paste</span>
                    </button>
                  ) : null}
                  <button aria-label="New folder" title="New folder" onClick={createFolder}>
                    <Icon name="folder" size={16} />
                    <span>New folder</span>
                  </button>
                  <button aria-label="New text" title="New text" onClick={createTextFile}>
                    <Icon name="text" size={16} />
                    <span>New text</span>
                  </button>
                  <button
                    aria-label={busy ? 'Importing files' : 'Import files'}
                    title="Import"
                    onClick={() => inputRef.current?.click()}
                    disabled={busy}
                  >
                    <Icon name="upload" size={16} />
                    <span>{busy ? 'Importing…' : 'Import'}</span>
                  </button>
                </>
              )}
              <input ref={inputRef} hidden multiple type="file" onChange={handleInput} />
            </div>
          ) : view === 'trash' ? (
            <button
              className="files-toolbar__empty"
              disabled={nodes.length === 0}
              onClick={() => {
                if (globalThis.confirm('Permanently delete every item in Trash?')) {
                  void system.files.emptyTrash();
                }
              }}
            >
              Empty Trash
            </button>
          ) : null}
        </header>

        <div
          className={`files-list files-list--${viewMode}`}
          role="grid"
          aria-label={currentTitle}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedIds(new Set());
          }}
        >
          {viewMode === 'list' ? (
            <div className="files-list__header" role="row">
              <span>Name</span>
              <span>Modified</span>
              <span>Size</span>
              <span />
            </div>
          ) : null}
          {visibleNodes.map((node) => (
            <div
              className={`files-list__row ${selectedIds.has(node.id) ? 'is-selected' : ''}`}
              key={node.id}
              role="row"
              tabIndex={0}
              draggable={view !== 'trash'}
              onClick={(event) => selectNode(event, node)}
              onDoubleClick={() => openNode(node)}
              onDragStart={(event) => {
                event.dataTransfer.setData(INTERNAL_DRAG_TYPE, node.id);
                event.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(event) => {
                if (node.kind === 'directory' && view === 'files') {
                  event.preventDefault();
                  event.stopPropagation();
                  event.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={(event: DragEvent<HTMLDivElement>) => {
                if (node.kind !== 'directory' || view !== 'files') return;
                event.preventDefault();
                event.stopPropagation();
                const draggedId = event.dataTransfer.getData(INTERNAL_DRAG_TYPE);
                if (draggedId) void dropInternalItems(node.id, draggedId);
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
                  <button
                    className="files-list__label"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (event.metaKey || event.ctrlKey || event.shiftKey) {
                        selectNode(event, node);
                      } else {
                        openNode(node);
                      }
                    }}
                  >
                    {node.name}
                    {node.favorite ? <small>★</small> : null}
                  </button>
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
              <Icon
                name={view === 'trash' ? 'trash' : view === 'favorites' ? 'sparkle' : 'folder'}
                size={34}
              />
              <strong>
                {filter
                  ? 'No matching items'
                  : view === 'trash'
                    ? 'Trash is empty'
                    : view === 'favorites'
                      ? 'No favorites yet'
                      : view === 'recent'
                        ? 'No recent files yet'
                        : 'This folder is empty'}
              </strong>
              <span>
                {view === 'trash'
                  ? 'Items you remove appear here.'
                  : view === 'favorites'
                    ? 'Use the item menu to add a favorite.'
                    : 'Drop files here or create a new document.'}
              </span>
            </div>
          ) : null}
        </div>

        <footer className="files-status">
          <span>
            {selectedIds.size
              ? `${selectedIds.size} selected`
              : `${visibleNodes.length} item${visibleNodes.length === 1 ? '' : 's'}`}
          </span>
          <span>⌘/Ctrl C · X · V · A · F2 · Delete</span>
          <span>Stored locally with IndexedDB</span>
        </footer>
      </section>

      {draggingExternal ? (
        <div className="files-drop">
          <Icon name="upload" size={34} />
          <strong>Drop to import</strong>
          <span>Your files stay on this device.</span>
        </div>
      ) : null}

      {undoIds.length ? (
        <div className="files-undo" role="status">
          <span>
            {undoIds.length} item{undoIds.length === 1 ? '' : 's'} moved to Trash
          </span>
          <button onClick={() => void undoTrash()}>Undo</button>
          <button aria-label="Dismiss" onClick={() => setUndoIds([])}>
            <Icon name="close" size={12} />
          </button>
        </div>
      ) : null}

      {moveIds ? (
        <div className="files-dialog-layer" role="presentation">
          <section className="files-dialog" role="dialog" aria-modal="true">
            <header>
              <strong>
                Move {moveIds.length} item{moveIds.length === 1 ? '' : 's'}
              </strong>
              <button aria-label="Close" onClick={() => setMoveIds(null)}>
                <Icon name="close" size={14} />
              </button>
            </header>
            <button onClick={() => void moveTo(ROOT_DIRECTORY_ID)}>
              <Icon name="files" size={17} />
              Local Space
            </button>
            {directories
              .filter((directory) => !moveIds.includes(directory.id))
              .map((directory) => (
                <button key={directory.id} onClick={() => void moveTo(directory.id)}>
                  <Icon name="folder" size={17} />
                  {directory.name}
                </button>
              ))}
          </section>
        </div>
      ) : null}

      {contextMenu ? (
        <div
          className="files-context"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {view !== 'trash' ? (
            <>
              <button onClick={() => openNode(contextMenu.node)}>Open</button>
              {view === 'files' ? (
                <button onClick={() => beginRename(contextMenu.node)}>Rename</button>
              ) : null}
              <button
                onClick={() => {
                  void system.files.setFavorite(contextMenu.node.id, !contextMenu.node.favorite);
                  setContextMenu(null);
                }}
              >
                {contextMenu.node.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
              <div />
              <button onClick={() => copySelection('copy')}>Copy</button>
              {view === 'files' ? (
                <>
                  <button onClick={() => copySelection('cut')}>Cut</button>
                  <button onClick={() => void openMoveDialog([...selectedIds])}>Move to…</button>
                  <div />
                  <button
                    className="is-danger"
                    onClick={() => void trashSelection([...selectedIds])}
                  >
                    Move to Trash
                  </button>
                </>
              ) : null}
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
                  if (globalThis.confirm(`Permanently delete “${contextMenu.node.name}”?`)) {
                    void system.files.deletePermanently(contextMenu.node.id);
                  }
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

function isFilesView(value: unknown): value is FilesView {
  return ['files', 'trash', 'recent', 'favorites'].includes(String(value));
}
