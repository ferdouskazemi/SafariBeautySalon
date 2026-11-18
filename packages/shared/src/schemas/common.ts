import { z } from 'zod';
import { normalizeAfghanPhone } from '../phone.js';

// Persian default messages for any rule without a custom message, on both client and server.
z.config(z.locales.fa());

export const idSchema = z.string().trim().min(1).max(50);

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ معتبر نیست')
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), 'تاریخ معتبر نیست');

export const personNameSchema = z
  .string()
  .trim()
  .min(2, 'نام باید حداقل ۲ حرف باشد')
  .max(60, 'نام طولانی است');

export const phoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const phone = normalizeAfghanPhone(value);
    if (!phone) {
      ctx.addIssue({ code: 'custom', message: 'شماره موبایل معتبر نیست. مثال: ۰۷۹۹۱۲۳۴۵۶' });
      return z.NEVER;
    }
    return phone;
  });

export const passwordSchema = z
  .string()
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
  .max(128, 'رمز عبور طولانی است');

/** Optional free text from a form: blank input becomes `null`. */
export const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `حداکثر ${max} کاراکتر`)
    .nullish()
    .transform((v) => v || null);
