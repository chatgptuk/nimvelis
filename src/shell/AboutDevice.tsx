import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, NimvelisMark } from '../design/Icon';
import './about.css';

interface AboutDeviceProps {
  appearance: 'light' | 'dark';
  openWindowCount: number;
  wallpaper: 'aurora' | 'solstice' | 'stillness';
  onClose: () => void;
  onOpenSettings: () => void;
}

interface StorageDetails {
  usage: number;
  quota: number;
  persisted: boolean;
}

interface NavigatorWithDeviceHints extends Navigator {
  deviceMemory?: number;
  userAgentData?: {
    brands?: Array<{ brand: string; version: string }>;
    platform?: string;
  };
}

export function AboutDevice({
  appearance,
  openWindowCount,
  wallpaper,
  onClose,
  onOpenSettings,
}: AboutDeviceProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [storage, setStorage] = useState<StorageDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const profile = useMemo(() => readSystemProfile(), []);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let active = true;

    const loadStorage = async () => {
      try {
        if (!navigator.storage?.estimate) throw new Error('Storage estimate is unavailable.');
        const [estimate, persisted] = await Promise.all([
          navigator.storage.estimate(),
          navigator.storage.persisted?.() ?? Promise.resolve(false),
        ]);
        if (!active) return;
        setStorage({
          usage: estimate.usage ?? 0,
          quota: estimate.quota ?? 0,
          persisted,
        });
      } catch {
        if (active) setStorage({ usage: 0, quota: 0, persisted: false });
      }
    };

    void loadStorage();
    return () => {
      active = false;
    };
  }, []);

  const storagePercent =
    storage?.quota && storage.quota > 0
      ? Math.min(100, Math.max(1.5, (storage.usage / storage.quota) * 100))
      : 0;

  const systemReport = [
    'Nimvelis Aurora 0.4',
    `Device: ${profile.device}`,
    `Browser: ${profile.browser}`,
    `Processor: ${profile.processor}`,
    `Display: ${profile.display}`,
    `Language: ${profile.language}`,
    `Appearance: ${capitalize(appearance)}`,
    `Atmosphere: ${capitalize(wallpaper)}`,
    `Open windows: ${openWindowCount}`,
    storage?.quota
      ? `Local storage: ${formatBytes(storage.usage)} used of ${formatBytes(storage.quota)}`
      : 'Local storage: Browser managed',
  ].join('\n');

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(systemReport);
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="about-device"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="about-device__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-device-title"
      >
        <header className="about-device__titlebar">
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close About This Device"
            onClick={onClose}
          >
            <Icon name="close" size={12} />
          </button>
          <span>About This Device</span>
          <i aria-hidden="true" />
        </header>

        <div className="about-device__hero">
          <div className="about-device__mark" aria-hidden="true">
            <NimvelisMark size={82} />
            <span />
          </div>
          <div>
            <p>NIMVELIS LOCAL SPACE</p>
            <h1 id="about-device-title">Nimvelis Aurora</h1>
            <strong>Version 0.4</strong>
            <span>Browser-native personal workspace</span>
          </div>
        </div>

        <div className="about-device__status">
          <span className="status-dot" />
          <strong>Local-first system</strong>
          <span>Ready · No account required</span>
        </div>

        <dl className="about-device__specs">
          <div>
            <dt>Device</dt>
            <dd>{profile.device}</dd>
          </div>
          <div>
            <dt>Browser</dt>
            <dd>{profile.browser}</dd>
          </div>
          <div>
            <dt>Processor</dt>
            <dd>{profile.processor}</dd>
          </div>
          <div>
            <dt>Display</dt>
            <dd>{profile.display}</dd>
          </div>
          <div>
            <dt>Appearance</dt>
            <dd>
              {capitalize(appearance)} · {capitalize(wallpaper)}
            </dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd>
              {openWindowCount} open window{openWindowCount === 1 ? '' : 's'} · {profile.language}
            </dd>
          </div>
        </dl>

        <section className="about-device__storage" aria-label="Local storage">
          <div>
            <span>LOCAL STORAGE</span>
            <strong>
              {storage?.quota
                ? `${formatBytes(storage.usage)} of ${formatBytes(storage.quota)} used`
                : storage
                  ? 'Quota managed by this browser'
                  : 'Estimating available space…'}
            </strong>
          </div>
          <div className="about-device__storage-bar" aria-hidden="true">
            <i style={{ width: `${storagePercent}%` }} />
          </div>
          <p>
            <Icon name="files" size={14} />
            Files stay in this browser
            {storage?.persisted ? ' · Persistent storage granted' : ''}
          </p>
        </section>

        <footer className="about-device__footer">
          <span>Original interface · MIT licensed</span>
          <button type="button" onClick={() => void copyReport()}>
            {copied ? <Icon name="check" size={14} /> : null}
            {copied ? 'Copied' : 'Copy System Report'}
          </button>
          <button
            className="is-primary"
            type="button"
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
          >
            System Settings
          </button>
        </footer>
      </section>
    </div>
  );
}

function readSystemProfile() {
  const browserNavigator = navigator as NavigatorWithDeviceHints;
  const userAgent = navigator.userAgent;
  const platform = browserNavigator.userAgentData?.platform || navigator.platform || 'Web device';
  const device = detectDevice(platform, userAgent);
  const browser = detectBrowser(userAgent, browserNavigator.userAgentData?.brands);
  const memory = browserNavigator.deviceMemory
    ? ` · ~${browserNavigator.deviceMemory} GB memory`
    : '';
  const cores = navigator.hardwareConcurrency
    ? `${navigator.hardwareConcurrency} logical cores`
    : 'Browser-managed processor';

  return {
    browser,
    device,
    processor: `${cores}${memory}`,
    display: `${globalThis.innerWidth} × ${globalThis.innerHeight} · ${devicePixelRatio.toFixed(1)}×`,
    language: navigator.language || 'Default language',
  };
}

function detectDevice(platform: string, userAgent: string) {
  const source = `${platform} ${userAgent}`.toLocaleLowerCase();
  if (source.includes('iphone') || source.includes('ipad')) return 'iOS device';
  if (source.includes('android')) return 'Android device';
  if (source.includes('mac')) return 'Mac';
  if (source.includes('win')) return 'Windows PC';
  if (source.includes('linux')) return 'Linux computer';
  return platform;
}

function detectBrowser(userAgent: string, brands?: Array<{ brand: string; version: string }>) {
  const brand = brands?.find(
    (item) =>
      !['Not.A/Brand', 'Not A(Brand'].some((placeholder) => item.brand.includes(placeholder)),
  );
  if (userAgent.includes('Edg/')) return `Microsoft Edge ${readVersion(userAgent, 'Edg/')}`;
  if (userAgent.includes('Firefox/')) return `Firefox ${readVersion(userAgent, 'Firefox/')}`;
  if (userAgent.includes('Chrome/')) return `Chrome ${readVersion(userAgent, 'Chrome/')}`;
  if (userAgent.includes('Safari/') && userAgent.includes('Version/')) {
    return `Safari ${readVersion(userAgent, 'Version/')}`;
  }
  return brand ? `${brand.brand} ${brand.version}` : 'Modern web browser';
}

function readVersion(userAgent: string, marker: string) {
  return userAgent.split(marker)[1]?.split(/[ .]/u)[0] ?? '';
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: value >= 10 ? 0 : 1 })} ${units[exponent]}`;
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}
