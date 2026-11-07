'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/shared/lib/theme';

/** Cloudflare Turnstile site key (public). Without it the widget is skipped, as in development. */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const turnstileEnabled = Boolean(SITE_KEY);

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: 'light' | 'dark';
      appearance: 'interaction-only';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  scriptLoading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing'));
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.append(script);
  }).catch((error: unknown) => {
    scriptLoading = null; // a later attempt may succeed
    throw error;
  });
  return scriptLoading;
}

interface TurnstileProps {
  /** The one-time token when the check passes, `null` while it is pending or after it expires. */
  onToken: (token: string | null) => void;
  /** Change this value to run the check again (a token only works once). */
  resetKey: number;
}

/**
 * Cloudflare's free bot check for the booking form. It runs by itself and only shows something
 * when Cloudflare is unsure the visitor is human.
 */
export function Turnstile({ onToken, resetKey }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const theme = useTheme();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    if (!SITE_KEY || !container.current) return;
    let cancelled = false;
    let api: TurnstileApi | undefined;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return;
        api = turnstile;
        widgetId.current = turnstile.render(container.current, {
          sitekey: SITE_KEY,
          theme,
          appearance: 'interaction-only',
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      if (api && widgetId.current) api.remove(widgetId.current);
      widgetId.current = null;
    };
    // The widget is rendered once per theme; later checks reuse it through `resetKey`.
  }, [theme]);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (window.turnstile && widgetId.current) window.turnstile.reset(widgetId.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return failed ? (
    <p role="alert" className="text-sm text-danger">
      بررسی امنیتی بارگذاری نشد. اینترنت را بررسی کنید و صفحه را تازه کنید.
    </p>
  ) : (
    <div ref={container} />
  );
}
