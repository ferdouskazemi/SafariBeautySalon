import { Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { loginSchema, type LoginData, type SessionUser } from '@safari/shared';
import type { CookieOptions, Request, Response } from 'express';
import { ZodBody } from '../../common/validation/zod-validation.js';
import type { Env } from '../../config/env.js';
import {
  ACCESS_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
  type AuthUser,
} from './auth.constants.js';
import { Auth, CurrentUser } from './auth.decorators.js';
import { AuthService, type AuthTokens } from './auth.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @ZodBody(loginSchema) body: LoginData,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionUser> {
    const { user, tokens } = await this.auth.login(body);
    this.setAuthCookies(res, tokens);
    return user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionUser> {
    try {
      const { user, tokens } = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE]);
      this.setAuthCookies(res, tokens);
      return user;
    } catch (error) {
      this.clearAuthCookies(res);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    this.clearAuthCookies(res);
  }

  @Get('me')
  @Auth()
  me(@CurrentUser() user: AuthUser): Promise<SessionUser> {
    return this.auth.me(user.id);
  }

  private cookieOptions(maxAgeSeconds: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds * 1000,
    };
  }

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, this.cookieOptions(ACCESS_TOKEN_TTL_SECONDS));
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, this.cookieOptions(REFRESH_TOKEN_TTL_SECONDS));
  }

  private clearAuthCookies(res: Response) {
    const { maxAge: _, ...options } = this.cookieOptions(0);
    res.clearCookie(ACCESS_COOKIE, options);
    res.clearCookie(REFRESH_COOKIE, options);
  }
}
