import {
  useMemo,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { AppIcon, Icon } from '../design/Icon';
import { getAppManifest } from '../kernel/app-registry/registry';
import type { NimvelisSystemApi } from '../kernel/system-api';
import {
  constrainBounds,
  getMaximizedBounds,
  moveBounds,
  resizeBounds,
  type ResizeDirection,
} from '../kernel/window-manager/geometry';
import type {
  DesktopViewport,
  WindowBounds,
  WindowInstance,
  WindowMinimumSize,
} from '../kernel/window-manager/types';
import { useDesktopStore } from '../state/desktop-store';
import './window.css';

interface SystemWindowProps {
  window: WindowInstance;
  viewport: DesktopViewport;
  system: NimvelisSystemApi;
}

interface PointerInteraction {
  pointerId: number;
  kind: 'move' | 'resize';
  direction?: ResizeDirection;
  startX: number;
  startY: number;
  startBounds: WindowBounds;
  pendingBounds: WindowBounds;
  frame: number | null;
}

const RESIZE_DIRECTIONS: ResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

export function SystemWindow({ window, viewport, system }: SystemWindowProps) {
  const elementRef = useRef<HTMLElement>(null);
  const interactionRef = useRef<PointerInteraction | null>(null);
  const manifest = getAppManifest(window.appId);
  const focusWindow = useDesktopStore((state) => state.focusWindow);
  const closeWindow = useDesktopStore((state) => state.closeWindow);
  const minimizeWindow = useDesktopStore((state) => state.minimizeWindow);
  const toggleMaximize = useDesktopStore((state) => state.toggleMaximize);
  const toggleFullscreen = useDesktopStore((state) => state.toggleFullscreen);
  const setWindowBounds = useDesktopStore((state) => state.setWindowBounds);

  const minimumSize = useMemo<WindowMinimumSize>(
    () => ({
      width: manifest?.defaultWindow.minWidth ?? 280,
      height: manifest?.defaultWindow.minHeight ?? 220,
    }),
    [manifest],
  );

  if (!manifest || window.state === 'minimized') return null;

  const visibleBounds = window.state === 'maximized' ? getMaximizedBounds(viewport) : window.bounds;
  const isFullscreen = window.state === 'fullscreen';
  const style: CSSProperties = isFullscreen
    ? { zIndex: 40_000 + window.zIndex }
    : {
        width: visibleBounds.width,
        height: visibleBounds.height,
        transform: `translate3d(${visibleBounds.x}px, ${visibleBounds.y}px, 0)`,
        zIndex: window.zIndex,
      };
  const AppComponent = manifest.component;

  const startInteraction = (
    event: ReactPointerEvent<HTMLElement>,
    kind: 'move' | 'resize',
    direction?: ResizeDirection,
  ) => {
    if (event.button !== 0 || window.state !== 'normal') return;
    if (
      kind === 'move' &&
      event.target instanceof Element &&
      event.target.closest('[data-window-action]')
    ) {
      return;
    }

    event.preventDefault();
    focusWindow(window.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    elementRef.current?.setAttribute('data-interacting', kind);
    interactionRef.current = {
      pointerId: event.pointerId,
      kind,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      startBounds: window.bounds,
      pendingBounds: window.bounds,
      frame: null,
    };
  };

  const updateInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - interaction.startX;
    const deltaY = event.clientY - interaction.startY;
    interaction.pendingBounds =
      interaction.kind === 'move'
        ? constrainBounds(
            moveBounds(interaction.startBounds, deltaX, deltaY),
            viewport,
            minimumSize,
          )
        : constrainBounds(
            resizeBounds(
              interaction.startBounds,
              interaction.direction ?? 'se',
              deltaX,
              deltaY,
              minimumSize,
            ),
            viewport,
            minimumSize,
          );

    if (interaction.frame !== null) return;
    interaction.frame = globalThis.requestAnimationFrame(() => {
      const activeInteraction = interactionRef.current;
      const element = elementRef.current;
      if (!activeInteraction || !element) return;
      const next = activeInteraction.pendingBounds;
      element.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
      if (activeInteraction.kind === 'resize') {
        element.style.width = `${next.width}px`;
        element.style.height = `${next.height}px`;
      }
      activeInteraction.frame = null;
    });
  };

  const finishInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    if (interaction.frame !== null) globalThis.cancelAnimationFrame(interaction.frame);
    const next = interaction.pendingBounds;
    const element = elementRef.current;
    if (element) {
      element.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
      element.style.width = `${next.width}px`;
      element.style.height = `${next.height}px`;
      element.removeAttribute('data-interacting');
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    interactionRef.current = null;
    setWindowBounds(window.id, next);
  };

  const handleTitlebarKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && window.state === 'fullscreen') {
      event.preventDefault();
      toggleFullscreen(window.id);
      return;
    }

    if (event.altKey && event.key === 'Enter') {
      event.preventDefault();
      toggleMaximize(window.id);
      return;
    }

    if (!event.altKey || !event.key.startsWith('Arrow') || window.state !== 'normal') return;
    event.preventDefault();
    const amount = event.shiftKey ? 28 : 14;
    const deltaX = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0;
    const deltaY = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
    const nextBounds = event.shiftKey
      ? resizeBounds(
          window.bounds,
          deltaX < 0 ? 'w' : deltaX > 0 ? 'e' : deltaY < 0 ? 'n' : 's',
          deltaX,
          deltaY,
          minimumSize,
        )
      : moveBounds(window.bounds, deltaX, deltaY);
    setWindowBounds(window.id, constrainBounds(nextBounds, viewport, minimumSize));
  };

  return (
    <article
      ref={elementRef}
      className={`system-window ${window.focused ? 'is-focused' : ''} ${
        window.state === 'maximized' ? 'is-maximized' : ''
      } ${isFullscreen ? 'is-fullscreen' : ''}`}
      style={style}
      role="dialog"
      aria-label={`${window.title} window`}
      data-window-id={window.id}
      data-app-id={window.appId}
      onPointerDown={() => focusWindow(window.id)}
    >
      <header
        className="window-titlebar"
        tabIndex={0}
        aria-label={`${window.title} window controls. Alt plus arrow moves. Alt plus Shift plus arrow resizes. Alt plus Enter toggles maximize.`}
        aria-keyshortcuts="Alt+Enter Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown"
        onPointerDown={(event) => startInteraction(event, 'move')}
        onPointerMove={updateInteraction}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        onDoubleClick={(event) => {
          if (!(event.target instanceof Element) || !event.target.closest('[data-window-action]')) {
            toggleMaximize(window.id);
          }
        }}
        onKeyDown={handleTitlebarKeyDown}
      >
        <div className="window-controls" data-window-action>
          <button
            type="button"
            className="window-control window-control--close"
            aria-label={`Close ${window.title}`}
            onClick={() => closeWindow(window.id)}
          >
            <Icon name="close" size={12} />
          </button>
          <button
            type="button"
            className="window-control"
            aria-label={`Minimize ${window.title}`}
            onClick={() => minimizeWindow(window.id)}
          >
            <Icon name="minimize" size={12} />
          </button>
          <button
            type="button"
            className="window-control"
            aria-label={
              window.state === 'maximized' ? `Restore ${window.title}` : `Maximize ${window.title}`
            }
            onClick={() => toggleMaximize(window.id)}
          >
            <Icon name={window.state === 'maximized' ? 'restore' : 'maximize'} size={11} />
          </button>
          <button
            type="button"
            className="window-control"
            aria-label={
              isFullscreen
                ? `Exit full screen for ${window.title}`
                : `Enter full screen for ${window.title}`
            }
            onClick={() => toggleFullscreen(window.id)}
          >
            <Icon name="fullscreen" size={11} />
          </button>
        </div>
        <div className="window-app-identity">
          <span className="window-app-icon">
            <AppIcon name={manifest.icon} size={23} />
          </span>
          <span className="window-title">{window.title}</span>
        </div>
      </header>
      <div className="window-content">
        <AppComponent window={window} system={system} />
      </div>
      {window.resizable &&
        window.state === 'normal' &&
        RESIZE_DIRECTIONS.map((direction) => (
          <div
            key={direction}
            className={`window-resize-handle window-resize-handle--${direction}`}
            aria-hidden="true"
            onPointerDown={(event) => startInteraction(event, 'resize', direction)}
            onPointerMove={updateInteraction}
            onPointerUp={finishInteraction}
            onPointerCancel={finishInteraction}
          />
        ))}
    </article>
  );
}
