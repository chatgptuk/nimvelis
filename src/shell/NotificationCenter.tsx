import { useEffect, useState, useSyncExternalStore } from 'react';
import { Icon, NimvelisMark } from '../design/Icon';
import {
  applyPwaUpdate,
  checkForPwaUpdate,
  getPwaSnapshot,
  promptPwaInstall,
  subscribePwa,
} from '../kernel/pwa-manager';
import type { AppearanceMode } from '../state/desktop-store';
import type { SystemNotification } from '../state/system-store';
import './notifications.css';

interface NotificationCenterProps {
  appearance: AppearanceMode;
  notifications: SystemNotification[];
  online: boolean;
  focusMode: boolean;
  quietMedia: boolean;
  interfaceBrightness: number;
  onClose: () => void;
  onSetAppearance: (appearance: AppearanceMode) => void;
  onSetFocusMode: (enabled: boolean) => void;
  onSetQuietMedia: (enabled: boolean) => void;
  onSetInterfaceBrightness: (brightness: number) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  onOpenSettings: () => void;
  onOpenApp: (appId: string) => void;
  onLock: () => void;
}

export function NotificationCenter({
  appearance,
  notifications,
  online,
  focusMode,
  quietMedia,
  interfaceBrightness,
  onClose,
  onSetAppearance,
  onSetFocusMode,
  onSetQuietMedia,
  onSetInterfaceBrightness,
  onMarkAllRead,
  onClear,
  onRemove,
  onOpenSettings,
  onOpenApp,
  onLock,
}: NotificationCenterProps) {
  const pwa = useSyncExternalStore(subscribePwa, getPwaSnapshot, getPwaSnapshot);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    let active = true;
    void navigator.storage?.estimate().then((estimate) => {
      if (!active) return;
      setStorage({ usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 });
    });
    onMarkAllRead();
    return () => {
      active = false;
    };
  }, [onMarkAllRead]);

  const storagePercent =
    storage && storage.quota > 0 ? Math.min(100, (storage.usage / storage.quota) * 100) : 0;

  return (
    <div
      className="notification-center-layer"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="notification-center"
        role="dialog"
        aria-modal="true"
        aria-label="Control Center"
      >
        <header>
          <div>
            <NimvelisMark size={24} />
            <span>
              <strong>Control Center</strong>
              <small>
                {online ? 'Control Center · local-first' : 'Offline · local apps remain ready'}
              </small>
            </span>
          </div>
          <button aria-label="Close Control Center" onClick={onClose}>
            <Icon name="close" size={15} />
          </button>
        </header>

        <section className="quick-settings">
          <div className="quick-settings__appearance">
            {(
              [
                ['system', 'system', 'Auto'],
                ['light', 'sun', 'Light'],
                ['dark', 'moon', 'Dark'],
              ] as const
            ).map(([mode, icon, label]) => (
              <button
                className={appearance === mode ? 'is-active' : ''}
                key={mode}
                onClick={() => onSetAppearance(mode)}
              >
                <Icon name={icon} size={17} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <button className="quick-settings__settings" onClick={onOpenSettings}>
            <Icon name="settings" size={17} />
            Settings
          </button>
        </section>

        <section className="control-grid" aria-label="System controls">
          <button
            type="button"
            className={online ? 'is-active' : ''}
            onClick={() => onOpenApp('connections')}
          >
            <span>
              <Icon name="wifi" size={17} />
            </span>
            <strong>{online ? 'Online' : 'Offline'}</strong>
            <small>Connections</small>
          </button>
          <button type="button" onClick={() => onOpenApp('connections')}>
            <span>
              <Icon name="bluetooth" size={17} />
            </span>
            <strong>Bluetooth</strong>
            <small>Ask browser</small>
          </button>
          <button
            type="button"
            className={focusMode ? 'is-active' : ''}
            aria-pressed={focusMode}
            onClick={() => onSetFocusMode(!focusMode)}
          >
            <span>
              <Icon name="moon" size={17} />
            </span>
            <strong>Focus</strong>
            <small>{focusMode ? 'Toasts paused' : 'Available'}</small>
          </button>
          <button
            type="button"
            className={quietMedia ? 'is-active' : ''}
            aria-pressed={quietMedia}
            onClick={() => onSetQuietMedia(!quietMedia)}
          >
            <span>
              <Icon name={quietMedia ? 'volume-off' : 'volume'} size={17} />
            </span>
            <strong>Media</strong>
            <small>{quietMedia ? 'Muted in apps' : 'App volume'}</small>
          </button>
        </section>

        <section className="brightness-control">
          <Icon name="sun" size={15} />
          <label>
            <span>
              Interface brightness
              <small>{Math.round(interfaceBrightness * 100)}%</small>
            </span>
            <input
              type="range"
              min="45"
              max="100"
              value={Math.round(interfaceBrightness * 100)}
              aria-label="Interface brightness"
              onChange={(event) => onSetInterfaceBrightness(Number(event.target.value) / 100)}
            />
          </label>
        </section>

        <section className="system-tools" aria-label="System tools">
          {[
            ['pulse', 'pulse', 'Pulse'],
            ['stash', 'stash', 'Stash'],
            ['capture', 'capture', 'Capture'],
          ].map(([appId, icon, label]) => (
            <button type="button" key={appId} onClick={() => onOpenApp(appId)}>
              <Icon name={icon as 'pulse' | 'stash' | 'capture'} size={17} />
              {label}
            </button>
          ))}
          <button type="button" onClick={onLock}>
            <Icon name="lock" size={17} />
            Lock
          </button>
        </section>

        <section className="device-card">
          <div>
            <span className={`device-card__status ${online ? 'is-online' : ''}`}>
              <Icon name={online ? 'check' : 'download'} size={16} />
            </span>
            <span>
              <strong>{online ? 'Ready everywhere' : 'Working offline'}</strong>
              <small>Files and settings remain in this browser</small>
            </span>
          </div>
          {storage ? (
            <div className="device-card__storage">
              <span>
                Local storage
                <small>{formatBytes(storage.usage)} used</small>
              </span>
              <i>
                <b style={{ width: `${Math.max(3, storagePercent)}%` }} />
              </i>
            </div>
          ) : null}
        </section>

        <section className="pwa-card">
          <div>
            <Icon name="download" size={18} />
            <span>
              <strong>App & updates</strong>
              <small>
                {pwa.updateState === 'available'
                  ? 'A new Aurora build is ready'
                  : pwa.installed
                    ? 'Installed app · up to date'
                    : 'Install for an app-like experience'}
              </small>
            </span>
          </div>
          <div className="pwa-card__actions">
            {pwa.updateState === 'available' ? (
              <button className="is-primary" onClick={applyPwaUpdate}>
                Refresh to update
              </button>
            ) : (
              <button onClick={() => void checkForPwaUpdate()}>Check updates</button>
            )}
            {pwa.installAvailable && !pwa.installed ? (
              <button onClick={() => void promptPwaInstall()}>Install app</button>
            ) : null}
          </div>
        </section>

        <section className="notification-history">
          <div className="notification-history__title">
            <span>
              Notifications
              {notifications.length > 0 ? <small>{notifications.length}</small> : null}
            </span>
            {notifications.length > 0 ? <button onClick={onClear}>Clear</button> : null}
          </div>
          <div className="notification-history__list">
            {notifications.map((notification) => (
              <article
                className={`notification-item notification-item--${notification.tone}`}
                key={notification.id}
              >
                <span className="status-dot" />
                <div>
                  <strong>{notification.message}</strong>
                  <small>{formatRelativeTime(notification.createdAt)}</small>
                </div>
                <button aria-label="Dismiss notification" onClick={() => onRemove(notification.id)}>
                  <Icon name="close" size={12} />
                </button>
              </article>
            ))}
            {notifications.length === 0 ? (
              <div className="notification-history__empty">
                <Icon name="check" size={23} />
                <strong>All caught up</strong>
                <span>System activity will appear here.</span>
              </div>
            ) : null}
          </div>
        </section>
      </aside>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatRelativeTime(value: number) {
  const minutes = Math.floor((Date.now() - value) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(value);
}
