import { randomInt } from 'node:crypto';
import { BOOKING_CODE_LENGTH } from '@safari/shared';

/** No 0/O or 1/I, so customers can read the code back over the phone. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateBookingCode(): string {
  return Array.from(
    { length: BOOKING_CODE_LENGTH },
    () => ALPHABET[randomInt(ALPHABET.length)],
  ).join('');
}
