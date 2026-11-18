import type { AppointmentDto, AppointmentStatus, DateKey } from '@safari/shared';
import { queryOptions } from '@tanstack/react-query';
import { http } from '@/shared/lib/http';
import { useAdminMutation } from '../shared/use-admin-mutation';

export const scheduleQuery = (date: DateKey, staffId?: string) =>
  queryOptions({
    queryKey: ['schedule', date, staffId ?? 'all'],
    queryFn: () => {
      const params = new URLSearchParams({ date });
      if (staffId) params.set('staffId', staffId);
      return http<AppointmentDto[]>(`/schedule?${params}`);
    },
    refetchInterval: 60_000,
  });

/** Every customer a barber has had (latest 200 appointments), for the staff page. */
export const staffHistoryQuery = (staffId: string) =>
  queryOptions({
    queryKey: ['schedule', 'history', staffId],
    queryFn: () => http<AppointmentDto[]>(`/schedule/history?staffId=${staffId}`),
  });

/** Manager only: cut an appointment short, which frees the rest of its time. */
export const useShortenAppointment = () =>
  useAdminMutation({
    mutationFn: ({ id, durationMinutes }: { id: string; durationMinutes: number }) =>
      http<AppointmentDto>(`/schedule/${id}/duration`, {
        method: 'PATCH',
        body: { durationMinutes },
      }),
    invalidates: [['schedule'], ['admin', 'dashboard']],
    successMessage: 'زمان نوبت کوتاه شد',
  });

export const useUpdateAppointmentStatus = () =>
  useAdminMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      http<AppointmentDto>(`/schedule/${id}/status`, { method: 'PATCH', body: { status } }),
    invalidates: [['schedule'], ['admin', 'dashboard']],
    successMessage: 'وضعیت نوبت به‌روز شد',
  });
