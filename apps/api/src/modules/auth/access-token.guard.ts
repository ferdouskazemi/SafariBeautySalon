import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@safari/shared';
import type { Request } from 'express';
import type { Env } from '../../config/env.js';
import {
  ACCESS_COOKIE,
  ROLES_KEY,
  type AccessTokenPayload,
  type AuthUser,
} from './auth.constants.js';

export type AuthenticatedRequest = Request & { user?: AuthUser };

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[ACCESS_COOKIE];
    if (typeof token !== 'string') throw new UnauthorizedException('ابتدا وارد شوید');

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
      request.user = { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException('نشست شما منقضی شده است');
    }

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles?.length && !roles.includes(request.user.role)) {
      throw new ForbiddenException('به این بخش دسترسی ندارید');
    }
    return true;
  }
}
