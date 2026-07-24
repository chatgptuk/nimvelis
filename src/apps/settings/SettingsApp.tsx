import { Icon, type IconName } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import type { AppearanceMode, WallpaperId } from '../../state/desktop-store';
import './settings.css';

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
  return (
    <div className="settings-app">
      <aside className="settings-sidebar">
        <div className="settings-avatar">
          <Icon name="sparkle" size={18} />
        </div>
        <div>
          <strong>Local space</strong>
          <span>Aurora 0.4</span>
        </div>
        <nav aria-label="Settings sections">
          <button type="button" className="settings-nav-item is-active">
            <Icon name="wallpaper" size={18} />
            Appearance
          </button>
          <button type="button" className="settings-nav-item" disabled>
            <Icon name="window" size={18} />
            Desktop
            <span>Soon</span>
          </button>
        </nav>
      </aside>
      <main className="settings-content">
        <div className="settings-heading">
          <span className="settings-eyebrow">PERSONALIZE</span>
          <h2>Make the space yours.</h2>
          <p>Appearance and wallpaper stay on this device.</p>
        </div>

        <section className="settings-section" aria-labelledby="appearance-heading">
          <h3 id="appearance-heading">Appearance</h3>
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
                {system.appearance === appearance.id && (
                  <Icon name="check" className="settings-check" size={16} />
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section" aria-labelledby="wallpaper-heading">
          <h3 id="wallpaper-heading">Atmosphere</h3>
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
                {system.wallpaper === wallpaper.id && (
                  <span className="wallpaper-selected">
                    <Icon name="check" size={14} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
