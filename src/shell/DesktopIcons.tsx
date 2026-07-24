import { useState } from 'react';
import { Icon } from '../design/Icon';
import type { AppManifest } from '../kernel/app-registry/types';

interface DesktopIconsProps {
  apps: readonly AppManifest[];
  onOpen: (appId: string) => void;
}

export function DesktopIcons({ apps, onOpen }: DesktopIconsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="desktop-icons" aria-label="Desktop applications">
      {apps.map((app) => (
        <button
          key={app.id}
          type="button"
          className={`desktop-icon desktop-icon--${app.id} ${
            selected === app.id ? 'is-selected' : ''
          }`}
          aria-label={`Open ${app.name}`}
          onClick={(event) => {
            event.stopPropagation();
            setSelected(app.id);
          }}
          onDoubleClick={() => onOpen(app.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onOpen(app.id);
          }}
        >
          <span className="desktop-icon__tile">
            <Icon name={app.icon} size={28} />
          </span>
          <span>{app.name}</span>
        </button>
      ))}
    </div>
  );
}
