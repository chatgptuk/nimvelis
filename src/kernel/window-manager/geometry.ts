import type { DesktopViewport, WindowBounds, WindowMinimumSize } from './types';

export const DEFAULT_MINIMUM_SIZE: WindowMinimumSize = {
  width: 280,
  height: 220,
};

const MIN_VISIBLE_TITLEBAR = 112;
const DESKTOP_INSET = 12;

export function constrainBounds(
  bounds: WindowBounds,
  viewport: DesktopViewport,
  minimum: WindowMinimumSize = DEFAULT_MINIMUM_SIZE,
): WindowBounds {
  const availableWidth = Math.max(240, viewport.width - DESKTOP_INSET * 2);
  const availableHeight = Math.max(180, viewport.height - DESKTOP_INSET * 2);
  const width = clamp(bounds.width, Math.min(minimum.width, availableWidth), availableWidth);
  const height = clamp(bounds.height, Math.min(minimum.height, availableHeight), availableHeight);

  return {
    x:
      width >= availableWidth
        ? DESKTOP_INSET
        : clamp(
            bounds.x,
            DESKTOP_INSET - width + MIN_VISIBLE_TITLEBAR,
            viewport.width - MIN_VISIBLE_TITLEBAR,
          ),
    y: clamp(bounds.y, DESKTOP_INSET, Math.max(DESKTOP_INSET, viewport.height - 48)),
    width,
    height,
  };
}

export function getMaximizedBounds(viewport: DesktopViewport): WindowBounds {
  return {
    x: DESKTOP_INSET,
    y: DESKTOP_INSET,
    width: Math.max(240, viewport.width - DESKTOP_INSET * 2),
    height: Math.max(180, viewport.height - DESKTOP_INSET * 2),
  };
}

export function moveBounds(bounds: WindowBounds, deltaX: number, deltaY: number): WindowBounds {
  return {
    ...bounds,
    x: bounds.x + deltaX,
    y: bounds.y + deltaY,
  };
}

export type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export function resizeBounds(
  bounds: WindowBounds,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
  minimum: WindowMinimumSize = DEFAULT_MINIMUM_SIZE,
): WindowBounds {
  let { x, y, width, height } = bounds;

  if (direction.includes('e')) {
    width = Math.max(minimum.width, bounds.width + deltaX);
  }

  if (direction.includes('s')) {
    height = Math.max(minimum.height, bounds.height + deltaY);
  }

  if (direction.includes('w')) {
    width = Math.max(minimum.width, bounds.width - deltaX);
    x = bounds.x + (bounds.width - width);
  }

  if (direction.includes('n')) {
    height = Math.max(minimum.height, bounds.height - deltaY);
    y = bounds.y + (bounds.height - height);
  }

  return { x, y, width, height };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
