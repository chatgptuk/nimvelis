import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getAppManifest, listAppManifests } from '../kernel/app-registry/registry';
import type { NimvelisSystemApi } from '../kernel/system-api';
import { isTextMimeType, localFileSystem, type VfsNode } from '../kernel/vfs';
import type { DesktopViewport, WindowInstance } from '../kernel/window-manager/types';
import {
  useDesktopStore,
  type AppearanceMode,
  type DesktopPreferences,
} from '../state/desktop-store';
import { startDesktopSync, startProductivitySync, startSystemSync } from '../state/desktop-sync';
import { useSystemStore } from '../state/system-store';
import { AboutDevice } from './AboutDevice';
import { DesktopOverview } from './DesktopOverview';
import { DesktopIcons } from './DesktopIcons';
import { NotificationCenter } from './NotificationCenter';
import { Shelf } from './Shelf';
import { SystemSearch } from './SystemSearch';
import type { SystemCommand } from './SystemSearch';
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
    workspaces,
    activeWorkspaceId,
    createWorkspace,
    switchWorkspace,
    renameWorkspace,
    removeWorkspace,
    moveWindowToWorkspace,
    snapWindow,
    closeAppWindows,
    minimizeAppWindows,
    desktopIconPositions,
    setDesktopIconPosition,
    resetDesktopIconPositions,
    preferences,
    updatePreferences,
    resetPreferences,
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
      workspaces: state.workspaces,
      activeWorkspaceId: state.activeWorkspaceId,
      createWorkspace: state.createWorkspace,
      switchWorkspace: state.switchWorkspace,
      renameWorkspace: state.renameWorkspace,
      removeWorkspace: state.removeWorkspace,
      moveWindowToWorkspace: state.moveWindowToWorkspace,
      snapWindow: state.snapWindow,
      closeAppWindows: state.closeAppWindows,
      minimizeAppWindows: state.minimizeAppWindows,
      desktopIconPositions: state.desktopIconPositions,
      setDesktopIconPosition: state.setDesktopIconPosition,
      resetDesktopIconPositions: state.resetDesktopIconPositions,
      preferences: state.preferences,
      updatePreferences: state.updatePreferences,
      resetPreferences: state.resetPreferences,
    })),
  );
  const {
    notificationHistory,
    addNotification,
    markAllRead,
    removeNotification,
    clearNotifications,
  } = useSystemStore(
    useShallow((state) => ({
      notificationHistory: state.notifications,
      addNotification: state.addNotification,
      markAllRead: state.markAllRead,
      removeNotification: state.removeNotification,
      clearNotifications: state.clearNotifications,
    })),
  );
  const [viewport, setViewport] = useState<DesktopViewport>(() => readViewport());
  const [aboutOpen, setAboutOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [overviewAppFilter, setOverviewAppFilter] = useState<string | null>(null);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; tone: 'neutral' | 'success' | 'error' }>
  >([]);
  const resolvedAppearance = useResolvedAppearance(appearance);
  const apps = listAppManifests();
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];
  const workspaceWindows = windows.filter((window) => window.workspaceId === activeWorkspaceId);
  const activeWindow = [...workspaceWindows]
    .filter((window) => window.focused)
    .sort((a, b) => b.zIndex - a.zIndex)[0];
  const activeManifest = activeWindow ? getAppManifest(activeWindow.appId) : undefined;
  const searchCommands = useMemo<SystemCommand[]>(
    () => [
      {
        id: 'new-task',
        title: 'Add a task',
        description: 'Open your local task list',
        keywords: 'todo reminder productivity plan',
        icon: 'tasks',
        run: () => {
          openApp('tasks');
        },
      },
      {
        id: 'open-calendar',
        title: 'Open calendar',
        description: 'Plan events and see task due dates',
        keywords: 'date schedule agenda event',
        icon: 'calendar',
        run: () => {
          openApp('calendar');
        },
      },
      {
        id: 'focus-timer',
        title: 'Start a focus timer',
        description: 'Open Clock for a focused work session',
        keywords: 'clock countdown pomodoro stopwatch focus',
        icon: 'clock',
        run: () => {
          openApp('clock');
        },
      },
      {
        id: 'open-connections',
        title: 'Open connections',
        description: 'Inspect network and Bluetooth availability',
        keywords: 'wifi bluetooth network internet connection',
        icon: 'connections',
        run: () => {
          openApp('connections');
        },
      },
      {
        id: 'ask-vela',
        title: 'Ask Vela',
        description: 'Open the Workers AI text assistant',
        keywords: 'ai assistant chat write explain brainstorm',
        icon: 'vela',
        run: () => {
          openApp('vela');
        },
      },
      {
        id: 'new-text',
        title: 'New text document',
        description: 'Start a locally saved note',
        keywords: 'create file note write',
        icon: 'text',
        run: () => {
          openApp('text');
        },
      },
      {
        id: 'overview',
        title: 'Open Nimvelis Overview',
        description: 'See windows and switch spaces',
        keywords: 'task view windows workspace space',
        icon: 'window',
        run: () => {
          setOverviewAppFilter(null);
          setOverviewOpen(true);
        },
      },
      {
        id: 'appearance',
        title: 'Change appearance',
        description: 'Open wallpaper and theme settings',
        keywords: 'dark light theme wallpaper settings',
        icon: 'sparkle',
        run: () => {
          openApp('settings');
        },
      },
      {
        id: 'recent-files',
        title: 'Show recent files',
        description: 'Open Files in the recent view',
        keywords: 'recent documents files',
        icon: 'files',
        run: () => {
          openApp('files', { instanceData: { view: 'recent' } });
        },
      },
      {
        id: 'device-space',
        title: 'Open device space',
        description: 'Notifications, storage, install, and updates',
        keywords: 'notification center quick settings pwa install update offline',
        icon: 'system',
        run: () => setNotificationCenterOpen(true),
      },
      {
        id: 'reset-desktop-icons',
        title: 'Reset desktop icon layout',
        description: 'Return every app icon to its default place',
        keywords: 'arrange clean restore move icons desktop',
        icon: 'window',
        run: () => {
          resetDesktopIconPositions();
          addNotification('Desktop icon layout reset', 'success');
        },
      },
      {
        id: 'empty-trash',
        title: 'Empty Trash…',
        description: 'Permanently remove all trashed items',
        keywords: 'delete files clean bin',
        icon: 'trash',
        run: async () => {
          if (!globalThis.confirm('Permanently delete every item in Trash?')) return;
          await localFileSystem.emptyTrash();
          addNotification('Trash emptied', 'success');
        },
      },
    ],
    [addNotification, openApp, resetDesktopIconPositions],
  );
  const openFile = useCallback(
    (node: VfsNode) => {
      void localFileSystem.touch(node.id);
      if (node.kind === 'directory') {
        return openApp('files', { instanceData: { folderId: node.id } });
      }
      const previewable =
        node.mimeType.startsWith('image/') ||
        node.mimeType.startsWith('audio/') ||
        node.mimeType.startsWith('video/') ||
        node.mimeType === 'application/pdf';
      return openApp(!previewable && isTextMimeType(node.mimeType) ? 'text' : 'view', {
        instanceData: { fileId: node.id },
      });
    },
    [openApp],
  );
  const notify = useCallback(
    (message: string, tone: 'neutral' | 'success' | 'error' = 'neutral') => {
      const id = addNotification(message, tone);
      setToasts((items) => [...items.slice(-2), { id, message, tone }]);
      globalThis.setTimeout(() => {
        setToasts((items) => items.filter((item) => item.id !== id));
      }, 3200);
    },
    [addNotification],
  );

  useEffect(() => {
    const stopDesktopSync = startDesktopSync();
    const stopSystemSync = startSystemSync();
    const stopProductivitySync = startProductivitySync();
    return () => {
      stopDesktopSync();
      stopSystemSync();
      stopProductivitySync();
    };
  }, []);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    globalThis.addEventListener('online', updateOnline);
    globalThis.addEventListener('offline', updateOnline);
    return () => {
      globalThis.removeEventListener('online', updateOnline);
      globalThis.removeEventListener('offline', updateOnline);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.textScale = preferences.textScale;
    return () => {
      delete document.documentElement.dataset.textScale;
    };
  }, [preferences.textScale]);

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

      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === 'Escape' && searchOpen) {
        event.preventDefault();
        setSearchOpen(false);
        return;
      }

      if (event.key === 'Escape' && overviewOpen) {
        event.preventDefault();
        setOverviewOpen(false);
        setOverviewAppFilter(null);
        return;
      }

      if (event.key === 'Escape' && notificationCenterOpen) {
        event.preventDefault();
        setNotificationCenterOpen(false);
        return;
      }

      if (event.key === 'Escape' && aboutOpen) {
        event.preventDefault();
        setAboutOpen(false);
        return;
      }

      if (event.key === 'Escape' && activeWindow?.state === 'fullscreen') {
        event.preventDefault();
        toggleFullscreen(activeWindow.id);
      }
    };

    globalThis.addEventListener('keydown', handleKeyboard);
    return () => globalThis.removeEventListener('keydown', handleKeyboard);
  }, [
    aboutOpen,
    activeWindow,
    cycleFocus,
    notificationCenterOpen,
    overviewOpen,
    searchOpen,
    toggleFullscreen,
  ]);

  const handleShelfLaunch = (appId: string, forceNew: boolean) => {
    const manifest = getAppManifest(appId);
    const appWindows = workspaceWindows
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
      data-density={preferences.interfaceDensity}
      data-high-contrast={preferences.highContrast}
      data-reduce-motion={preferences.reduceMotion}
      data-text-scale={preferences.textScale}
    >
      <TopBar
        activeWindow={activeWindow}
        activeManifest={activeManifest}
        onNewWindow={() => activeWindow && openApp(activeWindow.appId)}
        onMinimize={() => activeWindow && minimizeWindow(activeWindow.id)}
        onToggleMaximize={() => activeWindow && toggleMaximize(activeWindow.id)}
        onToggleFullscreen={() => activeWindow && toggleFullscreen(activeWindow.id)}
        onClose={() => activeWindow && closeWindow(activeWindow.id)}
        onOpenAbout={() => setAboutOpen(true)}
        onOpenSettings={() => openApp('settings')}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenNotifications={() => setNotificationCenterOpen((open) => !open)}
        onOpenOverview={() => {
          setOverviewAppFilter(null);
          setOverviewOpen(true);
        }}
        onSnapLeft={() => activeWindow && snapWindow(activeWindow.id, 'left')}
        onSnapRight={() => activeWindow && snapWindow(activeWindow.id, 'right')}
        onResetDesktopIcons={() => {
          resetDesktopIconPositions();
          addNotification('Desktop icon layout reset', 'success');
        }}
        activeWorkspaceName={activeWorkspace?.name ?? 'Main'}
        unreadNotifications={
          notificationHistory.filter((notification) => !notification.read).length
        }
        clockFormat={preferences.clockFormat}
        showDate={preferences.showDate}
        showSeconds={preferences.showSeconds}
        timeZone={preferences.timeZone}
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
          <strong>0.6</strong>
        </div>
        {preferences.showDesktopIcons ? (
          <DesktopIcons
            apps={apps}
            viewport={viewport}
            positions={desktopIconPositions}
            onMove={setDesktopIconPosition}
            onOpen={(appId) => openApp(appId)}
          />
        ) : null}
        {workspaceWindows.map((window) => (
          <WindowHost
            key={window.id}
            window={window}
            viewport={viewport}
            appearance={appearance}
            wallpaper={wallpaper}
            preferences={preferences}
            openApp={openApp}
            closeWindow={closeWindow}
            setWindowTitle={setWindowTitle}
            updateWindowData={updateWindowData}
            setAppearance={setAppearance}
            setWallpaper={setWallpaper}
            updatePreferences={updatePreferences}
            resetPreferences={resetPreferences}
            resetDesktopIconPositions={resetDesktopIconPositions}
            openFile={openFile}
            notify={notify}
          />
        ))}
      </section>
      <Shelf
        apps={apps}
        windows={workspaceWindows}
        onLaunch={handleShelfLaunch}
        onOpenOverview={(appFilter) => {
          setOverviewAppFilter(appFilter ?? null);
          setOverviewOpen(true);
        }}
        onMinimizeAll={minimizeAppWindows}
        onCloseAll={closeAppWindows}
      />
      <div className="desktop-tagline" aria-hidden="true">
        Your world, anywhere.
      </div>
      {searchOpen ? (
        <SystemSearch
          apps={apps}
          files={localFileSystem}
          commands={searchCommands}
          onClose={() => setSearchOpen(false)}
          onOpenApp={(appId) => openApp(appId)}
          onOpenFile={openFile}
        />
      ) : null}
      {aboutOpen ? (
        <AboutDevice
          appearance={resolvedAppearance}
          openWindowCount={windows.filter((window) => window.state !== 'minimized').length}
          wallpaper={wallpaper}
          onClose={() => setAboutOpen(false)}
          onOpenSettings={() => openApp('settings')}
        />
      ) : null}
      {overviewOpen ? (
        <DesktopOverview
          apps={apps}
          windows={windows}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          files={localFileSystem}
          appFilter={overviewAppFilter}
          onClose={() => {
            setOverviewOpen(false);
            setOverviewAppFilter(null);
          }}
          onCreateWorkspace={() => {
            createWorkspace();
            setOverviewAppFilter(null);
          }}
          onSwitchWorkspace={(workspaceId) => {
            switchWorkspace(workspaceId);
            setOverviewAppFilter(null);
          }}
          onRenameWorkspace={renameWorkspace}
          onRemoveWorkspace={removeWorkspace}
          onOpenApp={(appId) => openApp(appId)}
          onOpenFile={openFile}
          onFocusWindow={focusWindow}
          onCloseWindow={closeWindow}
          onSnapWindow={snapWindow}
          onMoveWindow={moveWindowToWorkspace}
        />
      ) : null}
      {notificationCenterOpen ? (
        <NotificationCenter
          appearance={appearance}
          notifications={notificationHistory}
          online={online}
          onClose={() => setNotificationCenterOpen(false)}
          onSetAppearance={setAppearance}
          onMarkAllRead={markAllRead}
          onClear={clearNotifications}
          onRemove={removeNotification}
          onOpenSettings={() => {
            openApp('settings');
            setNotificationCenterOpen(false);
          }}
        />
      ) : null}
      <div className="notification-stack" aria-live="polite">
        {toasts.map((notification) => (
          <div
            className={`system-notification system-notification--${notification.tone}`}
            key={notification.id}
          >
            <span className="status-dot" />
            {notification.message}
          </div>
        ))}
      </div>
    </main>
  );
}

