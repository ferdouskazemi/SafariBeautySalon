import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import type { Role } from '@safari/shared';
import { AccessTokenGuard, type AuthenticatedRequest } from './access-token.guard.js';
import { ACCESS_COOKIE, ROLES_KEY, type AuthUser } from './auth.constants.js';

/** Requires a signed-in team member, optionally restricted to the given roles. */
export const Auth = (...roles: Role[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(AccessTokenGuard),
    ApiCookieAuth(ACCESS_COOKIE),
  );

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user!,
);
