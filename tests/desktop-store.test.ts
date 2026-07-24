import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_DESKTOP_PREFERENCES, useDesktopStore } from '../src/state/desktop-store';

describe('desktop store', () => {
  beforeEach(() => {
    localStorage.clear();
    useDesktopStore.setState({
      windows: [],
      zCounter: 100,
      appearance: 'system',
      wallpaper: 'aurora',
      hasCompletedWelcome: true,
      workspaces: [{ id: 'space-main', name: 'Main', createdAt: 0 }],
      activeWorkspaceId: 'space-main',
      desktopIconPositions: {},
      preferences: DEFAULT_DESKTOP_PREFERENCES,
    });
  });

  it('supports multiple instances for apps that allow them', () => {
    useDesktopStore.getState().openApp('memo');
    useDesktopStore.getState().openApp('memo');

    const memoWindows = useDesktopStore
      .getState()
      .windows.filter((window) => window.appId === 'memo');
    expect(memoWindows).toHaveLength(2);
    expect(new Set(memoWindows.map((window) => window.id)).size).toBe(2);
  });

  it('focuses an existing single-instance app', () => {
    const firstId = useDesktopStore.getState().openApp('settings');
    const secondId = useDesktopStore.getState().openApp('settings');

    expect(secondId).toBe(firstId);
    expect(useDesktopStore.getState().windows).toHaveLength(1);
    expect(useDesktopStore.getState().windows[0]?.focused).toBe(true);
  });

  it('restores the previous visual state after minimizing', () => {
    const id = useDesktopStore.getState().openApp('calculator');
    expect(id).not.toBeNull();
    if (!id) return;

    useDesktopStore.getState().toggleMaximize(id);
    useDesktopStore.getState().minimizeWindow(id);
    expect(useDesktopStore.getState().windows[0]?.state).toBe('minimized');

    useDesktopStore.getState().restoreWindow(id);
    expect(useDesktopStore.getState().windows[0]?.state).toBe('maximized');
  });

  it('returns from full screen to the previous maximized state', () => {
    const id = useDesktopStore.getState().openApp('memo');
    if (!id) throw new Error('Expected Memo to open');

    useDesktopStore.getState().toggleMaximize(id);
    useDesktopStore.getState().toggleFullscreen(id);
    expect(useDesktopStore.getState().windows[0]?.state).toBe('fullscreen');

    useDesktopStore.getState().toggleFullscreen(id);
    expect(useDesktopStore.getState().windows[0]?.state).toBe('maximized');

    useDesktopStore.getState().toggleMaximize(id);
    expect(useDesktopStore.getState().windows[0]?.state).toBe('normal');
  });

  it('closes a focused window and focuses the next highest window', () => {
    const firstId = useDesktopStore.getState().openApp('calculator');
    const secondId = useDesktopStore.getState().openApp('memo');
    if (!firstId || !secondId) throw new Error('Expected windows to open');

    useDesktopStore.getState().closeWindow(secondId);

    expect(useDesktopStore.getState().windows).toHaveLength(1);
    expect(useDesktopStore.getState().windows[0]).toMatchObject({
      id: firstId,
      focused: true,
    });
  });

  it('keeps windows isolated across named workspaces', () => {
    const mainWindowId = useDesktopStore.getState().openApp('memo');
    const secondSpaceId = useDesktopStore.getState().createWorkspace();
    const secondWindowId = useDesktopStore.getState().openApp('text');
    if (!mainWindowId || !secondWindowId) throw new Error('Expected windows to open');

    expect(useDesktopStore.getState().activeWorkspaceId).toBe(secondSpaceId);
    expect(
      useDesktopStore.getState().windows.find((window) => window.id === secondWindowId)
        ?.workspaceId,
    ).toBe(secondSpaceId);

    useDesktopStore.getState().switchWorkspace('space-main');
    expect(useDesktopStore.getState().windows.find((window) => window.focused)?.id).toBe(
      mainWindowId,
    );

    useDesktopStore.getState().moveWindowToWorkspace(mainWindowId, secondSpaceId);
    expect(
      useDesktopStore.getState().windows.find((window) => window.id === mainWindowId)?.workspaceId,
    ).toBe(secondSpaceId);
  });

  it('snaps a window to a desktop half', () => {
    const id = useDesktopStore.getState().openApp('memo');
    if (!id) throw new Error('Expected Memo to open');

    useDesktopStore.getState().snapWindow(id, 'left');
    const window = useDesktopStore.getState().windows.find((candidate) => candidate.id === id);
    expect(window?.state).toBe('normal');
    expect(window?.bounds.x).toBe(8);
    expect(window?.bounds.width).toBeGreaterThan(280);
  });

  it('persists and resets custom desktop icon positions', () => {
    useDesktopStore.getState().setDesktopIconPosition('vela', { x: 142, y: 96 });
    expect(useDesktopStore.getState().desktopIconPositions.vela).toEqual({ x: 142, y: 96 });

    useDesktopStore.getState().resetDesktopIconPositions();
    expect(useDesktopStore.getState().desktopIconPositions).toEqual({});
  });

  it('updates and resets system preferences', () => {
    useDesktopStore.getState().updatePreferences({
      interfaceDensity: 'compact',
      showSeconds: true,
      textScale: 'large',
      timeZone: 'Asia/Tokyo',
      weekStartsOn: 'monday',
    });

    expect(useDesktopStore.getState().preferences).toMatchObject({
      interfaceDensity: 'compact',
      showSeconds: true,
      textScale: 'large',
      timeZone: 'Asia/Tokyo',
      weekStartsOn: 'monday',
    });

    useDesktopStore.getState().resetPreferences();
    expect(useDesktopStore.getState().preferences).toEqual(DEFAULT_DESKTOP_PREFERENCES);
  });
});
