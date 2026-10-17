import { z } from 'zod';
import { optionalTextSchema, passwordSchema, personNameSchema, phoneSchema } from './common.js';

/** An absolute http(s) URL, or a path on this site such as '/photos/barber-1.jpg'. */
const avatarUrlSchema = z
  .union([
    z.url({ protocol: /^https?$/, error: 'آدرس تصویر معتبر نیست' }),
    z.string().regex(/^\/(?!\/)[\w\-./]+$/, 'آدرس تصویر معتبر نیست'),
    z.literal(''),
  ])
  .nullish()
  .transform((v) => v || null);

export const createStaffSchema = z.object({
  fullName: personNameSchema,
  phone: phoneSchema,
  password: passwordSchema,
  title: optionalTextSchema(60),
  bio: optionalTextSchema(400),
  avatarUrl: avatarUrlSchema,
});
export type CreateStaffInput = z.input<typeof createStaffSchema>;
export type CreateStaffData = z.output<typeof createStaffSchema>;

export const updateStaffSchema = createStaffSchema
  .omit({ password: true })
  .partial()
  .extend({ isActive: z.boolean().optional() });
export type UpdateStaffInput = z.input<typeof updateStaffSchema>;
export type UpdateStaffData = z.output<typeof updateStaffSchema>;

export const resetPasswordSchema = z.object({ password: passwordSchema });
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

const minuteOfDaySchema = z
  .number()
  .int()
  .min(0)
  .max(24 * 60);

export const workingHoursSchema = z
  .object({
    days: z
      .array(
        z
          .object({
            weekday: z.number().int().min(0).max(6),
            startMinute: minuteOfDaySchema,
            endMinute: minuteOfDaySchema,
          })
          .refine((d) => d.startMinute < d.endMinute, 'ساعت پایان باید بعد از ساعت شروع باشد'),
      )
      .max(7),
  })
  .refine(
    ({ days }) => new Set(days.map((d) => d.weekday)).size === days.length,
    'هر روز فقط یک بار قابل تعریف است',
  );
export type WorkingHoursInput = z.input<typeof workingHoursSchema>;
