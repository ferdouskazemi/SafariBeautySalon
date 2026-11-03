import { z } from 'zod';
import { APPOINTMENT_STATUSES, MAX_SERVICES_PER_BOOKING } from '../constants.js';
import { toLatinDigits } from '../phone.js';
import {
  dateKeySchema,
  idSchema,
  optionalTextSchema,
  personNameSchema,
  phoneSchema,
} from './common.js';

/**
 * A booking is for one package, or for one or more single services done back to back.
 * `serviceIds` also accepts a comma-separated string, so it works in query strings.
 */
const serviceIdsSchema = z.preprocess(
  (v) => (typeof v === 'string' ? v.split(',').filter(Boolean) : v),
  z
    .array(idSchema)
    .min(1, 'حداقل یک خدمت انتخاب کنید')
    .max(MAX_SERVICES_PER_BOOKING, `حداکثر ${MAX_SERVICES_PER_BOOKING} خدمت در یک نوبت`)
    .refine((ids) => new Set(ids).size === ids.length, 'هر خدمت را یک بار انتخاب کنید'),
);
const offeringShape = {
  serviceIds: serviceIdsSchema.optional(),
  packageId: idSchema.optional(),
};
const hasExactlyOneOffering = (v: { serviceIds?: string[]; packageId?: string }) =>
  Boolean(v.serviceIds?.length) !== Boolean(v.packageId);
const offeringError = { message: 'یک پکیج یا یک یا چند خدمت انتخاب کنید' };

export const availabilityQuerySchema = z
  .object({ ...offeringShape, staffId: idSchema.optional(), date: dateKeySchema })
  .refine(hasExactlyOneOffering, offeringError);
export type AvailabilityQuery = z.output<typeof availabilityQuerySchema>;

/** Free-slot counts for every day customers can currently book. */
export const bookableDaysQuerySchema = z
  .object({ ...offeringShape, staffId: idSchema.optional() })
  .refine(hasExactlyOneOffering, offeringError);
export type BookableDaysQuery = z.output<typeof bookableDaysQuerySchema>;

/** The public day board: who works when, and which times are booked or free. */
export const boardQuerySchema = z.object({ date: dateKeySchema });
export type BoardQuery = z.output<typeof boardQuerySchema>;

export const createAppointmentSchema = z
  .object({
    ...offeringShape,
    staffId: idSchema.optional(),
    startsAt: z.iso.datetime({ offset: true }),
    customerName: personNameSchema,
    customerPhone: phoneSchema,
    note: optionalTextSchema(300),
  })
  .refine(hasExactlyOneOffering, offeringError);
export type CreateAppointmentInput = z.input<typeof createAppointmentSchema>;
export type CreateAppointmentData = z.output<typeof createAppointmentSchema>;

export const BOOKING_CODE_LENGTH = 6;

export const bookingCodeSchema = z
  .string()
  .trim()
  .transform((v) => toLatinDigits(v).toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{6}$/, 'کد نوبت ۶ کاراکتر است'));

export const appointmentLookupSchema = z.object({
  code: bookingCodeSchema,
  phone: phoneSchema,
});
export type AppointmentLookupInput = z.input<typeof appointmentLookupSchema>;
export type AppointmentLookupData = z.output<typeof appointmentLookupSchema>;

export const scheduleQuerySchema = z.object({
  date: dateKeySchema,
  staffId: idSchema.optional(),
});
export type ScheduleQuery = z.output<typeof scheduleQuerySchema>;

/** A barber's past and upcoming customers. Barbers always get their own, whatever is passed. */
export const historyQuerySchema = z.object({
  staffId: idSchema.optional(),
});
export type HistoryQuery = z.output<typeof historyQuerySchema>;

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
});
export type UpdateAppointmentStatusData = z.output<typeof updateAppointmentStatusSchema>;
