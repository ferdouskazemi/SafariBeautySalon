'use client';

import {
  BellRinging,
  BellSimple,
  CalendarCheck,
  CalendarX,
  Checks,
  Star,
  type Icon,
} from '@phosphor-icons/react';
import { toDateKey, type NotificationDto, type NotificationType } from '@safari/shared';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatLongDate, formatTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/http';
import { useHydrated } from '@/shared/lib/use-hydrated';
import { Button } from '@/shared/ui/button';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { PageHeader } from '../../shell/admin-shell';
import {
  describeNotification,
  notificationsQuery,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../api';

const ICONS: Record<NotificationType, { icon: Icon; tone: string }> = {
  APPOINTMENT_BOOKED: { icon: CalendarCheck, tone: 'text-accent' },
  APPOINTMENT_CANCELLED: { icon: CalendarX, tone: 'text-danger' },
  REVIEW_RECEIVED: { icon: Star, tone: 'text-success' },
};

export function NotificationsPage() {
  const router = useRouter();
  const { data, isPending, isError, error } = useQuery(notificationsQuery);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Opening a message marks it read and jumps to that appointment's day in the schedule.
  const open = (notification: NotificationDto) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    router.push(`/admin/schedule?date=${toDateKey(new Date(notification.appointment.startsAt))}`);
  };

  return (
    <>
      <PageHeader
        title="پیام‌ها"
        description="روی هر پیام بزنید تا برنامه همان روز باز شود."
        action={
          data && data.unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              loading={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <Checks size={16} />
              همه خوانده شد
            </Button>
          ) : undefined
        }
      />

      <EnableSystemAlerts />

      {isPending ? (
        <div className="grid gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title="پیام‌ها بارگذاری نشد" description={errorMessage(error)} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<BellSimple size={32} />}
          title="پیامی ندارید"
          description="وقتی مشتری نوبت بگیرد، لغو کند یا نظر بدهد، اینجا خبردار می‌شوید."
        />
      ) : (
        <ul className="grid gap-2">
          {data.items.map((notification) => {
            const { title, body } = describeNotification(notification);
            const { icon: TypeIcon, tone } = ICONS[notification.type];
            const unread = !notification.readAt;
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => open(notification)}
                  className={cn(
                    'flex w-full items-start gap-4 rounded-[var(--radius-field)] border p-4 text-start transition hover:border-accent/50',
                    unread ? 'border-accent/30 bg-accent-soft' : 'border-line bg-surface',
                  )}
                >
                  <TypeIcon size={22} className={cn('mt-0.5 shrink-0', tone)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="font-bold">{title}</span>
                      {unread && (
                        <span aria-hidden className="size-2 shrink-0 rounded-full bg-accent" />
                      )}
                      {unread && <span className="sr-only">(خوانده نشده)</span>}
                      <span className="ms-auto shrink-0 text-xs text-muted">
                        {formatTime(notification.createdAt)}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{body}</span>
                    <span className="mt-2 block text-xs text-muted">
                      {formatLongDate(notification.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** Asks once for permission to show phone/desktop notifications while the panel is in the background. */
function EnableSystemAlerts() {
  const hydrated = useHydrated();
  // The permission lives in the browser; this state only re-renders after the user answers.
  const [, setAnswered] = useState(false);
  const permission = hydrated && 'Notification' in window ? Notification.permission : null;
  if (permission !== 'default') return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-field)] border border-accent/30 bg-accent-soft p-4">
      <BellRinging size={22} className="shrink-0 text-accent" />
      <p className="flex-1 text-sm">
        اجازه دهید وقتی نوبت جدید ثبت شد، حتی با پنل در پس‌زمینه، اعلان روی همین دستگاه بیاید.
      </p>
      <Button
        size="sm"
        onClick={() => void Notification.requestPermission().then(() => setAnswered(true))}
      >
        فعال‌سازی
      </Button>
    </div>
  );
}
