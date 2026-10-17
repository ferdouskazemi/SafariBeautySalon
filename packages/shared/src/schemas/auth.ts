import { z } from 'zod';
import { phoneSchema } from './common.js';

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'رمز عبور را وارد کنید').max(128),
});
export type LoginInput = z.input<typeof loginSchema>;
export type LoginData = z.output<typeof loginSchema>;
