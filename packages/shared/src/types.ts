import type { AppointmentStatus, NotificationType, Role, ServiceCategory } from './constants.js';

/** API response contracts. Dates are ISO-8601 strings. */

export interface SessionUser {
  id: string;
  fullName: string;
  phone: string;
  role: Role;
}

export interface ServiceDto {
  id: string;
  name: string;
  description: string | null;
  category: ServiceCategory;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

export interface PackageDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  /** Sum of the included services' prices, to show the saving. */
  regularPrice: number;
  durationMinutes: number;
  isFeatured: boolean;
  isActive: boolean;
  services: Pick<ServiceDto, 'id' | 'name'>[];
}

export interface CatalogDto {
  services: ServiceDto[];
  packages: PackageDto[];
}

export interface RatingSummary {
  average: number | null;
  count: number;
}

export interface PublicStaffDto {
  id: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  rating: RatingSummary;
  /** Inactive barbers are still listed publicly, but cannot be booked. */
  isActive: boolean;
}

export interface WorkingHoursDto {
  weekday: number;
  startMinute: number;
  endMinute: number;
}

export interface StaffDto extends PublicStaffDto {
  phone: string;
  role: Role;
  workingHours: WorkingHoursDto[];
}

export interface SlotDto {
  startsAt: string;
  staffId: string;
}

export interface AvailabilityDto {
  date: string;
  durationMinutes: number;
  slots: SlotDto[];
}

/** What was booked: a package, or one or more services (named "A + B"). */
export interface OfferingRef {
  kind: 'services' | 'package';
  name: string;
}

export interface AppointmentDto {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  price: number;
  note: string | null;
  offering: OfferingRef;
  staff: { id: string; fullName: string };
}

export interface BookingConfirmationDto {
  code: string;
  startsAt: string;
  price: number;
  offeringName: string;
  staffName: string;
}

export interface PublicAppointmentDto extends BookingConfirmationDto {
  endsAt: string;
  status: AppointmentStatus;
  canCancel: boolean;
  canReview: boolean;
  review: { rating: number; comment: string | null } | null;
}

export interface ReviewDto {
  id: string;
  /** Shortened for privacy on public endpoints, e.g. "احمد ش." */
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  staffName: string;
  offeringName: string;
  isVisible: boolean;
}

export interface PublicReviewsDto {
  summary: RatingSummary;
  items: ReviewDto[];
}

export interface DashboardStatsDto {
  todayAppointments: number;
  upcomingAppointments: number;
  revenueLast30Days: number;
  rating: RatingSummary;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface DayAvailabilityDto {
  date: string;
  /** False when nobody works that day. */
  open: boolean;
  freeSlots: number;
}

/** Every day customers can book right now, starting today. */
export interface BookableDaysDto {
  durationMinutes: number;
  days: DayAvailabilityDto[];
}

export interface TimeRangeDto {
  startsAt: string;
  endsAt: string;
}

/** One barber's day on the public board. Booked times carry no customer details. */
export interface BoardColumnDto {
  staff: Pick<PublicStaffDto, 'id' | 'fullName' | 'title' | 'avatarUrl'>;
  /** Salon-local working hours, or `null` on a day off. */
  shift: Pick<WorkingHoursDto, 'startMinute' | 'endMinute'> | null;
  booked: TimeRangeDto[];
  /** Gaps still open for booking (past times excluded). */
  free: TimeRangeDto[];
}

export interface BoardDto {
  date: string;
  columns: BoardColumnDto[];
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  createdAt: string;
  readAt: string | null;
  appointment: {
    id: string;
    code: string;
    customerName: string;
    startsAt: string;
    offeringName: string;
    staffName: string;
    reviewRating: number | null;
  };
}

export interface NotificationsDto {
  unreadCount: number;
  items: NotificationDto[];
}
