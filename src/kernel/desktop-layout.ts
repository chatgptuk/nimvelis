import type { DesktopViewport } from './window-manager/types';

export const TOP_BAR_HEIGHT = 44;
export const SHELF_SAFE_AREA_HEIGHT = 116;

export function getWindowingViewport(width: number, height: number): DesktopViewport {
  return {
    width: Math.max(320, width),
    height: Math.max(240, height - TOP_BAR_HEIGHT - SHELF_SAFE_AREA_HEIGHT),
  };
}
