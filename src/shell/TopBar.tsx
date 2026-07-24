import { useEffect, useRef, useState } from 'react';
import { Icon, NimvelisMark } from '../design/Icon';
import type { AppManifest } from '../kernel/app-registry/types';
import type { WindowInstance } from '../kernel/window-manager/types';

interface TopBarProps {
  activeWindow?: WindowInstance;
  activeManifest?: AppManifest;
  onNewWindow: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
}

type MenuId = 'nimvelis' | 'space' | 'view' | 'window' | 'help' | null;

export function TopBar({
  activeWindow,
  activeManifest,
  onNewWindow,
  onMinimize,
  onToggleMaximize,
  onToggleFullscreen,
  onClose,
  onOpenSettings,
  onOpenSearch,
}: TopBarProps) {
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const barRef = useRef<HTMLElement>(null);
  const now = useClock();

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    globalThis.addEventListener('pointerdown', closeOnOutsideClick);
    return () => globalThis.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  const runAndClose = (action: () => void) => {
    action();
    setOpenMenu(null);
  };

  const toggleMenu = (menu: Exclude<MenuId, null>) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  return (
    <header className="top-bar" ref={barRef}>
      <nav className="top-bar__left" aria-label="System menu">
        <div className="top-menu">
          <button
            type="button"
            className={`top-bar__brand ${openMenu === 'nimvelis' ? 'is-open' : ''}`}
            aria-label="Open Nimvelis menu"
            aria-expanded={openMenu === 'nimvelis'}
            onClick={() => toggleMenu('nimvelis')}
          >
            <NimvelisMark size={23} />
          </button>
          {openMenu === 'nimvelis' && (
            <div className="top-menu__popover top-menu__popover--brand" role="menu">
              <div className="about-card">
                <NimvelisMark size={40} />
                <div>
                  <strong>Nimvelis</strong>
                  <span>Aurora desktop · 0.2</span>
                </div>
              </div>
              <p>An independent space for your local work.</p>
              <div className="top-menu__separator" />
              <button type="button" role="menuitem" onClick={() => runAndClose(onOpenSettings)}>
                Personalize Nimvelis
                <Icon name="chevron" size={14} />
              </button>
              <div className="top-menu__footnote">
                <span className="status-dot" />
                Original interface · MIT licensed
              </div>
            </div>
          )}
        </div>
        <span className="top-bar__active-app">
          <span>N</span>
          {activeManifest?.name ?? 'Desktop'}
        </span>
        <div className="top-menu">
          <button
            type="button"
            className={`top-bar__menu-label ${openMenu === 'space' ? 'is-open' : ''}`}
            aria-expanded={openMenu === 'space'}
            onClick={() => toggleMenu('space')}
          >
            Space
          </button>
          {openMenu === 'space' && (
            <div className="top-menu__popover" role="menu">
              <button
                type="button"
                role="menuitem"
                disabled={!activeManifest?.allowMultipleInstances}
                onClick={() => runAndClose(onNewWindow)}
              >
                New {activeManifest?.name ?? 'window'}
                <span>Shift + click</span>
              </button>
              <div className="top-menu__separator" />
              <button type="button" role="menuitem" onClick={() => runAndClose(onOpenSettings)}>
                Appearance
                <Icon name="sparkle" size={14} />
              </button>
              <div className="top-menu__footnote">
                <span className="status-dot" />
                Saved on this device
              </div>
            </div>
          )}
        </div>
        <div className="top-menu">
          <button
            type="button"
            className={`top-bar__menu-label ${openMenu === 'view' ? 'is-open' : ''}`}
            aria-expanded={openMenu === 'view'}
            onClick={() => toggleMenu('view')}
          >
            View
          </button>
          {openMenu === 'view' && (
            <div className="top-menu__popover" role="menu">
              <button
                type="button"
                role="menuitem"
                disabled={!activeWindow}
                onClick={() => runAndClose(onToggleMaximize)}
              >
                {activeWindow?.state === 'maximized' ? 'Return to window' : 'Expand window'}
                <span>Alt + Enter</span>
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!activeWindow}
                onClick={() => runAndClose(onToggleFullscreen)}
              >
                {activeWindow?.state === 'fullscreen' ? 'Leave full canvas' : 'Full canvas'}
                <Icon name="fullscreen" size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="top-menu">
          <button
            type="button"
            className={`top-bar__menu-label ${openMenu === 'window' ? 'is-open' : ''}`}
            aria-expanded={openMenu === 'window'}
            onClick={() => toggleMenu('window')}
          >
            Window
          </button>
          {openMenu === 'window' && (
            <div className="top-menu__popover" role="menu">
              <button
                type="button"
                role="menuitem"
                disabled={!activeManifest?.allowMultipleInstances}
                onClick={() => runAndClose(onNewWindow)}
              >
                New window
                <span>Shift + click</span>
              </button>
              <div className="top-menu__separator" />
              <button
                type="button"
                role="menuitem"
                disabled={!activeWindow}
                onClick={() => runAndClose(onMinimize)}
              >
                Minimize
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!activeWindow}
                onClick={() => runAndClose(onToggleMaximize)}
              >
                {activeWindow?.state === 'maximized' ? 'Restore' : 'Maximize'}
                <span>Alt + Enter</span>
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!activeWindow}
                onClick={() => runAndClose(onToggleFullscreen)}
              >
                {activeWindow?.state === 'fullscreen' ? 'Exit full screen' : 'Full screen'}
              </button>
              <div className="top-menu__separator" />
              <button
                type="button"
                role="menuitem"
                disabled={!activeWindow}
                onClick={() => runAndClose(onClose)}
              >
                Close window
              </button>
            </div>
          )}
        </div>
        <div className="top-menu top-menu--help">
          <button
            type="button"
            className={`top-bar__menu-label ${openMenu === 'help' ? 'is-open' : ''}`}
            aria-expanded={openMenu === 'help'}
            onClick={() => toggleMenu('help')}
          >
            Help
          </button>
          {openMenu === 'help' && (
            <div className="top-menu__popover top-menu__popover--help" role="menu">
              <div className="shortcut-card">
                <strong>Keyboard flow</strong>
                <span>
                  Move window <kbd>Alt</kbd> + <kbd>Arrow</kbd>
                </span>
                <span>
                  Resize window <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>Arrow</kbd>
                </span>
                <span>
                  Cycle focus <kbd>Alt</kbd> + <kbd>`</kbd>
                </span>
              </div>
              <div className="top-menu__separator" />
              <div className="top-menu__footnote">Nimvelis Aurora 0.2</div>
            </div>
          )}
        </div>
      </nav>
      <div className="top-bar__right">
        <button className="top-bar__search" type="button" onClick={onOpenSearch}>
          <Icon name="search" size={14} />
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
        <span className="top-bar__local" title="Your data stays in this browser">
          <span className="status-dot" />
          Device space
        </span>
        <time dateTime={now.toISOString()}>
          {new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }).format(now)}
          <strong>
            {new Intl.DateTimeFormat(undefined, {
              hour: 'numeric',
              minute: '2-digit',
            }).format(now)}
          </strong>
        </time>
      </div>
    </header>
  );
}

function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = globalThis.setInterval(() => setNow(new Date()), 30_000);
    return () => globalThis.clearInterval(interval);
  }, []);

  return now;
}
