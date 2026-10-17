'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  APPOINTMENT_STATUS_LABELS,
  appointmentLookupSchema,
  type AppointmentLookupData,
  type AppointmentLookupInput,
  type AppointmentStatus,
  type PublicAppointmentDto,
} from '@safari/shared';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ReviewForm } from '@/features/reviews/components/review-form';
import { formatLongDate, formatPrice, formatTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/http';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Badge } from '@/shared/ui/feedback';
import { Field, Input } from '@/shared/ui/field';
import { StarRating } from '@/shared/ui/star-rating';
import { useCancelAppointment, useLookupAppointment } from '../api';

const STATUS_TONE: Record<AppointmentStatus, 'accent' | 'success' | 'danger' | 'neutral'> = {
  CONFIRMED: 'accent',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'neutral',
};

/** Guests look up their booking with its code and their phone number, then cancel or review it. */
export function TrackAppointment() {
  const params = useSearchParams();
  const lookup = useLookupAppointment();
  const [credentials, setCredentials] = useState<AppointmentLookupData | null>(null);
  const [appointment, setAppointment] = useState<PublicAppointmentDto | null>(null);

  const form = useForm<AppointmentLookupInput, unknown, AppointmentLookupData>({
    resolver: zodResolver(appointmentLookupSchema),
    defaultValues: { code: params.get('code') ?? '', phone: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((data) =>
    lookup.mutate(data, {
      onSuccess: (result) => {
        setCredentials(data);
        setAppointment(result);
      },
      onError: (error) => {
        setAppointment(null);
        toast.error(errorMessage(error));
      },
    }),
  );

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 lg:col-span-5">
        <Field label="کد نوبت" error={errors.code?.message}>
          {(control) => (
            <Input
              {...control}
              dir="ltr"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={6}
              className="font-latin tracking-[0.3em] uppercase"
              {...form.register('code')}
            />
          )}
        </Field>
        <Field label="شماره موبایل" error={errors.phone?.message}>
          {(control) => (
            <Input
              {...control}
              type="tel"
              inputMode="tel"
              dir="ltr"
              autoComplete="tel"
              className="text-start"
              {...form.register('phone')}
            />
          )}
        </Field>
        <Button type="submit" size="lg" loading={lookup.isPending} className="self-start">
          نمایش نوبت
        </Button>
      </form>

      <div className="lg:col-span-7">
        {appointment && credentials && (
          <AppointmentCard
            appointment={appointment}
            credentials={credentials}
            onChange={setAppointment}
          />
        )}
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: PublicAppointmentDto;
  credentials: AppointmentLookupData;
  onChange: (appointment: PublicAppointmentDto) => void;
}

function AppointmentCard({ appointment, credentials, onChange }: AppointmentCardProps) {
  const cancel = useCancelAppointment();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const onCancel = () =>
    cancel.mutate(credentials, {
      onSuccess: (updated) => {
        onChange(updated);
        setConfirmingCancel(false);
        toast.success('نوبت شما لغو شد');
      },
      onError: (error) => toast.error(errorMessage(error)),
    });

  return (
    <article className="rounded-[var(--radius-surface)] border border-line-strong bg-surface p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">{appointment.offeringName}</h2>
          <p className="mt-1 text-muted">با {appointment.staffName}</p>
        </div>
        <Badge tone={STATUS_TONE[appointment.status]}>
          {APPOINTMENT_STATUS_LABELS[appointment.status]}
        </Badge>
      </div>

      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">زمان</dt>
          <dd className="mt-1 font-bold">
            {formatLongDate(appointment.startsAt)}، ساعت {formatTime(appointment.startsAt)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">مبلغ</dt>
          <dd className="mt-1 font-bold">{formatPrice(appointment.price)}</dd>
        </div>
      </dl>

      {appointment.canCancel && (
        <Button variant="danger" className="mt-8" onClick={() => setConfirmingCancel(true)}>
          لغو نوبت
        </Button>
      )}

      {appointment.review && (
        <div className="mt-8 border-t border-line pt-6">
          <p className="text-sm text-muted">نظر شما</p>
          <StarRating value={appointment.review.rating} className="mt-2" />
          {appointment.review.comment && (
            <p className="mt-2 leading-relaxed">{appointment.review.comment}</p>
          )}
        </div>
      )}

      {appointment.canReview && (
        <div className="mt-8 border-t border-line pt-6">
          <ReviewForm
            credentials={credentials}
            onReviewed={(review) => onChange({ ...appointment, canReview: false, review })}
          />
        </div>
      )}

      <Dialog open={confirmingCancel} onClose={() => setConfirmingCancel(false)} title="لغو نوبت">
        <p className="leading-relaxed text-muted">
          نوبت {formatLongDate(appointment.startsAt)} ساعت {formatTime(appointment.startsAt)} لغو
          شود؟ این کار قابل بازگشت نیست.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmingCancel(false)}>
            منصرف شدم
          </Button>
          <Button variant="danger" loading={cancel.isPending} onClick={onCancel}>
            بله، لغو شود
          </Button>
        </div>
      </Dialog>
    </article>
  );
}
