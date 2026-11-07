import { MAX_ACTIVE_BOOKINGS_PER_PHONE, NO_SHOW_LIMIT } from '@safari/shared';
import { describe, expect, it } from 'vitest';
import { bookingBlock } from './booking-limits.js';

describe('bookingBlock', () => {
  it('lets a new customer book', () => {
    expect(bookingBlock({ activeCount: 0, noShowCount: 0 })).toBeNull();
  });

  it('allows up to the active-booking limit, then asks to wait', () => {
    expect(
      bookingBlock({ activeCount: MAX_ACTIVE_BOOKINGS_PER_PHONE - 1, noShowCount: 0 }),
    ).toBeNull();
    expect(
      bookingBlock({ activeCount: MAX_ACTIVE_BOOKINGS_PER_PHONE, noShowCount: 0 })?.status,
    ).toBe(429);
  });

  it('forgives a single no-show but not repeated ones', () => {
    expect(bookingBlock({ activeCount: 0, noShowCount: NO_SHOW_LIMIT - 1 })).toBeNull();
    expect(bookingBlock({ activeCount: 0, noShowCount: NO_SHOW_LIMIT })?.status).toBe(403);
  });

  it('puts the no-show rule first, since waiting would not help that customer', () => {
    const block = bookingBlock({
      activeCount: MAX_ACTIVE_BOOKINGS_PER_PHONE,
      noShowCount: NO_SHOW_LIMIT,
    });
    expect(block?.status).toBe(403);
  });
});
