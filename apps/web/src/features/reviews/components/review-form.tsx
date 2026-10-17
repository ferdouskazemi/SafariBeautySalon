'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { optionalTextSchema, type AppointmentLookupData, type ReviewDto } from '@safari/shared';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { errorMessage, http } from '@/shared/lib/http';
import { Button } from '@/shared/ui/button';
import { Field, Textarea } from '@/shared/ui/field';
import { StarInput } from '@/shared/ui/star-rating';

const reviewFormSchema = z.object({
  rating: z.number().int().min(1, 'امتیاز را انتخاب کنید').max(5),
  comment: optionalTextSchema(500),
});
type ReviewFormInput = z.input<typeof reviewFormSchema>;
type ReviewFormData = z.output<typeof reviewFormSchema>;

interface ReviewFormProps {
  credentials: AppointmentLookupData;
  onReviewed: (review: { rating: number; comment: string | null }) => void;
}

export function ReviewForm({ credentials, onReviewed }: ReviewFormProps) {
  const submit = useMutation({
    mutationFn: (data: ReviewFormData) =>
      http<ReviewDto>('/reviews', { method: 'POST', body: { ...credentials, ...data } }),
  });
  const form = useForm<ReviewFormInput, unknown, ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 0, comment: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((data) =>
    submit.mutate(data, {
      onSuccess: (review) => {
        toast.success('ممنون از نظرتان');
        onReviewed({ rating: review.rating, comment: review.comment });
      },
      onError: (error) => toast.error(errorMessage(error)),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <p className="font-bold">تجربه‌تان چطور بود؟</p>
        <div className="mt-3">
          <Controller
            control={form.control}
            name="rating"
            render={({ field }) => (
              <StarInput
                value={field.value}
                onChange={field.onChange}
                invalid={Boolean(errors.rating)}
              />
            )}
          />
        </div>
        {errors.rating && <p className="mt-2 text-xs text-danger">{errors.rating.message}</p>}
      </div>
      <Field label="نظر شما (اختیاری)" error={errors.comment?.message}>
        {(control) => <Textarea {...control} {...form.register('comment')} />}
      </Field>
      <Button type="submit" loading={submit.isPending} className="self-start">
        ثبت نظر
      </Button>
    </form>
  );
}
