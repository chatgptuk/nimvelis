import { useEffect, useMemo, useState } from 'react';
import { AppIcon, Icon, NimvelisMark } from '../design/Icon';
import type { AppManifest } from '../kernel/app-registry/types';
import type { VfsNode, VirtualFileSystem } from '../kernel/vfs';
import type {
  DesktopWorkspace,
  WindowInstance,
  WindowSnapPosition,
} from '../kernel/window-manager/types';
import './overview.css';

interface DesktopOverviewProps {
  apps: readonly AppManifest[];
  windows: WindowInstance[];
  workspaces: DesktopWorkspace[];
  activeWorkspaceId: string;
  files: VirtualFileSystem;
  appFilter?: string | null;
  onClose: () => void;
  onCreateWorkspace: () => void;
  onSwitchWorkspace: (workspaceId: string) => void;
  onRenameWorkspace: (workspaceId: string, name: string) => void;
  onRemoveWorkspace: (workspaceId: string) => void;
  onOpenApp: (appId: string) => void;
  onOpenFile: (node: VfsNode) => void;
  onFocusWindow: (windowId: string) => void;
  onCloseWindow: (windowId: string) => void;
  onSnapWindow: (windowId: string, position: WindowSnapPosition) => void;
  onMoveWindow: (windowId: string, workspaceId: string) => void;
}

export function DesktopOverview({
  apps,
  windows,
  workspaces,
  activeWorkspaceId,
  files,
  appFilter,
  onClose,
  onCreateWorkspace,
  onSwitchWorkspace,
  onRenameWorkspace,
  onRemoveWorkspace,
  onOpenApp,
  onOpenFile,
  onFocusWindow,
  onCloseWindow,
  onSnapWindow,
  onMoveWindow,
}: DesktopOverviewProps) {
  const [recent, setRecent] = useState<VfsNode[]>([]);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');

  useEffect(() => {
    let active = true;
    void files.ready().then(async () => {
      const nodes = await files.listRecent(6);
      if (active) setRecent(nodes.filter((node) => node.kind === 'file'));
    });
    return () => {
      active = false;
    };
  }, [files]);

  const visibleWindows = useMemo(
    () =>
      windows
        .filter(
          (window) =>
            window.workspaceId === activeWorkspaceId && (!appFilter || window.appId === appFilter),
        )
        .sort((left, right) => right.zIndex - left.zIndex),
    [activeWorkspaceId, appFilter, windows],
  );
  const filteredApp = appFilter ? apps.find((app) => app.id === appFilter) : undefined;

  const commitWorkspaceName = (workspaceId: string) => {
    onRenameWorkspace(workspaceId, workspaceName);
    setEditingWorkspaceId(null);
  };

  return (
    <div
      className="desktop-overview"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="desktop-overview__panel" role="dialog" aria-modal="true">
        <header className="desktop-overview__header">
          <div>
            <span className="desktop-overview__mark">
              <NimvelisMark size={29} />
            </span>
            <div>
              <strong>{filteredApp ? `${filteredApp.name} windows` : 'Nimvelis Overview'}</strong>
              <small>Windows, spaces, and recent work in one place</small>
            </div>
          </div>
          <button aria-label="Close overview" onClick={onClose}>
            <Icon name="close" size={17} />
          </button>
        </header>

        <div className="overview-spaces" aria-label="Workspaces">
          {workspaces.map((workspace) => {
            const count = windows.filter(
              (window) => window.workspaceId === workspace.id && window.state !== 'minimized',
            ).length;
            return (
              <div
                className={`overview-space ${
                  workspace.id === activeWorkspaceId ? 'is-active' : ''
                }`}
                key={workspace.id}
              >
                {editingWorkspaceId === workspace.id ? (
                  <input
                    autoFocus
                    value={workspaceName}
                    aria-label="Workspace name"
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    onBlur={() => commitWorkspaceName(workspace.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitWorkspaceName(workspace.id);
                      if (event.key === 'Escape') setEditingWorkspaceId(null);
                    }}
                  />
                ) : (
                  <button
                    onClick={() => onSwitchWorkspace(workspace.id)}
                    onDoubleClick={() => {
                      setEditingWorkspaceId(workspace.id);
                      setWorkspaceName(workspace.name);
                    }}
                  >
                    <span>{workspace.name}</span>
                    <small>
                      {count} window{count === 1 ? '' : 's'}
                    </small>
                  </button>
                )}
                {workspaces.length > 1 ? (
                  <button
                    className="overview-space__remove"
                    aria-label={`Remove ${workspace.name}`}
                    onClick={() => onRemoveWorkspace(workspace.id)}
                  >
                    <Icon name="close" size={11} />
                  </button>
                ) : null}
              </div>
            );
          })}
          <button className="overview-space__add" onClick={onCreateWorkspace}>
            <Icon name="plus" size={16} />
            New space
          </button>
        </div>

        <div className="desktop-overview__content">
          <section className="overview-windows">
            <div className="overview-section-title">
              <span>Open windows</span>
              <small>Double-click a space name to rename it</small>
            </div>
            <div className="overview-window-grid">
              {visibleWindows.map((window) => {
                const app = apps.find((candidate) => candidate.id === window.appId);
                if (!app) return null;
                return (
                  <article
                    className={`overview-window-card ${
                      window.state === 'minimized' ? 'is-minimized' : ''
                    }`}
                    key={window.id}
                  >
                    <button
                      className="overview-window-card__open"
                      onClick={() => {
                        onFocusWindow(window.id);
                        onClose();
                      }}
                    >
                      <span className="overview-window-card__preview">
                        <AppIcon name={app.icon} size={55} />
                        <i />
                      </span>
                      <span>
                        <strong>{window.title}</strong>
                        <small>
                          {app.name} · {window.state === 'minimized' ? 'Minimized' : 'Open'}
                        </small>
                      </span>
                    </button>
                    <div className="overview-window-card__actions">
                      <button onClick={() => onSnapWindow(window.id, 'left')}>Left</button>
                      <button onClick={() => onSnapWindow(window.id, 'right')}>Right</button>
                      <select
                        value={window.workspaceId}
                        aria-label={`Move ${window.title} to a space`}
                        onChange={(event) => onMoveWindow(window.id, event.target.value)}
                      >
                        {workspaces.map((workspace) => (
                          <option key={workspace.id} value={workspace.id}>
                            {workspace.name}
                          </option>
                        ))}
                      </select>
                      <button
                        aria-label={`Close ${window.title}`}
                        onClick={() => onCloseWindow(window.id)}
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  </article>
                );
              })}
              {visibleWindows.length === 0 ? (
                <div className="overview-empty">
                  <Icon name="window" size={28} />
                  <strong>No open windows here</strong>
                  <span>Launch an app below to begin in this space.</span>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="overview-side">
            <section>
              <div className="overview-section-title">
                <span>Applications</span>
              </div>
              <div className="overview-apps">
                {apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      onOpenApp(app.id);
                      onClose();
                    }}
                  >
                    <AppIcon name={app.icon} size={38} />
                    <span>{app.name}</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <div className="overview-section-title">
                <span>Recent files</span>
              </div>
              <div className="overview-recent">
                {recent.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      onOpenFile(node);
                      onClose();
                    }}
                  >
                    <Icon name="file" size={16} />
                    <span>{node.name}</span>
                  </button>
                ))}
                {recent.length === 0 ? <small>No recent files yet</small> : null}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}
