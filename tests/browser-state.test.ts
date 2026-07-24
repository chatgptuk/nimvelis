import { describe, expect, it } from 'vitest';
import {
  BROWSER_HOME_URL,
  addBrowserHistory,
  moveBrowserNavigation,
  normalizeBrowserInput,
  pushBrowserNavigation,
  readBrowserNavigationState,
  toggleBrowserBookmark,
} from '../src/apps/browser/browser-state';

describe('browser state', () => {
  it('normalizes domains and searches while rejecting unsafe schemes', () => {
    expect(normalizeBrowserInput('example.com/docs')).toBe('https://example.com/docs');
    expect(normalizeBrowserInput('localhost:4173/health')).toBe('http://localhost:4173/health');
    expect(normalizeBrowserInput('cloudflare workers')).toBe(
      'https://duckduckgo.com/?q=cloudflare%20workers',
    );
    expect(normalizeBrowserInput('javascript:alert(1)')).toBeNull();
    expect(normalizeBrowserInput('data:text/html,hello')).toBeNull();
    expect(normalizeBrowserInput('https://user:secret@example.com')).toBeNull();
  });

  it('sanitizes persisted window navigation and clamps its index', () => {
    expect(
      readBrowserNavigationState({
        entries: [BROWSER_HOME_URL, 'javascript:alert(1)', 'https://example.com/'],
        index: 99,
        privateMode: true,
      }),
    ).toEqual({
      entries: [BROWSER_HOME_URL, 'https://example.com/'],
      index: 1,
      privateMode: true,
    });
  });

  it('maintains forward and back navigation without retaining abandoned entries', () => {
    let state = readBrowserNavigationState(null);
    state = pushBrowserNavigation(state, 'https://example.com/');
    state = pushBrowserNavigation(state, 'https://developer.mozilla.org/');
    state = moveBrowserNavigation(state, -1);
    state = pushBrowserNavigation(state, 'https://developers.cloudflare.com/');

    expect(state.entries).toEqual([
      BROWSER_HOME_URL,
      'https://example.com/',
      'https://developers.cloudflare.com/',
    ]);
    expect(state.index).toBe(2);
  });

  it('deduplicates local history and toggles bookmarks', () => {
    const firstHistory = addBrowserHistory([], 'https://example.com/', 10);
    const history = addBrowserHistory(firstHistory, 'https://example.com/', 20);
    expect(history).toEqual([{ url: 'https://example.com/', visitedAt: 20 }]);

    const saved = toggleBrowserBookmark([], 'https://example.com/', 30);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      url: 'https://example.com/',
      label: 'example.com',
      addedAt: 30,
    });
    expect(toggleBrowserBookmark(saved, 'https://example.com/', 40)).toEqual([]);
  });
});
