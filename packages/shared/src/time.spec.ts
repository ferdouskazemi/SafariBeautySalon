import { describe, expect, it } from 'vitest';
import {
  minuteOfDayOf,
  salonTimeToInstant,
  toDateKey,
  upcomingDateKeys,
  weekStartOf,
  weekdayOf,
} from './time.js';

describe('salon time helpers', () => {
  it('maps salon-local time to UTC (Kabul is UTC+04:30)', () => {
    expect(salonTimeToInstant('2026-10-08', 9 * 60).toISOString()).toBe('2026-10-08T04:30:00.000Z');
  });

  it('uses the salon-local day, not the UTC day', () => {
    // 21:00 UTC on Oct 7 is already 01:30 on Oct 8 in Kabul.
    expect(toDateKey(new Date('2026-10-07T21:00:00Z'))).toBe('2026-10-08');
    expect(minuteOfDayOf(new Date('2026-10-07T21:00:00Z'))).toBe(90);
  });

  it('resolves weekdays and upcoming days', () => {
    expect(weekdayOf('2026-10-09')).toBe(5); // Friday
    expect(upcomingDateKeys(3, new Date('2026-10-08T06:00:00Z'))).toEqual([
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
    ]);
  });
});

describe('weekStartOf', () => {
  it('returns the Saturday that starts the Afghan week', () => {
    expect(weekStartOf('2026-10-08')).toBe('2026-10-03'); // Thursday -> previous Saturday
    expect(weekStartOf('2026-10-03')).toBe('2026-10-03'); // Saturday itself
    expect(weekStartOf('2026-10-09')).toBe('2026-10-03'); // Friday ends the week
  });
});
