import type { AppearanceMode, DesktopPreferences, WallpaperId } from '../state/desktop-store';
import type { VfsNode, VirtualFileSystem } from './vfs';
import type { WindowBounds } from './window-manager/types';

export interface OpenAppOptions {
  instanceData?: unknown;
  bounds?: Partial<WindowBounds>;
}

export interface InstalledAppSummary {
  id: string;
  name: string;
  description: string;
}

export interface NimvelisSystemApi {
  appearance: AppearanceMode;
  wallpaper: WallpaperId;
  preferences: DesktopPreferences;
  files: VirtualFileSystem;
  listApps: () => InstalledAppSummary[];
  openApp: (appId: string, options?: OpenAppOptions) => string | null;
  openFile: (node: VfsNode) => string | null;
  notify: (message: string, tone?: 'neutral' | 'success' | 'error') => void;
  closeWindow: (windowId: string) => void;
  setWindowTitle: (windowId: string, title: string) => void;
  updateWindowData: (windowId: string, data: unknown) => void;
  setAppearance: (appearance: AppearanceMode) => void;
  setWallpaper: (wallpaper: WallpaperId) => void;
  updatePreferences: (preferences: Partial<DesktopPreferences>) => void;
  resetPreferences: () => void;
  resetDesktopIconPositions: () => void;
}
