import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AppIcon, Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import {
  BROWSER_HISTORY_KEY,
  BROWSER_HOME_URL,
  addBrowserHistory,
  getBrowserPageLabel,
  isWebUrl,
  moveBrowserNavigation,
  normalizeBrowserInput,
  pushBrowserNavigation,
  readBrowserBookmarks,
  readBrowserHistory,
  readBrowserNavigationState,
  toggleBrowserBookmark,
  writeBrowserBookmarks,
  writeBrowserHistory,
  type BrowserBookmark,
  type BrowserHistoryEntry,
} from './browser-state';
import './browser.css';

type LibraryPanel = 'bookmarks' | 'history' | null;

const QUICK_LINKS = [
  {
    label: 'Cloudflare',
    detail: 'Developer platform',
    url: 'https://developers.cloudflare.com/',
    color: 'orange',
  },
  {
    label: 'MDN',
    detail: 'Web documentation',
    url: 'https://developer.mozilla.org/',
    color: 'blue',
  },
  {
    label: 'Wikipedia',
    detail: 'Free encyclopedia',
    url: 'https://www.wikipedia.org/',
    color: 'slate',
  },
  {
    label: 'Internet Archive',
    detail: 'Digital library',
    url: 'https://archive.org/',
    color: 'violet',
  },
] as const;

