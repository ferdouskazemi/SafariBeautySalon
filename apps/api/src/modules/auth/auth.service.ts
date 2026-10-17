import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { LoginData, SessionUser } from '@safari/shared';
import * as argon2 from 'argon2';
import type { Env } from '../../config/env.js';
import type { User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  type AccessTokenPayload,
  type RefreshTokenPayload,
} from './auth.constants.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const INVALID_CREDENTIALS = 'شماره موبایل یا رمز عبور اشتباه است';

@Injectable()
export class AuthService {
  /** Verified against when the phone is unknown, so response time does not reveal accounts. */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async login({ phone, password }: LoginData) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    this.dummyHash ??= argon2.hash('safari-timing-equalizer');
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const passwordMatches = await argon2.verify(hash, password);

    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return { user: toSessionUser(user), tokens: await this.issueTokens(user) };
  }

  async refresh(refreshToken: string | undefined) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive || user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException('نشست شما منقضی شده است');
    }
    return { user: toSessionUser(user), tokens: await this.issueTokens(user) };
  }

  /** Revokes all refresh tokens of the user who owns `refreshToken`, if it is valid. */
  async logout(refreshToken: string | undefined) {
    const payload = await this.verifyRefreshToken(refreshToken).catch(() => null);
    if (!payload) return;
    await this.prisma.user.updateMany({
      where: { id: payload.sub, tokenVersion: payload.ver },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async me(userId: string): Promise<SessionUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('حساب کاربری فعال نیست');
    return toSessionUser(user);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const access: AccessTokenPayload = { sub: user.id, role: user.role };
    const refresh: RefreshTokenPayload = { sub: user.id, ver: user.tokenVersion };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(access, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      }),
      this.jwt.signAsync(refresh, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string | undefined) {
    if (!token) throw new UnauthorizedException('ابتدا وارد شوید');
    try {
      return await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('نشست شما منقضی شده است');
    }
  }
}

function toSessionUser(user: User): SessionUser {
  return { id: user.id, fullName: user.fullName, phone: user.phone, role: user.role };
}
