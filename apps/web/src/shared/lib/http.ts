import type { ApiErrorBody } from '@safari/shared';

/** Browser-side API client. Requests go through the same-origin `/api` rewrite. */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const GENERIC_ERROR = 'خطایی رخ داد. لطفاً دوباره تلاش کنید';
const NO_REFRESH_PATHS = new Set(['/auth/login', '/auth/refresh', '/auth/logout']);

let refreshInFlight: Promise<boolean> | null = null;

/** Concurrent 401s share one refresh request. */
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch('/api/auth/refresh', { method: 'POST' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
}

export async function http<T>(
  path: string,
  options: RequestOptions = {},
  canRetry = true,
): Promise<T> {
  const { method = 'GET', body } = options;
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'اتصال به سرور برقرار نشد. اینترنت خود را بررسی کنید');
  }

  if (response.status === 401 && canRetry && !NO_REFRESH_PATHS.has(path)) {
    if (await refreshSession()) return http<T>(path, options, false);
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as Partial<ApiErrorBody> | null;
    const message = typeof error?.message === 'string' ? error.message : GENERIC_ERROR;
    throw new ApiError(response.status, message, error?.fieldErrors);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : GENERIC_ERROR;
