import type { NotificationDto, NotificationsDto } from '@safari/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatLongDate, formatNumber, formatTime } from '@/shared/lib/format';
import { http } from '@/shared/lib/http';

/** Polled so new bookings show up in the panel within half a minute. */
export const notificationsQuery = queryOptions({
  queryKey: ['notifications'],
  queryFn: () => http<NotificationsDto>('/notifications'),
  refetchInterval: 30_000,
  staleTime: 10_000,
});

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http<void>(`/notifications/${id}/read`, { method: 'POST' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsQuery.queryKey }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => http<void>('/notifications/read-all', { method: 'POST' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsQuery.queryKey }),
  });
}

export function describeNotification({ type, appointment: a }: NotificationDto) {
  const when = `${formatLongDate(a.startsAt)} ساعت ${formatTime(a.startsAt)}`;
  switch (type) {
    case 'APPOINTMENT_BOOKED':
      return {
        title: 'نوبت جدید',
        body: `${a.customerName} برای ${a.offeringName} با ${a.staffName}، ${when}`,
      };
    case 'APPOINTMENT_CANCELLED':
      return {
        title: 'نوبت لغو شد',
        body: `${a.customerName} نوبت ${a.offeringName} (${when}) را لغو کرد`,
      };
    case 'REVIEW_RECEIVED':
      return {
        title: 'نظر جدید',
        body: `${a.customerName} به ${a.offeringName} با ${a.staffName} امتیاز ${formatNumber(a.reviewRating ?? 0)} از ۵ داد`,
      };
  }
}
