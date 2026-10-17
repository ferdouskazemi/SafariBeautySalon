import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type { CreateReviewData, PublicReviewsDto, RatingSummary, ReviewDto } from '@safari/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { offeringOf, offeringSelect } from '../booking/appointment.mapper.js';
import { BookingService } from '../booking/booking.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

const reviewInclude = {
  appointment: {
    select: {
      customerName: true,
      staff: { select: { fullName: true } },
      ...offeringSelect,
    },
  },
} satisfies Prisma.ReviewInclude;
type ReviewWithContext = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;

const PUBLIC_REVIEW_LIMIT = 9;
const ADMIN_REVIEW_LIMIT = 200;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly booking: BookingService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Only the customer of a completed appointment can review it, once. */
  async create(data: CreateReviewData): Promise<ReviewDto> {
    const appointment = await this.booking.findOwnedAppointment(data);
    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException('ثبت نظر پس از انجام نوبت امکان‌پذیر است');
    }
    if (appointment.review) throw new ConflictException('برای این نوبت قبلاً نظر ثبت شده است');

    const review = await this.prisma.review.create({
      data: { appointmentId: appointment.id, rating: data.rating, comment: data.comment },
      include: reviewInclude,
    });
    await this.notifications.notifyTeam('REVIEW_RECEIVED', appointment);
    return toReviewDto(review, { shortenName: true });
  }

  async listPublic(): Promise<PublicReviewsDto> {
    const [summary, reviews] = await Promise.all([
      this.overallRating(),
      this.prisma.review.findMany({
        // Written reviews make better social proof than bare star ratings.
        where: { isVisible: true, comment: { not: null } },
        include: reviewInclude,
        orderBy: { createdAt: 'desc' },
        take: PUBLIC_REVIEW_LIMIT,
      }),
    ]);
    return { summary, items: reviews.map((r) => toReviewDto(r, { shortenName: true })) };
  }

  async listAll(): Promise<ReviewDto[]> {
    const reviews = await this.prisma.review.findMany({
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
      take: ADMIN_REVIEW_LIMIT,
    });
    return reviews.map((r) => toReviewDto(r));
  }

  async setVisibility(id: string, isVisible: boolean): Promise<ReviewDto> {
    const review = await this.prisma.review.update({
      where: { id },
      data: { isVisible },
      include: reviewInclude,
    });
    return toReviewDto(review);
  }

  async overallRating(): Promise<RatingSummary> {
    const result = await this.prisma.review.aggregate({
      where: { isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return toRatingSummary(result._avg.rating, result._count._all);
  }

  async ratingsByStaff(): Promise<Map<string, RatingSummary>> {
    const rows = await this.prisma.$queryRaw<{ staffId: string; average: number; count: number }[]>`
      SELECT a."staffId", AVG(r.rating)::float8 AS average, COUNT(*)::int AS count
      FROM reviews r
      JOIN appointments a ON a.id = r."appointmentId"
      WHERE r."isVisible" = true
      GROUP BY a."staffId"
    `;
    return new Map(rows.map((row) => [row.staffId, toRatingSummary(row.average, row.count)]));
  }
}

export const EMPTY_RATING: RatingSummary = { average: null, count: 0 };

function toRatingSummary(average: number | null, count: number): RatingSummary {
  return { average: average === null ? null : Math.round(average * 10) / 10, count };
}

/** "احمد شریفی" → "احمد ش." so public reviews do not expose full names. */
function shortenName(fullName: string): string {
  const [first, last] = fullName.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : (first ?? '');
}

function toReviewDto(review: ReviewWithContext, { shortenName: shorten = false } = {}): ReviewDto {
  const { appointment } = review;
  return {
    id: review.id,
    customerName: shorten ? shortenName(appointment.customerName) : appointment.customerName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    staffName: appointment.staff.fullName,
    offeringName: offeringOf(appointment).name,
    isVisible: review.isVisible,
  };
}
