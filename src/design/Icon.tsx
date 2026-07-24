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
  calculator: ['#083844', '#0ca08f', '#7dffe0'],
  memo: ['#6d3147', '#ee8c67', '#ffe1a3'],
  settings: ['#273142', '#71809a', '#d7e8ff'],
  files: ['#075175', '#26aee2', '#a9f7ff'],
  text: ['#45346f', '#9a67de', '#f6d1ff'],
  view: ['#692f4b', '#eb6f78', '#ffd59d'],
  vela: ['#062d61', '#12a6c2', '#a8fff0'],
  tasks: ['#0b4b43', '#26af83', '#b8ffe0'],
  calendar: ['#173f7d', '#4b8bea', '#cce8ff'],
  clock: ['#783928', '#ef8c56', '#ffe2a7'],
  connections: ['#064b6e', '#2a9fd1', '#b8f4ff'],
  terminal: ['#07151e', '#263c4a', '#72f5c7'],
  luma: ['#211354', '#7545d8', '#ffd772'],
} as const;

export function AppIcon({ name, size = 56, className = '', ...props }: AppIconProps) {
  const rawId = useId().replaceAll(':', '');
  const palette =
    APP_ICON_PALETTES[name as keyof typeof APP_ICON_PALETTES] ?? APP_ICON_PALETTES.settings;
  const backgroundId = `${rawId}-background`;
  const glowId = `${rawId}-glow`;
  const glossId = `${rawId}-gloss`;
  const rimId = `${rawId}-rim`;
  const surfaceShadowId = `${rawId}-surface-shadow`;
  const artworkShadowId = `${rawId}-artwork-shadow`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={`app-icon-art app-icon-art--${name} ${className}`.trim()}
      {...props}
    >
      <defs>
        <linearGradient id={backgroundId} x1="8" y1="5" x2="58" y2="60">
          <stop stopColor={palette[1]} />
          <stop offset=".52" stopColor={palette[0]} />
          <stop offset="1" stopColor="#0b1227" />
        </linearGradient>
        <radialGradient
          id={glowId}
          cx="0"
          cy="0"
          r="1"
          gradientTransform="translate(19 13) rotate(48) scale(49)"
        >
          <stop stopColor={palette[2]} stopOpacity=".62" />
          <stop offset=".62" stopColor={palette[1]} stopOpacity=".08" />
          <stop offset="1" stopColor={palette[0]} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={glossId} x1="18" y1="3" x2="39" y2="43">
          <stop stopColor="white" stopOpacity=".38" />
          <stop offset=".45" stopColor="white" stopOpacity=".06" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={rimId} x1="8" y1="5" x2="56" y2="59">
          <stop stopColor="white" stopOpacity=".48" />
          <stop offset=".5" stopColor="white" stopOpacity=".12" />
          <stop offset="1" stopColor="white" stopOpacity=".28" />
        </linearGradient>
        <filter id={surfaceShadowId} x="-24%" y="-20%" width="148%" height="158%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#030714" floodOpacity=".42" />
        </filter>
        <filter id={artworkShadowId} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" floodColor="#020612" floodOpacity=".3" />
        </filter>
      </defs>
      <g filter={`url(#${surfaceShadowId})`}>
        <path
          d="M14 4h35c7 0 11 5 11 12v34c0 6-4 10-10 10H14C8 60 4 56 4 50V15C4 8.5 8 4 14 4Z"
          fill={`url(#${backgroundId})`}
        />
        <path
          d="M14 4.75h35c6.4 0 10.25 4.55 10.25 11.25v34c0 5.6-3.65 9.25-9.25 9.25H14c-5.6 0-9.25-3.65-9.25-9.25V15c0-6.1 3.65-10.25 9.25-10.25Z"
          fill={`url(#${glowId})`}
          stroke={`url(#${rimId})`}
          strokeWidth="1.4"
        />
        <path
          d="M8 25C13 9 32 3 50 9c4 1.3 7 3.5 9 6.4C44 9.8 25 12.5 8 25Z"
          fill={`url(#${glossId})`}
        />
        <path
          d="M9 49c12 5.5 32 6.7 46-1"
          stroke="#020718"
          strokeOpacity=".22"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <g filter={`url(#${artworkShadowId})`}>
        {name === 'calculator' && <CalculatorArtwork accent={palette[2]} />}
        {name === 'memo' && <MemoArtwork accent={palette[2]} />}
        {name === 'settings' && <SettingsArtwork accent={palette[2]} />}
        {name === 'files' && <FilesArtwork accent={palette[2]} />}
        {name === 'text' && <TextArtwork accent={palette[2]} />}
        {name === 'view' && <ViewArtwork accent={palette[2]} />}
        {name === 'vela' && <VelaArtwork accent={palette[2]} />}
        {name === 'tasks' && <TasksArtwork accent={palette[2]} />}
        {name === 'calendar' && <CalendarArtwork accent={palette[2]} />}
        {name === 'clock' && <ClockArtwork accent={palette[2]} />}
        {name === 'connections' && <ConnectionsArtwork accent={palette[2]} />}
        {name === 'terminal' && <TerminalArtwork accent={palette[2]} />}
        {name === 'luma' && <LumaArtwork accent={palette[2]} />}
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

function CalculatorArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M18 15h28a4 4 0 0 1 4 4v26a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5V19a4 4 0 0 1 4-4Z"
        fill="#07111f"
        fillOpacity=".62"
        stroke="white"
        strokeOpacity=".16"
      />
      <path
        d="M20 22h20"
        stroke="white"
        strokeOpacity=".82"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="21" cy="33" r="3" fill="white" fillOpacity=".76" />
      <circle cx="31" cy="33" r="3" fill="white" fillOpacity=".42" />
      <circle cx="21" cy="43" r="3" fill="white" fillOpacity=".42" />
      <path
        d="M30.5 43h1"
        stroke="white"
        strokeOpacity=".76"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M43 31v14" stroke={accent} strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function MemoArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="m18 15 26-3 6 8-3 30-28 2-6-8 2-24Z"
        fill="#fffaf0"
        fillOpacity=".93"
        stroke="white"
        strokeOpacity=".38"
      />
      <path d="m18 15-3 15 5-4 4-11Z" fill={accent} fillOpacity=".76" />
      <path d="m44 12 6 8-7 1Z" fill="#381c42" fillOpacity=".5" />
      <path
        d="m25 29 16-1M23 36l18-1M22 43l13-1"
        stroke="#673a57"
        strokeOpacity=".72"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="42.5" cy="43" r="3.5" fill={accent} />
    </g>
  );
}

