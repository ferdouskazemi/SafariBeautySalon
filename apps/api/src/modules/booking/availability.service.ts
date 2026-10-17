import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BOOKING_WINDOW_DAYS,
  MIN_BOOKING_LEAD_MINUTES,
  SLOT_BLOCKING_STATUSES,
  salonTimeToInstant,
  upcomingDateKeys,
  weekdayOf,
  type AvailabilityDto,
  type AvailabilityQuery,
  type BoardDto,
  type BoardQuery,
  type BookableDaysDto,
  type BookableDaysQuery,
  type DateKey,
} from '@safari/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CatalogService } from '../catalog/catalog.service.js';
import { computeFreeRanges, computeFreeSlots, type TimeRange } from './availability.js';

export interface Slot {
  startsAt: Date;
  staffId: string;
}

const toRangeDto = (range: TimeRange) => ({
  startsAt: range.startsAt.toISOString(),
  endsAt: range.endsAt.toISOString(),
});

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

  async getAvailability(query: AvailabilityQuery): Promise<AvailabilityDto> {
    const offering = await this.catalog.resolveOffering(query);
    const slots = await this.findSlots(query.date, offering.durationMinutes, query.staffId);
    return {
      date: query.date,
      durationMinutes: offering.durationMinutes,
      slots: slots.map((s) => ({ startsAt: s.startsAt.toISOString(), staffId: s.staffId })),
    };
  }

  /** Free-slot counts for every bookable day, so customers can see at a glance which days have room. */
  async getBookableDays(query: BookableDaysQuery): Promise<BookableDaysDto> {
    const offering = await this.catalog.resolveOffering(query);
    const days = upcomingDateKeys(BOOKING_WINDOW_DAYS);
    const slotsByDay = await this.slotsByDay(days, offering.durationMinutes, query.staffId);

    return {
      durationMinutes: offering.durationMinutes,
      days: days.map((date) => {
        const day = slotsByDay.get(date);
        return { date, open: Boolean(day?.open), freeSlots: day?.slots.length ?? 0 };
      }),
    };
  }

  /**
   * The public day board: each barber's hours with booked and free times.
   * Only time ranges leave the server, never who booked them.
   */
  async getBoard({ date }: BoardQuery): Promise<BoardDto> {
    if (!upcomingDateKeys(BOOKING_WINDOW_DAYS).includes(date)) {
      throw new BadRequestException('این تاریخ قابل نمایش نیست');
    }
    const weekday = weekdayOf(date);
    const [staff, appointments] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'STAFF', isActive: true },
        select: {
          id: true,
          fullName: true,
          title: true,
          avatarUrl: true,
          workingHours: { where: { weekday }, select: { startMinute: true, endMinute: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.appointment.findMany({
        where: {
          status: { in: [...SLOT_BLOCKING_STATUSES] },
          startsAt: { lt: salonTimeToInstant(date, 24 * 60) },
          endsAt: { gt: salonTimeToInstant(date, 0) },
        },
        select: { staffId: true, startsAt: true, endsAt: true },
        orderBy: { startsAt: 'asc' },
      }),
    ]);
    const notBefore = new Date(Date.now() + MIN_BOOKING_LEAD_MINUTES * 60_000);

    return {
      date,
      columns: staff.map(({ workingHours, ...member }) => {
        const shift = workingHours[0] ?? null;
        const booked = appointments
          .filter((a) => a.staffId === member.id)
          .map(({ startsAt, endsAt }) => ({ startsAt, endsAt }));
        const free = shift
          ? computeFreeRanges({ dateKey: date, shift, busy: booked, notBefore })
          : [];
        return {
          staff: member,
          shift,
          booked: booked.map(toRangeDto),
          free: free.map(toRangeDto),
        };
      }),
    };
  }

  /** Free slots on one salon-local day; rejects days outside the booking window. */
  async findSlots(dateKey: DateKey, durationMinutes: number, staffId?: string): Promise<Slot[]> {
    if (!upcomingDateKeys(BOOKING_WINDOW_DAYS).includes(dateKey)) {
      throw new BadRequestException('این تاریخ قابل رزرو نیست');
    }
    const result = await this.slotsByDay([dateKey], durationMinutes, staffId);
    return result.get(dateKey)?.slots ?? [];
  }

  /**
   * Free slots for several days with two queries in total. Without `staffId`, each start
   * time goes to the least busy free barber that day, to spread the work fairly.
   * `open` is false when nobody works that day.
   */
  private async slotsByDay(dateKeys: DateKey[], durationMinutes: number, staffId?: string) {
    const result = new Map<DateKey, { open: boolean; slots: Slot[] }>();
    if (dateKeys.length === 0) return result;

    const staff = await this.prisma.user.findMany({
      where: { role: 'STAFF', isActive: true, ...(staffId && { id: staffId }) },
      select: {
        id: true,
        workingHours: { select: { weekday: true, startMinute: true, endMinute: true } },
      },
    });
    if (staffId && staff.length === 0) throw new NotFoundException('آرایشگر پیدا نشد');

    const sorted = [...dateKeys].sort();
    const appointments = await this.prisma.appointment.findMany({
      where: {
        staffId: { in: staff.map((s) => s.id) },
        status: { in: [...SLOT_BLOCKING_STATUSES] },
        startsAt: { lt: salonTimeToInstant(sorted.at(-1)!, 24 * 60) },
        endsAt: { gt: salonTimeToInstant(sorted[0]!, 0) },
      },
      select: { staffId: true, startsAt: true, endsAt: true },
    });
    const notBefore = new Date(Date.now() + MIN_BOOKING_LEAD_MINUTES * 60_000);

    for (const dateKey of dateKeys) {
      const weekday = weekdayOf(dateKey);
      const dayStart = salonTimeToInstant(dateKey, 0);
      const dayEnd = salonTimeToInstant(dateKey, 24 * 60);
      const busyByStaff = new Map<string, TimeRange[]>();
      for (const { staffId: id, ...range } of appointments) {
        if (range.startsAt < dayEnd && range.endsAt > dayStart) {
          busyByStaff.set(id, [...(busyByStaff.get(id) ?? []), range]);
        }
      }

      const working = staff
        .map((member) => ({
          id: member.id,
          shift: member.workingHours.find((h) => h.weekday === weekday),
        }))
        .filter((member) => member.shift !== undefined)
        .sort(
          (a, b) => (busyByStaff.get(a.id)?.length ?? 0) - (busyByStaff.get(b.id)?.length ?? 0),
        );

      const staffByStartTime = new Map<number, string>();
      for (const member of working) {
        const free = computeFreeSlots({
          dateKey,
          shift: member.shift!,
          durationMinutes,
          busy: busyByStaff.get(member.id) ?? [],
          notBefore,
        });
        for (const start of free) {
          if (!staffByStartTime.has(start.getTime()))
            staffByStartTime.set(start.getTime(), member.id);
        }
      }

      result.set(dateKey, {
        open: working.length > 0,
        slots: [...staffByStartTime.entries()]
          .sort(([a], [b]) => a - b)
          .map(([time, id]) => ({ startsAt: new Date(time), staffId: id })),
      });
    }
    return result;
  }
}
