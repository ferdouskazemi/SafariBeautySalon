/** Afghanistan (Asia/Kabul) is UTC+04:30 all year round, with no daylight saving. */
export const SALON_TIMEZONE = 'Asia/Kabul';
export const SALON_UTC_OFFSET_MINUTES = 270;

export const SLOT_STEP_MINUTES = 30;
/** How far ahead customers can book (three weeks). */
export const BOOKING_WINDOW_DAYS = 21;
export const MIN_BOOKING_LEAD_MINUTES = 30;
export const MAX_SERVICES_PER_BOOKING = 6;

export const ROLES = ['ADMIN', 'STAFF'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'مدیر',
  STAFF: 'آرایشگر',
};

/**
 * How many distinct colors services cycle through in the schedule. The web app defines the matching
 * `--svc-0` ... `--svc-7` CSS variables; each service stores the index it was given.
 */
export const SERVICE_COLOR_COUNT = 8;

export const SERVICE_CATEGORIES = ['HAIR', 'BEARD', 'FACE', 'GROOMING'] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  HAIR: 'مو',
  BEARD: 'ریش و اصلاح',
  FACE: 'پوست و صورت',
  GROOMING: 'آراستگی',
};

export const APPOINTMENT_STATUSES = ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Statuses that occupy a staff member's time slot. */
export const SLOT_BLOCKING_STATUSES = [
  'CONFIRMED',
  'COMPLETED',
] as const satisfies readonly AppointmentStatus[];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'تأیید شده',
  COMPLETED: 'انجام شده',
  CANCELLED: 'لغو شده',
  NO_SHOW: 'حاضر نشد',
};

/** Indexed by JS weekday (0 = Sunday). */
export const WEEKDAY_LABELS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
] as const;

/** The Afghan week starts on Saturday. */
export const WEEKDAY_DISPLAY_ORDER = [6, 0, 1, 2, 3, 4, 5] as const;

export const NOTIFICATION_TYPES = [
  'APPOINTMENT_BOOKED',
  'APPOINTMENT_CANCELLED',
  'REVIEW_RECEIVED',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