interface WindowHostProps {
  window: WindowInstance;
  viewport: DesktopViewport;
  appearance: AppearanceMode;
  wallpaper: 'aurora' | 'solstice' | 'stillness';
  preferences: DesktopPreferences;
  openApp: NimvelisSystemApi['openApp'];
  closeWindow: NimvelisSystemApi['closeWindow'];
  setWindowTitle: NimvelisSystemApi['setWindowTitle'];
  updateWindowData: NimvelisSystemApi['updateWindowData'];
  setAppearance: NimvelisSystemApi['setAppearance'];
  setWallpaper: NimvelisSystemApi['setWallpaper'];
  updatePreferences: NimvelisSystemApi['updatePreferences'];
  resetPreferences: NimvelisSystemApi['resetPreferences'];
  resetDesktopIconPositions: NimvelisSystemApi['resetDesktopIconPositions'];
  openFile: NimvelisSystemApi['openFile'];
  notify: NimvelisSystemApi['notify'];
}

function WindowHost({
  window,
  viewport,
  appearance,
  wallpaper,
  preferences,
  openApp,
  closeWindow,
  setWindowTitle,
  updateWindowData,
  setAppearance,
  setWallpaper,
  updatePreferences,
  resetPreferences,
  resetDesktopIconPositions,
  openFile,
  notify,
}: WindowHostProps) {
  const system = useMemo<NimvelisSystemApi>(
    () => ({
      appearance,
      wallpaper,
      preferences,
      files: localFileSystem,
      openApp,
      openFile,
      notify,
      closeWindow,
      setWindowTitle,
      updateWindowData,
      setAppearance,
      setWallpaper,
      updatePreferences,
      resetPreferences,
      resetDesktopIconPositions,
    }),
    [
      appearance,
      closeWindow,
      openApp,
      openFile,
      preferences,
      resetDesktopIconPositions,
      resetPreferences,
      notify,
      setAppearance,
      setWallpaper,
      setWindowTitle,
      updatePreferences,
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
