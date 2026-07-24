export const TIME_ZONES = [
  { id: 'system', label: 'System time zone', city: 'Automatic' },
  { id: 'UTC', label: 'Coordinated Universal Time', city: 'UTC' },
  { id: 'America/Vancouver', label: 'Pacific Time', city: 'Vancouver' },
  { id: 'America/Los_Angeles', label: 'Pacific Time', city: 'Los Angeles' },
  { id: 'America/New_York', label: 'Eastern Time', city: 'New York' },
  { id: 'Europe/London', label: 'United Kingdom Time', city: 'London' },
  { id: 'Europe/Paris', label: 'Central European Time', city: 'Paris' },
  { id: 'Asia/Dubai', label: 'Gulf Standard Time', city: 'Dubai' },
  { id: 'Asia/Kolkata', label: 'India Standard Time', city: 'Kolkata' },
  { id: 'Asia/Shanghai', label: 'China Standard Time', city: 'Shanghai' },
  { id: 'Asia/Singapore', label: 'Singapore Standard Time', city: 'Singapore' },
  { id: 'Asia/Tokyo', label: 'Japan Standard Time', city: 'Tokyo' },
  { id: 'Australia/Sydney', label: 'Australian Eastern Time', city: 'Sydney' },
] as const;

export type TimeZoneId = (typeof TIME_ZONES)[number]['id'];
export type WeekStartsOn = 'sunday' | 'monday';

export function isTimeZoneId(value: unknown): value is TimeZoneId {
  return TIME_ZONES.some((timeZone) => timeZone.id === value);
}

export function resolveTimeZone(timeZone: TimeZoneId): string | undefined {
  return timeZone === 'system' ? undefined : timeZone;
}

export function getSystemTimeZone() {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function getTimeZoneLabel(timeZone: TimeZoneId) {
  const resolved = timeZone === 'system' ? getSystemTimeZone() : timeZone;
  return (
    TIME_ZONES.find((candidate) => candidate.id === resolved)?.city ??
    resolved.split('/').at(-1)?.replaceAll('_', ' ') ??
    resolved
  );
}

export function dateKeyInTimeZone(date: Date, timeZone: TimeZoneId) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolveTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
