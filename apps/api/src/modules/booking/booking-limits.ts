import { MAX_ACTIVE_BOOKINGS_PER_PHONE, NO_SHOW_LIMIT } from '@safari/shared';

export interface BookingBlock {
  /** HTTP status: 429 asks the customer to wait, 403 asks them to call the salon. */
  status: 429 | 403;
  message: string;
}

/**
 * Whether a phone number may book online right now. Pure, so the rules are easy to test:
 * the caller counts the number's upcoming confirmed bookings and its recent no-shows.
 */
export function bookingBlock({
  activeCount,
  noShowCount,
}: {
  activeCount: number;
  noShowCount: number;
}): BookingBlock | null {
  if (noShowCount >= NO_SHOW_LIMIT) {
    return {
      status: 403,
      message:
        'رزرو آنلاین برای این شماره فعلاً بسته است، چون چند بار برای نوبت نیامده‌اید. لطفاً با سالون تماس بگیرید.',
    };
  }
  if (activeCount >= MAX_ACTIVE_BOOKINGS_PER_PHONE) {
    return {
      status: 429,
      message: `با این شماره ${MAX_ACTIVE_BOOKINGS_PER_PHONE} نوبت فعال دارید. بعد از انجام یا لغو یکی از آنها می‌توانید نوبت تازه بگیرید.`,
    };
  }
  return null;
}
