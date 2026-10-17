import type { CreateStaffData, StaffDto, UpdateStaffData, WorkingHoursInput } from '@safari/shared';
import { queryOptions } from '@tanstack/react-query';
import { http } from '@/shared/lib/http';
import { useAdminMutation } from '../shared/use-admin-mutation';

const STAFF_KEY = ['admin', 'staff'];

export const staffListQuery = queryOptions({
  queryKey: STAFF_KEY,
  queryFn: () => http<StaffDto[]>('/admin/staff'),
});

export const useCreateStaff = () =>
  useAdminMutation({
    mutationFn: (body: CreateStaffData) => http<StaffDto>('/admin/staff', { method: 'POST', body }),
    invalidates: [STAFF_KEY],
    successMessage: 'عضو جدید اضافه شد',
  });

export const useUpdateStaff = () =>
  useAdminMutation({
    mutationFn: ({ id, ...body }: UpdateStaffData & { id: string }) =>
      http<StaffDto>(`/admin/staff/${id}`, { method: 'PATCH', body }),
    invalidates: [STAFF_KEY],
    successMessage: 'تغییرات ذخیره شد',
  });

export const useSetWorkingHours = () =>
  useAdminMutation({
    mutationFn: ({ id, ...body }: WorkingHoursInput & { id: string }) =>
      http<StaffDto>(`/admin/staff/${id}/working-hours`, { method: 'PUT', body }),
    invalidates: [STAFF_KEY],
    successMessage: 'ساعت کاری ذخیره شد',
  });

export const useResetPassword = () =>
  useAdminMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      http<void>(`/admin/staff/${id}/password`, { method: 'PUT', body: { password } }),
    invalidates: [],
    successMessage: 'رمز عبور تغییر کرد',
  });
