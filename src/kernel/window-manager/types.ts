export type WindowVisualState = 'normal' | 'minimized' | 'maximized' | 'fullscreen';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  bounds: WindowBounds;
  state: WindowVisualState;
  zIndex: number;
  focused: boolean;
  resizable: boolean;
  restoreBounds?: WindowBounds;
  stateBeforeMinimize?: Exclude<WindowVisualState, 'minimized'>;
  stateBeforeFullscreen?: 'normal' | 'maximized';
  instanceData?: unknown;
}

export interface DesktopViewport {
  width: number;
  height: number;
}

export interface WindowMinimumSize {
  width: number;
  height: number;
}
