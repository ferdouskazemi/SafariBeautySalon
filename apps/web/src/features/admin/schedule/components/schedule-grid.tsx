'use client';

import {
  APPOINTMENT_STATUS_LABELS,
  minuteOfDayOf,
  toDateKey,
  weekdayOf,
  type AppointmentStatus,
  type DateKey,
} from '@safari/shared';
import { useQuery } from '@tanstack/react-query';
import { formatTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/http';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { TimelineGrid } from '@/shared/ui/timeline-grid';
import { staffListQuery } from '../../staff/api';
import { scheduleQuery } from '../api';

const STATUS_BLOCK: Record<Exclude<AppointmentStatus, 'CANCELLED'>, string> = {
  CONFIRMED: 'border border-accent/50 bg-accent-soft text-fg',
  COMPLETED: 'border border-success/40 bg-success/10 text-fg',
  NO_SHOW: 'border border-line-strong bg-raised text-muted line-through',
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
        title: `${a.customerName} (${a.customerPhone})، ${a.offering.name}، ${APPOINTMENT_STATUS_LABELS[a.status]}`,
        children: (
          <>
            <span className="block truncate font-bold">{a.customerName}</span>
            <span className="block truncate text-muted">{a.offering.name}</span>
            <span className="block text-muted">
              {formatTime(a.startsAt)} تا {formatTime(a.endsAt)}
            </span>
          </>
        ),
      })),
  }));

  const grid = columns.length > 0 && (
    <TimelineGrid
      label="تقویم روز"
      nowMinute={date === toDateKey(new Date()) ? minuteOfDayOf(new Date()) : null}
      columns={columns}
    />
  );
  return grid || <EmptyState title="در این روز هیچ آرایشگری برنامه ندارد" />;
}
