import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  WEB_ORIGIN: z.url(),
  COOKIE_SECURE: z.stringbool().default(false),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
});

export type Env = z.infer<typeof envSchema>;

/** Fails fast at boot when the environment is misconfigured. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
