import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import type { ClipboardHistory, ClipboardHistoryEntry } from '../../kernel/clipboard';
import './stash.css';

export function StashApp({ system }: SystemAppProps) {
  const [entries, setEntries] = useState<ClipboardHistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    await system.clipboard.ready();
    const next = await system.clipboard.list();
    setEntries(next);
    setSelectedId((current) =>
      current && next.some((entry) => entry.id === current) ? current : (next[0]?.id ?? null),
    );
  }, [system.clipboard]);

  useEffect(() => {
    queueMicrotask(() => void reload());
    return system.clipboard.subscribe(() => void reload());
  }, [reload, system.clipboard]);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return entries;
    return entries.filter((entry) => entry.preview.toLocaleLowerCase().includes(normalized));
  }, [entries, query]);
  const selected = entries.find((entry) => entry.id === selectedId) ?? filteredEntries[0];

  const importFromDevice = async () => {
    setBusy(true);
    try {
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        const item = clipboardItems[0];
        const imageType = item?.types.find((type) => type.startsWith('image/'));
        if (item && imageType) {
          await system.clipboard.addImage(await item.getType(imageType));
          system.notify('Image added to Stash', 'success');
          return;
        }
      }
      const text = await navigator.clipboard.readText();
      await system.clipboard.addText(text);
      system.notify('Clipboard text added to Stash', 'success');
    } catch {
      system.notify('Clipboard access was unavailable or not allowed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const copyEntry = async (entry: ClipboardHistoryEntry) => {
    try {
      const data = await system.clipboard.read(entry.id);
      if (entry.kind === 'text') {
        await navigator.clipboard.writeText(await data.text());
      } else if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ [entry.mimeType]: data })]);
      } else {
        throw new Error('Image clipboard unavailable');
      }
      system.notify('Copied to device clipboard', 'success');
    } catch {
      system.notify('Your browser did not allow clipboard writing', 'error');
    }
  };

  const addDraft = async () => {
    if (!draft.trim()) return;
    try {
      await system.clipboard.addText(draft);
      setDraft('');
      system.notify('Text saved in Stash', 'success');
    } catch (error) {
      system.notify(
        error instanceof Error ? error.message : 'Could not save clipboard text',
        'error',
      );
    }
  };

  return (
    <div className="stash-app">
      <aside className="stash-sidebar">
        <header>
          <div>
            <span className="stash-mark">
              <Icon name="stash" size={18} />
            </span>
            <span>
              <strong>Stash</strong>
              <small>{entries.length} local items</small>
            </span>
          </div>
          <button type="button" onClick={() => void importFromDevice()} disabled={busy}>
            <Icon name="download" size={14} />
            {busy ? 'Reading…' : 'Paste'}
          </button>
        </header>
        <label className="stash-search">
          <Icon name="search" size={14} />
          <input
            type="search"
            aria-label="Search clipboard history"
            placeholder="Search clipboard"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="stash-list" role="listbox" aria-label="Clipboard history">
          {filteredEntries.map((entry) => (
            <button
              type="button"
              role="option"
              aria-selected={selected?.id === entry.id}
              className={selected?.id === entry.id ? 'is-selected' : ''}
              key={entry.id}
              onClick={() => setSelectedId(entry.id)}
            >
              <span className={`stash-list__kind is-${entry.kind}`}>
                <Icon name={entry.kind === 'image' ? 'view' : 'text'} size={15} />
              </span>
              <span>
                <strong>{entry.preview}</strong>
                <small>{formatRelativeTime(entry.createdAt)}</small>
              </span>
              {entry.pinned ? <Icon name="pin" size={13} /> : null}
            </button>
          ))}
          {filteredEntries.length === 0 ? (
            <div className="stash-empty">
              <Icon name="stash" size={24} />
              <strong>{entries.length === 0 ? 'Nothing stashed yet' : 'No matching items'}</strong>
              <span>Use Paste to import text or images with browser permission.</span>
            </div>
          ) : null}
        </div>
        {entries.length > 0 ? (
          <button
            type="button"
            className="stash-clear"
            onClick={() => {
              if (!globalThis.confirm('Clear every item from Stash?')) return;
              void system.clipboard.clear();
            }}
          >
            Clear history
          </button>
        ) : null}
      </aside>

      <main className="stash-detail">
        {selected ? (
          <>
            <header>
              <span>
                <strong>{selected.kind === 'image' ? 'Image item' : 'Text item'}</strong>
                <small>
                  {formatBytes(selected.size)} · {formatDate(selected.createdAt)}
                </small>
              </span>
              <div>
                <button
                  type="button"
                  aria-label={selected.pinned ? 'Unpin clipboard item' : 'Pin clipboard item'}
                  onClick={() => void system.clipboard.setPinned(selected.id, !selected.pinned)}
                >
                  <Icon name="pin" size={15} />
                  {selected.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button type="button" onClick={() => void copyEntry(selected)}>
                  <Icon name="clipboard" size={15} />
                  Copy
                </button>
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => void system.clipboard.remove(selected.id)}
                >
                  <Icon name="trash" size={15} />
                  Delete
                </button>
              </div>
            </header>
            <ClipboardPreview entry={selected} history={system.clipboard} />
          </>
        ) : (
          <div className="stash-composer">
            <span className="stash-composer__mark">
              <Icon name="clipboard" size={26} />
            </span>
            <h2>Keep something close.</h2>
            <p>Stash is local clipboard history. It never watches the device clipboard silently.</p>
            <textarea
              aria-label="Text to save in Stash"
              placeholder="Type or paste text here…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="button" onClick={() => void addDraft()} disabled={!draft.trim()}>
              Save text
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function ClipboardPreview({
  entry,
  history,
}: {
  entry: ClipboardHistoryEntry;
  history: ClipboardHistory;
}) {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    void history.read(entry.id).then(async (blob) => {
      if (!active) return;
      if (entry.kind === 'text') {
        setText(await blob.text());
        setImageUrl('');
      } else {
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
        setText('');
      }
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry.id, entry.kind, history]);

  return entry.kind === 'image' ? (
    <div className="stash-preview stash-preview--image">
      {imageUrl ? <img src={imageUrl} alt="Clipboard preview" /> : <span>Loading image…</span>}
    </div>
  ) : (
    <pre className="stash-preview stash-preview--text">{text}</pre>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}

function formatRelativeTime(value: number) {
  const minutes = Math.floor((Date.now() - value) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}
