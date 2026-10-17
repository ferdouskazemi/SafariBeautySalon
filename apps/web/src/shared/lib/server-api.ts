import { cacheLife } from 'next/cache';

/** Server-side reads from the API (Server Components only). */

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

/**
 * Cached public read. Fresh data is kept for about a minute; if the API is unreachable the
 * page still renders (sections show their empty state) and the failure is retried within seconds.
 */
export async function cachedGet<T>(path: string): Promise<T | null> {
  'use cache';
  try {
    const response = await fetch(`${API_URL}/api${path}`);
    if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`);
    const data = (await response.json()) as T;
    cacheLife('minutes');
    return data;
  } catch (error) {
    console.error(`[server-api] ${path}:`, error);
    cacheLife('seconds');
    return null;
  }
}
