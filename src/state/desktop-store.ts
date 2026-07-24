import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getAppManifest, hasApp } from '../kernel/app-registry/registry';
import type { OpenAppOptions } from '../kernel/system-api';
import type { DesktopIconPosition } from '../kernel/desktop-icons/geometry';
import { constrainBounds } from '../kernel/window-manager/geometry';
import type {
  DesktopWorkspace,
  DesktopViewport,
  WindowBounds,
  WindowInstance,
  WindowSnapPosition,
  WindowVisualState,
} from '../kernel/window-manager/types';

export type AppearanceMode = 'system' | 'light' | 'dark';
export type WallpaperId = 'aurora' | 'solstice' | 'stillness';

interface PersistedDesktopState {
  windows: WindowInstance[];
  zCounter: number;
  appearance: AppearanceMode;
  wallpaper: WallpaperId;
  hasCompletedWelcome: boolean;
  workspaces: DesktopWorkspace[];
  activeWorkspaceId: string;
  desktopIconPositions: Record<string, DesktopIconPosition>;
}

interface DesktopActions {
  openApp: (appId: string, options?: OpenAppOptions) => string | null;
  focusWindow: (windowId: string) => void;
  clearFocus: () => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  toggleMaximize: (windowId: string) => void;
  toggleFullscreen: (windowId: string) => void;
  setWindowBounds: (windowId: string, bounds: WindowBounds) => void;
  setWindowTitle: (windowId: string, title: string) => void;
  updateWindowData: (windowId: string, instanceData: unknown) => void;
  setAppearance: (appearance: AppearanceMode) => void;
  setWallpaper: (wallpaper: WallpaperId) => void;
  constrainWindows: (viewport: DesktopViewport) => void;
  cycleFocus: () => void;
  dismissWelcome: () => void;
  createWorkspace: () => string;
  switchWorkspace: (workspaceId: string) => void;
  renameWorkspace: (workspaceId: string, name: string) => void;
  removeWorkspace: (workspaceId: string) => void;
  moveWindowToWorkspace: (windowId: string, workspaceId: string) => void;
  snapWindow: (windowId: string, position: WindowSnapPosition) => void;
  closeAppWindows: (appId: string) => void;
  minimizeAppWindows: (appId: string) => void;
  setDesktopIconPosition: (appId: string, position: DesktopIconPosition) => void;
  resetDesktopIconPositions: () => void;
}

export type DesktopStore = PersistedDesktopState & DesktopActions;

const INITIAL_WINDOWS: WindowInstance[] = [
  {
    id: 'aurora-welcome',
    appId: 'memo',
    workspaceId: 'space-main',
    title: 'Welcome to Aurora',
    bounds: { x: 292, y: 116, width: 650, height: 500 },
    state: 'normal',
    zIndex: 102,
    focused: true,
    resizable: true,
    instanceData: {
      content:
        'Welcome to Nimvelis.\n\nA quiet space for your thoughts, files, tools, and work — wherever you are.\n\nOpen Files to create or import documents, press ⌘/Ctrl + K to search, or change the atmosphere in Settings.',
      updatedAt: 'A moment ago',
    },
  },
  {
    id: 'aurora-calculator',
    appId: 'calculator',
    workspaceId: 'space-main',
    title: 'Calculator',
    bounds: { x: 82, y: 176, width: 326, height: 468 },
    state: 'normal',
    zIndex: 101,
    focused: false,
    resizable: true,
  },
];

const INITIAL_WORKSPACES: DesktopWorkspace[] = [{ id: 'space-main', name: 'Main', createdAt: 0 }];

const INITIAL_STATE: PersistedDesktopState = {
  windows: INITIAL_WINDOWS,
  zCounter: 102,
  appearance: 'system',
  wallpaper: 'aurora',
  hasCompletedWelcome: false,
  workspaces: INITIAL_WORKSPACES,
  activeWorkspaceId: 'space-main',
  desktopIconPositions: {},
};

