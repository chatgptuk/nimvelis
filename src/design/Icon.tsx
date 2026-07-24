import { useId, type SVGProps } from 'react';

export type IconName =
  | 'browser'
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
  | 'pulse'
  | 'stash'
  | 'capture'
  | 'wifi'
  | 'bluetooth'
  | 'clipboard'
  | 'pin'
  | 'lock'
  | 'unlock'
  | 'volume'
  | 'volume-off'
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
    case 'browser':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3.5 12h17M12 3c2.7 2.5 4.1 5.5 4.1 9S14.7 18.5 12 21c-2.7-2.5-4.1-5.5-4.1-9S9.3 5.5 12 3Z" />
          <path d="m13.7 8.2-1.2 4.3-4.2 1.3 1.2-4.3Z" fill="currentColor" stroke="none" />
        </svg>
      );
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
    case 'pulse':
      return (
        <svg {...shared}>
          <path d="M3 12h4l2.2-6 4.1 12 2.2-6H21" />
          <path d="M4 20h16" strokeOpacity=".35" />
        </svg>
      );
    case 'stash':
      return (
        <svg {...shared}>
          <path d="M4 8.5h16v10A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5Z" />
          <path d="M6 3h12l2 5.5H4ZM9 12h6" />
        </svg>
      );
    case 'capture':
      return (
        <svg {...shared}>
          <path d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M16 20h3a1 1 0 0 0 1-1v-3" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg {...shared}>
          <rect x="5" y="4" width="14" height="17" rx="3" />
          <path d="M9 5V3h6v2M8.5 10h7M8.5 14h7M8.5 18h4" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...shared}>
          <path d="m8 3 8 8M7 8l-3 3 4 1 4 4 1 4 3-3M4 20l5-5" />
        </svg>
      );
    case 'lock':
    case 'unlock':
      return (
        <svg {...shared}>
          <rect x="5" y="10" width="14" height="11" rx="3" />
          <path d={name === 'lock' ? 'M8 10V7a4 4 0 0 1 8 0v3' : 'M8 10V7a4 4 0 0 1 7.5-2'} />
          <path d="M12 14v3" />
        </svg>
      );
    case 'volume':
    case 'volume-off':
      return (
        <svg {...shared}>
          <path d="M4 10v4h4l5 4V6l-5 4Z" />
          {name === 'volume' ? (
            <>
              <path d="M16 9a4 4 0 0 1 0 6" />
              <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
            </>
          ) : (
            <path d="m17 10 4 4M21 10l-4 4" />
          )}
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
  browser: ['#173a72', '#071327', '#71f4e4', '#dffefa'],
  calculator: ['#31c7b1', '#075e62', '#a9fff1', '#07363c'],
  memo: ['#ffd86a', '#e98a2f', '#fff2a8', '#714115'],
  settings: ['#9eabc0', '#435166', '#f3f7ff', '#182334'],
  files: ['#51d5f5', '#0a83ca', '#d9fbff', '#073c68'],
  text: ['#7388f7', '#3a4aac', '#eef1ff', '#26336f'],
  view: ['#ff8f9f', '#9f3e79', '#ffe8b8', '#4c214e'],
  vela: ['#366be4', '#071c59', '#8fffea', '#f2ffff'],
  tasks: ['#55d7ad', '#07806c', '#dcfff1', '#075247'],
  calendar: ['#71b7ff', '#296ed5', '#f3f8ff', '#214f96'],
  clock: ['#ffb06f', '#c35f3f', '#fff0c4', '#55394a'],
  connections: ['#51cff4', '#1178bd', '#d8fbff', '#0b5278'],
  terminal: ['#315063', '#081019', '#78ffcf', '#e8fff8'],
  luma: ['#9b6ef2', '#4520a5', '#ffe17f', '#160b3f'],
  pulse: ['#39cb95', '#075c50', '#bfffe2', '#052f2d'],
  stash: ['#a187ef', '#5b3db4', '#f1eaff', '#322263'],
  capture: ['#42c9d2', '#09697a', '#c9fffa', '#063a4a'],
} as const;

