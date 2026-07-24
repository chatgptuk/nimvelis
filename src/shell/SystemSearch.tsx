import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon, Icon } from '../design/Icon';
import type { AppManifest } from '../kernel/app-registry/types';
import type { VfsNode, VirtualFileSystem } from '../kernel/vfs';
import './search.css';

interface SystemSearchProps {
  apps: readonly AppManifest[];
  files: VirtualFileSystem;
  onClose: () => void;
  onOpenApp: (appId: string) => void;
  onOpenFile: (node: VfsNode) => void;
}

type SearchResult =
  { key: string; kind: 'app'; app: AppManifest } | { key: string; kind: 'file'; node: VfsNode };

export function SystemSearch({ apps, files, onClose, onOpenApp, onOpenFile }: SystemSearchProps) {
  const [query, setQuery] = useState('');
  const [fileResults, setFileResults] = useState<VfsNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let current = true;
    const timer = globalThis.setTimeout(async () => {
      const results = query.trim() ? await files.search(query) : [];
      if (current) {
        setFileResults(results.slice(0, 8));
        setSelectedIndex(0);
      }
    }, 90);
    return () => {
      current = false;
      globalThis.clearTimeout(timer);
    };
  }, [files, query]);

  const appResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return apps.slice(0, 5);
    return apps
      .filter(
        (app) =>
          app.name.toLocaleLowerCase().includes(normalized) ||
          app.description.toLocaleLowerCase().includes(normalized),
      )
      .slice(0, 5);
  }, [apps, query]);

  const results = useMemo<SearchResult[]>(
    () => [
      ...appResults.map((app) => ({ key: `app-${app.id}`, kind: 'app' as const, app })),
      ...fileResults.map((node) => ({ key: `file-${node.id}`, kind: 'file' as const, node })),
    ],
    [appResults, fileResults],
  );

  const openResult = (result: SearchResult | undefined) => {
    if (!result) return;
    if (result.kind === 'app') onOpenApp(result.app.id);
    else onOpenFile(result.node);
    onClose();
  };

  return (
    <div
      className="system-search"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="system-search__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search Nimvelis"
      >
        <label className="system-search__input">
          <Icon name="search" size={22} />
          <input
            ref={inputRef}
            value={query}
            placeholder="Search apps and local files"
            aria-label="Search apps and local files"
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose();
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex((index) => Math.min(results.length - 1, index + 1));
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex((index) => Math.max(0, index - 1));
              }
              if (event.key === 'Enter') {
                openResult(results[Math.min(selectedIndex, Math.max(0, results.length - 1))]);
              }
            }}
          />
          <kbd>Esc</kbd>
        </label>

        <div className="system-search__results">
          {appResults.length > 0 ? <h2>Applications</h2> : null}
          {appResults.map((app) => {
            const resultIndex = results.findIndex((result) => result.key === `app-${app.id}`);
            return (
              <button
                className={selectedIndex === resultIndex ? 'is-selected' : ''}
                key={app.id}
                onPointerMove={() => setSelectedIndex(resultIndex)}
                onClick={() => openResult(results[resultIndex])}
              >
                <AppIcon name={app.icon} size={38} />
                <span>
                  <strong>{app.name}</strong>
                  <small>{app.description}</small>
                </span>
                <Icon name="chevron" size={15} />
              </button>
            );
          })}

          {fileResults.length > 0 ? <h2>Local files</h2> : null}
          {fileResults.map((node) => {
            const resultIndex = results.findIndex((result) => result.key === `file-${node.id}`);
            return (
              <button
                className={selectedIndex === resultIndex ? 'is-selected' : ''}
                key={node.id}
                onPointerMove={() => setSelectedIndex(resultIndex)}
                onClick={() => openResult(results[resultIndex])}
              >
                <span className="system-search__file-icon">
                  <Icon name={node.kind === 'directory' ? 'folder' : 'file'} size={19} />
                </span>
                <span>
                  <strong>{node.name}</strong>
                  <small>
                    {node.kind === 'directory' ? 'Folder' : node.mimeType} · On this device
                  </small>
                </span>
                <Icon name="chevron" size={15} />
              </button>
            );
          })}

          {query.trim() && results.length === 0 ? (
            <div className="system-search__empty">
              <Icon name="search" size={30} />
              <strong>No results</strong>
              <span>Try another name or phrase.</span>
            </div>
          ) : null}
        </div>
        <footer>
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> Navigate
          </span>
          <span>
            <kbd>↵</kbd> Open
          </span>
          <span className="status-dot" /> Private local search
        </footer>
      </section>
    </div>
  );
}
