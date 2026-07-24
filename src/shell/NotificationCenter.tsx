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
  onClose: () => void;
  onSetAppearance: (appearance: AppearanceMode) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  onOpenSettings: () => void;
}

export function NotificationCenter({
  appearance,
  notifications,
  online,
  onClose,
  onSetAppearance,
  onMarkAllRead,
  onClear,
  onRemove,
  onOpenSettings,
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
      <aside className="notification-center" role="dialog" aria-modal="true">
        <header>
          <div>
            <NimvelisMark size={24} />
            <span>
              <strong>Device space</strong>
              <small>
                {online ? 'Online · local-first' : 'Offline · your local apps still work'}
              </small>
            </span>
          </div>
          <button aria-label="Close device space" onClick={onClose}>
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
            Personalize
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
