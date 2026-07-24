import type { AppearanceMode, DesktopPreferences, WallpaperId } from '../state/desktop-store';
import type { IconName } from '../design/Icon';
import type { LocalSession } from '../state/system-store';
import type { ClipboardHistory } from './clipboard';
import type { VfsNode, VirtualFileSystem } from './vfs';
import type { WindowBounds, WindowVisualState } from './window-manager/types';

export interface OpenAppOptions {
  instanceData?: unknown;
  bounds?: Partial<WindowBounds>;
}

export interface InstalledAppSummary {
  id: string;
  name: string;
  description: string;
  icon?: IconName;
}

export interface SystemWindowSummary {
  id: string;
  appId: string;
  appName: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  state: WindowVisualState;
  focused: boolean;
}

export interface NimvelisSystemApi {
  appearance: AppearanceMode;
  wallpaper: WallpaperId;
  preferences: DesktopPreferences;
  session: LocalSession;
  files: VirtualFileSystem;
  clipboard: ClipboardHistory;
  windows: SystemWindowSummary[];
  listApps: () => InstalledAppSummary[];
  openApp: (appId: string, options?: OpenAppOptions) => string | null;
  openFile: (node: VfsNode) => string | null;
  notify: (message: string, tone?: 'neutral' | 'success' | 'error') => void;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  setWindowTitle: (windowId: string, title: string) => void;
  updateWindowData: (windowId: string, data: unknown) => void;
  setAppearance: (appearance: AppearanceMode) => void;
  setWallpaper: (wallpaper: WallpaperId) => void;
  updatePreferences: (preferences: Partial<DesktopPreferences>) => void;
  resetPreferences: () => void;
  resetDesktopIconPositions: () => void;
  lockSession: () => void;
  setProfileName: (name: string) => void;
}
