import { SLOT_STEP_MINUTES, salonTimeToInstant, type DateKey } from '@safari/shared';

export interface TimeRange {
  startsAt: Date;
  endsAt: Date;
}

export interface FreeSlotsRequest {
  dateKey: DateKey;
  /** Working shift in salon-local minutes since midnight. */
  shift: { startMinute: number; endMinute: number };
  durationMinutes: number;
  /** Existing bookings of this barber on that day. */
  busy: TimeRange[];
  /** Slots starting before this instant are not offered. */
  notBefore: Date;
  stepMinutes?: number;
}

/** Start times inside the shift where the whole appointment fits without overlapping a booking. */
export function computeFreeSlots({
  dateKey,
  shift,
  durationMinutes,
  busy,
  notBefore,
  stepMinutes = SLOT_STEP_MINUTES,
}: FreeSlotsRequest): Date[] {
  const slots: Date[] = [];
  const durationMs = durationMinutes * 60_000;

  for (
    let minute = shift.startMinute;
    minute + durationMinutes <= shift.endMinute;
    minute += stepMinutes
  ) {
    const start = salonTimeToInstant(dateKey, minute);
    const end = start.getTime() + durationMs;
    if (start < notBefore) continue;

    const overlaps = busy.some(
      (b) => start.getTime() < b.endsAt.getTime() && end > b.startsAt.getTime(),
    );
    if (!overlaps) slots.push(start);
  }
  return slots;
}

export interface FreeRangesRequest {
  dateKey: DateKey;
  shift: { startMinute: number; endMinute: number };
  busy: TimeRange[];
  /** Time before this instant is not free any more. */
  notBefore: Date;
  /** Gaps shorter than this are too small to book and are dropped. */
  minMinutes?: number;
}

/** The open gaps of a shift around its bookings, for the public day board. */
export function computeFreeRanges({
  dateKey,
  shift,
  busy,
  notBefore,
  minMinutes = SLOT_STEP_MINUTES,
}: FreeRangesRequest): TimeRange[] {
  const shiftStart = salonTimeToInstant(dateKey, shift.startMinute).getTime();
  const shiftEnd = salonTimeToInstant(dateKey, shift.endMinute).getTime();
  const sorted = [...busy].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const gaps: TimeRange[] = [];
  let cursor = Math.max(shiftStart, notBefore.getTime());
  const addGap = (end: number) => {
    if (end - cursor >= minMinutes * 60_000) {
      gaps.push({ startsAt: new Date(cursor), endsAt: new Date(end) });
    }
  };
  for (const booking of sorted) {
    addGap(Math.min(booking.startsAt.getTime(), shiftEnd));
    cursor = Math.max(cursor, booking.endsAt.getTime());
  }
  addGap(shiftEnd);
  return gaps;
}
