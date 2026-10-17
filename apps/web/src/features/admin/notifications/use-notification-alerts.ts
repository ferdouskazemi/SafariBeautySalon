'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { describeNotification, notificationsQuery } from './api';

/**
 * Pops a toast for each message that arrives while the panel is open, and shows the unread
 * count in the browser tab. Messages that were already there on first load are not toasted.
 */
export function useNotificationAlerts(enabled: boolean) {
  const router = useRouter();
  const { data } = useQuery({ ...notificationsQuery, enabled });
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data) return;
    if (seen.current === null) {
      seen.current = new Set(data.items.map((n) => n.id));
      return;
    }
    for (const notification of data.items) {
      if (seen.current.has(notification.id)) continue;
      seen.current.add(notification.id);
      if (notification.readAt) continue;
      const { title, body } = describeNotification(notification);
      toast(title, {
        description: body,
        duration: 10_000,
        action: { label: 'مشاهده', onClick: () => router.push('/admin/notifications') },
      });
    }
  }, [data, router]);

  const unreadCount = data?.unreadCount ?? 0;
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  return unreadCount;
}
