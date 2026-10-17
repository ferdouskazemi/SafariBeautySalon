import { Injectable, Logger } from '@nestjs/common';
import type { NotificationDto, NotificationType, NotificationsDto } from '@safari/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { offeringOf, offeringSelect } from '../booking/appointment.mapper.js';

const notificationInclude = {
  appointment: {
    select: {
      id: true,
      code: true,
      customerName: true,
      startsAt: true,
      staff: { select: { fullName: true } },
      ...offeringSelect,
      review: { select: { rating: true } },
    },
  },
} satisfies Prisma.NotificationInclude;
type NotificationWithAppointment = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

const LIST_LIMIT = 50;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tells the barber on the appointment and every active manager about an event.
   * Never throws: a failed notification must not undo a booking the customer already made.
   */
  async notifyTeam(type: NotificationType, appointment: { id: string; staffId: string }) {
    try {
      const managers = await this.prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true },
      });
      const recipients = new Set([appointment.staffId, ...managers.map((m) => m.id)]);
      await this.prisma.notification.createMany({
        data: [...recipients].map((recipientId) => ({
          recipientId,
          type,
          appointmentId: appointment.id,
        })),
      });
    } catch (error) {
      this.logger.error(`Could not create ${type} notifications`, error as Error);
    }
  }

  async list(recipientId: string): Promise<NotificationsDto> {
    const [unreadCount, items] = await Promise.all([
      this.prisma.notification.count({ where: { recipientId, readAt: null } }),
      this.prisma.notification.findMany({
        where: { recipientId },
        include: notificationInclude,
        orderBy: { createdAt: 'desc' },
        take: LIST_LIMIT,
      }),
    ]);
    return { unreadCount, items: items.map(toNotificationDto) };
  }

  /** Scoped to the recipient, so nobody can mark someone else's messages. */
  async markRead(recipientId: string, id: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, recipientId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(recipientId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { recipientId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

function toNotificationDto(notification: NotificationWithAppointment): NotificationDto {
  const { appointment } = notification;
  return {
    id: notification.id,
    type: notification.type,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
    appointment: {
      id: appointment.id,
      code: appointment.code,
      customerName: appointment.customerName,
      startsAt: appointment.startsAt.toISOString(),
      offeringName: offeringOf(appointment).name,
      staffName: appointment.staff.fullName,
      reviewRating: appointment.review?.rating ?? null,
    },
  };
}
