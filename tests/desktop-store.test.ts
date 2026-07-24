import { beforeEach, describe, expect, it } from 'vitest';
import { useDesktopStore } from '../src/state/desktop-store';

describe('desktop store', () => {
  beforeEach(() => {
    localStorage.clear();
    useDesktopStore.setState({
      windows: [],
      zCounter: 100,
      appearance: 'system',
      wallpaper: 'aurora',
      hasCompletedWelcome: true,
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
});
