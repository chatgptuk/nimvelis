export const BROWSER_HOME_URL = 'nimvelis://start';
export const BROWSER_BOOKMARKS_KEY = 'nimvelis-browser-bookmarks-v1';
export const BROWSER_HISTORY_KEY = 'nimvelis-browser-history-v1';

const MAX_ADDRESS_LENGTH = 2_048;
const MAX_WINDOW_ENTRIES = 50;
const MAX_HISTORY_ENTRIES = 100;
const MAX_BOOKMARKS = 50;

export interface BrowserNavigationState {
  entries: string[];
  index: number;
  privateMode: boolean;
}

export interface BrowserBookmark {
  id: string;
  url: string;
  label: string;
  addedAt: number;
}

export interface BrowserHistoryEntry {
  url: string;
  visitedAt: number;
}

export function normalizeBrowserInput(input: string): string | null {
  const value = input.trim();
  if (!value || value === BROWSER_HOME_URL) return BROWSER_HOME_URL;
  if (value.length > MAX_ADDRESS_LENGTH) return null;

  const localhostLike =
    /^(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|\[[\da-f:]+\])(?::\d+)?(?:[/?#]|$)/i.test(value);
  const looksLikeHost =
    localhostLike ||
    /^(?:[\p{L}\d](?:[\p{L}\d-]{0,61}[\p{L}\d])?\.)+[\p{L}]{2,}(?::\d+)?(?:[/?#]|$)/iu.test(value);

  if (localhostLike) return normalizeWebUrl(`http://${value}`);
  if (looksLikeHost && !/^[a-z][a-z\d+.-]*:/i.test(value)) {
    return normalizeWebUrl(`https://${value}`);
  }

  if (/^https?:\/\//i.test(value)) return normalizeWebUrl(value);
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return null;

  return `https://duckduckgo.com/?q=${encodeURIComponent(value)}`;
}

export function readBrowserNavigationState(value: unknown): BrowserNavigationState {
  const record = asRecord(value);
  const rawEntries = Array.isArray(record.entries) ? record.entries : [];
  const entries = rawEntries
    .flatMap((candidate) =>
      typeof candidate === 'string' && isSafeBrowserUrl(candidate) ? [candidate] : [],
    )
    .slice(-MAX_WINDOW_ENTRIES);

  if (!entries.length) {
    return {
      entries: [BROWSER_HOME_URL],
      index: 0,
      privateMode: record.privateMode === true,
    };
  }

  const rawIndex =
    typeof record.index === 'number' && Number.isInteger(record.index)
      ? record.index
      : entries.length - 1;

  return {
    entries,
    index: Math.max(0, Math.min(rawIndex, entries.length - 1)),
    privateMode: record.privateMode === true,
  };
}

export function pushBrowserNavigation(
  state: BrowserNavigationState,
  url: string,
): BrowserNavigationState {
  if (!isSafeBrowserUrl(url)) return state;
  if (state.entries[state.index] === url) return state;

  const entries = [...state.entries.slice(0, state.index + 1), url].slice(-MAX_WINDOW_ENTRIES);
  return {
    ...state,
    entries,
    index: entries.length - 1,
  };
}

export function moveBrowserNavigation(
  state: BrowserNavigationState,
  offset: -1 | 1,
): BrowserNavigationState {
  return {
    ...state,
    index: Math.max(0, Math.min(state.index + offset, state.entries.length - 1)),
  };
}

export function readBrowserBookmarks(storage: Pick<Storage, 'getItem'>): BrowserBookmark[] {
  const parsed = readStoredArray(storage, BROWSER_BOOKMARKS_KEY);
  return parsed
    .flatMap((candidate): BrowserBookmark[] => {
      const record = asRecord(candidate);
      if (
        typeof record.id !== 'string' ||
        typeof record.url !== 'string' ||
        !isWebUrl(record.url) ||
        typeof record.label !== 'string' ||
        typeof record.addedAt !== 'number'
      ) {
        return [];
      }
      return [
        {
          id: record.id.slice(0, 80),
          url: record.url,
          label: record.label.slice(0, 120),
          addedAt: record.addedAt,
        },
      ];
    })
    .slice(-MAX_BOOKMARKS);
}

export function writeBrowserBookmarks(
  storage: Pick<Storage, 'setItem'>,
  bookmarks: BrowserBookmark[],
) {
  storage.setItem(BROWSER_BOOKMARKS_KEY, JSON.stringify(bookmarks.slice(-MAX_BOOKMARKS)));
}

export function toggleBrowserBookmark(
  bookmarks: BrowserBookmark[],
  url: string,
  now = Date.now(),
): BrowserBookmark[] {
  if (!isWebUrl(url)) return bookmarks;
  if (bookmarks.some((bookmark) => bookmark.url === url)) {
    return bookmarks.filter((bookmark) => bookmark.url !== url);
  }

  return [
    ...bookmarks,
    {
      id: `bookmark-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      label: getBrowserPageLabel(url),
      addedAt: now,
    },
  ].slice(-MAX_BOOKMARKS);
}

export function readBrowserHistory(storage: Pick<Storage, 'getItem'>): BrowserHistoryEntry[] {
  const parsed = readStoredArray(storage, BROWSER_HISTORY_KEY);
  return parsed
    .flatMap((candidate): BrowserHistoryEntry[] => {
      const record = asRecord(candidate);
      if (
        typeof record.url !== 'string' ||
        !isWebUrl(record.url) ||
        typeof record.visitedAt !== 'number'
      ) {
        return [];
      }
      return [{ url: record.url, visitedAt: record.visitedAt }];
    })
    .slice(-MAX_HISTORY_ENTRIES);
}

export function addBrowserHistory(
  history: BrowserHistoryEntry[],
  url: string,
  now = Date.now(),
): BrowserHistoryEntry[] {
  if (!isWebUrl(url)) return history;
  return [...history.filter((entry) => entry.url !== url), { url, visitedAt: now }].slice(
    -MAX_HISTORY_ENTRIES,
  );
}

export function writeBrowserHistory(
  storage: Pick<Storage, 'setItem'>,
  history: BrowserHistoryEntry[],
) {
  storage.setItem(BROWSER_HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY_ENTRIES)));
}

export function getBrowserPageLabel(url: string): string {
  if (url === BROWSER_HOME_URL) return 'Start Page';
  try {
    return new URL(url).hostname.replace(/^www\./, '') || 'Web page';
  } catch {
    return 'Web page';
  }
}

export function isWebUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

function normalizeWebUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function isSafeBrowserUrl(url: string): boolean {
  return url === BROWSER_HOME_URL || isWebUrl(url);
}

function readStoredArray(storage: Pick<Storage, 'getItem'>, key: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}
