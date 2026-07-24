import type { DesktopViewport } from '../window-manager/types';

export interface DesktopIconPosition {
  x: number;
  y: number;
}

export const DESKTOP_ICON_WIDTH = 88;
export const DESKTOP_ICON_HEIGHT = 92;

const EDGE_GAP = 12;
const TOP_GAP = 20;
const SHELF_CLEARANCE = 94;
const COLUMN_GAP = 12;
const ROW_GAP = 10;

export function clampDesktopIconPosition(
  position: DesktopIconPosition,
  viewport: DesktopViewport,
): DesktopIconPosition {
  return {
    x: clamp(
      position.x,
      EDGE_GAP,
      Math.max(EDGE_GAP, viewport.width - DESKTOP_ICON_WIDTH - EDGE_GAP),
    ),
    y: clamp(
      position.y,
      EDGE_GAP,
      Math.max(EDGE_GAP, viewport.height - DESKTOP_ICON_HEIGHT - SHELF_CLEARANCE),
    ),
  };
}

export function getDefaultDesktopIconPosition(
  index: number,
  viewport: DesktopViewport,
): DesktopIconPosition {
  const maxY = Math.max(TOP_GAP, viewport.height - DESKTOP_ICON_HEIGHT - SHELF_CLEARANCE);
  const rowStep = DESKTOP_ICON_HEIGHT + ROW_GAP;
  const rows = Math.max(1, Math.floor((maxY - TOP_GAP) / rowStep) + 1);
  const row = index % rows;
  const column = Math.floor(index / rows);

  return clampDesktopIconPosition(
    {
      x:
        viewport.width - EDGE_GAP - DESKTOP_ICON_WIDTH - column * (DESKTOP_ICON_WIDTH + COLUMN_GAP),
      y: TOP_GAP + row * rowStep,
    },
    viewport,
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
