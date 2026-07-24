import { useEffect, useMemo, useState } from 'react';
import { AppIcon, Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import type { SystemWindowSummary } from '../../kernel/system-api';
import './pulse.css';

interface RuntimeSnapshot {
  storageUsage: number;
  storageQuota: number;
  heapUsage: number | null;
  heapLimit: number | null;
  cacheCount: number;
  serviceWorker: 'active' | 'available' | 'unavailable';
  online: boolean;
}

const EMPTY_RUNTIME: RuntimeSnapshot = {
  storageUsage: 0,
  storageQuota: 0,
  heapUsage: null,
  heapLimit: null,
  cacheCount: 0,
  serviceWorker: 'unavailable',
  online: true,
};

export function PulseApp({ window, system }: SystemAppProps) {
  const [runtime, setRuntime] = useState<RuntimeSnapshot>(EMPTY_RUNTIME);
  const [selectedId, setSelectedId] = useState<string>(window.id);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const [storage, cacheNames] = await Promise.all([
        navigator.storage?.estimate?.().catch(() => undefined),
        globalThis.caches?.keys?.().catch(() => [] as string[]),
      ]);
      const memory = readMemory();
      if (!active) return;
      setRuntime({
        storageUsage: storage?.usage ?? 0,
        storageQuota: storage?.quota ?? 0,
        heapUsage: memory?.usedJSHeapSize ?? null,
        heapLimit: memory?.jsHeapSizeLimit ?? null,
        cacheCount: cacheNames?.length ?? 0,
        serviceWorker:
          'serviceWorker' in navigator
            ? navigator.serviceWorker.controller
              ? 'active'
              : 'available'
            : 'unavailable',
        online: navigator.onLine,
      });
    };
    void refresh();
    const interval = globalThis.setInterval(() => void refresh(), 5_000);
    globalThis.addEventListener('online', refresh);
    globalThis.addEventListener('offline', refresh);
    return () => {
      active = false;
      globalThis.clearInterval(interval);
      globalThis.removeEventListener('online', refresh);
      globalThis.removeEventListener('offline', refresh);
    };
  }, []);

  const selected =
    system.windows.find((candidate) => candidate.id === selectedId) ?? system.windows[0];
  const runningApps = new Set(system.windows.map((candidate) => candidate.appId)).size;
  const visibleWindows = system.windows.filter(
    (candidate) => candidate.state !== 'minimized',
  ).length;
  const storagePercent =
    runtime.storageQuota > 0
      ? Math.min(100, Math.round((runtime.storageUsage / runtime.storageQuota) * 100))
      : 0;
  const memoryPercent =
    runtime.heapUsage !== null && runtime.heapLimit
      ? Math.min(100, Math.round((runtime.heapUsage / runtime.heapLimit) * 100))
      : null;
  const windows = useMemo(
    () =>
      [...system.windows].sort(
        (left, right) =>
          Number(right.focused) - Number(left.focused) || left.appName.localeCompare(right.appName),
      ),
    [system.windows],
  );

  return (
    <div className="pulse-app">
      <header className="pulse-overview">
        <div>
          <span className="pulse-live">
            <i />
            LIVE
          </span>
          <span>
            <strong>System is responsive</strong>
            <small>Browser-safe runtime signals only</small>
          </span>
        </div>
        <div className="pulse-overview__metrics">
          <RuntimeMetric label="Apps" value={String(runningApps)} detail="running" />
          <RuntimeMetric label="Windows" value={String(visibleWindows)} detail="visible" />
          <RuntimeMetric
            label="Storage"
            value={formatBytes(runtime.storageUsage)}
            detail={`${storagePercent}% of quota`}
          />
          <RuntimeMetric
            label="Memory"
            value={runtime.heapUsage === null ? 'Private' : formatBytes(runtime.heapUsage)}
            detail={memoryPercent === null ? 'not exposed' : `${memoryPercent}% browser heap`}
          />
        </div>
      </header>

      <main className="pulse-main">
        <section className="pulse-processes" aria-label="Nimvelis windows">
          <header>
            <span>
              <strong>Running windows</strong>
              <small>{system.windows.length} restored in this session</small>
            </span>
            <Icon name="pulse" size={18} />
          </header>
          <div className="pulse-process-list">
            {windows.map((candidate) => (
              <button
                type="button"
                className={selected?.id === candidate.id ? 'is-selected' : ''}
                aria-pressed={selected?.id === candidate.id}
                key={candidate.id}
                onClick={() => setSelectedId(candidate.id)}
              >
                <AppIcon name={getAppIcon(system, candidate.appId)} size={34} />
                <span>
                  <strong>{candidate.title}</strong>
                  <small>
                    {candidate.workspaceName} · {formatWindowState(candidate)}
                  </small>
                </span>
                <i className={candidate.focused ? 'is-focused' : ''} />
              </button>
            ))}
          </div>
        </section>

        <section className="pulse-detail">
          {selected ? (
            <>
              <header>
                <AppIcon name={getAppIcon(system, selected.appId)} size={54} />
                <span>
                  <strong>{selected.appName}</strong>
                  <small>{selected.title}</small>
                </span>
                <b className={`pulse-state is-${selected.state}`}>{formatWindowState(selected)}</b>
              </header>
              <div className="pulse-facts">
                <article>
                  <span>Workspace</span>
                  <strong>{selected.workspaceName}</strong>
                </article>
                <article>
                  <span>Window ID</span>
                  <strong title={selected.id}>{shortId(selected.id)}</strong>
                </article>
                <article>
                  <span>Runtime</span>
                  <strong>React sandbox</strong>
                </article>
                <article>
                  <span>Host access</span>
                  <strong>None</strong>
                </article>
              </div>
              <div className="pulse-actions">
                <button
                  type="button"
                  onClick={() =>
                    selected.state === 'minimized'
                      ? system.restoreWindow(selected.id)
                      : system.focusWindow(selected.id)
                  }
                >
                  <Icon name="window" size={15} />
                  {selected.state === 'minimized' ? 'Restore' : 'Bring forward'}
                </button>
                <button
                  type="button"
                  disabled={selected.state === 'minimized'}
                  onClick={() => system.minimizeWindow(selected.id)}
                >
                  <Icon name="minimize" size={15} />
                  Minimize
                </button>
                <button
                  type="button"
                  className="is-danger"
                  disabled={selected.id === window.id}
                  title={
                    selected.id === window.id
                      ? 'Close Pulse from its window controls'
                      : 'Close this Nimvelis window'
                  }
                  onClick={() => system.closeWindow(selected.id)}
                >
                  <Icon name="close" size={15} />
                  Force close
                </button>
              </div>
              <div className="pulse-runtime">
                <h3>Browser runtime</h3>
                <RuntimeRow
                  label="Network"
                  value={runtime.online ? 'Online' : 'Offline'}
                  tone={runtime.online ? 'good' : 'warn'}
                />
                <RuntimeRow
                  label="Service worker"
                  value={runtime.serviceWorker}
                  tone={runtime.serviceWorker === 'active' ? 'good' : 'neutral'}
                />
                <RuntimeRow label="Application caches" value={String(runtime.cacheCount)} />
                <RuntimeRow label="Storage quota" value={formatBytes(runtime.storageQuota)} />
              </div>
            </>
          ) : (
            <div className="pulse-no-processes">No running Nimvelis windows.</div>
          )}
        </section>
      </main>
      <footer>
        Pulse reports Nimvelis windows and browser-provided metrics. It cannot inspect device
        processes, CPU usage, or other applications.
      </footer>
    </div>
  );
}

function RuntimeMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function RuntimeRow({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'good' | 'warn';
}) {
  return (
    <div className="pulse-runtime__row">
      <span>{label}</span>
      <strong className={`is-${tone}`}>
        <i />
        {value}
      </strong>
    </div>
  );
}

function readMemory() {
  return (
    performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }
  ).memory;
}

function getAppIcon(system: SystemAppProps['system'], appId: string) {
  const manifest = system.listApps().find((candidate) => candidate.id === appId);
  return manifest?.icon ?? 'system';
}

function formatWindowState(window: SystemWindowSummary) {
  if (window.focused) return 'Focused';
  if (window.state === 'minimized') return 'Minimized';
  if (window.state === 'fullscreen') return 'Full screen';
  if (window.state === 'maximized') return 'Expanded';
  return 'Running';
}

function shortId(value: string) {
  const suffix = value.split('-').slice(-2).join('-');
  return suffix.slice(0, 14);
}

function formatBytes(value: number) {
  if (!value) return '0 B';
  if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(1)} GB`;
}
