import { useEffect, useRef, useState } from 'react';
import { Icon, NimvelisMark } from '../design/Icon';
import { resolveTimeZone, type TimeZoneId } from '../kernel/time';
import './lock-screen.css';

interface LockScreenProps {
  profileName: string;
  timeZone: TimeZoneId;
  clockFormat: 'system' | '12h' | '24h';
  onUnlock: () => void;
}

export function LockScreen({ profileName, timeZone, clockFormat, onUnlock }: LockScreenProps) {
  const [now, setNow] = useState(() => new Date());
  const unlockButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    unlockButtonRef.current?.focus();
    const interval = globalThis.setInterval(() => setNow(new Date()), 1_000);
    return () => globalThis.clearInterval(interval);
  }, []);

  const resolvedTimeZone = resolveTimeZone(timeZone);
  return (
    <section
      className="lock-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Nimvelis is locked"
      onKeyDown={(event) => {
        if (event.key === 'Enter') onUnlock();
      }}
    >
      <div className="lock-screen__top">
        <NimvelisMark size={27} />
        <span>Nimvelis</span>
      </div>
      <div className="lock-screen__clock">
        <time dateTime={now.toISOString()}>
          {new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: clockFormat === 'system' ? undefined : clockFormat === '12h',
            timeZone: resolvedTimeZone,
          }).format(now)}
        </time>
        <span>
          {new Intl.DateTimeFormat(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            timeZone: resolvedTimeZone,
          }).format(now)}
        </span>
      </div>
      <div className="lock-screen__profile">
        <div className="lock-screen__avatar" aria-hidden="true">
          <span>{profileName.slice(0, 1).toLocaleUpperCase()}</span>
          <i />
        </div>
        <strong>{profileName}</strong>
        <button type="button" ref={unlockButtonRef} onClick={onUnlock}>
          <Icon name="unlock" size={17} />
          Resume session
        </button>
        <small>No password is configured. This local lock prevents accidental access only.</small>
      </div>
      <div className="lock-screen__foot">
        <Icon name="system" size={15} />
        Windows and workspaces are ready to restore
      </div>
    </section>
  );
}

export function BootScreen() {
  return (
    <section className="boot-screen" role="status" aria-label="Restarting Nimvelis">
      <NimvelisMark size={62} />
      <div>
        <i />
      </div>
      <span>Restoring your local session…</span>
    </section>
  );
}
