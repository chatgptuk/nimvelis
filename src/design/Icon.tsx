import { useId, type SVGProps } from 'react';

export type IconName =
  | 'calculator'
  | 'memo'
  | 'settings'
  | 'files'
  | 'text'
  | 'view'
  | 'vela'
  | 'tasks'
  | 'calendar'
  | 'clock'
  | 'connections'
  | 'terminal'
  | 'luma'
  | 'wifi'
  | 'bluetooth'
  | 'search'
  | 'folder'
  | 'file'
  | 'trash'
  | 'upload'
  | 'download'
  | 'arrow-left'
  | 'arrow-right'
  | 'more'
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'fullscreen'
  | 'close'
  | 'plus'
  | 'sparkle'
  | 'sun'
  | 'moon'
  | 'system'
  | 'wallpaper'
  | 'check'
  | 'chevron'
  | 'window';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  const shared = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };

  switch (name) {
    case 'calculator':
      return (
        <svg {...shared}>
          <rect x="4" y="2.8" width="16" height="18.4" rx="4" />
          <path d="M7.5 7.3h9M8 11.5h.01M12 11.5h.01M16 11.5h.01M8 15.5h.01M12 15.5h.01M16 15.5v3M8 18.5h.01M12 18.5h.01" />
        </svg>
      );
    case 'memo':
      return (
        <svg {...shared}>
          <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h8.8L20 5.7v13.8a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 5 19.5Z" />
          <path d="M15.5 2v4.5H20M8.5 11h7M8.5 15h7M8.5 19h4.5" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.55v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-1.5-1H2V10h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.06 4.2l.06.06A1.7 1.7 0 0 0 8 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 18.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );
    case 'files':
    case 'folder':
      return (
        <svg {...shared}>
          <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5Z" />
          {name === 'files' && <path d="M8 12h8M8 15h5" />}
        </svg>
      );
    case 'text':
    case 'file':
      return (
        <svg {...shared}>
          <path d="M6 3.5h8l4 4v13H6Z" />
          <path d="M14 3.5v4h4M9 12h6M9 16h6" />
          {name === 'text' && <path d="M9 9h2" />}
        </svg>
      );
    case 'view':
      return (
        <svg {...shared}>
          <path d="M2.8 12s3.2-5.2 9.2-5.2 9.2 5.2 9.2 5.2-3.2 5.2-9.2 5.2S2.8 12 2.8 12Z" />
          <circle cx="12" cy="12" r="2.8" />
        </svg>
      );
    case 'vela':
      return (
        <svg {...shared}>
          <path d="M12 3.3c4.9 0 8.7 3.4 8.7 8s-3.8 8-8.7 8c-1.1 0-2.2-.2-3.2-.5L4 21l1.4-4.3a7.7 7.7 0 0 1-2.1-5.4c0-4.6 3.8-8 8.7-8Z" />
          <path d="M7.8 11.6c2.7-.4 4.2-1.9 4.6-4.5.4 2.6 1.9 4.1 4.5 4.5-2.6.4-4.1 1.9-4.5 4.5-.4-2.6-1.9-4.1-4.6-4.5Z" />
        </svg>
      );
    case 'tasks':
      return (
        <svg {...shared}>
          <rect x="4" y="3" width="16" height="18" rx="4" />
          <path d="m7.5 8 1.5 1.5L12 6.5M14 8h2.5M7.5 14 9 15.5l3-3M14 14h2.5" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );
    case 'connections':
      return (
        <svg {...shared}>
          <path d="M3.5 9.5c5-4.3 12-4.3 17 0M6.5 13c3.2-2.7 7.8-2.7 11 0M9.7 16.4c1.4-1.1 3.2-1.1 4.6 0" />
          <circle cx="12" cy="19.2" r=".9" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'terminal':
      return (
        <svg {...shared}>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="m7 9 3 3-3 3M12.5 15H17" />
        </svg>
      );
    case 'luma':
      return (
        <svg {...shared}>
          <path d="M12 3.2c.6 4.8 3.2 7.4 8 8-.8.1-1.6.3-2.3.6M12 3.2c-.6 4.8-3.2 7.4-8 8 4.8.6 7.4 3.2 8 8 .3-2.2 1-4 2.2-5.2" />
          <circle cx="18" cy="17.8" r="2.3" />
        </svg>
      );
    case 'wifi':
      return (
        <svg {...shared}>
          <path d="M3 9c5.2-4.5 12.8-4.5 18 0M6.3 12.8c3.3-2.8 8.1-2.8 11.4 0M9.5 16.3c1.5-1.2 3.5-1.2 5 0" />
          <circle cx="12" cy="19.5" r=".8" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'bluetooth':
      return (
        <svg {...shared}>
          <path d="m8 7 8 10-4 4V3l4 4-8 10" />
        </svg>
      );
    case 'search':
      return (
        <svg {...shared}>
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m15.5 15.5 4.2 4.2" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...shared}>
          <path d="M4.5 7h15M9 3.8h6l1 3.2H8ZM7 7l.8 13h8.4L17 7M10 11v5M14 11v5" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...shared}>
          <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M4 15v5h16v-5" />
        </svg>
      );
    case 'download':
      return (
        <svg {...shared}>
          <path d="M12 4v12M7.5 11.5 12 16l4.5-4.5M4 15v5h16v-5" />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg {...shared}>
          <path d="m14.5 5-7 7 7 7" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...shared}>
          <path d="m9.5 5 7 7-7 7" />
        </svg>
      );
    case 'more':
      return (
        <svg {...shared}>
          <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'minimize':
      return (
        <svg {...shared}>
          <path d="M6 12h12" />
        </svg>
      );
    case 'maximize':
      return (
        <svg {...shared}>
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      );
    case 'restore':
      return (
        <svg {...shared}>
          <rect x="5" y="8" width="11" height="11" rx="2" />
          <path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
        </svg>
      );
    case 'fullscreen':
      return (
        <svg {...shared}>
          <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
        </svg>
      );
    case 'close':
      return (
        <svg {...shared}>
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...shared}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg {...shared}>
          <path d="M12 2.8c.7 4.8 3.4 7.5 8.2 8.2-4.8.7-7.5 3.4-8.2 8.2-.7-4.8-3.4-7.5-8.2-8.2 4.8-.7 7.5-3.4 8.2-8.2Z" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...shared}>
          <path d="M20.3 15.3A8.5 8.5 0 0 1 8.7 3.7a8.5 8.5 0 1 0 11.6 11.6Z" />
        </svg>
      );
    case 'system':
      return (
        <svg {...shared}>
          <rect x="3" y="4" width="18" height="13" rx="3" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );
    case 'wallpaper':
      return (
        <svg {...shared}>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <circle cx="8.5" cy="9" r="1.5" />
          <path d="m4 17 4.8-4.8a2 2 0 0 1 2.8 0l1.4 1.4 1-1a2 2 0 0 1 2.8 0L20 15.8" />
        </svg>
      );
    case 'check':
      return (
        <svg {...shared}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...shared}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case 'window':
      return (
        <svg {...shared}>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
        </svg>
      );
  }
}

interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

const APP_ICON_PALETTES = {
  calculator: ['#052b35', '#00a18d', '#8affdc'],
  memo: ['#7b3e0a', '#f0a238', '#fff0a3'],
  settings: ['#283241', '#71819a', '#e8f1ff'],
  files: ['#064a70', '#20aee4', '#b6f5ff'],
  text: ['#283b82', '#6576e8', '#e6eaff'],
  view: ['#51285f', '#d65a83', '#ffd59e'],
  vela: ['#071c54', '#167cc7', '#a0fff2'],
  tasks: ['#075247', '#20aa7e', '#c6ffe3'],
  calendar: ['#174581', '#4b91ef', '#d8edff'],
  clock: ['#64302b', '#ed8955', '#ffe8b4'],
  connections: ['#03486c', '#1da7d8', '#c3f6ff'],
  terminal: ['#06141c', '#1b3844', '#7effc9'],
  luma: ['#1b1052', '#7541df', '#ffda72'],
} as const;

export function AppIcon({ name, size = 56, className = '', ...props }: AppIconProps) {
  const rawId = useId().replaceAll(':', '');
  const palette =
    APP_ICON_PALETTES[name as keyof typeof APP_ICON_PALETTES] ?? APP_ICON_PALETTES.settings;
  const backgroundId = `${rawId}-background`;
  const glowId = `${rawId}-glow`;
  const glossId = `${rawId}-gloss`;
  const rimId = `${rawId}-rim`;
  const accentId = `${rawId}-accent`;
  const glassId = `${rawId}-glass`;
  const clipId = `${rawId}-clip`;
  const surfaceShadowId = `${rawId}-surface-shadow`;
  const artworkShadowId = `${rawId}-artwork-shadow`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
      className={`app-icon-art app-icon-art--${name} ${className}`.trim()}
      {...props}
    >
      <defs>
        <linearGradient id={backgroundId} x1="10" y1="5" x2="55" y2="61">
          <stop stopColor={palette[1]} />
          <stop offset=".52" stopColor={palette[0]} />
          <stop offset="1" stopColor="#07101f" />
        </linearGradient>
        <radialGradient
          id={glowId}
          cx="0"
          cy="0"
          r="1"
          gradientTransform="translate(17 12) rotate(48) scale(45)"
        >
          <stop stopColor={palette[2]} stopOpacity=".62" />
          <stop offset=".62" stopColor={palette[1]} stopOpacity=".08" />
          <stop offset="1" stopColor={palette[0]} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={glossId} x1="17" y1="4" x2="39" y2="42">
          <stop stopColor="white" stopOpacity=".48" />
          <stop offset=".45" stopColor="white" stopOpacity=".08" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={rimId} x1="8" y1="4" x2="57" y2="60">
          <stop stopColor="white" stopOpacity=".62" />
          <stop offset=".48" stopColor="white" stopOpacity=".12" />
          <stop offset="1" stopColor="white" stopOpacity=".34" />
        </linearGradient>
        <linearGradient id={accentId} x1="18" y1="14" x2="48" y2="53">
          <stop stopColor={palette[2]} />
          <stop offset=".55" stopColor={palette[1]} />
          <stop offset="1" stopColor={palette[0]} />
        </linearGradient>
        <linearGradient id={glassId} x1="18" y1="12" x2="44" y2="52">
          <stop stopColor="white" stopOpacity=".96" />
          <stop offset=".52" stopColor="#f2f6ff" stopOpacity=".88" />
          <stop offset="1" stopColor={palette[2]} stopOpacity=".72" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="4" y="4" width="56" height="56" rx="14.5" />
        </clipPath>
        <filter id={surfaceShadowId} x="-24%" y="-20%" width="148%" height="158%">
          <feDropShadow
            dx="0"
            dy="3.5"
            stdDeviation="3.2"
            floodColor="#020611"
            floodOpacity=".46"
          />
        </filter>
        <filter id={artworkShadowId} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow
            dx="0"
            dy="2.2"
            stdDeviation="1.6"
            floodColor="#020612"
            floodOpacity=".34"
          />
        </filter>
      </defs>
      <g filter={`url(#${surfaceShadowId})`}>
        <rect x="4" y="4" width="56" height="56" rx="14.5" fill={`url(#${backgroundId})`} />
        <rect
          x="4.75"
          y="4.75"
          width="54.5"
          height="54.5"
          rx="13.8"
          fill={`url(#${glowId})`}
          stroke={`url(#${rimId})`}
          strokeWidth="1.35"
        />
        <g clipPath={`url(#${clipId})`}>
          <path
            d="M5 27C11 8 32 1 51 8c5 1.8 8 5 10 8.8C44 10.5 25 13.5 5 27Z"
            fill={`url(#${glossId})`}
          />
          <ellipse cx="52" cy="57" rx="28" ry="13" fill="#020718" fillOpacity=".18" />
          <path
            d="M9 51c13 5.3 32 5.9 46-1.3"
            stroke="white"
            strokeOpacity=".12"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      </g>
      <g filter={`url(#${artworkShadowId})`}>
        {name === 'calculator' && (
          <CalculatorArtwork accent={palette[2]} accentFill={`url(#${accentId})`} />
        )}
        {name === 'memo' && <MemoArtwork accent={palette[2]} />}
        {name === 'settings' && (
          <SettingsArtwork accent={palette[2]} chromeFill={`url(#${glassId})`} />
        )}
        {name === 'files' && <FilesArtwork accent={palette[2]} accentFill={`url(#${accentId})`} />}
        {name === 'text' && <TextArtwork accent={palette[2]} />}
        {name === 'view' && <ViewArtwork accent={palette[2]} />}
        {name === 'vela' && <VelaArtwork accent={palette[2]} accentFill={`url(#${accentId})`} />}
        {name === 'tasks' && <TasksArtwork accent={palette[2]} />}
        {name === 'calendar' && (
          <CalendarArtwork accent={palette[2]} accentFill={`url(#${accentId})`} />
        )}
        {name === 'clock' && <ClockArtwork accent={palette[2]} />}
        {name === 'connections' && (
          <ConnectionsArtwork accent={palette[2]} accentFill={`url(#${accentId})`} />
        )}
        {name === 'terminal' && <TerminalArtwork accent={palette[2]} />}
        {name === 'luma' && <LumaArtwork accent={palette[2]} accentFill={`url(#${accentId})`} />}
        {![
          'calculator',
          'memo',
          'settings',
          'files',
          'text',
          'view',
          'vela',
          'tasks',
          'calendar',
          'clock',
          'connections',
          'terminal',
          'luma',
        ].includes(name) && (
          <g color="white">
            <rect x="15" y="15" width="34" height="34" rx="12" fill="white" fillOpacity=".1" />
            <path
              d="M23 32h18M32 23v18"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    </svg>
  );
}

function CalculatorArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <rect
        x="13"
        y="11"
        width="38"
        height="43"
        rx="9"
        fill="#06141b"
        fillOpacity=".88"
        stroke="white"
        strokeOpacity=".22"
      />
      <rect x="18" y="16" width="28" height="9" rx="3.2" fill="#c9fff3" fillOpacity=".9" />
      <path d="M36 20.5h6" stroke="#123a3f" strokeWidth="2.2" strokeLinecap="round" />
      <g fill="#dff8f4" fillOpacity=".88">
        <rect x="18" y="30" width="7" height="7" rx="2.5" />
        <rect x="28.5" y="30" width="7" height="7" rx="2.5" />
        <rect x="18" y="40.5" width="7" height="7" rx="2.5" />
        <rect x="28.5" y="40.5" width="7" height="7" rx="2.5" />
      </g>
      <rect x="39" y="30" width="7" height="17.5" rx="3" fill={accentFill} />
      <path
        d="M40.7 38.8h3.6M42.5 37v3.6"
        stroke="#063b37"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M16 13.5c7-3 23-3.3 31 .5" stroke={accent} strokeOpacity=".55" />
    </g>
  );
}

function MemoArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="m15 19 30-5 6 34-30 6Z"
        fill="#713711"
        fillOpacity=".34"
        transform="rotate(-5 33 34)"
      />
      <path
        d="M17 13h31a4 4 0 0 1 4 4v30l-7 7H17a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4Z"
        fill="#fff4a9"
        stroke="#fff9d8"
        strokeOpacity=".78"
      />
      <path d="M13 22h39v-5a4 4 0 0 0-4-4H17a4 4 0 0 0-4 4Z" fill="#f2a232" />
      <path d="m45 54 7-7h-7Z" fill="#d88320" />
      <path
        d="M20 31c5-2 8 2 13 0s8 1 12-1M20 38c6-1 8 2 13 0s6 0 11-1M20 45h16"
        stroke="#8c571f"
        strokeOpacity=".78"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="42.5" cy="17.5" r="2.4" fill={accent} />
      <path d="M18 16h18" stroke="white" strokeOpacity=".52" strokeLinecap="round" />
    </g>
  );
}

function SettingsArtwork({ accent, chromeFill }: { accent: string; chromeFill: string }) {
  const teeth = Array.from({ length: 8 }, (_, index) => index * 45);

  return (
    <g>
      {teeth.map((rotation) => (
        <rect
          key={rotation}
          x="28"
          y="9.5"
          width="8"
          height="14"
          rx="3"
          fill={chromeFill}
          transform={`rotate(${rotation} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="17" fill={chromeFill} />
      <circle
        cx="32"
        cy="32"
        r="12.8"
        fill="#75849a"
        stroke="white"
        strokeOpacity=".68"
        strokeWidth="1.4"
      />
      <circle cx="32" cy="32" r="7.8" fill="#202c3d" />
      <circle cx="32" cy="32" r="3.9" fill={accent} />
      <path
        d="M20.5 24c4.5-6 13-8 19.8-3"
        stroke="white"
        strokeOpacity=".72"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </g>
  );
}

function FilesArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <path
        d="M11 22a6 6 0 0 1 6-6h11l5 5h15a5 5 0 0 1 5 5v22a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6Z"
        fill="#d8f8ff"
        fillOpacity=".96"
      />
      <path d="M11 27h42v21a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6Z" fill={accentFill} />
      <path d="M14 30h36" stroke="white" strokeOpacity=".56" strokeWidth="1.5" />
      <path
        d="m18 46 9-10 7 7 5-5 8 9"
        stroke="#073b59"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="43" cy="35" r="3" fill={accent} />
      <path d="M18 20h10l3 3H15" stroke="white" strokeOpacity=".68" strokeLinecap="round" />
    </g>
  );
}

function TextArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M17 11h28a5 5 0 0 1 5 5v34a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5V16a5 5 0 0 1 5-5Z"
        fill="#fbfcff"
        fillOpacity=".96"
        stroke="white"
        strokeOpacity=".62"
      />
      <path d="M18 19h26" stroke="#c9d2f5" strokeWidth="1.5" />
      <path
        d="M20 27h16M20 34h13M20 41h11"
        stroke="#4a5794"
        strokeOpacity=".68"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path d="m36 46 11-17 5 3-10 18-7 3Z" fill="#344caa" />
      <path d="m47 29 2-3 5 3-2 3Z" fill={accent} />
      <path d="m36 46-1 7 7-3Z" fill="#17295f" />
      <path d="M16 14c8-3 21-2 30 1" stroke="white" strokeOpacity=".8" />
    </g>
  );
}

function ViewArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M12 17a5 5 0 0 1 5-5h27a5 5 0 0 1 5 5v27a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5Z"
        fill="#f7fbff"
        fillOpacity=".94"
        stroke="white"
        strokeOpacity=".54"
      />
      <path d="m15 42 9-10 7 6 6-8 9 12v4H15Z" fill="#4961a7" />
      <path d="m15 42 9-10 7 6-6 8H15Z" fill="#72c8c3" />
      <circle cx="39" cy="22" r="4" fill={accent} />
      <circle
        cx="39.5"
        cy="40"
        r="10.5"
        fill="#fff9ed"
        fillOpacity=".22"
        stroke="#fff9ed"
        strokeWidth="3.2"
      />
      <path d="m47 48 7 7" stroke="#fff9ed" strokeWidth="4" strokeLinecap="round" />
      <path d="M16 15c8-2 19-2 29 .5" stroke="white" strokeOpacity=".78" />
    </g>
  );
}

function VelaArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <circle
        cx="32"
        cy="32"
        r="20"
        fill="#061743"
        fillOpacity=".76"
        stroke="white"
        strokeOpacity=".18"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="22"
        ry="9"
        stroke={accent}
        strokeOpacity=".72"
        strokeWidth="2"
        transform="rotate(-24 32 32)"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="18"
        ry="7"
        stroke="#7b8cff"
        strokeOpacity=".48"
        strokeWidth="1.4"
        transform="rotate(54 32 32)"
      />
      <path
        d="M32 17c1 8 5 12 13 13-8 1-12 5-13 13-1-8-5-12-13-13 8-1 12-5 13-13Z"
        fill={accentFill}
      />
      <circle cx="48" cy="20" r="2.3" fill="#ffd98a" />
      <circle cx="17" cy="44" r="1.8" fill="#ff9ed2" />
      <circle cx="29" cy="27" r="2.2" fill="white" fillOpacity=".92" />
    </g>
  );
}

function TasksArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M17 14h30a5 5 0 0 1 5 5v31a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5Z"
        fill="#f5fffb"
        fillOpacity=".96"
        stroke="white"
        strokeOpacity=".5"
      />
      <rect x="24" y="10" width="16" height="8" rx="4" fill="#b9ffe0" />
      <path
        d="m19 27 3 3 6-7M19 39l3 3 6-7"
        stroke="#167669"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33 27h12M33 39h12M19 49h25"
        stroke="#23534f"
        strokeOpacity=".72"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="44" cy="18" r="3" fill={accent} />
    </g>
  );
}

function CalendarArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <path
        d="M13 18a6 6 0 0 1 6-6h27a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H19a6 6 0 0 1-6-6Z"
        fill="#f7fbff"
        fillOpacity=".97"
        stroke="white"
        strokeOpacity=".5"
      />
      <path d="M13 26h39v-8a6 6 0 0 0-6-6H19a6 6 0 0 0-6 6Z" fill={accentFill} />
      <path d="M22 9v9M43 9v9" stroke="white" strokeWidth="3.3" strokeLinecap="round" />
      <path d="M18 30h29" stroke="#c9d9ee" strokeWidth="1.3" />
      <text
        x="32.5"
        y="47"
        fill="#274f84"
        fontFamily="system-ui, sans-serif"
        fontSize="19"
        fontWeight="760"
        textAnchor="middle"
      >
        23
      </text>
      <circle cx="48" cy="19" r="2.3" fill={accent} />
    </g>
  );
}

function ClockArtwork({ accent }: { accent: string }) {
  const ticks = Array.from({ length: 12 }, (_, index) => index * 30);

  return (
    <g>
      <circle
        cx="32"
        cy="32"
        r="21"
        fill="#fff9f2"
        fillOpacity=".97"
        stroke="white"
        strokeOpacity=".6"
        strokeWidth="1.8"
      />
      <circle cx="32" cy="32" r="17.5" fill="#5f3547" fillOpacity=".09" />
      {ticks.map((rotation) => (
        <path
          key={rotation}
          d="M32 14.5v3"
          stroke="#6d4751"
          strokeWidth={rotation % 90 === 0 ? 1.8 : 1.1}
          strokeLinecap="round"
          transform={`rotate(${rotation} 32 32)`}
        />
      ))}
      <path
        d="M32 20v12l8.5 5"
        stroke="#573c56"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="3.4" fill={accent} />
      <path d="M20 18c6-5 15-6 22-1" stroke="white" strokeOpacity=".74" strokeWidth="1.8" />
    </g>
  );
}

function ConnectionsArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <circle
        cx="32"
        cy="33"
        r="21"
        fill="#052f51"
        fillOpacity=".5"
        stroke="white"
        strokeOpacity=".24"
      />
      <circle cx="32" cy="33" r="17" fill={accentFill} fillOpacity=".2" />
      <path
        d="M17 28c8.5-7.5 21.5-7.5 30 0M22 34c5.5-4.7 14.5-4.7 20 0M28 40c2.5-2 5.5-2 8 0"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="46" r="2.8" fill={accent} />
      <path
        d="m46 14 7 7-4 4V11l4 4-7 8"
        stroke="#d5f8ff"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="18" r="2.2" fill="#8fffe5" />
    </g>
  );
}

function TerminalArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M11 17a6 6 0 0 1 6-6h31a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6Z"
        fill="#030b12"
        fillOpacity=".94"
        stroke="white"
        strokeOpacity=".26"
      />
      <path d="M11 22h43" stroke="white" strokeOpacity=".18" />
      <circle cx="18" cy="16.5" r="1.8" fill="#ff7c7c" />
      <circle cx="24" cy="16.5" r="1.8" fill="#ffd06c" />
      <circle cx="30" cy="16.5" r="1.8" fill={accent} />
      <path
        d="m19 31 6 5-6 5M30 41h13"
        stroke="#eaf8ff"
        strokeWidth="2.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M30 30h13" stroke={accent} strokeOpacity=".52" strokeWidth="1.5" />
      <circle cx="46" cy="31" r="2.7" fill={accent} fillOpacity=".9" />
      <path d="M14 13.5c10-2.5 25-2 36 .5" stroke="white" strokeOpacity=".16" />
    </g>
  );
}

function LumaArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  const cells = [
    { x: 17, y: 17, fill: '#ffd772', opacity: 1 },
    { x: 27, y: 17, fill: '#fff7d1', opacity: 0.38 },
    { x: 37, y: 17, fill: '#ff9ed2', opacity: 0.9 },
    { x: 17, y: 27, fill: '#fff7d1', opacity: 0.25 },
    { x: 27, y: 27, fill: accent, opacity: 1 },
    { x: 37, y: 27, fill: '#fff7d1', opacity: 0.3 },
    { x: 17, y: 37, fill: '#a8fff0', opacity: 0.84 },
    { x: 27, y: 37, fill: '#fff7d1', opacity: 0.28 },
    { x: 37, y: 37, fill: '#ffd772', opacity: 0.94 },
  ];

  return (
    <g>
      <circle
        cx="32"
        cy="32"
        r="21"
        fill="#090a2d"
        fillOpacity=".86"
        stroke="white"
        strokeOpacity=".22"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="19"
        ry="8"
        stroke={accent}
        strokeOpacity=".2"
        transform="rotate(28 32 32)"
      />
      <path
        d="m20 20 20 20M40 20 20 40M17 32h30M32 17v30"
        stroke={accent}
        strokeOpacity=".2"
        strokeWidth="1"
      />
      {cells.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width="7"
          height="7"
          rx="2.4"
          fill={cell.fill}
          fillOpacity={cell.opacity}
          stroke="white"
          strokeOpacity={cell.opacity * 0.25}
        />
      ))}
      <circle cx="32" cy="32" r="5" fill={accentFill} fillOpacity=".32" />
      <circle cx="47" cy="15" r="2.3" fill="#ff9ed2" />
      <path d="M17 18c7-5 16-7 24-3" stroke="white" strokeOpacity=".28" strokeLinecap="round" />
    </g>
  );
}

export function NimvelisMark({ size = 24 }: { size?: number }) {
  const gradientId = `${useId().replaceAll(':', '')}-nimvelis-crest`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="nimvelis-mark"
    >
      <path
        d="M4.7 24.8 11.1 8.2c.6-1.6 2.7-1.8 3.6-.3l3.3 5.6 2.9-5.2c.9-1.5 3.1-1.1 3.5.6l3 15.9c-7.1-3.3-15.1-3.3-22.7 0Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M8.1 21.8c5.4-2.9 10.7-2.8 16.2.1"
        stroke="white"
        strokeOpacity=".82"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="m13.3 9.7 3.5 6.1-3.5 5"
        stroke="#E9FFFC"
        strokeOpacity=".44"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.4" cy="6.6" r="1.45" fill="#F7FFFE" />
      <defs>
        <linearGradient id={gradientId} x1="7" y1="5" x2="27" y2="27">
          <stop stopColor="#8AFFF0" />
          <stop offset=".46" stopColor="#7B9CFF" />
          <stop offset="1" stopColor="#FF9ECE" />
        </linearGradient>
      </defs>
    </svg>
  );
}
