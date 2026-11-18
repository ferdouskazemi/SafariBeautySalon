import { Injectable } from '@nestjs/common';
import {
  SLOT_BLOCKING_STATUSES,
  salonTimeToInstant,
  toDateKey,
  type DashboardStatsDto,
} from '@safari/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';

const RECENT_WINDOW_DAYS = 30;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviews: ReviewsService,
  ) {}

  async getStats(now = new Date()): Promise<DashboardStatsDto> {
    const today = toDateKey(now);
    const recentSince = new Date(now.getTime() - RECENT_WINDOW_DAYS * 24 * 60 * 60_000);

    const [todayAppointments, upcomingAppointments, completedLast30Days, rating] =
      await Promise.all([
        this.prisma.appointment.count({
          where: {
            status: { in: [...SLOT_BLOCKING_STATUSES] },
            startsAt: { gte: salonTimeToInstant(today, 0), lt: salonTimeToInstant(today, 24 * 60) },
          },
        }),
        this.prisma.appointment.count({ where: { status: 'CONFIRMED', startsAt: { gt: now } } }),
        this.prisma.appointment.count({
          where: { status: 'COMPLETED', startsAt: { gte: recentSince } },
        }),
        this.reviews.overallRating(),
      ]);

    return {
      todayAppointments,
      upcomingAppointments,
      completedLast30Days,
      rating,
    };
  }
}
