import { SALON_TIMEZONE, salonTimeToInstant, type DateKey } from '@safari/shared';

/** Dari (Afghanistan Persian): Persian digits and the Afghan solar month names. */
const LOCALE = 'fa-AF';
const CALENDAR_LOCALE = 'fa-AF-u-ca-persian';

const numberFormat = new Intl.NumberFormat(LOCALE);
const ratingFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: SALON_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const longDayFormat = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: SALON_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const shortWeekdayFormat = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: SALON_TIMEZONE,
  weekday: 'short',
});
const dayFormat = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: SALON_TIMEZONE,
  day: 'numeric',
});
const dayMonthFormat = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: SALON_TIMEZONE,
  day: 'numeric',
  month: 'short',
});
const monthYearFormat = new Intl.DateTimeFormat(CALENDAR_LOCALE, {
  timeZone: SALON_TIMEZONE,
  month: 'long',
  year: 'numeric',
});

export const formatNumber = (value: number) => numberFormat.format(value);

export const formatRating = (value: number) => ratingFormat.format(value);

export const formatPrice = (afghani: number) => `${numberFormat.format(afghani)} افغانی`;

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${formatNumber(rest)} دقیقه`;
  if (rest === 0) return `${formatNumber(hours)} ساعت`;
  return `${formatNumber(hours)} ساعت و ${formatNumber(rest)} دقیقه`;
}

export const formatTime = (iso: string) => timeFormat.format(new Date(iso));

/** e.g. "جمعه ۱۷ میزان" */
export const formatLongDate = (iso: string) => longDayFormat.format(new Date(iso));

const dateKeyToInstant = (dateKey: DateKey) => salonTimeToInstant(dateKey, 12 * 60);

export const formatDateKeyLong = (dateKey: DateKey) =>
  longDayFormat.format(dateKeyToInstant(dateKey));
export const formatDateKeyWeekday = (dateKey: DateKey) =>
  shortWeekdayFormat.format(dateKeyToInstant(dateKey));
/** Day of the Afghan solar month, e.g. "۱۷". */
export const formatDateKeyDay = (dateKey: DateKey) => dayFormat.format(dateKeyToInstant(dateKey));
export const formatDateKeyDayMonth = (dateKey: DateKey) =>
  dayMonthFormat.format(dateKeyToInstant(dateKey));
/** e.g. "میزان ۱۴۰۵" */
export const formatDateKeyMonthYear = (dateKey: DateKey) =>
  monthYearFormat.format(dateKeyToInstant(dateKey));

/** Minutes since midnight as Persian-digit "HH:MM". */
export function formatMinuteOfDay(minute: number) {
  const h = String(Math.floor(minute / 60)).padStart(2, '0');
  const m = String(minute % 60).padStart(2, '0');
  return formatTime(`1970-01-01T${h}:${m}:00+04:30`);
}