export function AppIcon({ name, size = 56, className = '', ...props }: AppIconProps) {
  const rawId = useId().replaceAll(':', '');
  const palette =
    APP_ICON_PALETTES[name as keyof typeof APP_ICON_PALETTES] ?? APP_ICON_PALETTES.settings;
  const backgroundId = `${rawId}-background`;
  const ambientId = `${rawId}-ambient`;
  const highlightId = `${rawId}-highlight`;
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
        <linearGradient id={backgroundId} x1="13" y1="4" x2="49" y2="61">
          <stop stopColor={palette[0]} />
          <stop offset=".62" stopColor={palette[1]} />
          <stop offset="1" stopColor={palette[1]} />
        </linearGradient>
        <radialGradient
          id={ambientId}
          cx="0"
          cy="0"
          r="1"
          gradientTransform="translate(15 8) rotate(45) scale(48 39)"
        >
          <stop stopColor="white" stopOpacity=".52" />
          <stop offset=".46" stopColor={palette[2]} stopOpacity=".14" />
          <stop offset="1" stopColor={palette[1]} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={highlightId} x1="11" y1="5" x2="41" y2="38">
          <stop stopColor="white" stopOpacity=".38" />
          <stop offset=".52" stopColor="white" stopOpacity=".06" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={rimId} x1="9" y1="4" x2="55" y2="60">
          <stop stopColor="white" stopOpacity=".78" />
          <stop offset=".42" stopColor="white" stopOpacity=".26" />
          <stop offset=".74" stopColor="white" stopOpacity=".06" />
          <stop offset="1" stopColor="white" stopOpacity=".32" />
        </linearGradient>
        <linearGradient id={accentId} x1="18" y1="14" x2="48" y2="53">
          <stop stopColor={palette[2]} />
          <stop offset=".62" stopColor={palette[0]} />
          <stop offset="1" stopColor={palette[1]} />
        </linearGradient>
        <linearGradient id={glassId} x1="18" y1="12" x2="44" y2="52">
          <stop stopColor="white" />
          <stop offset=".5" stopColor={palette[3]} stopOpacity=".94" />
          <stop offset="1" stopColor={palette[2]} stopOpacity=".7" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="4" y="4" width="56" height="56" rx="14.25" />
        </clipPath>
        <filter id={surfaceShadowId} x="-24%" y="-20%" width="148%" height="160%">
          <feDropShadow
            dx="0"
            dy="3.2"
            stdDeviation="2.7"
            floodColor="#020611"
            floodOpacity=".38"
          />
        </filter>
        <filter id={artworkShadowId} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow
            dx="0"
            dy="1.8"
            stdDeviation="1.35"
            floodColor="#020612"
            floodOpacity=".3"
          />
        </filter>
      </defs>
      <g filter={`url(#${surfaceShadowId})`}>
        <rect x="4" y="4" width="56" height="56" rx="14.25" fill={`url(#${backgroundId})`} />
        <rect
          x="4.75"
          y="4.75"
          width="54.5"
          height="54.5"
          rx="13.55"
          fill={`url(#${ambientId})`}
          stroke={`url(#${rimId})`}
          strokeWidth="1.15"
        />
        <g clipPath={`url(#${clipId})`}>
          <path
            d="M5 22.5C10 8.5 23 3 37 4h23v7.5C42 9.5 23 13 5 22.5Z"
            fill={`url(#${highlightId})`}
          />
          <path
            d="M9.5 52.2c12.2 4.3 31.2 4.8 45-1.5"
            stroke="white"
            strokeOpacity=".14"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path d="M5 51c11 9 37 12 55-1v10H5Z" fill="#020718" fillOpacity=".1" />
        </g>
      </g>
      <g filter={`url(#${artworkShadowId})`}>
        {name === 'browser' && (
          <BrowserArtwork accent={palette[2]} accentFill={`url(#${accentId})`} />
        )}
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
        {name === 'pulse' && <PulseArtwork accent={palette[2]} accentFill={`url(#${accentId})`} />}
        {name === 'stash' && <StashArtwork accent={palette[2]} />}
        {name === 'capture' && (
          <CaptureArtwork accent={palette[2]} accentFill={`url(#${accentId})`} />
        )}
        {![
          'browser',
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
          'pulse',
          'stash',
          'capture',
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

function PulseArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <rect
        x="10.5"
        y="14"
        width="43"
        height="34"
        rx="9"
        fill="#052b2a"
        stroke="#dffff4"
        strokeOpacity=".42"
      />
      <rect x="14" y="17.5" width="36" height="27" rx="6.5" fill={accentFill} fillOpacity=".14" />
      <path d="M18 21.5h11M18 25h7" stroke={accent} strokeOpacity=".36" strokeLinecap="round" />
      <path
        d="M14 34h8l4-11 7 20 5-13 3 4h9"
        stroke="#dffff3"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="33" cy="43" r="2" fill={accent} />
      <path
        d="M24 52h16"
        stroke="#dffff3"
        strokeOpacity=".7"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M29 48v4M35 48v4" stroke="#dffff3" strokeOpacity=".55" strokeWidth="1.6" />
    </g>
  );
}

function StashArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path d="M16 14h32l4 11H12Z" fill="#d8ccff" stroke="#faf7ff" strokeOpacity=".74" />
      <path
        d="M12 25h40l-3.2 25.5a5 5 0 0 1-5 4.5H20.2a5 5 0 0 1-5-4.5Z"
        fill="#f5f1ff"
        stroke="white"
        strokeOpacity=".62"
      />
      <path d="M12 25h40l-1.1 9H13.1Z" fill="#7654c7" />
      <path d="M23 20h18" stroke="#5b4293" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M23 40h18M25 46h14" stroke="#59467e" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26 30h12" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M17 27h30" stroke="white" strokeOpacity=".55" />
    </g>
  );
}

function CaptureArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <rect
        x="12"
        y="17"
        width="40"
        height="32"
        rx="9"
        fill="#e9fffd"
        stroke="white"
        strokeOpacity=".74"
      />
      <path d="m20 17 4-5h16l4 5Z" fill="#e9fffd" stroke="white" strokeOpacity=".62" />
      <circle cx="32" cy="33" r="13" fill="#063b4a" stroke={accent} strokeWidth="1.5" />
      <path d="m32 21 6 4-1 8-7 4-6-4 1-8Z" fill={accentFill} fillOpacity=".64" />
      <circle cx="32" cy="33" r="6.8" fill="#061d2b" />
      <circle cx="29.5" cy="30.5" r="2.4" fill={accent} fillOpacity=".92" />
      <path
        d="M10 22v-7a3 3 0 0 1 3-3h7M54 22v-7a3 3 0 0 0-3-3h-7M10 42v7a3 3 0 0 0 3 3h7M54 42v7a3 3 0 0 1-3 3h-7"
        stroke="#d8fffa"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="45" cy="23" r="2" fill={accent} />
    </g>
  );
}

function BrowserArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="#07162d"
        stroke="white"
        strokeOpacity=".52"
        strokeWidth="1.2"
      />
      <circle
        cx="32"
        cy="32"
        r="18.5"
        fill={accentFill}
        fillOpacity=".18"
        stroke={accent}
        strokeOpacity=".38"
      />
      <path
        d="M15.5 32h33M32 15.5c4.5 4.7 6.8 10.2 6.8 16.5S36.5 43.8 32 48.5c-4.5-4.7-6.8-10.2-6.8-16.5S27.5 20.2 32 15.5Z"
        stroke="#cffff8"
        strokeOpacity=".34"
        strokeWidth="1.35"
      />
      <path
        d="m40.5 20.5-5 15-15 5 5-15Z"
        fill="#ff7f72"
        stroke="#fff7ef"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m35.5 35.5-10-10" stroke="#703348" strokeOpacity=".68" strokeWidth="1.35" />
      <circle cx="32" cy="32" r="2.7" fill="#f5fffd" />
      <circle cx="32" cy="32" r="1.25" fill={accent} />
      <path
        d="M20 19c6-4 14-5 21-1"
        stroke="white"
        strokeOpacity=".52"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

function CalculatorArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <rect
        x="13.5"
        y="9.5"
        width="37"
        height="45"
        rx="9.5"
        fill="#073d43"
        stroke="white"
        strokeOpacity=".34"
      />
      <rect x="18" y="14.5" width="28" height="10.5" rx="3" fill="#d6fff6" />
      <path d="M35 20h7" stroke="#17464b" strokeWidth="2.2" strokeLinecap="round" />
      <g fill="#e9fffa">
        <circle cx="21.5" cy="32.5" r="3.5" />
        <circle cx="31.5" cy="32.5" r="3.5" />
        <circle cx="21.5" cy="42.5" r="3.5" />
        <circle cx="31.5" cy="42.5" r="3.5" />
      </g>
      <rect x="38" y="29" width="8" height="17" rx="4" fill={accentFill} />
      <path
        d="M39.7 37.5h4.6M42 35.2v4.6"
        stroke="#063b37"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M17 13c8-2.3 21-2.3 30 .2"
        stroke={accent}
        strokeOpacity=".4"
        strokeLinecap="round"
      />
    </g>
  );
}

function MemoArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="m17 14 31 5-5 34-31-5Z"
        fill="#a85a22"
        fillOpacity=".42"
        transform="rotate(-3 30 34)"
      />
      <path d="M14 11h36v35l-9 9H14Z" fill="#fff0a0" stroke="#fffbd7" strokeOpacity=".76" />
      <path d="M14 11h36v10H14Z" fill="#ffc34f" />
      <path d="m41 55 9-9h-9Z" fill="#e59b2d" />
      <path
        d="M20 29h23M20 36h18M20 43h21"
        stroke="#7a4a18"
        strokeOpacity=".72"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M21 16h17"
        stroke="white"
        strokeOpacity=".6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="44.5" cy="16" r="2.2" fill={accent} />
    </g>
  );
}

