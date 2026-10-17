import { SALON_UTC_OFFSET_MINUTES } from './constants.js';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** A calendar day in salon local time, formatted `YYYY-MM-DD`. */
export type DateKey = string;

function shiftToSalonTime(instant: Date): Date {
  return new Date(instant.getTime() + SALON_UTC_OFFSET_MINUTES * MINUTE_MS);
}

/** The salon-local calendar day of an instant. */
export function toDateKey(instant: Date): DateKey {
  return shiftToSalonTime(instant).toISOString().slice(0, 10);
}

/** JS weekday (0 = Sunday) of a salon-local calendar day. */
export function weekdayOf(dateKey: DateKey): number {
  return new Date(`${dateKey}T00:00:00Z`).getUTCDay();
}

/** The UTC instant of `minuteOfDay` minutes after salon-local midnight on `dateKey`. */
export function salonTimeToInstant(dateKey: DateKey, minuteOfDay: number): Date {
  const midnightUtc = Date.parse(`${dateKey}T00:00:00Z`);
  return new Date(midnightUtc + (minuteOfDay - SALON_UTC_OFFSET_MINUTES) * MINUTE_MS);
}

/** Salon-local minutes since midnight of an instant. */
export function minuteOfDayOf(instant: Date): number {
  const local = shiftToSalonTime(instant);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

/** The next `count` salon-local calendar days, starting today. */
export function upcomingDateKeys(count: number, from: Date = new Date()): DateKey[] {
  const today = Date.parse(`${toDateKey(from)}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) =>
    new Date(today + i * DAY_MS).toISOString().slice(0, 10),
  );
}

export function minutesToTime(minuteOfDay: number): string {
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Shifts a salon-local calendar day by `days` (may be negative). */
export function addDays(dateKey: DateKey, days: number): DateKey {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** The Saturday that starts the Afghan week containing `dateKey`. */
export function weekStartOf(dateKey: DateKey): DateKey {
  const daysSinceSaturday = (weekdayOf(dateKey) + 1) % 7;
  return addDays(dateKey, -daysSinceSaturday);
}
