import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import './clock.css';

type ClockTab = 'world' | 'timer' | 'stopwatch';

const CITIES = [
  { city: 'Local', zone: undefined },
  { city: 'Vancouver', zone: 'America/Vancouver' },
  { city: 'London', zone: 'Europe/London' },
  { city: 'Tokyo', zone: 'Asia/Tokyo' },
  { city: 'Sydney', zone: 'Australia/Sydney' },
] as const;

const TIMER_PRESETS = [
  { label: 'Quick break', minutes: 5 },
  { label: 'Reset', minutes: 10 },
  { label: 'Focus', minutes: 25 },
];

export function ClockApp({ system }: SystemAppProps) {
  const [tab, setTab] = useState<ClockTab>('world');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => globalThis.clearInterval(interval);
  }, []);

  return (
    <div className="clock-app">
      <aside className="clock-sidebar">
        <header>
          <span>
            <Icon name="clock" size={19} />
          </span>
          <div>
            <strong>Clock</strong>
            <small>Time, quietly useful</small>
          </div>
        </header>
        <nav aria-label="Clock sections">
          {(['world', 'timer', 'stopwatch'] as ClockTab[]).map((item) => (
            <button
              type="button"
              key={item}
              className={tab === item ? 'is-active' : ''}
              onClick={() => setTab(item)}
            >
              <Icon
                name={item === 'world' ? 'system' : item === 'timer' ? 'clock' : 'sparkle'}
                size={17}
              />
              {item === 'world' ? 'World clocks' : capitalize(item)}
            </button>
          ))}
        </nav>
        <div className="clock-sidebar__now">
          <span>{formatTime(now, undefined, system.preferences.clockFormat, true)}</span>
          <small>
            {new Intl.DateTimeFormat(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            }).format(now)}
          </small>
        </div>
      </aside>

      <main className="clock-main">
        {tab === 'world' ? <WorldClocks now={now} format={system.preferences.clockFormat} /> : null}
        {tab === 'timer' ? <Timer system={system} /> : null}
        {tab === 'stopwatch' ? <Stopwatch /> : null}
      </main>
    </div>
  );
}

