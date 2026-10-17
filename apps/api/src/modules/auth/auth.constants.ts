import type { Role } from '@safari/shared';

export const ACCESS_COOKIE = 'sbs_at';
export const REFRESH_COOKIE = 'sbs_rt';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const ROLES_KEY = 'roles';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
  /** Must match `User.tokenVersion`; bumping it revokes the token. */
  ver: number;
}

/** The authenticated user attached to the request by `AccessTokenGuard`. */
export interface AuthUser {
  id: string;
  role: Role;
}
