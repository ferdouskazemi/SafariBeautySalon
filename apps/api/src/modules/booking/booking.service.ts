import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  salonTimeToInstant,
  toDateKey,
  type AppointmentDto,
  type AppointmentLookupData,
  type AppointmentStatus,
  type BookingConfirmationDto,
  type CreateAppointmentData,
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

const SLOT_TAKEN = 'این زمان دیگر خالی نیست. لطفاً زمان دیگری انتخاب کنید';
const APPOINTMENT_NOT_FOUND = 'نوبتی با این کد و شماره موبایل پیدا نشد';
const MAX_CODE_ATTEMPTS = 3;

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly availability: AvailabilityService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(data: CreateAppointmentData): Promise<BookingConfirmationDto> {
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
          price: service.price,
          position,
        })),
      },
      startsAt,
      endsAt: new Date(startsAt.getTime() + offering.durationMinutes * 60_000),
      price: offering.price,
    });
    await this.notifications.notifyTeam('APPOINTMENT_BOOKED', appointment);
    return toConfirmationDto(appointment);
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
