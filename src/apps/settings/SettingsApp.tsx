import { useEffect, useState, type ReactNode } from 'react';
import { AppIcon, Icon, type IconName } from '../../design/Icon';
import { listAppManifests } from '../../kernel/app-registry/registry';
import type { AppPermission, SystemAppProps } from '../../kernel/app-registry/types';
import { DEFAULT_SHELF_APP_IDS } from '../../kernel/shelf/order';
import {
  getSystemTimeZone,
  resolveTimeZone,
  TIME_ZONES,
  type TimeZoneId,
  type WeekStartsOn,
} from '../../kernel/time';
import type {
  AppearanceMode,
  ClockFormat,
  InterfaceDensity,
  TextScale,
  WallpaperId,
} from '../../state/desktop-store';
import './settings.css';

type SettingsSection = 'appearance' | 'desktop' | 'time' | 'accessibility' | 'privacy' | 'system';

const SECTIONS: Array<{
  id: SettingsSection;
  label: string;
  description: string;
  icon: IconName;
}> = [
  { id: 'appearance', label: 'Appearance', description: 'Theme and atmosphere', icon: 'wallpaper' },
  { id: 'desktop', label: 'Desktop', description: 'Icons and density', icon: 'window' },
  { id: 'time', label: 'Date & Time', description: 'Time zone and clock', icon: 'clock' },
  {
    id: 'accessibility',
    label: 'Accessibility',
    description: 'Reading and motion',
    icon: 'sparkle',
  },
  { id: 'privacy', label: 'Privacy', description: 'Permissions and data', icon: 'lock' },
  { id: 'system', label: 'System', description: 'Storage and reset', icon: 'system' },
];

const APPEARANCES: { id: AppearanceMode; label: string; icon: IconName }[] = [
  { id: 'system', label: 'Auto', icon: 'system' },
  { id: 'light', label: 'Light', icon: 'sun' },
  { id: 'dark', label: 'Dark', icon: 'moon' },
];

const WALLPAPERS: { id: WallpaperId; name: string; subtitle: string }[] = [
  { id: 'aurora', name: 'Aurora Vale', subtitle: 'Original Nimvelis artwork' },
  { id: 'solstice', name: 'Soft Solstice', subtitle: 'Warm, quiet gradient' },
  { id: 'stillness', name: 'Blue Stillness', subtitle: 'Minimal deep atmosphere' },
];

export function SettingsApp({ system }: SystemAppProps) {
  const [section, setSection] = useState<SettingsSection>('appearance');

  return (
    <div className="settings-app">
      <aside className="settings-sidebar">
        <header>
          <div className="settings-avatar">
            <Icon name="settings" size={19} />
          </div>
          <div>
            <strong>Local space</strong>
            <span>Aurora 0.8</span>
          </div>
        </header>
        <nav aria-label="Settings sections">
          {SECTIONS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`settings-nav-item ${section === item.id ? 'is-active' : ''}`}
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => setSection(item.id)}
            >
              <Icon name={item.icon} size={18} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              <Icon name="chevron" size={13} />
            </button>
          ))}
        </nav>
        <footer>
          <span className="status-dot" />
          Saved on this device
        </footer>
      </aside>
      <main className="settings-content">
        {section === 'appearance' ? <AppearanceSettings system={system} /> : null}
        {section === 'desktop' ? <DesktopSettings system={system} /> : null}
        {section === 'time' ? <TimeSettings system={system} /> : null}
        {section === 'accessibility' ? <AccessibilitySettings system={system} /> : null}
        {section === 'privacy' ? <PrivacySettings system={system} /> : null}
        {section === 'system' ? <SystemSettings system={system} /> : null}
      </main>
    </div>
  );
}

