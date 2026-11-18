'use client';

import {
  ArrowCounterClockwise,
  CalendarBlank,
  Check,
  Clock,
  Phone,
  UserMinus,
  X,
} from '@phosphor-icons/react';
import {
  APPOINTMENT_STATUS_LABELS,
  MIN_APPOINTMENT_MINUTES,
  type AppointmentDto,
  type AppointmentStatus,
  type DateKey,
} from '@safari/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { sessionQuery } from '@/features/auth/api';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/http';
import { useHydrated } from '@/shared/lib/use-hydrated';
import { Button, buttonStyles } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Badge, EmptyState, Skeleton } from '@/shared/ui/feedback';
import { scheduleQuery, useShortenAppointment, useUpdateAppointmentStatus } from '../api';
import { OfferingChips } from '../offering-colors';

const STATUS_TONES = {
  CONFIRMED: 'accent',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'neutral',
} as const satisfies Record<AppointmentStatus, string>;

interface ScheduleListProps {
  date: DateKey;
  staffId?: string;
  showStaff: boolean;
}

export function ScheduleList({ date, staffId, showStaff }: ScheduleListProps) {
  const { data, isPending, isError, error } = useQuery(scheduleQuery(date, staffId));

  if (isPending) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }
  if (isError) return <EmptyState title="برنامه بارگذاری نشد" description={errorMessage(error)} />;
  if (data.length === 0) {
    return (
      <EmptyState icon={<CalendarBlank size={32} />} title="برای این روز نوبتی ثبت نشده است" />
    );
  }

  return (
    <ul className="grid gap-3 xl:grid-cols-2">
      {data.map((appointment) => (
        <AppointmentRow key={appointment.id} appointment={appointment} showStaff={showStaff} />
      ))}
    </ul>
  );
}

