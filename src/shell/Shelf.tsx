import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { AppIcon, NimvelisMark } from '../design/Icon';
import type { AppManifest } from '../kernel/app-registry/types';
import { reorderShelfAppIds } from '../kernel/shelf/order';
import type { WindowInstance } from '../kernel/window-manager/types';

interface ShelfProps {
  apps: readonly AppManifest[];
  windows: WindowInstance[];
  onLaunch: (appId: string, forceNew: boolean) => void;
  onOpenOverview: (appFilter?: string) => void;
  onMinimizeAll: (appId: string) => void;
  onCloseAll: (appId: string) => void;
  onOrderChange: (appIds: string[]) => void;
  onRemove: (appId: string) => void;
}

interface ShelfPointerDrag {
  pointerId: number;
  appId: string;
  startX: number;
  startY: number;
  dragging: boolean;
  willRemove: boolean;
  order: string[];
}

export function Shelf({
  apps,
  windows,
  onLaunch,
  onOpenOverview,
  onMinimizeAll,
  onCloseAll,
  onOrderChange,
  onRemove,
}: ShelfProps) {
  const [contextAppId, setContextAppId] = useState<string | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragTargetAppId, setDragTargetAppId] = useState<string | null>(null);
  const [dragWillRemove, setDragWillRemove] = useState(false);
  const shelfRef = useRef<HTMLElement>(null);
  const dragRef = useRef<ShelfPointerDrag | null>(null);
  const suppressClickRef = useRef(false);

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
  const appIds = apps.map((app) => app.id);
  const appById = new Map(apps.map((app) => [app.id, app]));
  const renderedApps = (dragOrder ?? appIds).flatMap((appId) => {
    const app = appById.get(appId);
    return app ? [app] : [];
  });
  const contextIndex = contextApp ? appIds.indexOf(contextApp.id) : -1;

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, appId: string) => {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      appId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
      willRemove: false,
      order: appIds,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.dragging) {
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (distance < 7) return;
      drag.dragging = true;
      suppressClickRef.current = true;
      setContextAppId(null);
      setDraggedAppId(drag.appId);
      setDragOrder(drag.order);
    }

    const shelfBounds = shelfRef.current?.getBoundingClientRect();
    const willRemove = Boolean(
      shelfBounds &&
      (event.clientY < shelfBounds.top - 34 ||
        event.clientX < shelfBounds.left - 34 ||
        event.clientX > shelfBounds.right + 34),
    );
    if (willRemove !== drag.willRemove) {
      drag.willRemove = willRemove;
      setDragWillRemove(willRemove);
      setDragTargetAppId(null);
    }
    if (willRemove) return;

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-shelf-app-id]');
    const targetAppId = target?.dataset.shelfAppId;
    if (!targetAppId || targetAppId === drag.appId || !drag.order.includes(targetAppId)) return;

    const nextOrder = reorderShelfAppIds(drag.order, drag.appId, targetAppId);
    if (nextOrder.every((appId, index) => appId === drag.order[index])) return;
    drag.order = nextOrder;
    setDragOrder(nextOrder);
    setDragTargetAppId(targetAppId);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>, commit: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (commit && drag.dragging) {
      if (drag.willRemove) onRemove(drag.appId);
      else onOrderChange(drag.order);
    }
    if (!commit) suppressClickRef.current = false;
    dragRef.current = null;
    setDragOrder(null);
    setDraggedAppId(null);
    setDragTargetAppId(null);
    setDragWillRemove(false);
  };

  return (
    <nav className="shelf" aria-label="Application Shelf" ref={shelfRef}>
      <button
        className="shelf__brand"
        type="button"
        aria-label="Open Nimvelis Overview"
        title="Nimvelis Overview"
        onClick={() => {
          setContextAppId(null);
          onOpenOverview();
        }}
      >
        <NimvelisMark size={26} />
        <span className="shelf-app__label">Overview</span>
      </button>
      <span className="shelf__divider" />
      {renderedApps.map((app) => {
        const appWindows = windows.filter((window) => window.appId === app.id);
        const isActive = appWindows.some((window) => window.focused);
        const hasMinimized = appWindows.some((window) => window.state === 'minimized');

        return (
          <button
            key={app.id}
            type="button"
            data-shelf-app-id={app.id}
            className={`shelf-app shelf-app--${app.id} ${isActive ? 'is-active' : ''} ${
              draggedAppId === app.id ? 'is-dragging' : ''
            } ${draggedAppId === app.id && dragWillRemove ? 'is-removing' : ''} ${
              dragTargetAppId === app.id ? 'is-drop-target' : ''
            }`}
            aria-label={`${app.name}${app.allowMultipleInstances ? '. Shift click for a new window' : ''}`}
            title={`${app.name} · Drag to reorder${
              app.allowMultipleInstances ? ' · Shift-click for new window' : ''
            }`}
            onClick={(event) => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                event.preventDefault();
                return;
              }
              setContextAppId(null);
              onLaunch(app.id, event.shiftKey);
            }}
            onContextMenu={(event) => showContextMenu(event, app.id)}
            onPointerDown={(event) => startDrag(event, app.id)}
            onPointerMove={updateDrag}
            onPointerUp={(event) => finishDrag(event, true)}
            onPointerCancel={(event) => finishDrag(event, false)}
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
            disabled={contextIndex <= 0}
            onClick={() => {
              const targetAppId = appIds[contextIndex - 1];
              if (targetAppId) {
                onOrderChange(reorderShelfAppIds(appIds, contextApp.id, targetAppId));
              }
              setContextAppId(null);
            }}
          >
            Move left
          </button>
          <button
            role="menuitem"
            disabled={contextIndex < 0 || contextIndex >= appIds.length - 1}
            onClick={() => {
              const targetAppId = appIds[contextIndex + 1];
              if (targetAppId) {
                onOrderChange(reorderShelfAppIds(appIds, contextApp.id, targetAppId));
              }
              setContextAppId(null);
            }}
          >
            Move right
          </button>
          <button
            role="menuitem"
            onClick={() => {
              onRemove(contextApp.id);
              setContextAppId(null);
            }}
          >
            Remove from Shelf
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
