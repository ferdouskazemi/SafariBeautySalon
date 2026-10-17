import type {
  AppointmentLookupInput,
  AvailabilityDto,
  BoardDto,
  BookableDaysDto,
  BookingConfirmationDto,
  CreateAppointmentInput,
  DateKey,
  PublicAppointmentDto,
} from '@safari/shared';
import { queryOptions, useMutation } from '@tanstack/react-query';
import { http } from '@/shared/lib/http';

/** One package, or one or more single services done in one visit. */
export type OfferingSelection =
  { kind: 'package'; id: string } | { kind: 'services'; ids: string[] };

/** The offering as API fields, for both query strings and request bodies. */
export function offeringFields(
  offering: OfferingSelection,
): Pick<CreateAppointmentInput, 'packageId' | 'serviceIds'> {
  return offering.kind === 'package' ? { packageId: offering.id } : { serviceIds: offering.ids };
}

function offeringParams(offering: OfferingSelection, staffId: string | null) {
  const params = new URLSearchParams(
    offering.kind === 'package'
      ? { packageId: offering.id }
      : { serviceIds: offering.ids.join(',') },
  );
  if (staffId) params.set('staffId', staffId);
  return params;
}

export const availabilityQuery = (
  offering: OfferingSelection,
  staffId: string | null,
  date: DateKey,
) =>
  queryOptions({
    queryKey: ['availability', 'day', offering, staffId, date],
    staleTime: 15_000,
    queryFn: () => {
      const params = offeringParams(offering, staffId);
      params.set('date', date);
      return http<AvailabilityDto>(`/availability?${params}`);
    },
  });

/** Free-slot counts for every bookable day. */
export const bookableDaysQuery = (offering: OfferingSelection, staffId: string | null) =>
  queryOptions({
    queryKey: ['availability', 'days', offering, staffId],
    staleTime: 15_000,
    queryFn: () => http<BookableDaysDto>(`/availability/days?${offeringParams(offering, staffId)}`),
  });

/** The public day board of booked and free times. */
export const boardQuery = (date: DateKey) =>
  queryOptions({
    queryKey: ['availability', 'board', date],
    refetchInterval: 60_000,
    queryFn: () => http<BoardDto>(`/availability/board?date=${date}`),
  });

export const useCreateAppointment = () =>
  useMutation({
    mutationFn: (body: CreateAppointmentInput) =>
      http<BookingConfirmationDto>('/appointments', { method: 'POST', body }),
  });

export const useLookupAppointment = () =>
  useMutation({
    mutationFn: (body: AppointmentLookupInput) =>
      http<PublicAppointmentDto>('/appointments/lookup', { method: 'POST', body }),
  });

export const useCancelAppointment = () =>
  useMutation({
    mutationFn: (body: AppointmentLookupInput) =>
      http<PublicAppointmentDto>('/appointments/cancel', { method: 'POST', body }),
  });
