import { Icon, NimvelisMark } from '../design/Icon';
import type { AppManifest } from '../kernel/app-registry/types';
import type { WindowInstance } from '../kernel/window-manager/types';

interface ShelfProps {
  apps: readonly AppManifest[];
  windows: WindowInstance[];
  onLaunch: (appId: string, forceNew: boolean) => void;
}

export function Shelf({ apps, windows, onLaunch }: ShelfProps) {
  return (
    <nav className="shelf" aria-label="Application Shelf">
      <div className="shelf__brand" aria-hidden="true">
        <NimvelisMark size={26} />
      </div>
      <span className="shelf__divider" />
      {apps.map((app) => {
        const appWindows = windows.filter((window) => window.appId === app.id);
        const isActive = appWindows.some((window) => window.focused);
        const hasMinimized = appWindows.some((window) => window.state === 'minimized');

        return (
          <button
            key={app.id}
            type="button"
            className={`shelf-app shelf-app--${app.id} ${isActive ? 'is-active' : ''}`}
            aria-label={`${app.name}${app.allowMultipleInstances ? '. Shift click for a new window' : ''}`}
            title={`${app.name}${app.allowMultipleInstances ? ' · Shift-click for new window' : ''}`}
            onClick={(event) => onLaunch(app.id, event.shiftKey)}
          >
            <span className="shelf-app__icon">
              <Icon name={app.icon} size={25} />
            </span>
            <span className="shelf-app__label">{app.name}</span>
            {appWindows.length > 0 && (
              <span
                className={`shelf-app__running ${hasMinimized ? 'has-minimized' : ''}`}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
