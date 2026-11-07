'use client';

import { CalendarX, CaretLeft, Lightning, LockSimple, UserCircle } from '@phosphor-icons/react';
import {
  BOOKING_WINDOW_DAYS,
  minuteOfDayOf,
  toDateKey,
  upcomingDateKeys,
  type BoardColumnDto,
  type TimeRangeDto,
} from '@safari/shared';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatDateKeyLong, formatDuration, formatNumber, formatTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/http';
import { Button, ButtonLink } from '@/shared/ui/button';
import { DayStrip } from '@/shared/ui/day-strip';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { TimelineGrid, type TimelineColumn } from '@/shared/ui/timeline-grid';
import { boardQuery } from '../api';

const BOOKED_STYLE = 'border border-line-strong bg-raised text-muted';
const FREE_STYLE =
  'border border-accent/30 bg-accent-soft text-accent transition hover:border-accent hover:bg-accent/20';

const toMinutes = (range: TimeRangeDto) => ({
  startMinute: minuteOfDayOf(new Date(range.startsAt)),
  endMinute: minuteOfDayOf(new Date(range.endsAt)) || 24 * 60,
});
const rangeLabel = (range: TimeRangeDto) =>
  `${formatTime(range.startsAt)} تا ${formatTime(range.endsAt)}`;

/**
 * The public day board: every barber's booked and free times, refreshed every minute.
 * Phones get a simple list per barber with big tap targets; wider screens get the grid.
 * Booked times say only «رزرو شده»; customer names never leave the team panel.
 */
export function PublicBoard() {
  const days = useMemo(() => upcomingDateKeys(BOOKING_WINDOW_DAYS), []);
  const router = useRouter();
  const pathname = usePathname();
  const requested = useSearchParams().get('date');
  const date = requested && days.includes(requested) ? requested : days[0]!;
  const setDate = (next: string) => router.replace(`${pathname}?date=${next}`, { scroll: false });

  const board = useQuery(boardQuery(date));
  const today = toDateKey(new Date());

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {/* The day picker stays in reach while scrolling on phones. */}
      <div className="sticky top-16 z-10 -mx-4 border-b border-line bg-bg/90 px-4 pt-3 backdrop-blur-xl md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <DayStrip key={date} days={days} value={date} onChange={setDate} label="انتخاب روز" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">{formatDateKeyLong(date)}</h2>
          {board.data && <DaySummary columns={board.data.columns} />}
        </div>
        <ul className="hidden flex-wrap gap-4 text-xs text-muted md:flex" aria-label="راهنما">
          <LegendItem className={FREE_STYLE}>آزاد؛ برای رزرو بزنید</LegendItem>
          <LegendItem className={BOOKED_STYLE}>رزرو شده</LegendItem>
          <LegendItem className="border border-line-strong bg-[repeating-linear-gradient(135deg,transparent_0_3px,color-mix(in_srgb,var(--color-fg)_15%,transparent)_3px_6px)]">
            خارج از ساعت کاری
          </LegendItem>
        </ul>
      </div>

      {board.isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-[var(--radius-surface)]" />
          <Skeleton className="h-80 rounded-[var(--radius-surface)]" />
        </div>
      ) : board.isError ? (
        <EmptyState
          title="تقویم بارگذاری نشد"
          description={errorMessage(board.error)}
          action={
            <Button variant="secondary" size="sm" onClick={() => board.refetch()}>
              تلاش دوباره
            </Button>
          }
        />
      ) : board.data.columns.every((c) => !c.shift) ? (
        <EmptyState
          icon={<CalendarX size={32} />}
          title="سالون در این روز تعطیل است"
          description="روز دیگری را از بالا انتخاب کنید."
        />
      ) : (
        <>
          <NextFree columns={board.data.columns} date={date} />

          <div className="flex flex-col gap-4 md:hidden">
            {board.data.columns.map((column) => (
              <BarberAgenda
                key={column.staff.id}
                column={column}
                date={date}
                now={board.dataUpdatedAt}
              />
            ))}
          </div>

          <div className="hidden md:block">
            <TimelineGrid
              label={`برنامه آرایشگران در ${formatDateKeyLong(date)}`}
              nowMinute={date === today ? minuteOfDayOf(new Date()) : null}
              columns={board.data.columns.map((column) => toTimelineColumn(column, date))}
            />
          </div>
        </>
      )}

      <ButtonLink href="/booking" size="lg" className="w-full md:w-auto md:self-start">
        رزرو نوبت
      </ButtonLink>
    </div>
  );
}

const bookingHref = (staffId: string, date: string) => `/booking?staff=${staffId}&date=${date}`;

/** The earliest free time of the day, one tap away. */
function NextFree({ columns, date }: { columns: BoardColumnDto[]; date: string }) {
  const next = columns
    .flatMap((c) => c.free.map((range) => ({ range, staff: c.staff })))
    .sort((a, b) => a.range.startsAt.localeCompare(b.range.startsAt))[0];
  if (!next) return null;

  return (
    <Link
      href={bookingHref(next.staff.id, date)}
      className="flex items-center gap-4 rounded-[var(--radius-surface)] border border-accent/60 bg-accent-soft p-4 transition active:scale-[0.99] md:self-start md:pe-6"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
        <Lightning size={20} weight="fill" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted">نزدیک‌ترین وقت آزاد</span>
        <span className="block truncate text-lg font-black">
          ساعت {formatTime(next.range.startsAt)} با {next.staff.fullName}
        </span>
      </span>
      <CaretLeft size={20} className="shrink-0 text-accent" />
    </Link>
  );
}