export const useDesktopStore = create<DesktopStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      openApp: (appId, options) => {
        const manifest = getAppManifest(appId);
        if (!manifest) return null;
        const activeWorkspaceId = get().activeWorkspaceId;

        const existing = get()
          .windows.filter((window) => window.appId === appId)
          .sort((a, b) => b.zIndex - a.zIndex);

        if (!manifest.allowMultipleInstances && existing[0]) {
          if (existing[0].workspaceId !== activeWorkspaceId) {
            get().switchWorkspace(existing[0].workspaceId);
          }
          get().restoreWindow(existing[0].id);
          return existing[0].id;
        }

        const zIndex = get().zCounter + 1;
        const cascade = existing.length % 6;
        const viewport = readViewport();
        const width = Math.min(manifest.defaultWindow.width, viewport.width - 24);
        const height = Math.min(manifest.defaultWindow.height, viewport.height - 24);
        const bounds = constrainBounds(
          {
            x: options?.bounds?.x ?? Math.round((viewport.width - width) / 2 + cascade * 26 - 26),
            y: options?.bounds?.y ?? Math.round((viewport.height - height) / 2 + cascade * 22 - 12),
            width: options?.bounds?.width ?? width,
            height: options?.bounds?.height ?? height,
          },
          viewport,
          {
            width: manifest.defaultWindow.minWidth ?? 280,
            height: manifest.defaultWindow.minHeight ?? 220,
          },
        );
        const id = createWindowId(appId);
        const nextWindow: WindowInstance = {
          id,
          appId,
          workspaceId: activeWorkspaceId,
          title: manifest.name,
          bounds,
          state: 'normal',
          zIndex,
          focused: true,
          resizable: true,
          instanceData: options?.instanceData,
        };

        set((state) => ({
          windows: [...state.windows.map((window) => ({ ...window, focused: false })), nextWindow],
          zCounter: zIndex,
        }));

        return id;
      },

      focusWindow: (windowId) => {
        const target = get().windows.find((window) => window.id === windowId);
        if (!target) return;
        if (target.workspaceId !== get().activeWorkspaceId) {
          get().switchWorkspace(target.workspaceId);
        }
        if (target.state === 'minimized') {
          get().restoreWindow(windowId);
          return;
        }

        const zIndex = get().zCounter + 1;
        set((state) => ({
          windows: state.windows.map((window) => ({
            ...window,
            focused: window.id === windowId,
            zIndex: window.id === windowId ? zIndex : window.zIndex,
          })),
          zCounter: zIndex,
        }));
      },

      clearFocus: () => {
        set((state) => ({
          windows: state.windows.map((window) => ({ ...window, focused: false })),
        }));
      },

      closeWindow: (windowId) => {
        set((state) => {
          const remaining = state.windows.filter((window) => window.id !== windowId);
          const nextFocused = [...remaining]
            .filter(
              (window) =>
                window.workspaceId === state.activeWorkspaceId && window.state !== 'minimized',
            )
            .sort((a, b) => b.zIndex - a.zIndex)[0];

          return {
            windows: remaining.map((window) => ({
              ...window,
              focused: window.id === nextFocused?.id,
            })),
          };
        });
      },

      minimizeWindow: (windowId) => {
        set((state) => {
          const target = state.windows.find((window) => window.id === windowId);
          if (!target || target.state === 'minimized') return state;

          const remaining = state.windows.filter(
            (window) =>
              window.id !== windowId &&
              window.workspaceId === state.activeWorkspaceId &&
              window.state !== 'minimized',
          );
          const nextFocused = [...remaining].sort((a, b) => b.zIndex - a.zIndex)[0];

          return {
            windows: state.windows.map((window) => {
              if (window.id === windowId) {
                return {
                  ...window,
                  focused: false,
                  state: 'minimized' as const,
                  stateBeforeMinimize:
                    window.state === 'minimized' ? ('normal' as const) : window.state,
                };
              }

              return { ...window, focused: window.id === nextFocused?.id };
            }),
          };
        });
      },

      restoreWindow: (windowId) => {
        const zIndex = get().zCounter + 1;
        set((state) => ({
          windows: state.windows.map((window) => {
            if (window.id !== windowId) return { ...window, focused: false };
            const restoredState = window.stateBeforeMinimize ?? 'normal';
            return {
              ...window,
              state: restoredState,
              stateBeforeMinimize: undefined,
              focused: true,
              zIndex,
            };
          }),
          zCounter: zIndex,
        }));
      },

      toggleMaximize: (windowId) => {
        set((state) => ({
          windows: state.windows.map((window) => {
            if (window.id !== windowId || window.state === 'minimized') return window;

            if (window.state === 'maximized') {
              return {
                ...window,
                state: 'normal',
                bounds: window.restoreBounds ?? window.bounds,
                restoreBounds: undefined,
              };
            }

            return {
              ...window,
              state: 'maximized',
              restoreBounds: window.state === 'normal' ? window.bounds : window.restoreBounds,
            };
          }),
        }));
      },

      toggleFullscreen: (windowId) => {
        set((state) => ({
          windows: state.windows.map((window) => {
            if (window.id !== windowId || window.state === 'minimized') return window;

            if (window.state === 'fullscreen') {
              const restoredState = window.stateBeforeFullscreen ?? 'normal';
              return {
                ...window,
                state: restoredState,
                bounds:
                  restoredState === 'normal'
                    ? (window.restoreBounds ?? window.bounds)
                    : window.bounds,
                restoreBounds: restoredState === 'normal' ? undefined : window.restoreBounds,
                stateBeforeFullscreen: undefined,
              };
            }

            return {
              ...window,
              state: 'fullscreen',
              restoreBounds: window.state === 'normal' ? window.bounds : window.restoreBounds,
              stateBeforeFullscreen: window.state === 'maximized' ? 'maximized' : 'normal',
            };
          }),
        }));
      },

      setWindowBounds: (windowId, bounds) => {
        set((state) => ({
          windows: state.windows.map((window) =>
            window.id === windowId && window.state === 'normal' ? { ...window, bounds } : window,
          ),
        }));
      },

      setWindowTitle: (windowId, title) => {
        const safeTitle = title.trim().slice(0, 80);
        if (!safeTitle) return;
        set((state) => ({
          windows: state.windows.map((window) =>
            window.id === windowId ? { ...window, title: safeTitle } : window,
          ),
        }));
      },

      updateWindowData: (windowId, instanceData) => {
        set((state) => ({
          windows: state.windows.map((window) =>
            window.id === windowId ? { ...window, instanceData } : window,
          ),
        }));
      },

      setAppearance: (appearance) => set({ appearance }),
      setWallpaper: (wallpaper) => set({ wallpaper }),

      constrainWindows: (viewport) => {
        set((state) => ({
          windows: state.windows.map((window) => {
            if (window.state !== 'normal') return window;
            const manifest = getAppManifest(window.appId);
            return {
              ...window,
              bounds: constrainBounds(window.bounds, viewport, {
                width: manifest?.defaultWindow.minWidth ?? 280,
                height: manifest?.defaultWindow.minHeight ?? 220,
              }),
            };
          }),
        }));
      },

      cycleFocus: () => {
        const candidates = get()
          .windows.filter(
            (window) =>
              window.workspaceId === get().activeWorkspaceId && window.state !== 'minimized',
          )
          .sort((a, b) => b.zIndex - a.zIndex);
        if (candidates.length < 2) return;
        const currentIndex = candidates.findIndex((window) => window.focused);
        const next = candidates[(currentIndex + 1 + candidates.length) % candidates.length];
        if (next) get().focusWindow(next.id);
      },

      dismissWelcome: () => set({ hasCompletedWelcome: true }),

      createWorkspace: () => {
        const id = createWindowId('space');
        const createdAt = Date.now();
        set((state) => ({
          workspaces: [
            ...state.workspaces,
            { id, name: `Space ${state.workspaces.length + 1}`, createdAt },
          ],
          activeWorkspaceId: id,
          windows: state.windows.map((window) => ({ ...window, focused: false })),
        }));
        return id;
      },

      switchWorkspace: (workspaceId) => {
        if (!get().workspaces.some((workspace) => workspace.id === workspaceId)) return;
        set((state) => {
          const target = [...state.windows]
            .filter((window) => window.workspaceId === workspaceId && window.state !== 'minimized')
            .sort((left, right) => right.zIndex - left.zIndex)[0];
          return {
            activeWorkspaceId: workspaceId,
            windows: state.windows.map((window) => ({
              ...window,
              focused: window.id === target?.id,
            })),
          };
        });
      },

      renameWorkspace: (workspaceId, rawName) => {
        const name = rawName.trim().slice(0, 24);
        if (!name) return;
        set((state) => ({
          workspaces: state.workspaces.map((workspace) =>
            workspace.id === workspaceId ? { ...workspace, name } : workspace,
          ),
        }));
      },

      removeWorkspace: (workspaceId) => {
        const state = get();
        if (state.workspaces.length <= 1) return;
        const fallback =
          state.workspaces.find((workspace) => workspace.id !== workspaceId) ?? state.workspaces[0];
        if (!fallback) return;
        set((current) => ({
          workspaces: current.workspaces.filter((workspace) => workspace.id !== workspaceId),
          activeWorkspaceId:
            current.activeWorkspaceId === workspaceId ? fallback.id : current.activeWorkspaceId,
          windows: current.windows.map((window) =>
            window.workspaceId === workspaceId
              ? { ...window, workspaceId: fallback.id, focused: false }
              : window,
          ),
        }));
        if (state.activeWorkspaceId === workspaceId) get().switchWorkspace(fallback.id);
      },

      moveWindowToWorkspace: (windowId, workspaceId) => {
        if (!get().workspaces.some((workspace) => workspace.id === workspaceId)) return;
        set((state) => ({
          windows: state.windows.map((window) =>
            window.id === windowId
              ? { ...window, workspaceId, focused: workspaceId === state.activeWorkspaceId }
              : window.id !== windowId && workspaceId === state.activeWorkspaceId
                ? { ...window, focused: false }
                : window,
          ),
        }));
      },

      snapWindow: (windowId, position) => {
        const viewport = readViewport();
        const gap = 8;
        const halfWidth = Math.max(280, Math.floor((viewport.width - gap * 3) / 2));
        const halfHeight = Math.max(220, Math.floor((viewport.height - gap * 3) / 2));
        const boundsByPosition: Record<WindowSnapPosition, WindowBounds> = {
          left: { x: gap, y: gap, width: halfWidth, height: viewport.height - gap * 2 },
          right: {
            x: viewport.width - halfWidth - gap,
            y: gap,
            width: halfWidth,
            height: viewport.height - gap * 2,
          },
          'top-left': { x: gap, y: gap, width: halfWidth, height: halfHeight },
          'top-right': {
            x: viewport.width - halfWidth - gap,
            y: gap,
            width: halfWidth,
            height: halfHeight,
          },
          'bottom-left': {
            x: gap,
            y: viewport.height - halfHeight - gap,
            width: halfWidth,
            height: halfHeight,
          },
          'bottom-right': {
            x: viewport.width - halfWidth - gap,
            y: viewport.height - halfHeight - gap,
            width: halfWidth,
            height: halfHeight,
          },
        };
        set((state) => ({
          windows: state.windows.map((window) =>
            window.id === windowId
              ? {
                  ...window,
                  state: 'normal',
                  bounds: boundsByPosition[position],
                  restoreBounds: undefined,
                  focused: true,
                }
              : { ...window, focused: false },
          ),
        }));
      },

      closeAppWindows: (appId) => {
        set((state) => ({
          windows: state.windows.filter(
            (window) => window.appId !== appId || window.workspaceId !== state.activeWorkspaceId,
          ),
        }));
      },

      minimizeAppWindows: (appId) => {
        set((state) => ({
          windows: state.windows.map((window) =>
            window.appId === appId &&
            window.workspaceId === state.activeWorkspaceId &&
            window.state !== 'minimized'
              ? {
                  ...window,
                  focused: false,
                  state: 'minimized',
                  stateBeforeMinimize: window.state,
                }
              : window,
          ),
        }));
      },

      setDesktopIconPosition: (appId, position) => {
        if (!hasApp(appId) || !isDesktopIconPosition(position)) return;
        set((state) => ({
          desktopIconPositions: {
            ...state.desktopIconPositions,
            [appId]: position,
          },
        }));
      },

      resetDesktopIconPositions: () => set({ desktopIconPositions: {} }),
    }),
    {
      name: 'nimvelis.aurora.desktop',
      storage: createJSONStorage(() => window.localStorage),
      version: 3,
      migrate: (persistedState) => persistedState,
      partialize: (state): PersistedDesktopState => ({
        windows: state.windows,
        zCounter: state.zCounter,
        appearance: state.appearance,
        wallpaper: state.wallpaper,
        hasCompletedWelcome: state.hasCompletedWelcome,
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        desktopIconPositions: state.desktopIconPositions,
      }),
      merge: (persistedState, currentState) => {
        const persisted = isRecord(persistedState)
          ? (persistedState as Partial<PersistedDesktopState>)
          : {};
        const windows = sanitizeWindows(persisted.windows);
        const workspaces = sanitizeWorkspaces(persisted.workspaces);
        const resolvedWorkspaces = workspaces.length ? workspaces : INITIAL_WORKSPACES;
        const activeWorkspaceId = resolvedWorkspaces.some(
          (workspace) => workspace.id === persisted.activeWorkspaceId,
        )
          ? String(persisted.activeWorkspaceId)
          : resolvedWorkspaces[0].id;

        return {
          ...currentState,
          windows: (windows ?? currentState.windows).map((window) => ({
            ...window,
            workspaceId: resolvedWorkspaces.some((workspace) => workspace.id === window.workspaceId)
              ? window.workspaceId
              : activeWorkspaceId,
          })),
          zCounter:
            windows === null
              ? currentState.zCounter
              : Math.max(100, ...windows.map((window) => window.zIndex)),
          appearance: isAppearance(persisted.appearance)
            ? persisted.appearance
            : currentState.appearance,
          wallpaper: isWallpaper(persisted.wallpaper)
            ? persisted.wallpaper
            : currentState.wallpaper,
          hasCompletedWelcome:
            typeof persisted.hasCompletedWelcome === 'boolean'
              ? persisted.hasCompletedWelcome
              : currentState.hasCompletedWelcome,
          workspaces: resolvedWorkspaces,
          activeWorkspaceId,
          desktopIconPositions: sanitizeDesktopIconPositions(persisted.desktopIconPositions),
        };
      },
    },
  ),
);

