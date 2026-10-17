import { z } from 'zod';
import { appointmentLookupSchema } from './booking.js';
import { optionalTextSchema } from './common.js';

export const createReviewSchema = appointmentLookupSchema.extend({
  rating: z.number().int().min(1, 'امتیاز را انتخاب کنید').max(5),
  comment: optionalTextSchema(500),
});
export type CreateReviewInput = z.input<typeof createReviewSchema>;
export type CreateReviewData = z.output<typeof createReviewSchema>;

export const reviewVisibilitySchema = z.object({ isVisible: z.boolean() });
export type ReviewVisibilityData = z.output<typeof reviewVisibilitySchema>;