export function BrowserApp({ system, window }: SystemAppProps) {
  const [navigation, setNavigation] = useState(() =>
    readBrowserNavigationState(window.instanceData),
  );
  const currentUrl = navigation.entries[navigation.index] ?? BROWSER_HOME_URL;
  const [address, setAddress] = useState(currentUrl === BROWSER_HOME_URL ? '' : currentUrl);
  const [bookmarks, setBookmarks] = useState<BrowserBookmark[]>(() =>
    readBrowserBookmarks(localStorage),
  );
  const [history, setHistory] = useState<BrowserHistoryEntry[]>(() =>
    readBrowserHistory(localStorage),
  );
  const [libraryPanel, setLibraryPanel] = useState<LibraryPanel>(null);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [startQuery, setStartQuery] = useState('');
  const addressRef = useRef<HTMLInputElement>(null);
  const isHome = currentUrl === BROWSER_HOME_URL;
  const isBookmarked = bookmarks.some((bookmark) => bookmark.url === currentUrl);

  useEffect(() => {
    system.updateWindowData(window.id, navigation);
  }, [navigation, system, window.id]);

  useEffect(() => {
    system.setWindowTitle(
      window.id,
      isHome ? 'Browser' : `Browser — ${getBrowserPageLabel(currentUrl)}`,
    );
  }, [currentUrl, isHome, system, window.id]);

  const recentHistory = useMemo(() => [...history].reverse().slice(0, 6), [history]);

  const visit = (input: string) => {
    const nextUrl = normalizeBrowserInput(input);
    if (!nextUrl) {
      system.notify('Browser supports only safe HTTP and HTTPS addresses.', 'error');
      return;
    }

    setAddress(nextUrl === BROWSER_HOME_URL ? '' : nextUrl);
    setLoading(nextUrl !== BROWSER_HOME_URL);
    setNavigation((current) => pushBrowserNavigation(current, nextUrl));
    setLibraryPanel(null);
    if (nextUrl !== BROWSER_HOME_URL && !navigation.privateMode) {
      setHistory((current) => {
        const next = addBrowserHistory(current, nextUrl);
        writeBrowserHistory(localStorage, next);
        return next;
      });
    }
  };

  const submitAddress = (event: FormEvent) => {
    event.preventDefault();
    visit(address);
  };

  const submitStartSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!startQuery.trim()) return;
    visit(startQuery);
  };

  const moveHistory = (offset: -1 | 1) => {
    const next = moveBrowserNavigation(navigation, offset);
    const nextUrl = next.entries[next.index] ?? BROWSER_HOME_URL;
    setAddress(nextUrl === BROWSER_HOME_URL ? '' : nextUrl);
    setLoading(nextUrl !== BROWSER_HOME_URL);
    setNavigation(next);
  };

  const reload = () => {
    if (isHome) return;
    setLoading(true);
    setReloadKey((current) => current + 1);
  };

  const toggleCurrentBookmark = () => {
    if (!isWebUrl(currentUrl)) return;
    setBookmarks((current) => {
      const next = toggleBrowserBookmark(current, currentUrl);
      writeBrowserBookmarks(localStorage, next);
      return next;
    });
    system.notify(isBookmarked ? 'Bookmark removed' : 'Bookmark saved', 'success');
  };

  const togglePrivateMode = () => {
    setNavigation((current) => ({ ...current, privateMode: !current.privateMode }));
    system.notify(
      navigation.privateMode
        ? 'Browser history is being saved locally again'
        : 'This window will not add pages to local history',
    );
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(BROWSER_HISTORY_KEY);
    system.notify('Browser history cleared', 'success');
  };

  const openExternally = () => {
    if (!isWebUrl(currentUrl)) return;
    globalThis.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (!window.focused) return;
    const handleShortcut = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        addressRef.current?.focus();
        addressRef.current?.select();
      } else if (modifier && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        reload();
      } else if (modifier && event.key.toLowerCase() === 'd' && isWebUrl(currentUrl)) {
        event.preventDefault();
        toggleCurrentBookmark();
      } else if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        moveHistory(-1);
      } else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        moveHistory(1);
      }
    };
    globalThis.addEventListener('keydown', handleShortcut);
    return () => globalThis.removeEventListener('keydown', handleShortcut);
  });

  return (
    <div className="browser-app">
      <header className="browser-toolbar">
        <div className="browser-toolbar__nav">
          <ToolbarButton
            label="Back"
            icon="arrow-left"
            disabled={navigation.index <= 0}
            onClick={() => moveHistory(-1)}
          />
          <ToolbarButton
            label="Forward"
            icon="arrow-right"
            disabled={navigation.index >= navigation.entries.length - 1}
            onClick={() => moveHistory(1)}
          />
          <ToolbarButton label="Reload" icon="restore" disabled={isHome} onClick={reload} />
          <ToolbarButton
            label="Start Page"
            icon="browser"
            active={isHome}
            onClick={() => visit(BROWSER_HOME_URL)}
          />
        </div>

        <form className="browser-address" onSubmit={submitAddress}>
          <Icon name={isHome ? 'search' : 'system'} size={15} />
          <input
            ref={addressRef}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            placeholder="Search or enter website"
            aria-label="Browser address"
            spellCheck={false}
            inputMode="url"
          />
          {!isHome ? (
            <button
              type="button"
              className={isBookmarked ? 'is-active' : ''}
              onClick={toggleCurrentBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <BookmarkGlyph filled={isBookmarked} />
            </button>
          ) : null}
        </form>

        <div className="browser-toolbar__actions">
          <ToolbarButton
            label={navigation.privateMode ? 'History off' : 'Local history'}
            icon="system"
            active={navigation.privateMode}
            onClick={togglePrivateMode}
          />
          <ToolbarButton
            label="Bookmarks"
            icon="sparkle"
            active={libraryPanel === 'bookmarks'}
            onClick={() =>
              setLibraryPanel((current) => (current === 'bookmarks' ? null : 'bookmarks'))
            }
          />
          <ToolbarButton
            label="History"
            icon="clock"
            active={libraryPanel === 'history'}
            onClick={() => setLibraryPanel((current) => (current === 'history' ? null : 'history'))}
          />
          <ToolbarButton
            label="Open in new tab"
            icon="window"
            disabled={isHome}
            onClick={openExternally}
          />
        </div>
      </header>

      <div className={`browser-progress ${loading ? 'is-loading' : ''}`} aria-hidden="true">
        <i />
      </div>

      <main className="browser-main">
        {libraryPanel ? (
          <BrowserLibrary
            panel={libraryPanel}
            bookmarks={bookmarks}
            history={history}
            onVisit={visit}
            onClearHistory={clearHistory}
            onClose={() => setLibraryPanel(null)}
          />
        ) : null}

        <section className="browser-viewport" aria-label="Web content">
          {isHome ? (
            <StartPage
              query={startQuery}
              recentHistory={recentHistory}
              bookmarks={bookmarks}
              onQueryChange={setStartQuery}
              onSubmit={submitStartSearch}
              onVisit={visit}
            />
          ) : (
            <>
              <div className="browser-embed-note">
                <span>
                  <Icon name="system" size={14} />
                  Sandboxed web view
                </span>
                <p>Some websites block embedded viewing.</p>
                <button type="button" onClick={openExternally}>
                  Open externally
                </button>
              </div>
              <iframe
                key={`${currentUrl}-${reloadKey}`}
                className="browser-frame"
                src={currentUrl}
                title={`Web page: ${getBrowserPageLabel(currentUrl)}`}
                sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts"
                referrerPolicy="no-referrer"
                allow="fullscreen"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </>
          )}
        </section>
      </main>

      <footer className="browser-statusbar">
        <span>
          <i className={navigator.onLine ? 'is-online' : ''} />
          {navigator.onLine ? 'Online' : 'Offline'}
        </span>
        <span>
          {navigation.privateMode ? 'History off for this window' : 'History stays on this device'}
        </span>
        <span>External pages may contact their own servers</span>
      </footer>
    </div>
  );
}

function ToolbarButton({
  label,
  icon,
  disabled,
  active,
  onClick,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]['name'];
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? 'is-active' : ''}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

