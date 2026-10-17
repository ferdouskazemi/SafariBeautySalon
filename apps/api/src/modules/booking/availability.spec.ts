import { describe, expect, it } from 'vitest';
import { computeFreeRanges, computeFreeSlots } from './availability.js';

const day = '2026-10-10';
// Kabul is UTC+04:30, so 09:00 local is 04:30 UTC.
const at = (utcTime: string) => new Date(`${day}T${utcTime}:00.000Z`);
const times = (slots: Date[]) => slots.map((s) => s.toISOString().slice(11, 16));

describe('computeFreeSlots', () => {
  const base = {
    dateKey: day,
    shift: { startMinute: 9 * 60, endMinute: 11 * 60 },
    notBefore: new Date('2026-01-01T00:00:00Z'),
  };

  it('offers every step where the appointment fits inside the shift', () => {
    const slots = computeFreeSlots({ ...base, durationMinutes: 60, busy: [] });
    expect(times(slots)).toEqual(['04:30', '05:00', '05:30']);
  });

  it('skips slots that overlap an existing booking', () => {
    const busy = [{ startsAt: at('05:00'), endsAt: at('05:30') }];
    const slots = computeFreeSlots({ ...base, durationMinutes: 30, busy });
    expect(times(slots)).toEqual(['04:30', '05:30', '06:00']);
  });

  it('allows back-to-back bookings', () => {
    const busy = [{ startsAt: at('04:30'), endsAt: at('05:00') }];
    const slots = computeFreeSlots({ ...base, durationMinutes: 30, busy });
    expect(times(slots)[0]).toBe('05:00');
  });

  it('never offers slots in the past', () => {
    const slots = computeFreeSlots({
      ...base,
      durationMinutes: 30,
      busy: [],
      notBefore: at('05:15'),
    });
    expect(times(slots)).toEqual(['05:30', '06:00']);
  });

  it('returns nothing when the service is longer than the shift', () => {
    expect(computeFreeSlots({ ...base, durationMinutes: 180, busy: [] })).toEqual([]);
  });
});

describe('computeFreeRanges', () => {
  const base = {
    dateKey: day,
    shift: { startMinute: 9 * 60, endMinute: 12 * 60 },
    notBefore: new Date('2026-01-01T00:00:00Z'),
  };
  const ranges = (gaps: { startsAt: Date; endsAt: Date }[]) =>
    gaps.map((g) => `${times([g.startsAt])[0]}-${times([g.endsAt])[0]}`);

  it('returns the whole shift when nothing is booked', () => {
    expect(ranges(computeFreeRanges({ ...base, busy: [] }))).toEqual(['04:30-07:30']);
  });

  it('splits the shift around bookings', () => {
    const busy = [
      { startsAt: at('06:30'), endsAt: at('07:00') },
      { startsAt: at('05:00'), endsAt: at('05:30') },
    ];
    expect(ranges(computeFreeRanges({ ...base, busy }))).toEqual([
      '04:30-05:00',
      '05:30-06:30',
      '07:00-07:30',
    ]);
  });

  it('drops gaps that are too short to book and time already past', () => {
    const busy = [{ startsAt: at('05:45'), endsAt: at('07:15') }];
    const gaps = computeFreeRanges({ ...base, busy, notBefore: at('05:00') });
    expect(ranges(gaps)).toEqual(['05:00-05:45']);
  });
});
