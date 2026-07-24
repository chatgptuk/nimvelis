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
}

type MenuId = 'nimvelis' | 'window' | null;

export function TopBar({
  activeWindow,
  activeManifest,
  onNewWindow,
  onMinimize,
  onToggleMaximize,
  onToggleFullscreen,
  onClose,
  onOpenSettings,
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

  return (
    <header className="top-bar" ref={barRef}>
      <nav className="top-bar__left" aria-label="System menu">
        <div className="top-menu">
          <button
            type="button"
            className={`top-bar__brand ${openMenu === 'nimvelis' ? 'is-open' : ''}`}
            aria-label="Open Nimvelis menu"
            aria-expanded={openMenu === 'nimvelis'}
            onClick={() => setOpenMenu((current) => (current === 'nimvelis' ? null : 'nimvelis'))}
          >
            <NimvelisMark size={23} />
          </button>
          {openMenu === 'nimvelis' && (
            <div className="top-menu__popover top-menu__popover--brand" role="menu">
              <div className="about-card">
                <NimvelisMark size={40} />
                <div>
                  <strong>Nimvelis</strong>
                  <span>Aurora 0.1</span>
                </div>
              </div>
              <p>Your world, anywhere.</p>
              <div className="top-menu__separator" />
              <button type="button" role="menuitem" onClick={() => runAndClose(onOpenSettings)}>
                Settings
                <Icon name="chevron" size={14} />
              </button>
              <div className="top-menu__footnote">
                <span className="status-dot" />
                Local workspace
              </div>
            </div>
          )}
        </div>
        <span className="top-bar__active-app">{activeManifest?.name ?? 'Desktop'}</span>
        <div className="top-menu">
          <button
            type="button"
            className={`top-bar__menu-label ${openMenu === 'window' ? 'is-open' : ''}`}
            aria-expanded={openMenu === 'window'}
            onClick={() => setOpenMenu((current) => (current === 'window' ? null : 'window'))}
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
                <span>⇧ click</span>
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
                <span>⌥↵</span>
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
      </nav>
      <div className="top-bar__right">
        <span className="top-bar__local">
          <span className="status-dot" />
          Local
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
