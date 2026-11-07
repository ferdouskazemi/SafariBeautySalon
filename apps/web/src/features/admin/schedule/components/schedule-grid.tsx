'use client';

import {
  APPOINTMENT_STATUS_LABELS,
  minuteOfDayOf,
  toDateKey,
  weekdayOf,
  type AppointmentStatus,
  type DateKey,
} from '@safari/shared';
import { Check } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { formatTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/http';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { TimelineGrid } from '@/shared/ui/timeline-grid';
import { staffListQuery } from '../../staff/api';
import { scheduleQuery } from '../api';
import { offeringStyle, ServiceLegend } from '../offering-colors';

/** The color says which service; the status shows as a check (done) or struck-through text. */
const STATUS_BLOCK: Record<Exclude<AppointmentStatus, 'CANCELLED'>, string> = {
  CONFIRMED: 'svc-block',
  COMPLETED: 'svc-block',
  NO_SHOW: 'svc-block opacity-60 line-through',
};

interface ScheduleGridProps {
  date: DateKey;
  staffId?: string;
}

/** The manager's day calendar: one column per barber, with each customer's booking. */
export function ScheduleGrid({ date, staffId }: ScheduleGridProps) {
  const staff = useQuery(staffListQuery);
  const schedule = useQuery(scheduleQuery(date, staffId));

  if (staff.isPending || schedule.isPending) {
    return <Skeleton className="h-[28rem] rounded-[var(--radius-surface)]" />;
  }
  if (staff.isError || schedule.isError) {
    return (
      <EmptyState
        title="برنامه بارگذاری نشد"
        description={errorMessage(staff.error ?? schedule.error)}
      />
    );
  }

  const weekday = weekdayOf(date);
  const barbers = staff.data.filter(
    (m) => m.role === 'STAFF' && (staffId ? m.id === staffId : m.isActive),
  );
  const columns = barbers.map((member) => ({
    key: member.id,
    shift: member.workingHours.find((h) => h.weekday === weekday) ?? null,
    header: <p className="truncate text-sm font-bold">{member.fullName}</p>,
    blocks: schedule.data
      .filter((a) => a.staff.id === member.id && a.status !== 'CANCELLED')
      .map((a) => ({
        key: a.id,
        startMinute: minuteOfDayOf(new Date(a.startsAt)),
        endMinute: minuteOfDayOf(new Date(a.endsAt)) || 24 * 60,
        className: STATUS_BLOCK[a.status as keyof typeof STATUS_BLOCK],
        style: offeringStyle(a.offering),
        title: `${a.customerName} (${a.customerPhone})، ${a.offering.name}، ${APPOINTMENT_STATUS_LABELS[a.status]}`,
        children: (
          <>
            <span className="flex items-center gap-1 font-bold">
              <span className="truncate">{a.customerName}</span>
              {a.status === 'COMPLETED' && (
                <Check
                  size={14}
                  weight="bold"
                  className="shrink-0 text-success"
                  aria-label={APPOINTMENT_STATUS_LABELS.COMPLETED}
                />
              )}
            </span>
            <span className="block truncate text-muted">{a.offering.name}</span>
            <span className="block text-muted">
              {formatTime(a.startsAt)} تا {formatTime(a.endsAt)}
            </span>
          </>
        ),
      })),
  }));

  if (columns.length === 0) {
    return <EmptyState title="در این روز هیچ آرایشگری برنامه ندارد" />;
  }
  const booked = schedule.data.filter((a) => a.status !== 'CANCELLED');
  return (
    <div className="flex flex-col gap-3">
      <ServiceLegend offerings={booked.map((a) => a.offering)} />
      <TimelineGrid
        label="تقویم روز"
        nowMinute={date === toDateKey(new Date()) ? minuteOfDayOf(new Date()) : null}
        columns={columns}
      />
    </div>
  );
}
