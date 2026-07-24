import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { AppIcon, NimvelisMark } from '../design/Icon';
import type { AppManifest } from '../kernel/app-registry/types';
import type { WindowInstance } from '../kernel/window-manager/types';

interface ShelfProps {
  apps: readonly AppManifest[];
  windows: WindowInstance[];
  onLaunch: (appId: string, forceNew: boolean) => void;
  onOpenOverview: (appFilter?: string) => void;
  onMinimizeAll: (appId: string) => void;
  onCloseAll: (appId: string) => void;
}

export function Shelf({
  apps,
  windows,
  onLaunch,
  onOpenOverview,
  onMinimizeAll,
  onCloseAll,
}: ShelfProps) {
  const [contextAppId, setContextAppId] = useState<string | null>(null);
  const shelfRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!shelfRef.current?.contains(event.target as Node)) setContextAppId(null);
    };
    globalThis.addEventListener('pointerdown', close);
    return () => globalThis.removeEventListener('pointerdown', close);
  }, []);

  const showContextMenu = (event: MouseEvent, appId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextAppId(appId);
  };

  const contextApp = apps.find((app) => app.id === contextAppId);
  const contextWindows = windows.filter((window) => window.appId === contextAppId);

  return (
    <nav className="shelf" aria-label="Application Shelf" ref={shelfRef}>
      <button
        className="shelf__brand"
        type="button"
        aria-label="Open Nimvelis Overview"
        title="Nimvelis Overview"
        onClick={() => onOpenOverview()}
      >
        <NimvelisMark size={26} />
        <span className="shelf-app__label">Overview</span>
      </button>
      <span className="shelf__divider" />
      {apps.map((app) => {
        const appWindows = windows.filter((window) => window.appId === app.id);
        const isActive = appWindows.some((window) => window.focused);
        const hasMinimized = appWindows.some((window) => window.state === 'minimized');

        return (
          <button
            key={app.id}
            type="button"
            className={`shelf-app shelf-app--${app.id} ${isActive ? 'is-active' : ''}`}
            aria-label={`${app.name}${app.allowMultipleInstances ? '. Shift click for a new window' : ''}`}
            title={`${app.name}${app.allowMultipleInstances ? ' · Shift-click for new window' : ''}`}
            onClick={(event) => onLaunch(app.id, event.shiftKey)}
            onContextMenu={(event) => showContextMenu(event, app.id)}
          >
            <span className="shelf-app__icon">
              <AppIcon name={app.icon} size={54} />
            </span>
            <span className="shelf-app__label">{app.name}</span>
            {appWindows.length > 0 && (
              <span
                className={`shelf-app__running ${hasMinimized ? 'has-minimized' : ''}`}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
      {contextApp ? (
        <div className="shelf-context" role="menu">
          <header>
            <AppIcon name={contextApp.icon} size={29} />
            <span>
              <strong>{contextApp.name}</strong>
              <small>
                {contextWindows.length} open window{contextWindows.length === 1 ? '' : 's'}
              </small>
            </span>
          </header>
          <button
            role="menuitem"
            onClick={() => {
              onLaunch(contextApp.id, true);
              setContextAppId(null);
            }}
          >
            New window
          </button>
          <button
            role="menuitem"
            disabled={contextWindows.length === 0}
            onClick={() => {
              onOpenOverview(contextApp.id);
              setContextAppId(null);
            }}
          >
            Show windows
          </button>
          <div />
          <button
            role="menuitem"
            disabled={contextWindows.length === 0}
            onClick={() => {
              onMinimizeAll(contextApp.id);
              setContextAppId(null);
            }}
          >
            Minimize all
          </button>
          <button
            className="is-danger"
            role="menuitem"
            disabled={contextWindows.length === 0}
            onClick={() => {
              onCloseAll(contextApp.id);
              setContextAppId(null);
            }}
          >
            Close all
          </button>
        </div>
      ) : null}
    </nav>
  );
}