function AppearanceSettings({ system }: Pick<SystemAppProps, 'system'>) {
  return (
    <>
      <SettingsHeading
        eyebrow="PERSONALIZE"
        title="Make the space yours."
        description="Appearance and wallpaper stay on this device."
      />
      <SettingsGroup title="Appearance" description="Choose how windows and apps are rendered.">
        <div className="appearance-options">
          {APPEARANCES.map((appearance) => (
            <button
              type="button"
              key={appearance.id}
              className={`appearance-option ${
                system.appearance === appearance.id ? 'is-selected' : ''
              }`}
              aria-pressed={system.appearance === appearance.id}
              onClick={() => system.setAppearance(appearance.id)}
            >
              <span className={`appearance-preview appearance-preview--${appearance.id}`}>
                <span />
                <span />
              </span>
              <span>
                <Icon name={appearance.icon} size={16} />
                {appearance.label}
              </span>
              {system.appearance === appearance.id ? (
                <Icon name="check" className="settings-check" size={16} />
              ) : null}
            </button>
          ))}
        </div>
      </SettingsGroup>
      <SettingsGroup title="Atmosphere" description="Set the background for every workspace.">
        <div className="wallpaper-options">
          {WALLPAPERS.map((wallpaper) => (
            <button
              type="button"
              key={wallpaper.id}
              className={`wallpaper-option wallpaper-option--${wallpaper.id} ${
                system.wallpaper === wallpaper.id ? 'is-selected' : ''
              }`}
              aria-pressed={system.wallpaper === wallpaper.id}
              onClick={() => system.setWallpaper(wallpaper.id)}
            >
              <span className="wallpaper-swatch" />
              <span className="wallpaper-copy">
                <strong>{wallpaper.name}</strong>
                <small>{wallpaper.subtitle}</small>
              </span>
              {system.wallpaper === wallpaper.id ? (
                <span className="wallpaper-selected">
                  <Icon name="check" size={14} />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </SettingsGroup>
    </>
  );
}

function DesktopSettings({ system }: Pick<SystemAppProps, 'system'>) {
  const preferences = system.preferences;
  const apps = listAppManifests();
  const appById = new Map(apps.map((app) => [app.id, app]));
  const orderedApps = [
    ...preferences.shelfAppIds.flatMap((appId) => {
      const app = appById.get(appId);
      return app ? [app] : [];
    }),
    ...apps.filter((app) => !preferences.shelfAppIds.includes(app.id)),
  ];

  return (
    <>
      <SettingsHeading
        eyebrow="WORKSPACE"
        title="Shape your desktop."
        description="Control what stays visible and how much space the interface uses."
      />
      <SettingsGroup title="Desktop" description="Manage app icons and their layout.">
        <div className="settings-list">
          <SettingsRow
            title="Show desktop icons"
            description="Keep application shortcuts on every workspace."
            control={
              <Toggle
                label="Show desktop icons"
                checked={preferences.showDesktopIcons}
                onChange={(checked) => system.updatePreferences({ showDesktopIcons: checked })}
              />
            }
          />
          <SettingsRow
            title="Icon layout"
            description="Return every app icon to its original position."
            control={
              <button
                type="button"
                className="settings-action"
                onClick={() => {
                  system.resetDesktopIconPositions();
                  system.notify('Desktop icon layout reset', 'success');
                }}
              >
                Reset layout
              </button>
            }
          />
        </div>
      </SettingsGroup>
      <SettingsGroup title="Interface" description="Adjust spacing across windows and the shelf.">
        <SegmentedControl<InterfaceDensity>
          label="Interface density"
          value={preferences.interfaceDensity}
          options={[
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
          ]}
          onChange={(interfaceDensity) => system.updatePreferences({ interfaceDensity })}
        />
      </SettingsGroup>
      <SettingsGroup
        title="Shelf"
        description="Drag icons directly on the Shelf to reorder them. Removed apps stay available on the desktop, in Search, and in Overview."
      >
        <div className="shelf-settings">
          <header>
            <span>
              <strong>{preferences.shelfAppIds.length} apps in Shelf</strong>
              <small>Your order is saved on this device.</small>
            </span>
            <button
              type="button"
              className="settings-action"
              onClick={() => system.updatePreferences({ shelfAppIds: [...DEFAULT_SHELF_APP_IDS] })}
            >
              Restore default
            </button>
          </header>
          <div className="shelf-settings__apps">
            {orderedApps.map((app) => {
              const isInShelf = preferences.shelfAppIds.includes(app.id);
              return (
                <article key={app.id}>
                  <AppIcon name={app.icon} size={38} />
                  <span>
                    <strong>{app.name}</strong>
                    <small>{isInShelf ? 'Shown in Shelf' : 'Available from Overview'}</small>
                  </span>
                  <button
                    type="button"
                    className={isInShelf ? 'is-remove' : 'is-add'}
                    aria-label={
                      isInShelf ? `Remove ${app.name} from Shelf` : `Add ${app.name} to Shelf`
                    }
                    onClick={() => {
                      const shelfAppIds = isInShelf
                        ? preferences.shelfAppIds.filter((appId) => appId !== app.id)
                        : [...preferences.shelfAppIds, app.id];
                      system.updatePreferences({ shelfAppIds });
                    }}
                  >
                    {isInShelf ? 'Remove' : 'Add'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </SettingsGroup>
    </>
  );
}

function TimeSettings({ system }: Pick<SystemAppProps, 'system'>) {
  const preferences = system.preferences;
  const now = useLiveTime();
  const resolvedTimeZone = resolveTimeZone(preferences.timeZone);
  const activeTimeZone =
    preferences.timeZone === 'system' ? getSystemTimeZone() : preferences.timeZone;

  return (
    <>
      <SettingsHeading
        eyebrow="DATE & TIME"
        title="Keep your world in time."
        description="Use the device clock automatically or display Nimvelis in another time zone."
      />
      <div className="settings-time-preview">
        <span>
          {new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            second: preferences.showSeconds ? '2-digit' : undefined,
            hour12:
              preferences.clockFormat === 'system' ? undefined : preferences.clockFormat === '12h',
            timeZone: resolvedTimeZone,
          }).format(now)}
        </span>
        <div>
          <strong>
            {new Intl.DateTimeFormat(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: resolvedTimeZone,
            }).format(now)}
          </strong>
          <small>
            {activeTimeZone}
            {preferences.timeZone === 'system' ? ' · System detected' : ' · Nimvelis override'}
          </small>
        </div>
      </div>
      <SettingsGroup
        title="Time zone"
        description="This changes Nimvelis displays, not the operating system clock."
      >
        <label className="settings-select-row">
          <span>
            <strong>Display time zone</strong>
            <small>Your device time remains unchanged.</small>
          </span>
          <select
            value={preferences.timeZone}
            aria-label="Time zone"
            onChange={(event) =>
              system.updatePreferences({ timeZone: event.target.value as TimeZoneId })
            }
          >
            {TIME_ZONES.map((timeZone) => (
              <option key={timeZone.id} value={timeZone.id}>
                {timeZone.city} — {timeZone.label}
              </option>
            ))}
          </select>
        </label>
      </SettingsGroup>
      <SettingsGroup title="Menu bar clock" description="Choose how time appears at the top.">
        <div className="settings-list">
          <SegmentedControl<ClockFormat>
            label="Clock format"
            value={preferences.clockFormat}
            options={[
              { value: 'system', label: 'System' },
              { value: '12h', label: '12-hour' },
              { value: '24h', label: '24-hour' },
            ]}
            onChange={(clockFormat) => system.updatePreferences({ clockFormat })}
          />
          <SettingsRow
            title="Show date"
            description="Display the weekday and date beside the time."
            control={
              <Toggle
                label="Show date"
                checked={preferences.showDate}
                onChange={(showDate) => system.updatePreferences({ showDate })}
              />
            }
          />
          <SettingsRow
            title="Show seconds"
            description="Update the menu bar clock every second."
            control={
              <Toggle
                label="Show seconds"
                checked={preferences.showSeconds}
                onChange={(showSeconds) => system.updatePreferences({ showSeconds })}
              />
            }
          />
        </div>
      </SettingsGroup>
      <SettingsGroup title="Calendar" description="Set the first column of every month view.">
        <SegmentedControl<WeekStartsOn>
          label="Week starts on"
          value={preferences.weekStartsOn}
          options={[
            { value: 'sunday', label: 'Sunday' },
            { value: 'monday', label: 'Monday' },
          ]}
          onChange={(weekStartsOn) => system.updatePreferences({ weekStartsOn })}
        />
      </SettingsGroup>
    </>
  );
}

function AccessibilitySettings({ system }: Pick<SystemAppProps, 'system'>) {
  const preferences = system.preferences;
  return (
    <>
      <SettingsHeading
        eyebrow="ACCESSIBILITY"
        title="Tune Nimvelis for you."
        description="Reading, contrast, and motion preferences apply immediately."
      />
      <SettingsGroup title="Reading" description="Scale text throughout the desktop.">
        <SegmentedControl<TextScale>
          label="Text size"
          value={preferences.textScale}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'standard', label: 'Standard' },
            { value: 'large', label: 'Large' },
          ]}
          onChange={(textScale) => system.updatePreferences({ textScale })}
        />
        <div className={`settings-type-preview is-${preferences.textScale}`}>
          <span>Aa</span>
          <div>
            <strong>A clearer view of your work</strong>
            <small>Changes apply across system apps.</small>
          </div>
        </div>
      </SettingsGroup>
      <SettingsGroup title="Display & motion" description="Increase separation or quiet animation.">
        <div className="settings-list">
          <SettingsRow
            title="Higher contrast"
            description="Strengthen borders, text, and selected controls."
            control={
              <Toggle
                label="Higher contrast"
                checked={preferences.highContrast}
                onChange={(highContrast) => system.updatePreferences({ highContrast })}
              />
            }
          />
          <SettingsRow
            title="Reduce motion"
            description="Minimize transitions and decorative animation."
            control={
              <Toggle
                label="Reduce motion"
                checked={preferences.reduceMotion}
                onChange={(reduceMotion) => system.updatePreferences({ reduceMotion })}
              />
            }
          />
        </div>
      </SettingsGroup>
    </>
  );
}

const PERMISSION_LABELS: Record<AppPermission, string> = {
  'ai:generate': 'Workers AI',
  'appearance:write': 'Appearance',
  'bluetooth:request': 'Bluetooth picker',
  'clipboard:read': 'Read clipboard',
  'clipboard:write': 'Write clipboard',
  'display:capture': 'Screen capture',
  'files:read': 'Read local files',
  'files:write': 'Write local files',
  'network:access': 'Network access',
  'notifications:read': 'Notifications',
  'storage:read': 'Storage metrics',
  'window:open': 'Open windows',
  'window:read': 'View windows',
  'window:write': 'Manage windows',
};

function PrivacySettings({ system }: Pick<SystemAppProps, 'system'>) {
  const [permissionStates, setPermissionStates] = useState<
    Record<string, PermissionState | 'prompt'>
  >({});
  const [profileName, setProfileName] = useState(system.session.profileName);
  const apps = listAppManifests().filter((app) => (app.permissions?.length ?? 0) > 0);

  useEffect(() => {
    let active = true;
    const readPermissions = async () => {
      const descriptors = [
        ['clipboard-read', 'Clipboard read'],
        ['clipboard-write', 'Clipboard write'],
        ['notifications', 'Notifications'],
        ['camera', 'Camera'],
        ['microphone', 'Microphone'],
      ] as const;
      const results = await Promise.all(
        descriptors.map(async ([name, label]) => {
          try {
            const result = await navigator.permissions?.query({
              name: name as PermissionName,
            });
            return [label, result?.state ?? 'prompt'] as const;
          } catch {
            return [label, 'prompt'] as const;
          }
        }),
      );
      if (active) setPermissionStates(Object.fromEntries(results));
    };
    void readPermissions();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SettingsHeading
        eyebrow="PRIVACY"
        title="Clear boundaries, by design."
        description="Review what system apps can request and what remains inside this browser."
      />
      <SettingsGroup
        title="Local session"
        description="The profile label appears on the lock screen and never leaves this device."
      >
        <div className="privacy-profile">
          <span>{profileName.slice(0, 1).toLocaleUpperCase()}</span>
          <label>
            <strong>Profile name</strong>
            <input
              aria-label="Local profile name"
              value={profileName}
              maxLength={32}
              onChange={(event) => setProfileName(event.target.value)}
              onBlur={() => {
                const normalized = profileName.trim().slice(0, 32) || system.session.profileName;
                system.setProfileName(normalized);
                setProfileName(normalized);
              }}
            />
          </label>
          <button type="button" onClick={system.lockSession}>
            <Icon name="lock" size={14} />
            Lock now
          </button>
        </div>
      </SettingsGroup>
      <SettingsGroup
        title="Browser permission gates"
        description="Only the browser can grant or revoke these. Nimvelis requests them after an explicit action."
      >
        <div className="permission-gates">
          {Object.entries(permissionStates).map(([label, state]) => (
            <article key={label}>
              <span className={`is-${state}`}>
                <Icon name={state === 'granted' ? 'check' : 'lock'} size={14} />
              </span>
              <strong>{label}</strong>
              <small>{formatPermissionState(state)}</small>
            </article>
          ))}
        </div>
      </SettingsGroup>
      <SettingsGroup
        title="Application capabilities"
        description="These declarations describe the maximum Nimvelis capability each built-in app uses."
      >
        <div className="app-permissions">
          {apps.map((app) => (
            <article key={app.id}>
              <AppIcon name={app.icon} size={37} />
              <span>
                <strong>{app.name}</strong>
                <small>{app.description}</small>
              </span>
              <div>
                {app.permissions?.map((permission) => (
                  <i key={permission}>{PERMISSION_LABELS[permission]}</i>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SettingsGroup>
      <SettingsGroup
        title="Clipboard privacy"
        description="Stash imports only after you press Paste. It does not monitor clipboard changes in the background."
      >
        <div className="settings-danger-zone">
          <div>
            <strong>Clear Stash history</strong>
            <p>Deletes locally stored clipboard text and image data, including pinned items.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!globalThis.confirm('Clear all local Stash clipboard history?')) return;
              void system.clipboard
                .clear()
                .then(() => system.notify('Stash history cleared', 'success'));
            }}
          >
            Clear clipboard
          </button>
        </div>
      </SettingsGroup>
    </>
  );
}

function SystemSettings({ system }: Pick<SystemAppProps, 'system'>) {
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const appCount = listAppManifests().length;

  useEffect(() => {
    let active = true;
    void navigator.storage?.estimate().then((estimate) => {
      if (active && estimate.usage !== undefined && estimate.quota !== undefined) {
        setStorage({ usage: estimate.usage, quota: estimate.quota });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SettingsHeading
        eyebrow="SYSTEM"
        title="This local space."
        description="A transparent summary of what Nimvelis stores and provides."
      />
      <div className="settings-summary">
        <article>
          <Icon name="window" size={20} />
          <strong>{appCount}</strong>
          <span>Built-in apps</span>
        </article>
        <article>
          <Icon name="files" size={20} />
          <strong>{storage ? formatBytes(storage.usage) : 'Local'}</strong>
          <span>{storage ? `of ${formatBytes(storage.quota)}` : 'Private storage'}</span>
        </article>
        <article>
          <Icon name="vela" size={20} />
          <strong>Optional</strong>
          <span>Workers AI</span>
        </article>
      </div>
      <SettingsGroup title="Data & privacy" description="Your local apps work without an account.">
        <div className="settings-info">
          <span>
            <Icon name="check" size={15} />
          </span>
          <div>
            <strong>Local-first by default</strong>
            <p>
              Tasks, calendar events, notes, settings, Terminal history, Luma best scores, and files
              stay in browser storage on this device. Browser bookmarks and visited-address history
              are local too. Terminal commands are limited to Nimvelis capabilities, Bluetooth
              always uses the browser permission picker, and Vela only sends a prompt when you
              submit one.
            </p>
          </div>
        </div>
      </SettingsGroup>
      <SettingsGroup
        title="Restore defaults"
        description="Keep your content while resetting display preferences."
      >
        <div className="settings-danger-zone">
          <div>
            <strong>Reset system settings</strong>
            <p>
              Restores appearance, wallpaper, Shelf, clock, accessibility, and desktop icon layout.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!globalThis.confirm('Reset system settings and desktop icon layout?')) return;
              system.setAppearance('system');
              system.setWallpaper('aurora');
              system.resetPreferences();
              system.resetDesktopIconPositions();
              system.notify('System settings restored', 'success');
            }}
          >
            Reset settings
          </button>
        </div>
      </SettingsGroup>
    </>
  );
}

function formatPermissionState(state: PermissionState | 'prompt') {
  if (state === 'granted') return 'Allowed by browser';
  if (state === 'denied') return 'Blocked by browser';
  return 'Ask when needed';
}

function SettingsHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="settings-heading">
      <span className="settings-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const id = `settings-${title.toLocaleLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className="settings-section" aria-labelledby={id}>
      <header>
        <h3 id={id}>{title}</h3>
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}

function SettingsRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="settings-row">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      {control}
    </div>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      className={`settings-toggle ${checked ? 'is-on' : ''}`}
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="settings-segmented-row">
      <strong>{label}</strong>
      <div className="settings-segmented" aria-label={label}>
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={option.value === value ? 'is-selected' : ''}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(1)} GB`;
}

function useLiveTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = globalThis.setInterval(() => setNow(new Date()), 1_000);
    return () => globalThis.clearInterval(interval);
  }, []);
  return now;
}