function WorldClocks({ now, format }: { now: number; format: 'system' | '12h' | '24h' }) {
  const localOffset = new Date(now).getTimezoneOffset();
  return (
    <section className="clock-panel world-panel">
      <header>
        <span>AROUND THE WORLD</span>
        <h2>One moment, five places.</h2>
        <p>World clocks update live and use your device as the source of time.</p>
      </header>
      <div className="world-grid">
        {CITIES.map((item, index) => (
          <article className={index === 0 ? 'is-local' : ''} key={item.city}>
            <span>{index === 0 ? 'HERE' : offsetLabel(now, item.zone, localOffset)}</span>
            <strong>{formatTime(now, item.zone, format, false)}</strong>
            <div>
              <b>{item.city}</b>
              <small>{formatDay(now, item.zone)}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Timer({ system }: { system: SystemAppProps['system'] }) {
  const [duration, setDuration] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const targetRef = useRef<number | null>(null);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    targetRef.current = Date.now() + remaining * 1000;
    const tick = () => {
      if (!targetRef.current) return;
      const next = Math.max(0, Math.ceil((targetRef.current - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          system.notify('Timer complete', 'success');
        }
      }
    };
    const interval = globalThis.setInterval(tick, 250);
    tick();
    return () => globalThis.clearInterval(interval);
  }, [remaining, running, system]);

  const chooseDuration = (seconds: number) => {
    setRunning(false);
    setDuration(seconds);
    setRemaining(seconds);
    targetRef.current = null;
    notifiedRef.current = false;
  };

  const toggle = () => {
    if (!remaining) setRemaining(duration);
    notifiedRef.current = false;
    setRunning((value) => !value);
  };

  const progress = duration ? 1 - remaining / duration : 0;
  const circumference = 2 * Math.PI * 104;

  return (
    <section className="clock-panel timer-panel">
      <header>
        <span>COUNTDOWN</span>
        <h2>Give your attention a boundary.</h2>
        <p>Pick a duration, start when ready, and Nimvelis will let you know when it ends.</p>
      </header>
      <div className="timer-stage">
        <div className="timer-dial">
          <svg viewBox="0 0 240 240" aria-hidden="true">
            <circle cx="120" cy="120" r="104" />
            <circle
              className="timer-dial__progress"
              cx="120"
              cy="120"
              r="104"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: circumference * (1 - progress),
              }}
            />
          </svg>
          <span>{formatDuration(remaining)}</span>
          <small>{running ? 'IN FOCUS' : remaining === 0 ? 'COMPLETE' : 'READY'}</small>
        </div>
        <div className="timer-controls">
          <div className="timer-presets">
            {TIMER_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.minutes}
                className={duration === preset.minutes * 60 ? 'is-selected' : ''}
                onClick={() => chooseDuration(preset.minutes * 60)}
              >
                <strong>{preset.minutes}</strong>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
          <label className="timer-custom">
            <span>Custom minutes</span>
            <input
              type="number"
              min="1"
              max="180"
              value={Math.round(duration / 60)}
              onChange={(event) => {
                const minutes = Math.min(180, Math.max(1, Number(event.target.value) || 1));
                chooseDuration(minutes * 60);
              }}
            />
          </label>
          <div className="clock-primary-controls">
            <button type="button" className="is-primary" onClick={toggle}>
              {running ? 'Pause' : remaining === 0 ? 'Again' : 'Start'}
            </button>
            <button type="button" onClick={() => chooseDuration(duration)}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startedAt = useRef(0);
  const baseElapsed = useRef(0);

  useEffect(() => {
    if (!running) return;
    startedAt.current = performance.now();
    const interval = globalThis.setInterval(() => {
      setElapsed(baseElapsed.current + performance.now() - startedAt.current);
    }, 40);
    return () => globalThis.clearInterval(interval);
  }, [running]);

  const toggle = () => {
    if (running) baseElapsed.current = elapsed;
    setRunning((value) => !value);
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    baseElapsed.current = 0;
  };

  return (
    <section className="clock-panel stopwatch-panel">
      <header>
        <span>STOPWATCH</span>
        <h2>Measure what matters.</h2>
        <p>Precision to a hundredth, with a lap history for comparisons.</p>
      </header>
      <div className="stopwatch-display">
        <span>{formatStopwatch(elapsed)}</span>
        <small>{running ? 'MEASURING' : elapsed ? 'PAUSED' : 'READY'}</small>
      </div>
      <div className="clock-primary-controls">
        <button type="button" className="is-primary" onClick={toggle}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          disabled={!elapsed}
          onClick={() => setLaps((items) => [elapsed, ...items])}
        >
          Lap
        </button>
        <button type="button" disabled={!elapsed} onClick={reset}>
          Reset
        </button>
      </div>
      <div className="stopwatch-laps">
        {laps.map((lap, index) => (
          <div key={`${lap}-${laps.length - index}`}>
            <span>Lap {laps.length - index}</span>
            <strong>{formatStopwatch(lap)}</strong>
          </div>
        ))}
        {!laps.length ? <p>Laps will appear here.</p> : null}
      </div>
    </section>
  );
}

function formatTime(
  value: number,
  timeZone: string | undefined,
  format: 'system' | '12h' | '24h',
  seconds: boolean,
) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: seconds ? '2-digit' : undefined,
    hour12: format === 'system' ? undefined : format === '12h',
    timeZone,
  }).format(value);
}

function formatDay(value: number, timeZone?: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(value);
}

function offsetLabel(value: number, timeZone: string | undefined, localOffset: number) {
  if (!timeZone) return 'LOCAL';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(value);
  const match = parts
    .find((part) => part.type === 'timeZoneName')
    ?.value.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return timeZone.split('/').at(-1)?.replaceAll('_', ' ') ?? timeZone;
  const direction = match[1] === '+' ? 1 : -1;
  const zoneMinutes = direction * (Number(match[2]) * 60 + Number(match[3]));
  const localMinutes = -localOffset;
  const difference = (zoneMinutes - localMinutes) / 60;
  if (difference === 0) return 'SAME TIME';
  return `${difference > 0 ? '+' : ''}${difference}H`;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatStopwatch(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor(milliseconds / 1_000) % 60;
  const hundredths = Math.floor(milliseconds / 10) % 100;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(
    hundredths,
  ).padStart(2, '0')}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
