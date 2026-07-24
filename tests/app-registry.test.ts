import { describe, expect, it } from 'vitest';
import { getAppManifest, listAppManifests } from '../src/kernel/app-registry/registry';

describe('app registry', () => {
  it('registers the three Aurora system apps with unique identifiers', () => {
    const manifests = listAppManifests();

    expect(manifests.map((manifest) => manifest.id)).toEqual(['calculator', 'memo', 'settings']);
    expect(new Set(manifests.map((manifest) => manifest.id)).size).toBe(manifests.length);
  });

  it('declares Settings as single-instance', () => {
    expect(getAppManifest('settings')?.allowMultipleInstances).toBe(false);
  });
});
