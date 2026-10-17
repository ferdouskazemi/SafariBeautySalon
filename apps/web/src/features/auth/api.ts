import type { LoginData, SessionUser } from '@safari/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/shared/lib/http';

export const sessionQuery = queryOptions({
  queryKey: ['session'],
  queryFn: () => http<SessionUser>('/auth/me'),
  staleTime: 5 * 60_000,
  retry: false,
});

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginData) => http<SessionUser>('/auth/login', { method: 'POST', body }),
    onSuccess: (user) => queryClient.setQueryData(sessionQuery.queryKey, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => http<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => queryClient.clear(),
  });
}

/** Where a user lands after login: only same-app admin paths are allowed (no open redirects). */
export function postLoginPath(user: SessionUser, next: string | null) {
  if (next?.startsWith('/admin') && !next.startsWith('//')) return next;
  return user.role === 'ADMIN' ? '/admin' : '/admin/schedule';
}
