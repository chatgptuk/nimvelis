import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getAppManifest, listAppManifests } from '../kernel/app-registry/registry';
import type { NimvelisSystemApi } from '../kernel/system-api';
import type { DesktopViewport, WindowInstance } from '../kernel/window-manager/types';
import { useDesktopStore, type AppearanceMode } from '../state/desktop-store';
import { DesktopIcons } from './DesktopIcons';
import { Shelf } from './Shelf';
import { SystemWindow } from './SystemWindow';
import { TopBar } from './TopBar';
import './shell.css';

const TOP_BAR_HEIGHT = 44;

export function DesktopShell() {
  const {
    windows,
    appearance,
    wallpaper,
    openApp,
    focusWindow,
    clearFocus,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    toggleFullscreen,
    setWindowTitle,
    updateWindowData,
    setAppearance,
    setWallpaper,
    constrainWindows,
    cycleFocus,
  } = useDesktopStore(
    useShallow((state) => ({
      windows: state.windows,
      appearance: state.appearance,
      wallpaper: state.wallpaper,
      openApp: state.openApp,
      focusWindow: state.focusWindow,
      clearFocus: state.clearFocus,
      closeWindow: state.closeWindow,
      minimizeWindow: state.minimizeWindow,
      restoreWindow: state.restoreWindow,
      toggleMaximize: state.toggleMaximize,
      toggleFullscreen: state.toggleFullscreen,
      setWindowTitle: state.setWindowTitle,
      updateWindowData: state.updateWindowData,
      setAppearance: state.setAppearance,
      setWallpaper: state.setWallpaper,
      constrainWindows: state.constrainWindows,
      cycleFocus: state.cycleFocus,
    })),
  );
  const [viewport, setViewport] = useState<DesktopViewport>(() => readViewport());
  const resolvedAppearance = useResolvedAppearance(appearance);
  const apps = listAppManifests();
  const activeWindow = [...windows]
    .filter((window) => window.focused)
    .sort((a, b) => b.zIndex - a.zIndex)[0];
  const activeManifest = activeWindow ? getAppManifest(activeWindow.appId) : undefined;

  useEffect(() => {
    const handleResize = () => {
      const nextViewport = readViewport();
      setViewport(nextViewport);
      constrainWindows(nextViewport);
    };
    handleResize();
    globalThis.addEventListener('resize', handleResize);
    return () => globalThis.removeEventListener('resize', handleResize);
  }, [constrainWindows]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (event.altKey && event.key === '`' && !isEditing) {
        event.preventDefault();
        cycleFocus();
      }

      if (event.key === 'Escape' && activeWindow?.state === 'fullscreen') {
        event.preventDefault();
        toggleFullscreen(activeWindow.id);
      }
    };

    globalThis.addEventListener('keydown', handleKeyboard);
    return () => globalThis.removeEventListener('keydown', handleKeyboard);
  }, [activeWindow, cycleFocus, toggleFullscreen]);

  const handleShelfLaunch = (appId: string, forceNew: boolean) => {
    const manifest = getAppManifest(appId);
    const appWindows = windows
      .filter((window) => window.appId === appId)
      .sort((a, b) => b.zIndex - a.zIndex);

    if (forceNew && manifest?.allowMultipleInstances) {
      openApp(appId);
      return;
    }

    const target = appWindows[0];
    if (!target) {
      openApp(appId);
    } else if (target.state === 'minimized') {
      restoreWindow(target.id);
    } else {
      focusWindow(target.id);
    }
  };

  return (
    <main
      className={`desktop-shell wallpaper-${wallpaper}`}
      data-appearance={resolvedAppearance}
      data-wallpaper={wallpaper}
    >
      <TopBar
        activeWindow={activeWindow}
        activeManifest={activeManifest}
        onNewWindow={() => activeWindow && openApp(activeWindow.appId)}
        onMinimize={() => activeWindow && minimizeWindow(activeWindow.id)}
        onToggleMaximize={() => activeWindow && toggleMaximize(activeWindow.id)}
        onToggleFullscreen={() => activeWindow && toggleFullscreen(activeWindow.id)}
        onClose={() => activeWindow && closeWindow(activeWindow.id)}
        onOpenSettings={() => openApp('settings')}
      />
      <section
        className="desktop-workspace"
        aria-label="Nimvelis desktop"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) clearFocus();
        }}
      >
        <div className="desktop-atmosphere" aria-hidden="true" />
        <div className="desktop-version" aria-hidden="true">
          <span>AURORA</span>
          <strong>0.1</strong>
        </div>
        <DesktopIcons apps={apps} onOpen={(appId) => openApp(appId)} />
        {windows.map((window) => (
          <WindowHost
            key={window.id}
            window={window}
            viewport={viewport}
            appearance={appearance}
            wallpaper={wallpaper}
            openApp={openApp}
            closeWindow={closeWindow}
            setWindowTitle={setWindowTitle}
            updateWindowData={updateWindowData}
            setAppearance={setAppearance}
            setWallpaper={setWallpaper}
          />
        ))}
      </section>
      <Shelf apps={apps} windows={windows} onLaunch={handleShelfLaunch} />
      <div className="desktop-tagline" aria-hidden="true">
        Your world, anywhere.
      </div>
    </main>
  );
}

interface WindowHostProps {
  window: WindowInstance;
  viewport: DesktopViewport;
  appearance: AppearanceMode;
  wallpaper: 'aurora' | 'solstice' | 'stillness';
  openApp: NimvelisSystemApi['openApp'];
  closeWindow: NimvelisSystemApi['closeWindow'];
  setWindowTitle: NimvelisSystemApi['setWindowTitle'];
  updateWindowData: NimvelisSystemApi['updateWindowData'];
  setAppearance: NimvelisSystemApi['setAppearance'];
  setWallpaper: NimvelisSystemApi['setWallpaper'];
}

function WindowHost({
  window,
  viewport,
  appearance,
  wallpaper,
  openApp,
  closeWindow,
  setWindowTitle,
  updateWindowData,
  setAppearance,
  setWallpaper,
}: WindowHostProps) {
  const system = useMemo<NimvelisSystemApi>(
    () => ({
      appearance,
      wallpaper,
      openApp,
      closeWindow,
      setWindowTitle,
      updateWindowData,
      setAppearance,
      setWallpaper,
    }),
    [
      appearance,
      closeWindow,
      openApp,
      setAppearance,
      setWallpaper,
      setWindowTitle,
      updateWindowData,
      wallpaper,
    ],
  );

  return <SystemWindow window={window} viewport={viewport} system={system} />;
}

function readViewport(): DesktopViewport {
  if (typeof window === 'undefined') return { width: 1280, height: 760 };
  return {
    width: Math.max(320, window.innerWidth),
    height: Math.max(240, window.innerHeight - TOP_BAR_HEIGHT),
  };
}

function useResolvedAppearance(appearance: AppearanceMode): 'light' | 'dark' {
  const [systemAppearance, setSystemAppearance] = useState<'light' | 'dark'>(() =>
    globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );

  useEffect(() => {
    const query = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;
    const update = (event: MediaQueryListEvent) =>
      setSystemAppearance(event.matches ? 'dark' : 'light');
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return appearance === 'system' ? systemAppearance : appearance;
}