function SettingsArtwork({ accent, chromeFill }: { accent: string; chromeFill: string }) {
  const teeth = Array.from({ length: 10 }, (_, index) => index * 36);

  return (
    <g>
      {teeth.map((rotation) => (
        <rect
          key={rotation}
          x="28.2"
          y="8.5"
          width="8"
          height="15"
          rx="2.8"
          fill={chromeFill}
          transform={`rotate(${rotation} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="18.5" fill={chromeFill} />
      <circle
        cx="32"
        cy="32"
        r="13.2"
        fill="#64748b"
        stroke="white"
        strokeOpacity=".58"
        strokeWidth="1.25"
      />
      <circle cx="32" cy="32" r="8.2" fill="#182334" />
      <circle cx="32" cy="32" r="4.2" fill={accent} />
      <path
        d="M19 23.5c5-7 14.5-8.8 22-3"
        stroke="white"
        strokeOpacity=".66"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M22 44c5 3.4 13 3.7 19-.7" stroke="#142033" strokeOpacity=".35" strokeWidth="1.4" />
    </g>
  );
}

function FilesArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <path
        d="M10.5 21a6 6 0 0 1 6-6h11l5 5H48a5.5 5.5 0 0 1 5.5 5.5V48a6 6 0 0 1-6 6h-31a6 6 0 0 1-6-6Z"
        fill="#d9faff"
        stroke="white"
        strokeOpacity=".54"
      />
      <path d="M10.5 27h43v21a6 6 0 0 1-6 6h-31a6 6 0 0 1-6-6Z" fill={accentFill} />
      <path d="M14 30h36" stroke="white" strokeOpacity=".6" strokeWidth="1.4" />
      <path
        d="m17 46 10-11 7 7 5-5 9 10"
        stroke="#063c65"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="43" cy="35" r="3" fill={accent} />
      <path d="M17 19.5h10.5l3 3H14.5" stroke="white" strokeOpacity=".74" strokeLinecap="round" />
    </g>
  );
}

function TextArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <rect
        x="12"
        y="11"
        width="40"
        height="43"
        rx="10"
        fill="#1f2b68"
        stroke="white"
        strokeOpacity=".34"
      />
      <rect x="16" y="15" width="32" height="35" rx="7" fill="#f6f7ff" />
      <path d="M21 22h22" stroke="#cfd6ff" strokeWidth="1.5" />
      <path
        d="M22 26h19"
        stroke="#5260a9"
        strokeOpacity=".55"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M25 42 31.8 24h2.4L41 42M27.6 35.5h10.8"
        stroke="#33449d"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m42 47 7-13 4 2.3-7 13-5 3Z"
        fill={accent}
        stroke="#ffffff"
        strokeOpacity=".62"
        strokeWidth=".8"
      />
      <path d="m41 52 1-5 4 2.3Z" fill="#26336f" />
    </g>
  );
}

function ViewArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M8.5 32c5.8-10.8 14-16 23.5-16s17.7 5.2 23.5 16C49.7 42.8 41.5 48 32 48S14.3 42.8 8.5 32Z"
        fill="#fff4e5"
        stroke="white"
        strokeOpacity=".58"
      />
      <circle cx="32" cy="32" r="13.5" fill="#5a2456" />
      <circle cx="32" cy="32" r="8.2" fill="#ffd18b" />
      <circle cx="32" cy="32" r="4.5" fill="#402044" />
      <circle cx="29.5" cy="29.5" r="2.1" fill="white" fillOpacity=".86" />
      <path
        d="M13 31c5-7.5 11.5-11 19-11"
        stroke={accent}
        strokeOpacity=".48"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M18 43c7 5 18 5 27-.5" stroke="#7a385f" strokeOpacity=".4" strokeWidth="1.2" />
    </g>
  );
}

function VelaArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <circle cx="32" cy="32" r="21.5" fill="#06143f" stroke="white" strokeOpacity=".22" />
      <ellipse
        cx="32"
        cy="32"
        rx="23"
        ry="8.5"
        stroke={accent}
        strokeOpacity=".68"
        strokeWidth="1.8"
        transform="rotate(-28 32 32)"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="19"
        ry="6.5"
        stroke="#89a5ff"
        strokeOpacity=".44"
        strokeWidth="1.2"
        transform="rotate(57 32 32)"
      />
      <path
        d="M32 14c1.2 9.6 6.4 14.8 16 16-9.6 1.2-14.8 6.4-16 16-1.2-9.6-6.4-14.8-16-16 9.6-1.2 14.8-6.4 16-16Z"
        fill={accentFill}
      />
      <circle cx="49" cy="20" r="2.2" fill="#ffe48a" />
      <circle cx="16" cy="44" r="1.7" fill="#ff9ed2" />
      <circle cx="29.5" cy="27.5" r="2.5" fill="white" fillOpacity=".94" />
    </g>
  );
}

function TasksArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M16 13h32a5 5 0 0 1 5 5v32a5 5 0 0 1-5 5H16a5 5 0 0 1-5-5V18a5 5 0 0 1 5-5Z"
        fill="#f5fffb"
        stroke="white"
        strokeOpacity=".56"
      />
      <rect
        x="23"
        y="9"
        width="18"
        height="9"
        rx="4.5"
        fill="#c6ffe7"
        stroke="white"
        strokeOpacity=".44"
      />
      <path
        d="m18 28 3 3 7-8M18 40l3 3 7-8"
        stroke="#167669"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33 27h13M33 39h13M18 49h28"
        stroke="#23534f"
        strokeOpacity=".72"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="46.5" cy="18.5" r="2.7" fill={accent} />
    </g>
  );
}

function CalendarArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <path
        d="M11.5 18a6 6 0 0 1 6-6h29a6 6 0 0 1 6 6v30.5a6 6 0 0 1-6 6h-29a6 6 0 0 1-6-6Z"
        fill="#f8fbff"
        stroke="white"
        strokeOpacity=".56"
      />
      <path d="M11.5 26.5h41V18a6 6 0 0 0-6-6h-29a6 6 0 0 0-6 6Z" fill={accentFill} />
      <path d="M21 9v10M43 9v10" stroke="white" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M17 30.5h30" stroke="#c9d9ee" strokeWidth="1.25" />
      <text
        x="32"
        y="48.5"
        fill="#274f84"
        fontFamily="system-ui, sans-serif"
        fontSize="20"
        fontWeight="780"
        textAnchor="middle"
      >
        23
      </text>
      <circle cx="48" cy="19" r="2.4" fill={accent} />
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
        r="22"
        fill="#fff9f2"
        stroke="white"
        strokeOpacity=".68"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="32"
        r="18.7"
        fill="#5f3547"
        fillOpacity=".08"
        stroke="#7b5061"
        strokeOpacity=".22"
      />
      {ticks.map((rotation) => (
        <path
          key={rotation}
          d="M32 14v3.2"
          stroke="#6d4751"
          strokeWidth={rotation % 90 === 0 ? 2 : 1.15}
          strokeLinecap="round"
          transform={`rotate(${rotation} 32 32)`}
        />
      ))}
      <path
        d="M32 19v13l9 5.5"
        stroke="#573c56"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="3.4" fill={accent} />
      <circle cx="30.8" cy="30.8" r="1" fill="white" fillOpacity=".86" />
      <path d="M19 18c6-5 16-6 23-1" stroke="white" strokeOpacity=".7" strokeWidth="1.7" />
    </g>
  );
}

function ConnectionsArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  return (
    <g>
      <circle cx="32" cy="33" r="21.5" fill="#07385f" stroke="white" strokeOpacity=".28" />
      <circle cx="32" cy="33" r="17.5" fill={accentFill} fillOpacity=".16" />
      <path
        d="M16 28c9-8 23-8 32 0M21.5 34.5c6-5 15-5 21 0M28 41c2.5-2.2 5.5-2.2 8 0"
        stroke="white"
        strokeWidth="2.9"
        strokeLinecap="round"
      />
      <circle cx="32" cy="47" r="2.8" fill={accent} />
      <path
        d="m45 14 8 7-4.5 4V10.5l4.5 4-8 8"
        stroke="#d5f8ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18.5" cy="17.5" r="2.2" fill="#8fffe5" />
    </g>
  );
}

function TerminalArtwork({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M10 17a6 6 0 0 1 6-6h32a6 6 0 0 1 6 6v31a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6Z"
        fill="#030b12"
        stroke="white"
        strokeOpacity=".3"
      />
      <path d="M10 23h44" stroke="white" strokeOpacity=".2" />
      <circle cx="17.5" cy="17" r="1.8" fill="#ff7c7c" />
      <circle cx="23.5" cy="17" r="1.8" fill="#ffd06c" />
      <circle cx="29.5" cy="17" r="1.8" fill={accent} />
      <path
        d="m18 31 6.5 5.5L18 42M29 42h15"
        stroke="#eaf8ff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M29 30h15" stroke={accent} strokeOpacity=".52" strokeWidth="1.5" />
      <circle cx="47" cy="30.5" r="2.7" fill={accent} />
      <path d="M14 13.5c10-2.4 25-2 36 .5" stroke="white" strokeOpacity=".17" />
    </g>
  );
}

function LumaArtwork({ accent, accentFill }: { accent: string; accentFill: string }) {
  const stars = [
    { x: 18, y: 37, radius: 3.4, fill: '#8fffe9' },
    { x: 24, y: 24, radius: 2.4, fill: '#fff2a3' },
    { x: 34, y: 31, radius: 3.2, fill: accent },
    { x: 43, y: 19, radius: 2.8, fill: '#ffadd8' },
    { x: 47, y: 41, radius: 2.5, fill: '#ffe17f' },
    { x: 29, y: 47, radius: 2.1, fill: '#c7b8ff' },
  ];

  return (
    <g>
      <circle cx="32" cy="32" r="22" fill="#0a082c" stroke="white" strokeOpacity=".24" />
      <path
        d="m18 37 6-13 10 7 9-12 4 22-18 6Z"
        stroke="#dcd4ff"
        strokeOpacity=".58"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse
        cx="32"
        cy="33"
        rx="20"
        ry="9"
        fill={accentFill}
        fillOpacity=".08"
        transform="rotate(-18 32 33)"
      />
      {stars.map((star) => (
        <g key={`${star.x}-${star.y}`}>
          <circle
            cx={star.x}
            cy={star.y}
            r={star.radius + 2.2}
            fill={star.fill}
            fillOpacity=".12"
          />
          <circle
            cx={star.x}
            cy={star.y}
            r={star.radius}
            fill={star.fill}
            stroke="white"
            strokeOpacity=".54"
          />
        </g>
      ))}
      <path d="M18 17c7-4 15-5 23-2" stroke="white" strokeOpacity=".26" strokeLinecap="round" />
      <circle cx="48.5" cy="13.5" r="1.5" fill="white" fillOpacity=".84" />
      <circle cx="15" cy="23" r="1" fill="#8fffe9" />
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