function StartPage({
  query,
  recentHistory,
  bookmarks,
  onQueryChange,
  onSubmit,
  onVisit,
}: {
  query: string;
  recentHistory: BrowserHistoryEntry[];
  bookmarks: BrowserBookmark[];
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onVisit: (url: string) => void;
}) {
  const saved = [...bookmarks].reverse().slice(0, 4);
  const recent = recentHistory.slice(0, Math.max(0, 4 - saved.length));
  const revisitUrls = [...saved.map((item) => item.url), ...recent.map((item) => item.url)].filter(
    (url, index, items) => items.indexOf(url) === index,
  );

  return (
    <div className="browser-start">
      <div className="browser-start__hero">
        <AppIcon name="browser" size={78} />
        <span>NIMVELIS BROWSER</span>
        <h2>Your web, inside your workspace.</h2>
        <p>Search the web or open a site without leaving the desktop.</p>
        <form onSubmit={onSubmit}>
          <Icon name="search" size={19} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search with DuckDuckGo"
            aria-label="Search the web"
          />
          <button type="submit" aria-label="Search">
            <Icon name="arrow-right" size={18} />
          </button>
        </form>
      </div>

      <section className="browser-quick-links" aria-labelledby="browser-favorites-heading">
        <header>
          <div>
            <span>START HERE</span>
            <h3 id="browser-favorites-heading">Favorites</h3>
          </div>
          <small>Pages open in a restricted web view</small>
        </header>
        <div>
          {QUICK_LINKS.map((link) => (
            <button type="button" key={link.url} onClick={() => onVisit(link.url)}>
              <i className={`is-${link.color}`}>{link.label.slice(0, 1)}</i>
              <span>
                <strong>{link.label}</strong>
                <small>{link.detail}</small>
              </span>
              <Icon name="chevron" size={15} />
            </button>
          ))}
        </div>
      </section>

      <section className="browser-start__lower">
        <article className="browser-privacy-card">
          <span>
            <Icon name="system" size={18} />
          </span>
          <div>
            <strong>A visibly safer web view</strong>
            <p>
              Unsafe URL schemes are blocked, embedded pages are sandboxed, and Nimvelis keeps
              bookmarks and history in this browser.
            </p>
          </div>
        </article>

        <article className="browser-recent-card">
          <header>
            <strong>{saved.length ? 'Saved & recent' : 'Recently visited'}</strong>
            <small>
              {saved.length + recent.length ? 'Open again' : 'Your local history is empty'}
            </small>
          </header>
          {revisitUrls.map((url) => (
            <button type="button" key={url} onClick={() => onVisit(url)}>
              <span>{getBrowserPageLabel(url).slice(0, 1).toUpperCase()}</span>
              <strong>{getBrowserPageLabel(url)}</strong>
              <Icon name="arrow-right" size={14} />
            </button>
          ))}
        </article>
      </section>
    </div>
  );
}

function BrowserLibrary({
  panel,
  bookmarks,
  history,
  onVisit,
  onClearHistory,
  onClose,
}: {
  panel: Exclude<LibraryPanel, null>;
  bookmarks: BrowserBookmark[];
  history: BrowserHistoryEntry[];
  onVisit: (url: string) => void;
  onClearHistory: () => void;
  onClose: () => void;
}) {
  const items =
    panel === 'bookmarks'
      ? [...bookmarks]
          .reverse()
          .map((item) => ({ key: item.id, url: item.url, detail: 'Saved locally' }))
      : [...history].reverse().map((item) => ({
          key: `${item.url}-${item.visitedAt}`,
          url: item.url,
          detail: formatVisitTime(item.visitedAt),
        }));

  return (
    <aside className="browser-library" aria-label={panel === 'bookmarks' ? 'Bookmarks' : 'History'}>
      <header>
        <div>
          <span>{panel === 'bookmarks' ? 'LIBRARY' : 'ON THIS DEVICE'}</span>
          <h3>{panel === 'bookmarks' ? 'Bookmarks' : 'History'}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Close library">
          <Icon name="close" size={15} />
        </button>
      </header>
      <div className="browser-library__items">
        {items.map((item) => (
          <button type="button" key={item.key} onClick={() => onVisit(item.url)}>
            <i>{getBrowserPageLabel(item.url).slice(0, 1).toUpperCase()}</i>
            <span>
              <strong>{getBrowserPageLabel(item.url)}</strong>
              <small>{item.detail}</small>
            </span>
          </button>
        ))}
        {!items.length ? (
          <div className="browser-library__empty">
            <Icon name={panel === 'bookmarks' ? 'sparkle' : 'clock'} size={26} />
            <strong>Nothing here yet</strong>
            <span>
              {panel === 'bookmarks'
                ? 'Save a page from the address bar.'
                : 'Visited pages appear here.'}
            </span>
          </div>
        ) : null}
      </div>
      {panel === 'history' && history.length ? (
        <button type="button" className="browser-library__clear" onClick={onClearHistory}>
          Clear history
        </button>
      ) : null}
    </aside>
  );
}

function BookmarkGlyph({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 3 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 17.03l-5.5 2.89 1.05-6.12L3.1 9.47l6.15-.9Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatVisitTime(value: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Visited locally';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
