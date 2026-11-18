import { z } from 'zod';
import { SERVICE_CATEGORIES } from '../constants.js';
import { idSchema, optionalTextSchema } from './common.js';

const offeringNameSchema = z
  .string()
  .trim()
  .min(2, 'نام باید حداقل ۲ حرف باشد')
  .max(80, 'نام طولانی است');

export const createServiceSchema = z.object({
  name: offeringNameSchema,
  description: optionalTextSchema(300),
  category: z.enum(SERVICE_CATEGORIES),
  durationMinutes: z
    .number({ error: 'مدت زمان را وارد کنید' })
    .int()
    .min(10, 'حداقل ۱۰ دقیقه')
    .max(480, 'حداکثر ۸ ساعت'),
  isActive: z.boolean().optional(),
});
export type CreateServiceInput = z.input<typeof createServiceSchema>;
export type CreateServiceData = z.output<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema.partial();
export type UpdateServiceData = z.output<typeof updateServiceSchema>;

export const createPackageSchema = z.object({
  name: offeringNameSchema,
  description: optionalTextSchema(400),
  serviceIds: z.array(idSchema).min(1, 'حداقل یک خدمت انتخاب کنید').max(12),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type CreatePackageInput = z.input<typeof createPackageSchema>;
export type CreatePackageData = z.output<typeof createPackageSchema>;

export const updatePackageSchema = createPackageSchema.partial();
export type UpdatePackageData = z.output<typeof updatePackageSchema>;
