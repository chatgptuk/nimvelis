import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LOCAL_SESSION, useSystemStore } from '../src/state/system-store';

describe('system store', () => {
  beforeEach(() => {
    localStorage.clear();
    useSystemStore.setState({
      notifications: [],
      session: DEFAULT_LOCAL_SESSION,
    });
  });

  it('locks and resumes the local session without discarding desktop state', () => {
    useSystemStore.getState().lockSession();
    expect(useSystemStore.getState().session.locked).toBe(true);

    useSystemStore.getState().unlockSession();
    expect(useSystemStore.getState().session.locked).toBe(false);
    expect(useSystemStore.getState().session.lastUnlockedAt).toBeGreaterThan(0);
  });

  it('sanitizes profile and interface control values', () => {
    useSystemStore.getState().setProfileName(`  ${'A'.repeat(40)}  `);
    useSystemStore.getState().setInterfaceBrightness(0.1);
    useSystemStore.getState().setFocusMode(true);
    useSystemStore.getState().setQuietMedia(true);

    expect(useSystemStore.getState().session).toMatchObject({
      profileName: 'A'.repeat(32),
      interfaceBrightness: 0.45,
      focusMode: true,
      quietMedia: true,
    });
  });
});
