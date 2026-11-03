'use client';

import { Phone } from '@phosphor-icons/react';
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus, type StaffDto } from '@safari/shared';
import { useQuery } from '@tanstack/react-query';
import { formatLongDate, formatNumber, formatPrice, formatTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/http';
import { Dialog } from '@/shared/ui/dialog';
import { Badge, EmptyState, Skeleton } from '@/shared/ui/feedback';
import { staffHistoryQuery } from '../../schedule/api';

const STATUS_TONES = {
  CONFIRMED: 'accent',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'neutral',
} as const satisfies Record<AppointmentStatus, 'accent' | 'success' | 'danger' | 'neutral'>;

/** A barber's customers: totals first, then every appointment, newest first. */
export function CustomersDialog({ member, onClose }: { member: StaffDto; onClose: () => void }) {
  const { data, isPending, isError, error } = useQuery(staffHistoryQuery(member.id));

  const done = data?.filter((a) => a.status === 'COMPLETED') ?? [];
  const upcoming = data?.filter(
    (a) => a.status === 'CONFIRMED' && new Date(a.startsAt) > new Date(),
  );
  const customers = new Set(data?.map((a) => a.customerPhone));
  const income = done.reduce((sum, a) => sum + a.price, 0);

  return (
    <Dialog open onClose={onClose} title={`مشتری‌های ${member.fullName}`}>
      {isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title="بارگذاری نشد" description={errorMessage(error)} />
      ) : data.length === 0 ? (
        <EmptyState title="هنوز مشتری‌ای ندارد" />
      ) : (
        <div className="grid gap-5">
          <dl className="grid grid-cols-2 gap-2 text-center">
            <Stat label="مشتری" value={formatNumber(customers.size)} />
            <Stat label="نوبت‌های انجام‌شده" value={formatNumber(done.length)} />
            <Stat label="نوبت‌های پیش‌رو" value={formatNumber(upcoming?.length ?? 0)} />
            <Stat label="درآمد انجام‌شده" value={formatPrice(income)} />
          </dl>

          <ul className="grid gap-2">
            {data.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-[var(--radius-field)] border border-line px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {a.customerName}
                    <Badge tone={STATUS_TONES[a.status]}>
                      {APPOINTMENT_STATUS_LABELS[a.status]}
                    </Badge>
                  </p>
                  <p className="mt-1 text-sm">{a.offering.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatLongDate(a.startsAt)}، {formatTime(a.startsAt)} · {formatPrice(a.price)}
                  </p>
                </div>
                <a
                  href={`tel:${a.customerPhone}`}
                  aria-label={`تماس با ${a.customerName}`}
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition hover:border-accent/60 hover:text-fg"
                >
                  <Phone size={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-field)] bg-fg/[0.04] px-3 py-3">
      <dd className="text-lg font-black text-accent">{value}</dd>
      <dt className="mt-0.5 text-xs text-muted">{label}</dt>
    </div>
  );
}
