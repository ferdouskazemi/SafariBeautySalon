import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NO_SHOW_WINDOW_DAYS,
  salonTimeToInstant,
  toDateKey,
  type AppointmentDto,
  type AppointmentLookupData,
  type AppointmentStatus,
  type BookingConfirmationDto,
  type CreateAppointmentData,
  type HistoryQuery,
  type PublicAppointmentDto,
  type ScheduleQuery,
} from '@safari/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthUser } from '../auth/auth.constants.js';
import { CatalogService } from '../catalog/catalog.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  appointmentInclude,
  toAppointmentDto,
  toConfirmationDto,
  toPublicAppointmentDto,
  type AppointmentWithRelations,
} from './appointment.mapper.js';
import { AvailabilityService } from './availability.service.js';
import { generateBookingCode } from './booking-code.js';
import { shortenError } from './appointment-duration.js';
import { bookingBlock } from './booking-limits.js';

const SLOT_TAKEN = 'این زمان دیگر خالی نیست. لطفاً زمان دیگری انتخاب کنید';
const APPOINTMENT_NOT_FOUND = 'نوبتی با این کد و شماره موبایل پیدا نشد';
const MAX_CODE_ATTEMPTS = 3;
const HISTORY_LIMIT = 200;

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly availability: AvailabilityService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(data: CreateAppointmentData): Promise<BookingConfirmationDto> {
    await this.assertPhoneMayBook(data.customerPhone);
    const offering = await this.catalog.resolveOffering(data);
    const startsAt = new Date(data.startsAt);

    // Re-check on the server: the slot must still be free and inside working hours.
    const slots = await this.availability.findSlots(
      toDateKey(startsAt),
      offering.durationMinutes,
      data.staffId,
    );
    const slot = slots.find((s) => s.startsAt.getTime() === startsAt.getTime());
    if (!slot) throw new ConflictException(SLOT_TAKEN);

    const appointment = await this.insertWithUniqueCode({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      note: data.note,
      staffId: slot.staffId,
      packageId: offering.packageId,
      services: {
        create: offering.services.map((service, position) => ({
          serviceId: service.id,
          position,
        })),
      },
      startsAt,
      endsAt: new Date(startsAt.getTime() + offering.durationMinutes * 60_000),
    });
    await this.notifications.notifyTeam('APPOINTMENT_BOOKED', appointment);
    return toConfirmationDto(appointment);
  }

  /** Stops one phone number from hoarding slots, and asks repeat no-shows to call the salon. */
  private async assertPhoneMayBook(customerPhone: string): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - NO_SHOW_WINDOW_DAYS * 24 * 60 * 60_000);
    const [activeCount, noShowCount] = await Promise.all([
      this.prisma.appointment.count({
        where: { customerPhone, status: 'CONFIRMED', startsAt: { gt: now } },
      }),
      this.prisma.appointment.count({
        where: { customerPhone, status: 'NO_SHOW', startsAt: { gte: windowStart } },
      }),
    ]);
    const block = bookingBlock({ activeCount, noShowCount });
    if (block) throw new HttpException(block.message, block.status);
  }

  async lookup(data: AppointmentLookupData): Promise<PublicAppointmentDto> {
    return toPublicAppointmentDto(await this.findOwnedAppointment(data));
  }

  async cancelByCustomer(data: AppointmentLookupData): Promise<PublicAppointmentDto> {
    const appointment = await this.findOwnedAppointment(data);
    if (!toPublicAppointmentDto(appointment).canCancel) {
      throw new BadRequestException('این نوبت قابل لغو نیست');
    }
    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' },
      include: appointmentInclude,
    });
    await this.notifications.notifyTeam('APPOINTMENT_CANCELLED', updated);
    return toPublicAppointmentDto(updated);
  }

  /** Customers prove ownership of a guest booking with its code and their phone number. */
  async findOwnedAppointment({ code, phone }: AppointmentLookupData) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { code },
      include: appointmentInclude,
    });
    if (!appointment || appointment.customerPhone !== phone) {
      throw new NotFoundException(APPOINTMENT_NOT_FOUND);
    }
    return appointment;
  }

  /** A day's schedule. Barbers only ever see their own appointments. */
  async schedule(user: AuthUser, query: ScheduleQuery): Promise<AppointmentDto[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        staffId: user.role === 'STAFF' ? user.id : query.staffId,
        startsAt: {
          gte: salonTimeToInstant(query.date, 0),
          lt: salonTimeToInstant(query.date, 24 * 60),
        },
      },
      include: appointmentInclude,
      orderBy: { startsAt: 'asc' },
    });
    return appointments.map(toAppointmentDto);
  }

  /** Latest appointments of one barber across all days, newest first (managers pick the barber). */
  async history(user: AuthUser, query: HistoryQuery): Promise<AppointmentDto[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { staffId: user.role === 'STAFF' ? user.id : query.staffId },
      include: appointmentInclude,
      orderBy: { startsAt: 'desc' },
      take: HISTORY_LIMIT,
    });
    return appointments.map(toAppointmentDto);
  }

  async updateStatus(
    user: AuthUser,
    id: string,
    status: AppointmentStatus,
  ): Promise<AppointmentDto> {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('نوبت پیدا نشد');
    if (user.role === 'STAFF' && appointment.staffId !== user.id) {
      throw new ForbiddenException('این نوبت متعلق به شما نیست');
    }
    if ((status === 'COMPLETED' || status === 'NO_SHOW') && appointment.startsAt > new Date()) {
      throw new BadRequestException('این نوبت هنوز شروع نشده است');
    }

    try {
      const updated = await this.prisma.appointment.update({
        where: { id },
        data: { status },
        include: appointmentInclude,
      });
      return toAppointmentDto(updated);
    } catch (error) {
      if (isOverlapViolation(error))
        throw new ConflictException('این زمان با نوبت دیگری تداخل دارد');
      throw error;
    }
  }

  /** Cuts an appointment short (e.g. a 1-hour slot that only took 30 minutes), freeing the rest. */
  async shortenDuration(id: string, durationMinutes: number): Promise<AppointmentDto> {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('نوبت پیدا نشد');
    const error = shortenError(appointment, durationMinutes);
    if (error) throw new BadRequestException(error);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { endsAt: new Date(appointment.startsAt.getTime() + durationMinutes * 60_000) },
      include: appointmentInclude,
    });
    return toAppointmentDto(updated);
  }

  private async insertWithUniqueCode(
    data: Omit<Prisma.AppointmentUncheckedCreateInput, 'code'>,
  ): Promise<AppointmentWithRelations> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.prisma.appointment.create({
          data: { ...data, code: generateBookingCode() },
          include: appointmentInclude,
        });
      } catch (error) {
        if (isOverlapViolation(error)) throw new ConflictException(SLOT_TAKEN);
        const codeCollision =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!codeCollision || attempt >= MAX_CODE_ATTEMPTS) throw error;
      }
    }
  }
}

/** The `appointments_no_overlap` exclusion constraint rejected a double booking (SQLSTATE 23P01). */
function isOverlapViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const details = `${error.message} ${JSON.stringify(error)}`;
  return details.includes('appointments_no_overlap') || details.includes('23P01');
}