function createWindowId(appId: string): string {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${appId}-${suffix}`;
}

function readViewport(): DesktopViewport {
  if (typeof window === 'undefined') return { width: 1280, height: 760 };
  return {
    width: Math.max(320, window.innerWidth),
    height: Math.max(240, window.innerHeight - 44),
  };
}

function sanitizeWindows(value: unknown): WindowInstance[] | null {
  if (!Array.isArray(value)) return null;

  return value.flatMap((candidate) => {
    if (!isRecord(candidate) || !hasApp(candidate.appId)) return [];
    if (!isBounds(candidate.bounds)) return [];
    if (!isWindowState(candidate.state)) return [];
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.zIndex !== 'number'
    ) {
      return [];
    }

    return [
      {
        id: candidate.id,
        appId: candidate.appId,
        workspaceId:
          typeof candidate.workspaceId === 'string' ? candidate.workspaceId : 'space-main',
        title: candidate.title.slice(0, 80),
        bounds: candidate.bounds,
        state: candidate.state,
        zIndex: candidate.zIndex,
        focused: Boolean(candidate.focused),
        resizable: candidate.resizable !== false,
        restoreBounds: isBounds(candidate.restoreBounds) ? candidate.restoreBounds : undefined,
        stateBeforeMinimize: isWindowState(candidate.stateBeforeMinimize)
          ? candidate.stateBeforeMinimize === 'minimized'
            ? undefined
            : candidate.stateBeforeMinimize
          : undefined,
        stateBeforeFullscreen:
          candidate.stateBeforeFullscreen === 'normal' ||
          candidate.stateBeforeFullscreen === 'maximized'
            ? candidate.stateBeforeFullscreen
            : undefined,
        instanceData: candidate.instanceData,
      },
    ];
  });
}

function sanitizeWorkspaces(value: unknown): DesktopWorkspace[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (
      !isRecord(candidate) ||
      typeof candidate.id !== 'string' ||
      typeof candidate.name !== 'string'
    ) {
      return [];
    }
    return [
      {
        id: candidate.id,
        name: candidate.name.trim().slice(0, 24) || 'Space',
        createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : 0,
      },
    ];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBounds(value: unknown): value is WindowBounds {
  return (
    isRecord(value) &&
    ['x', 'y', 'width', 'height'].every(
      (key) => typeof value[key] === 'number' && Number.isFinite(value[key]),
    )
  );
}

function isWindowState(value: unknown): value is WindowVisualState {
  return ['normal', 'minimized', 'maximized', 'fullscreen'].includes(String(value));
}

function isAppearance(value: unknown): value is AppearanceMode {
  return ['system', 'light', 'dark'].includes(String(value));
}

function isWallpaper(value: unknown): value is WallpaperId {
  return ['aurora', 'solstice', 'stillness'].includes(String(value));
}

function sanitizeDesktopIconPositions(value: unknown): Record<string, DesktopIconPosition> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([appId, position]) =>
      hasApp(appId) && isDesktopIconPosition(position) ? [[appId, position]] : [],
    ),
  );
}

function isDesktopIconPosition(value: unknown): value is DesktopIconPosition {
  return (
    isRecord(value) &&
    typeof value.x === 'number' &&
    Number.isFinite(value.x) &&
    typeof value.y === 'number' &&
    Number.isFinite(value.y)
  );
}
