import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { AppIcon } from '../design/Icon';
import {
  clampDesktopIconPosition,
  getDefaultDesktopIconPosition,
  type DesktopIconPosition,
} from '../kernel/desktop-icons/geometry';
import type { AppManifest } from '../kernel/app-registry/types';
import type { DesktopViewport } from '../kernel/window-manager/types';

interface DesktopIconsProps {
  apps: readonly AppManifest[];
  viewport: DesktopViewport;
  positions: Record<string, DesktopIconPosition>;
  onMove: (appId: string, position: DesktopIconPosition) => void;
  onOpen: (appId: string) => void;
}

interface IconInteraction {
  appId: string;
  pointerId: number;
  startX: number;
  startY: number;
  startPosition: DesktopIconPosition;
  pendingPosition: DesktopIconPosition;
  moved: boolean;
  frame: number | null;
  element: HTMLButtonElement;
}

export function DesktopIcons({ apps, viewport, positions, onMove, onOpen }: DesktopIconsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const interactionRef = useRef<IconInteraction | null>(null);
  const suppressClickRef = useRef<string | null>(null);

  const finishInteraction = useCallback(
    (pointerId: number, cancelled = false) => {
      const interaction = interactionRef.current;
      if (!interaction || interaction.pointerId !== pointerId) return;
      if (interaction.frame !== null) cancelAnimationFrame(interaction.frame);
      const next = cancelled ? interaction.startPosition : interaction.pendingPosition;
      interaction.element.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
      if (interaction.element.hasPointerCapture(pointerId)) {
        interaction.element.releasePointerCapture(pointerId);
      }
      interactionRef.current = null;
      setDragging(null);

      if (interaction.moved) {
        suppressClickRef.current = interaction.appId;
        if (!cancelled) onMove(interaction.appId, next);
      }
    },
    [onMove],
  );

  useEffect(() => {
    const finish = (event: PointerEvent) => finishInteraction(event.pointerId);
    const cancel = (event: PointerEvent) => finishInteraction(event.pointerId, true);
    globalThis.addEventListener('pointerup', finish);
    globalThis.addEventListener('pointercancel', cancel);
    return () => {
      globalThis.removeEventListener('pointerup', finish);
      globalThis.removeEventListener('pointercancel', cancel);
    };
  }, [finishInteraction]);

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, appId: string, index: number) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const startPosition = clampDesktopIconPosition(
      positions[appId] ?? getDefaultDesktopIconPosition(index, viewport),
      viewport,
    );
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      appId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition,
      pendingPosition: startPosition,
      moved: false,
      frame: null,
      element: event.currentTarget,
    };
  };

  const updateDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - interaction.startX;
    const deltaY = event.clientY - interaction.startY;
    if (!interaction.moved && Math.hypot(deltaX, deltaY) < 4) return;

    if (!interaction.moved) {
      interaction.moved = true;
      setDragging(interaction.appId);
    }
    interaction.pendingPosition = clampDesktopIconPosition(
      {
        x: interaction.startPosition.x + deltaX,
        y: interaction.startPosition.y + deltaY,
      },
      viewport,
    );

    if (interaction.frame !== null) return;
    interaction.frame = requestAnimationFrame(() => {
      const active = interactionRef.current;
      if (!active) return;
      active.element.style.transform = `translate3d(${active.pendingPosition.x}px, ${active.pendingPosition.y}px, 0)`;
      active.frame = null;
    });
  };

  return (
    <div className="desktop-icons" aria-label="Desktop applications">
      {apps.map((app, index) => {
        const position = clampDesktopIconPosition(
          positions[app.id] ?? getDefaultDesktopIconPosition(index, viewport),
          viewport,
        );
        const style = {
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        } satisfies CSSProperties;

        return (
          <button
            key={app.id}
            type="button"
            className={`desktop-icon desktop-icon--${app.id} ${
              selected === app.id ? 'is-selected' : ''
            } ${dragging === app.id ? 'is-dragging' : ''}`}
            style={style}
            aria-label={`Open ${app.name}`}
            onPointerDown={(event) => startDrag(event, app.id, index)}
            onPointerMove={updateDrag}
            onPointerUp={(event) => finishInteraction(event.pointerId)}
            onPointerCancel={(event) => finishInteraction(event.pointerId, true)}
            onClick={(event) => {
              event.stopPropagation();
              if (suppressClickRef.current === app.id) {
                suppressClickRef.current = null;
                return;
              }
              setSelected(app.id);
            }}
            onDoubleClick={() => onOpen(app.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onOpen(app.id);
            }}
          >
            <span className="desktop-icon__tile">
              <AppIcon name={app.icon} size={56} />
            </span>
            <span>{app.name}</span>
          </button>
        );
      })}
    </div>
  );
}