/** One barber's day as a plain list, for phones: free times are big buttons, booked ones are grey. */
/** `now` is when the board was fetched, so past bookings dim without reading the clock in render. */
function BarberAgenda({
  column,
  date,
  now,
}: {
  column: BoardColumnDto;
  date: string;
  now: number;
}) {
  const { staff } = column;
  const rows = [
    ...column.free.map((range) => ({ range, free: true })),
    ...column.booked.map((range) => ({ range, free: false })),
  ].sort((a, b) => a.range.startsAt.localeCompare(b.range.startsAt));

  return (
    <section
      aria-label={staff.fullName}
      className="overflow-hidden rounded-[var(--radius-surface)] border border-line-strong bg-surface"
    >
      <header className="flex items-center gap-3 p-4">
        <Avatar staff={staff} size={44} />
        <div className="min-w-0">
          <p className="truncate font-bold">{staff.fullName}</p>
          <p className={cn('text-xs', column.free.length > 0 ? 'text-accent' : 'text-muted')}>
            {freeLabel(column)}
          </p>
        </div>
      </header>

      {column.shift && rows.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-line p-3">
          {rows.map(({ range, free }) => {
            const time = (
              <span className="block font-bold tabular-nums">
                {formatTime(range.startsAt)} تا {formatTime(range.endsAt)}
              </span>
            );
            return (
              <li key={`${free}-${range.startsAt}`}>
                {free ? (
                  <Link
                    href={bookingHref(staff.id, date)}
                    className="flex min-h-14 items-center gap-3 rounded-[var(--radius-field)] border border-accent/40 bg-accent-soft px-4 py-2.5 transition active:scale-[0.99]"
                  >
                    <span className="min-w-0 flex-1">
                      {time}
                      <span className="block text-xs text-accent">
                        آزاد · {formatDuration(minutesIn([range]))}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-accent px-3.5 py-2 text-sm font-bold text-on-accent">
                      رزرو
                      <CaretLeft size={14} weight="bold" />
                    </span>
                  </Link>
                ) : (
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-[var(--radius-field)] bg-raised px-4 py-3 text-sm text-muted',
                      Date.parse(range.endsAt) < now && 'opacity-50',
                    )}
                  >
                    <LockSimple size={16} className="shrink-0" />
                    <span className="flex-1">{time}</span>
                    <span className="text-xs">رزرو شده</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Avatar({ staff, size }: { staff: BoardColumnDto['staff']; size: number }) {
  return (
    <span
      className="relative shrink-0 overflow-hidden rounded-full bg-raised"
      style={{ width: size, height: size }}
    >
      {staff.avatarUrl ? (
        <Image
          src={staff.avatarUrl}
          alt=""
          fill
          sizes={`${size}px`}
          unoptimized
          className="object-cover"
        />
      ) : (
        <UserCircle aria-hidden size={size * 0.6} className="absolute inset-0 m-auto text-muted" />
      )}
    </span>
  );
}

function toTimelineColumn(column: BoardColumnDto, date: string): TimelineColumn {
  const { staff } = column;
  return {
    key: staff.id,
    shift: column.shift,
    header: (
      <div className="flex items-center gap-3">
        <Avatar staff={staff} size={40} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{staff.fullName}</p>
          <p className="text-xs text-muted">{freeLabel(column)}</p>
        </div>
      </div>
    ),
    blocks: [
      ...column.booked.map((range) => ({
        key: `booked-${range.startsAt}`,
        ...toMinutes(range),
        className: BOOKED_STYLE,
        title: `رزرو شده، ${rangeLabel(range)}`,
        children: (
          <>
            <span className="block font-bold">رزرو شده</span>
            {rangeLabel(range)}
          </>
        ),
      })),
      ...column.free.map((range) => ({
        key: `free-${range.startsAt}`,
        ...toMinutes(range),
        className: FREE_STYLE,
        href: `/booking?staff=${staff.id}&date=${date}`,
        title: `رزرو با ${staff.fullName}، ${rangeLabel(range)}`,
        children: (
          <>
            <span className="block font-bold">آزاد</span>
            {rangeLabel(range)}
          </>
        ),
      })),
    ],
  };
}

const minutesIn = (ranges: TimeRangeDto[]) =>
  ranges.reduce((sum, r) => sum + (Date.parse(r.endsAt) - Date.parse(r.startsAt)) / 60_000, 0);

function freeLabel(column: BoardColumnDto) {
  if (!column.shift) return 'این روز کار نمی‌کند';
  const free = minutesIn(column.free);
  return free > 0 ? `${formatDuration(free)} وقت آزاد` : 'وقت آزاد ندارد';
}

function DaySummary({ columns }: { columns: BoardColumnDto[] }) {
  const booked = columns.reduce((sum, c) => sum + c.booked.length, 0);
  const withRoom = columns.filter((c) => c.free.length > 0).length;
  return (
    <p className="mt-1 text-sm text-muted">
      {formatNumber(booked)} نوبت رزرو شده ·{' '}
      {withRoom > 0
        ? `${formatNumber(withRoom)} آرایشگر هنوز وقت آزاد دارد`
        : 'همه وقت‌ها پر شده است'}
    </p>
  );
}

function LegendItem({ className, children }: { className: string; children: string }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden className={cn('size-3.5 rounded', className)} />
      {children}
    </li>
  );
}
