import { describe, expect, it } from 'vitest';
import { getAppManifest, listAppManifests } from '../src/kernel/app-registry/registry';

describe('app registry', () => {
  it('registers the Aurora system apps with unique identifiers', () => {
    const manifests = listAppManifests();

    expect(manifests.map((manifest) => manifest.id)).toEqual([
      'files',
      'text',
      'view',
      'tasks',
      'calendar',
      'clock',
      'connections',
      'terminal',
      'calculator',
      'luma',
      'memo',
      'vela',
      'settings',
    ]);
    expect(new Set(manifests.map((manifest) => manifest.id)).size).toBe(manifests.length);
  });

  it('declares Settings as single-instance', () => {
    expect(getAppManifest('settings')?.allowMultipleInstances).toBe(false);
  });

  it('registers the local productivity suite as single-instance apps', () => {
    for (const appId of ['tasks', 'calendar', 'clock', 'connections']) {
      expect(getAppManifest(appId)?.allowMultipleInstances).toBe(false);
    }
  });

  it('declares Vela as a single-instance Workers AI app', () => {
    expect(getAppManifest('vela')).toMatchObject({
      name: 'Vela',
      permissions: ['ai:generate'],
      allowMultipleInstances: false,
    });
  });

  it('grants Memo access to its real local files', () => {
    expect(getAppManifest('memo')).toMatchObject({
      permissions: ['files:read', 'files:write', 'window:open', 'window:write'],
      allowMultipleInstances: true,
    });
  });

  it('registers Terminal as a multi-instance local shell', () => {
    expect(getAppManifest('terminal')).toMatchObject({
      name: 'Terminal',
      permissions: ['files:read', 'files:write', 'window:open', 'window:write'],
      allowMultipleInstances: true,
    });
  });

  it('registers Luma as a single-instance built-in game', () => {
    expect(getAppManifest('luma')).toMatchObject({
      name: 'Luma',
      allowMultipleInstances: false,
    });
  });
});
