import { ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 5_000;

/**
 * Checks the Cloudflare Turnstile token the booking form sends along (a free, mostly invisible
 * bot check). Without TURNSTILE_SECRET_KEY nothing is checked, so local development just works.
 */
@Injectable()
export class TurnstileService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async verify(token: string | undefined, ip: string | undefined): Promise<void> {
    const secret = this.config.get('TURNSTILE_SECRET_KEY', { infer: true });
    if (!secret) return;
    if (!token)
      throw new ForbiddenException('تأیید امنیتی انجام نشد. صفحه را تازه کنید و دوباره تلاش کنید');

    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);

    let passed = false;
    try {
      const response = await fetch(VERIFY_URL, {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      });
      passed = ((await response.json()) as { success?: boolean }).success === true;
    } catch {
      // Cloudflare unreachable: fail closed, but tell the customer it is worth retrying.
      throw new ServiceUnavailableException(
        'بررسی امنیتی موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید',
      );
    }
    if (!passed) {
      throw new ForbiddenException('تأیید امنیتی انجام نشد. صفحه را تازه کنید و دوباره تلاش کنید');
    }
  }
}