function AppointmentRow({
  appointment,
  showStaff,
}: {
  appointment: AppointmentDto;
  showStaff: boolean;
}) {
  const updateStatus = useUpdateAppointmentStatus();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [shortening, setShortening] = useState(false);
  const { data: user } = useQuery(sessionQuery);
  // The session is cached on the client only, so wait for hydration before showing admin tools.
  const isAdmin = useHydrated() && user?.role === 'ADMIN';
  const { status } = appointment;
  const canShorten = isAdmin && (status === 'CONFIRMED' || status === 'COMPLETED');
  const inactive = status === 'CANCELLED' || status === 'NO_SHOW';
  // The API only accepts "done" / "no-show" once the appointment has started.
  const started = new Date(appointment.startsAt) <= new Date();

  const setStatus = (next: AppointmentStatus, onSuccess?: () => void) =>
    updateStatus.mutate({ id: appointment.id, status: next }, { onSuccess });
  const pendingFor = (target: AppointmentStatus) =>
    updateStatus.isPending && updateStatus.variables?.status === target;

  return (
    <li
      className={cn(
        'flex flex-col rounded-[var(--radius-field)] border border-line bg-surface p-4',
        inactive && 'opacity-70',
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 shrink-0 font-bold">
          {formatTime(appointment.startsAt)}
          <span className="block text-xs font-normal text-muted">
            تا {formatTime(appointment.endsAt)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{appointment.customerName}</p>
            <Badge tone={STATUS_TONES[status]}>{APPOINTMENT_STATUS_LABELS[status]}</Badge>
          </div>
          <OfferingChips offering={appointment.offering} />
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            {showStaff && <span>آرایشگر: {appointment.staff.fullName}</span>}
            <span>{formatDuration(minutesOf(appointment))}</span>
            <span>
              کد{' '}
              <span className="font-latin" dir="ltr">
                {appointment.code}
              </span>
            </span>
          </p>
          {appointment.note && (
            <p className="mt-3 rounded-lg bg-fg/[0.04] px-3 py-2 text-sm">
              <span className="text-muted">یادداشت مشتری: </span>
              {appointment.note}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <a
          href={`tel:${appointment.customerPhone}`}
          className={buttonStyles({ variant: 'secondary', size: 'sm' })}
          aria-label={`تماس با ${appointment.customerName}`}
        >
          <Phone size={16} />
          <span dir="ltr">{appointment.customerPhone}</span>
        </a>

        <div className="ms-auto flex flex-wrap gap-2">
          {canShorten && (
            <Button size="sm" variant="ghost" onClick={() => setShortening(true)}>
              <Clock size={16} />
              کوتاه کردن زمان
            </Button>
          )}
          {status === 'CONFIRMED' ? (
            <>
              {started && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pendingFor('NO_SHOW')}
                    disabled={updateStatus.isPending}
                    onClick={() => setStatus('NO_SHOW')}
                  >
                    <UserMinus size={16} />
                    نیامد
                  </Button>
                  <Button
                    size="sm"
                    loading={pendingFor('COMPLETED')}
                    disabled={updateStatus.isPending}
                    onClick={() => setStatus('COMPLETED')}
                  >
                    <Check size={16} weight="bold" />
                    انجام شد
                  </Button>
                </>
              )}
              {!started && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:bg-danger/10 hover:text-danger"
                  disabled={updateStatus.isPending}
                  onClick={() => setConfirmingCancel(true)}
                >
                  <X size={16} />
                  لغو نوبت
                </Button>
              )}
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              loading={pendingFor('CONFIRMED')}
              onClick={() => setStatus('CONFIRMED')}
              title="اگر وضعیت را اشتباهی تغییر داده‌اید"
            >
              <ArrowCounterClockwise size={16} />
              برگرداندن به «تأیید شده»
            </Button>
          )}
        </div>
      </div>

      {canShorten && (
        <ShortenDialog
          appointment={appointment}
          open={shortening}
          onClose={() => setShortening(false)}
        />
      )}

      <Dialog open={confirmingCancel} onClose={() => setConfirmingCancel(false)} title="لغو نوبت">
        <p className="leading-relaxed text-muted">
          نوبت <span className="font-bold text-fg">{appointment.customerName}</span> ساعت{' '}
          {formatTime(appointment.startsAt)} لغو شود؟ این زمان دوباره برای رزرو آزاد می‌شود.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmingCancel(false)}>
            منصرف شدم
          </Button>
          <Button
            variant="danger"
            loading={pendingFor('CANCELLED')}
            onClick={() => setStatus('CANCELLED', () => setConfirmingCancel(false))}
          >
            بله، لغو شود
          </Button>
        </div>
      </Dialog>
    </li>
  );
}

const minutesOf = ({ startsAt, endsAt }: Pick<AppointmentDto, 'startsAt' | 'endsAt'>) =>
  Math.round((Date.parse(endsAt) - Date.parse(startsAt)) / 60_000);

/** Shorter lengths to pick from: every 5 minutes for short visits, every 15 for long ones. */
function shorterDurations(current: number): number[] {
  const step = current <= 60 ? 5 : 15;
  const options: number[] = [];
  for (let minutes = MIN_APPOINTMENT_MINUTES; minutes < current; minutes += step) {
    options.push(minutes);
  }
  return options;
}

/** The manager picks how long the visit really took; the freed time opens up for booking. */
function ShortenDialog({
  appointment,
  open,
  onClose,
}: {
  appointment: AppointmentDto;
  open: boolean;
  onClose: () => void;
}) {
  const shorten = useShortenAppointment();
  const current = minutesOf(appointment);
  const options = shorterDurations(current);

  return (
    <Dialog open={open} onClose={onClose} title="کوتاه کردن زمان نوبت">
      <p className="leading-relaxed text-muted">
        نوبت <span className="font-bold text-fg">{appointment.customerName}</span> الان{' '}
        {formatDuration(current)} است ({formatTime(appointment.startsAt)} تا{' '}
        {formatTime(appointment.endsAt)}). مدت واقعی کار را انتخاب کنید؛ بقیهٔ وقت برای رزرو آزاد
        می‌شود.
      </p>
      {options.length === 0 ? (
        <p className="mt-5 text-sm text-muted">این نوبت از این کوتاه‌تر نمی‌شود.</p>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-2">
          {options.map((minutes) => (
            <Button
              key={minutes}
              variant="secondary"
              loading={shorten.isPending && shorten.variables?.durationMinutes === minutes}
              disabled={shorten.isPending}
              onClick={() =>
                shorten.mutate(
                  { id: appointment.id, durationMinutes: minutes },
                  { onSuccess: onClose },
                )
              }
            >
              {formatDuration(minutes)}
            </Button>
          ))}
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          بستن
        </Button>
      </div>
    </Dialog>
  );
}
