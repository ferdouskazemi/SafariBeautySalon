import type {
  AppointmentDto,
  AppointmentOfferingDto,
  BookingConfirmationDto,
  PublicAppointmentDto,
} from '@safari/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { joinServiceNames } from '../catalog/catalog.service.js';

/** What an appointment needs loaded to name its package or services. */
export const offeringSelect = {
  package: { select: { name: true } },
  services: {
    select: { service: { select: { name: true, colorIndex: true } } },
    orderBy: { position: 'asc' },
  },
} satisfies Prisma.AppointmentSelect;

type WithOffering = Prisma.AppointmentGetPayload<{ select: typeof offeringSelect }>;

export function offeringOf(appointment: WithOffering): AppointmentOfferingDto {
  if (appointment.package) return { kind: 'package', name: appointment.package.name, parts: [] };
  const parts = appointment.services.map(({ service }) => ({
    name: service.name,
    colorIndex: service.colorIndex,
  }));
  return { kind: 'services', name: joinServiceNames(parts.map((part) => part.name)), parts };
}

export const appointmentInclude = {
  staff: { select: { id: true, fullName: true } },
  ...offeringSelect,
  review: { select: { rating: true, comment: true } },
} satisfies Prisma.AppointmentInclude;

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

export function toConfirmationDto(a: AppointmentWithRelations): BookingConfirmationDto {
  return {
    code: a.code,
    startsAt: a.startsAt.toISOString(),
    price: a.price,
    offeringName: offeringOf(a).name,
    staffName: a.staff.fullName,
  };
}

export function toPublicAppointmentDto(
  a: AppointmentWithRelations,
  now = new Date(),
): PublicAppointmentDto {
  return {
    ...toConfirmationDto(a),
    endsAt: a.endsAt.toISOString(),
    status: a.status,
    canCancel: a.status === 'CONFIRMED' && a.startsAt > now,
    canReview: a.status === 'COMPLETED' && !a.review,
    review: a.review,
  };
}

export function toAppointmentDto(a: AppointmentWithRelations): AppointmentDto {
  return {
    id: a.id,
    code: a.code,
    customerName: a.customerName,
    customerPhone: a.customerPhone,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    status: a.status,
    price: a.price,
    note: a.note,
    offering: offeringOf(a),
    staff: a.staff,
  };
}
