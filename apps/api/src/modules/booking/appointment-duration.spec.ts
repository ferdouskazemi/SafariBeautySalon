import { describe, expect, it } from 'vitest';
import { shortenError } from './appointment-duration.js';

const startsAt = new Date('2026-11-20T10:00:00Z');
const at = (minutes: number) => new Date(startsAt.getTime() + minutes * 60_000);
const appointment = (
  minutes: number,
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
) => ({
  startsAt,
  endsAt: at(minutes),
  status,
});

describe('shortenError', () => {
  it('allows cutting a confirmed appointment shorter', () => {
    expect(shortenError(appointment(60, 'CONFIRMED'), 30)).toBeNull();
  });

  it('allows shortening a completed appointment too', () => {
    expect(shortenError(appointment(60, 'COMPLETED'), 45)).toBeNull();
  });

  it('refuses to keep or extend the length', () => {
    expect(shortenError(appointment(60, 'CONFIRMED'), 60)).not.toBeNull();
    expect(shortenError(appointment(60, 'CONFIRMED'), 90)).not.toBeNull();
  });

  it('refuses cancelled and no-show appointments', () => {
    expect(shortenError(appointment(60, 'CANCELLED'), 30)).not.toBeNull();
    expect(shortenError(appointment(60, 'NO_SHOW'), 30)).not.toBeNull();
  });
});