function SettingsArtwork({ accent }: { accent: string }) {
  const teeth = Array.from({ length: 8 }, (_, index) => index * 45);

  return (
    <g>
      {teeth.map((rotation) => (
        <rect
          key={rotation}
          x="28.5"
          y="11"
          width="7"
          height="13"
          rx="3.5"
          fill="#edf3fb"
          transform={`rotate(${rotation} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="16.5" fill="#e7edf7" />
      <circle
        cx="32"
        cy="32"
        r="13"
        fill="#8592a7"
        stroke="white"
        strokeOpacity=".64"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="32" r="7.5" fill="#263244" />
      <circle cx="32" cy="32" r="3.6" fill={accent} />
      <path
        d="M22 24.5c4-5 11.5-7.2 17.5-3.2"
        stroke="white"
        strokeOpacity=".68"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
}

function FilesArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M12 23c0-4 3-7 7-7h9l5 5h14c3 0 5 2 5 5v21c0 4-3 7-7 7H18c-4 0-7-3-7-7Z"
        fill="#eefeff"
        fillOpacity=".9"
      />
      <path d="M12 27h40v20c0 4-3 7-7 7H18c-4 0-7-3-7-7Z" fill={accent} fillOpacity=".7" />
      <path
        d="m18 42 9-9 7 7 5-5 8 8"
        stroke="#153d59"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="42" cy="31" r="3" fill="#153d59" fillOpacity=".72" />
    </g>
  );
}

function TextArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path d="m18 12 25 2 6 7-3 32-30-2-4-8 3-27Z" fill="#fbf8ff" fillOpacity=".94" />
      <path d="m43 14 6 7-7-1Z" fill="#3a326a" fillOpacity=".42" />
      <path
        d="M23 27h18M22 34h18M21 41h13"
        stroke="#554c88"
        strokeOpacity=".72"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="m37 47 10-11 4 4-10 11-6 2Z" fill={accent} />
    </g>
  );
}

function ViewArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M10 32s8-13 22-13 22 13 22 13-8 13-22 13S10 32 10 32Z"
        fill="#fff8ed"
        fillOpacity=".9"
      />
      <circle cx="32" cy="32" r="9" fill="#563651" />
      <circle cx="32" cy="32" r="5" fill={accent} />
      <circle cx="29" cy="29" r="2" fill="white" fillOpacity=".92" />
    </g>
  );
}

function VelaArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M13 19.5A7.5 7.5 0 0 1 20.5 12h23A7.5 7.5 0 0 1 51 19.5v19a7.5 7.5 0 0 1-7.5 7.5H30l-10.5 7v-7a7.4 7.4 0 0 1-6.5-7.4Z"
        fill="#f3ffff"
        fillOpacity=".94"
      />
      <path
        d="M19 35c4.5-9.5 8.5-10 12.5-3.5 3.2 5.2 7 4.5 13.5-6"
        stroke="#087d99"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M20 39c5.5-4.7 9.8-4.5 13 0 2.5 3.5 6 3.2 11-1.8"
        stroke={accent}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M39 17.5c.5 3.5 2.5 5.5 6 6-3.5.5-5.5 2.5-6 6-.5-3.5-2.5-5.5-6-6 3.5-.5 5.5-2.5 6-6Z"
        fill={accent}
      />
    </g>
  );
}

function TasksArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M17 13h30a4 4 0 0 1 4 4v31a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5V17a4 4 0 0 1 4-4Z"
        fill="#f5fffb"
        fillOpacity=".92"
      />
      <path
        d="m20 25 3 3 6-7M20 37l3 3 6-7"
        stroke="#167669"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 25h10M34 37h10M20 47h22"
        stroke="#23534f"
        strokeOpacity=".72"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="46" cy="17" r="4" fill={accent} />
    </g>
  );
}

function CalendarArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M14 19a5 5 0 0 1 5-5h27a5 5 0 0 1 5 5v28a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5Z"
        fill="#f7fbff"
        fillOpacity=".94"
      />
      <path d="M14 25h37v-6a5 5 0 0 0-5-5H19a5 5 0 0 0-5 5Z" fill={accent} fillOpacity=".82" />
      <path d="M22 11v7M43 11v7" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <g fill="#365c91">
        <rect x="21" y="31" width="6" height="6" rx="2" />
        <rect x="30" y="31" width="6" height="6" rx="2" opacity=".55" />
        <rect x="39" y="31" width="6" height="6" rx="2" opacity=".55" />
        <rect x="21" y="40" width="6" height="6" rx="2" opacity=".55" />
        <rect x="30" y="40" width="6" height="6" rx="2" />
      </g>
    </g>
  );
}

function ClockArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <circle
        cx="32"
        cy="32"
        r="20"
        fill="#fff9f2"
        fillOpacity=".94"
        stroke="white"
        strokeOpacity=".46"
        strokeWidth="2"
      />
      <circle cx="32" cy="32" r="14" fill="#4a304e" fillOpacity=".14" />
      <path
        d="M32 20v12l8 5"
        stroke="#573c56"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="3.2" fill={accent} />
      <path d="M32 15v3M49 32h-3M32 49v-3M15 32h3" stroke="#6b4b61" strokeWidth="2" />
    </g>
  );
}

function ConnectionsArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <circle
        cx="32"
        cy="34"
        r="19"
        fill="#effcff"
        fillOpacity=".12"
        stroke="white"
        strokeOpacity=".18"
      />
      <path
        d="M18 28c8-7 20-7 28 0M23 34c5-4.3 13-4.3 18 0M28 40c2.3-1.8 5.7-1.8 8 0"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="46" r="3" fill={accent} />
      <path
        d="m45 14 7 8-4 4V10l4 4-7 8"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function TerminalArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M13 17a5 5 0 0 1 5-5h29a5 5 0 0 1 5 5v29a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6Z"
        fill="#07101e"
        fillOpacity=".9"
        stroke="white"
        strokeOpacity=".24"
      />
      <path d="M13 21h39" stroke="white" strokeOpacity=".17" />
      <circle cx="19" cy="17" r="1.8" fill="#ff8e8e" />
      <circle cx="25" cy="17" r="1.8" fill="#ffd37a" />
      <circle cx="31" cy="17" r="1.8" fill={accent} />
      <path
        d="m20 31 6 5-6 5M31 41h12"
        stroke="#eaf8ff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="45" cy="31" r="3" fill={accent} fillOpacity=".82" />
    </g>
  );
}

function LumaArtwork({ accent }: { accent: string }) {
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
      <rect
        x="12"
        y="12"
        width="40"
        height="40"
        rx="13"
        fill="#090d2c"
        fillOpacity=".8"
        stroke="white"
        strokeOpacity=".24"
      />
      <path d="m20 20 20 20M40 20 20 40" stroke="#9d7dff" strokeOpacity=".25" strokeWidth="1.2" />
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
      <circle cx="47" cy="15" r="2.3" fill="#ff9ed2" />
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
