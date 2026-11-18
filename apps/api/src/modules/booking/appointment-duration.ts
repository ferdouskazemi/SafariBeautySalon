import type { AppointmentStatus } from '@safari/shared';

const NOT_SHORTENABLE: AppointmentStatus[] = ['CANCELLED', 'NO_SHOW'];

/**
 * Why an appointment cannot be cut to `newMinutes`, or `null` when it can.
 * Only shortening is allowed: a longer appointment could overlap the next one.
 */
export function shortenError(
  appointment: { startsAt: Date; endsAt: Date; status: AppointmentStatus },
  newMinutes: number,
): string | null {
  if (NOT_SHORTENABLE.includes(appointment.status)) {
    return 'زمان این نوبت قابل تغییر نیست';
  }
  const currentMinutes = Math.round(
    (appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60_000,
  );
  if (newMinutes >= currentMinutes) return 'مدت جدید باید کمتر از مدت فعلی نوبت باشد';
  return null;
}
