import { useId, type SVGProps } from 'react';

export type IconName =
  | 'calculator'
  | 'memo'
  | 'settings'
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
  calculator: ['#163b53', '#149a9f', '#78f0d5'],
  memo: ['#542f55', '#cf6d68', '#ffd68c'],
  settings: ['#272b65', '#796ee8', '#d5a8ff'],
} as const;

export function AppIcon({ name, size = 56, className = '', ...props }: AppIconProps) {
  const rawId = useId().replaceAll(':', '');
  const palette =
    APP_ICON_PALETTES[name as keyof typeof APP_ICON_PALETTES] ?? APP_ICON_PALETTES.settings;
  const backgroundId = `${rawId}-background`;
  const glowId = `${rawId}-glow`;

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
      </defs>
      <path
        d="M14 4h35c7 0 11 5 11 12v34c0 6-4 10-10 10H14C8 60 4 56 4 50V15C4 8.5 8 4 14 4Z"
        fill={`url(#${backgroundId})`}
      />
      <path
        d="M14 4.75h35c6.4 0 10.25 4.55 10.25 11.25v34c0 5.6-3.65 9.25-9.25 9.25H14c-5.6 0-9.25-3.65-9.25-9.25V15c0-6.1 3.65-10.25 9.25-10.25Z"
        fill={`url(#${glowId})`}
        stroke="white"
        strokeOpacity=".18"
        strokeWidth="1.5"
      />
      <path d="M9 15C22 6 42 5 56 15" stroke="white" strokeOpacity=".16" strokeWidth="1.5" />
      {name === 'calculator' && <CalculatorArtwork accent={palette[2]} />}
      {name === 'memo' && <MemoArtwork accent={palette[2]} />}
      {name === 'settings' && <SettingsArtwork accent={palette[2]} />}
      {!['calculator', 'memo', 'settings'].includes(name) && (
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
  return (
    <g>
      <ellipse
        cx="32"
        cy="32"
        rx="19"
        ry="10"
        stroke="white"
        strokeOpacity=".38"
        strokeWidth="2"
        transform="rotate(-28 32 32)"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="19"
        ry="10"
        stroke="white"
        strokeOpacity=".26"
        strokeWidth="2"
        transform="rotate(38 32 32)"
      />
      <path d="m32 20 10 12-10 12-10-12Z" fill="#f8f5ff" fillOpacity=".9" />
      <path d="m32 20 10 12-10 2-10-2Z" fill={accent} fillOpacity=".58" />
      <path d="m32 34 10-2-10 12Z" fill="#9b8dff" fillOpacity=".62" />
      <circle cx="17" cy="22" r="3" fill={accent} />
      <circle cx="48" cy="40" r="2.5" fill="white" fillOpacity=".9" />
    </g>
  );
}

export function NimvelisMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="nimvelis-mark"
    >
      <path d="M6.2 20.8 11 7.5l5 9 4.3-7.2 5.5 15.2H11.1Z" fill="url(#nimvelis-gradient)" />
      <path d="m9.2 18.5 6.9-2 6.2 3.1" stroke="white" strokeOpacity=".74" strokeWidth="1.5" />
      <defs>
        <linearGradient id="nimvelis-gradient" x1="7" y1="5" x2="26" y2="27">
          <stop stopColor="#77E8E0" />
          <stop offset=".48" stopColor="#7A8EFF" />
          <stop offset="1" stopColor="#F39BC6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
