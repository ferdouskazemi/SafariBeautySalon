import {
  MAX_SERVICES_PER_BOOKING,
  type BookingConfirmationDto,
  type DateKey,
  type SlotDto,
} from '@safari/shared';
import type { OfferingSelection } from './api';

/**
 * Three short steps: what, when, who you are. The barber is picked on the time step
 * (it defaults to "any barber", which shows the most free times).
 */
export const BOOKING_STEPS = ['services', 'time', 'confirm'] as const;
export type BookingStep = (typeof BOOKING_STEPS)[number];

export const STEP_LABELS: Record<BookingStep, string> = {
  services: 'خدمات',
  time: 'زمان',
  confirm: 'تأیید',
};

export interface BookingState {
  offering: OfferingSelection | null;
  /** `null` means "any barber". */
  staffId: string | null;
  /** `null` until the customer picks a day; the time step then opens on the first free day. */
  date: DateKey | null;
  slot: SlotDto | null;
  /** Where the flow started, e.g. the time step when a service was chosen on the home page. */
  entryStep: BookingStep;
  confirmation: BookingConfirmationDto | null;
}

export type BookingAction =
  | { type: 'toggleService'; id: string }
  | { type: 'togglePackage'; id: string }
  | { type: 'selectStaff'; staffId: string | null }
  | { type: 'selectDate'; date: DateKey }
  | { type: 'selectSlot'; slot: SlotDto }
  | { type: 'slotLost' }
  | { type: 'confirmed'; confirmation: BookingConfirmationDto };

export function initialBookingState(params: {
  packageId?: string | null;
  serviceId?: string | null;
  staffId?: string | null;
  date?: string | null;
}): BookingState {
  const offering: OfferingSelection | null = params.packageId
    ? { kind: 'package', id: params.packageId }
    : params.serviceId
      ? { kind: 'services', ids: [params.serviceId] }
      : null;
  const state: BookingState = {
    offering,
    staffId: params.staffId ?? null,
    date: params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : null,
    slot: null,
    entryStep: 'services',
    confirmation: null,
  };
  return { ...state, entryStep: offering ? 'time' : 'services' };
}

/** Changing an earlier choice clears the time slot, since availability depends on it. */
export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'toggleService': {
      const ids = state.offering?.kind === 'services' ? state.offering.ids : [];
      const next = ids.includes(action.id)
        ? ids.filter((id) => id !== action.id)
        : [...ids, action.id].slice(0, MAX_SERVICES_PER_BOOKING);
      return {
        ...state,
        offering: next.length > 0 ? { kind: 'services', ids: next } : null,
        slot: null,
      };
    }
    case 'togglePackage': {
      const selected = state.offering?.kind === 'package' && state.offering.id === action.id;
      return {
        ...state,
        offering: selected ? null : { kind: 'package', id: action.id },
        slot: null,
      };
    }
    case 'selectStaff':
      return { ...state, staffId: action.staffId, slot: null };
    case 'selectDate':
      return { ...state, date: action.date, slot: null };
    case 'selectSlot':
      return { ...state, slot: action.slot };
    case 'slotLost':
      return { ...state, slot: null };
    case 'confirmed':
      return { ...state, confirmation: action.confirmation };
  }
}

/** The step "continue" leads to. */
export function nextStep(step: BookingStep): BookingStep | null {
  const index = BOOKING_STEPS.indexOf(step);
  return BOOKING_STEPS[index + 1] ?? null;
}

/** The furthest step the current choices allow, so a stale URL never shows an empty step. */
export function clampStep(state: BookingState, step: BookingStep): BookingStep {
  if (!state.offering) return 'services';
  if (step === 'confirm' && !state.slot) return 'time';
  return step;
}

export const isBookingStep = (value: string | null): value is BookingStep =>
  (BOOKING_STEPS as readonly string[]).includes(value ?? '');
