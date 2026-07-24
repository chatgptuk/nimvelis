import type { AppearanceMode, WallpaperId } from '../state/desktop-store';
import type { WindowBounds } from './window-manager/types';

export interface OpenAppOptions {
  instanceData?: unknown;
  bounds?: Partial<WindowBounds>;
}

export interface NimvelisSystemApi {
  appearance: AppearanceMode;
  wallpaper: WallpaperId;
  openApp: (appId: string, options?: OpenAppOptions) => string | null;
  closeWindow: (windowId: string) => void;
  setWindowTitle: (windowId: string, title: string) => void;
  updateWindowData: (windowId: string, data: unknown) => void;
  setAppearance: (appearance: AppearanceMode) => void;
  setWallpaper: (wallpaper: WallpaperId) => void;
}
