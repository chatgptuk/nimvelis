import { describe, expect, it } from 'vitest';
import {
  dateKeyInTimeZone,
  getTimeZoneLabel,
  isTimeZoneId,
  resolveTimeZone,
} from '../src/kernel/time';

describe('time preferences', () => {
  it('validates only supported time zone identifiers', () => {
    expect(isTimeZoneId('America/Vancouver')).toBe(true);
    expect(isTimeZoneId('system')).toBe(true);
    expect(isTimeZoneId('Mars/Olympus')).toBe(false);
  });

  it('keeps system time automatic and resolves explicit zones', () => {
    expect(resolveTimeZone('system')).toBeUndefined();
    expect(resolveTimeZone('Asia/Tokyo')).toBe('Asia/Tokyo');
    expect(getTimeZoneLabel('Asia/Tokyo')).toBe('Tokyo');
  });

  it('derives today from the selected display time zone', () => {
    const instant = new Date('2026-01-01T01:30:00.000Z');

    expect(dateKeyInTimeZone(instant, 'UTC')).toBe('2026-01-01');
    expect(dateKeyInTimeZone(instant, 'America/Vancouver')).toBe('2025-12-31');
  });
});
