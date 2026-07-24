import { describe, expect, it } from 'vitest';
import {
  addShelfAppId,
  normalizeShelfAppIds,
  removeShelfAppId,
  reorderShelfAppIds,
} from '../src/kernel/shelf/order';

describe('shelf order', () => {
  it('normalizes persisted app ids without duplicates or unknown entries', () => {
    expect(
      normalizeShelfAppIds(['vela', 'files', 'vela', 'unknown'], ['files', 'vela', 'settings']),
    ).toEqual(['vela', 'files']);
  });

  it('allows an intentionally empty shelf', () => {
    expect(normalizeShelfAppIds([], ['files', 'vela'])).toEqual([]);
  });

  it('reorders an app around a target without changing membership', () => {
    expect(reorderShelfAppIds(['files', 'vela', 'settings'], 'settings', 'files')).toEqual([
      'settings',
      'files',
      'vela',
    ]);
  });

  it('removes and restores shelf apps safely', () => {
    const withoutVela = removeShelfAppId(['files', 'vela'], 'vela');
    expect(withoutVela).toEqual(['files']);
    expect(addShelfAppId(withoutVela, 'vela', ['files', 'vela'])).toEqual(['files', 'vela']);
    expect(addShelfAppId(withoutVela, 'unknown', ['files', 'vela'])).toEqual(['files']);
  });
});
