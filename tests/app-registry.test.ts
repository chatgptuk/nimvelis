import { describe, expect, it } from 'vitest';
import { getAppManifest, listAppManifests } from '../src/kernel/app-registry/registry';

describe('app registry', () => {
  it('registers the Aurora system apps with unique identifiers', () => {
    const manifests = listAppManifests();

    expect(manifests.map((manifest) => manifest.id)).toEqual([
      'files',
      'text',
      'view',
      'calculator',
      'memo',
      'vela',
      'settings',
    ]);
    expect(new Set(manifests.map((manifest) => manifest.id)).size).toBe(manifests.length);
  });

  it('declares Settings as single-instance', () => {
    expect(getAppManifest('settings')?.allowMultipleInstances).toBe(false);
  });

  it('declares Vela as a single-instance Workers AI app', () => {
    expect(getAppManifest('vela')).toMatchObject({
      name: 'Vela',
      permissions: ['ai:generate'],
      allowMultipleInstances: false,
    });
  });
});
