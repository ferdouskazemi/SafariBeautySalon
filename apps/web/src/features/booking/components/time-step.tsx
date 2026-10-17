'use client';

import {
  CalendarBlank,
  CalendarX,
  Lightning,
  Moon,
  Sun,
  SunHorizon,
  UserCircle,
} from '@phosphor-icons/react';
import { minuteOfDayOf, type DateKey, type PublicStaffDto, type SlotDto } from '@safari/shared';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatDateKeyLong, formatTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/http';
import { Button } from '@/shared/ui/button';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { availabilityQuery, bookableDaysQuery, type OfferingSelection } from '../api';
import { DateScroller } from './date-scroller';

const PARTS_OF_DAY = [
  { label: 'صبح', icon: SunHorizon, from: 0, to: 12 * 60 },
  { label: 'ظهر', icon: Sun, from: 12 * 60, to: 16 * 60 },
  { label: 'عصر و شب', icon: Moon, from: 16 * 60, to: 24 * 60 },
];

interface TimeStepProps {
  offering: OfferingSelection;
  team: PublicStaffDto[];
  staffId: string | null;
  date: DateKey | null;
  slot: SlotDto | null;
  onStaffChange: (staffId: string | null) => void;
  onDateChange: (date: DateKey) => void;
  onSlotChange: (slot: SlotDto) => void;
}

/** Barber pills, a swipeable row of days, then the free times of the chosen day. */
export function TimeStep({
  offering,
  team,
  staffId,
  date,
  slot,
  onStaffChange,
  onDateChange,
  onSlotChange,
}: TimeStepProps) {
  const days = useQuery(bookableDaysQuery(offering, staffId));
  const dayList = days.data?.days;
  // Without a chosen day (or with one outside the window), open on the first day with room.
  const known = dayList?.some((d) => d.date === date) ? date : null;
  const activeDate = known ?? dayList?.find((d) => d.freeSlots > 0)?.date ?? null;
  const nextFree = dayList?.find((d) => d.freeSlots > 0 && (!activeDate || d.date > activeDate));

  const day = useQuery({
    ...availabilityQuery(offering, staffId, activeDate ?? ''),
    enabled: activeDate !== null,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-bold">
          آرایشگر <span className="font-normal text-muted">(اختیاری)</span>
        </p>
        <StaffPills team={team} value={staffId} onChange={onStaffChange} />
      </div>

      <DateScroller days={dayList} value={activeDate} onChange={onDateChange} />

      {days.isError ? (
        <EmptyState
          title="تقویم بارگذاری نشد"
          description={errorMessage(days.error)}
          action={
            <Button variant="secondary" size="sm" onClick={() => days.refetch()}>
              تلاش دوباره
            </Button>
          }
        />
      ) : dayList && activeDate === null ? (
        <EmptyState
          icon={<CalendarX size={32} />}
          title="در سه هفته آینده وقت خالی نیست"
          description={
            staffId
              ? 'آرایشگر دیگری انتخاب کنید یا «هر آرایشگر» را بزنید.'
              : 'لطفاً با سالون تماس بگیرید.'
          }
        />
      ) : !dayList || day.isPending ? (
        <SlotsSkeleton />
      ) : day.isError ? (
        <EmptyState title="ساعت‌های خالی بارگذاری نشد" description={errorMessage(day.error)} />
      ) : day.data.slots.length === 0 ? (
        <EmptyState
          icon={<CalendarX size={32} />}
          title={`${formatDateKeyLong(activeDate!)} وقت خالی ندارد`}
          description={nextFree ? undefined : 'روزهای بعد هم پر است. آرایشگر دیگری را امتحان کنید.'}
          action={
            nextFree && (
              <Button variant="secondary" size="sm" onClick={() => onDateChange(nextFree.date)}>
                اولین وقت خالی: {formatDateKeyLong(nextFree.date)}
              </Button>
            )
          }
        />
      ) : (
        <div role="radiogroup" aria-label="انتخاب ساعت" className="flex flex-col gap-5">
          {PARTS_OF_DAY.map(({ label, icon: Icon, from, to }) => {
            const slots = day.data.slots.filter((s) => {
              const minute = minuteOfDayOf(new Date(s.startsAt));
              return minute >= from && minute < to;
            });
            if (slots.length === 0) return null;
            return (
              <div key={label}>
                <p className="mb-2 flex items-center gap-2 text-sm text-muted">
                  <Icon size={16} className="text-accent" />
                  {label}
                </p>
                <div className="grid grid-cols-4 gap-2 md:grid-cols-5">
                  {slots.map((s) => {
                    const selected = s.startsAt === slot?.startsAt;
                    return (
                      <button
                        key={s.startsAt}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onSlotChange(s)}
                        className={cn(
                          'h-11 rounded-full border text-sm font-bold tabular-nums transition active:scale-[0.96]',
                          selected
                            ? 'border-accent bg-accent text-on-accent'
                            : 'border-line-strong hover:border-accent/60',
                        )}
                      >
                        {formatTime(s.startsAt)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeDate && (
        <Link
          href={`/calendar?date=${activeDate}`}
          className="flex items-center gap-2 self-start text-sm text-muted underline-offset-4 transition hover:text-fg hover:underline"
        >
          <CalendarBlank size={16} />
          دیدن تقویم کامل سالون
        </Link>
      )}
    </div>
  );
}

function StaffPills({
  team,
  value,
  onChange,
}: {
  team: PublicStaffDto[];
  value: string | null;
  onChange: (staffId: string | null) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="آرایشگر"
      className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
    >
      <Pill selected={value === null} onClick={() => onChange(null)}>
        <span className="grid size-7 place-items-center rounded-full bg-accent-soft text-accent">
          <Lightning size={14} weight="fill" />
        </span>
        هر آرایشگر
      </Pill>
      {team.map((member) => (
        <Pill key={member.id} selected={value === member.id} onClick={() => onChange(member.id)}>
          <span className="relative size-7 overflow-hidden rounded-full bg-raised">
            {member.avatarUrl ? (
              <Image
                src={member.avatarUrl}
                alt=""
                fill
                sizes="28px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <UserCircle aria-hidden size={20} className="absolute inset-0 m-auto text-muted" />
            )}
          </span>
          {member.fullName}
        </Pill>
      ))}
    </div>
  );
}

function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-full border py-1.5 ps-1.5 pe-4 text-sm font-medium transition',
        selected ? 'border-accent bg-accent-soft' : 'border-line-strong hover:border-fg/30',
      )}
    >
      {children}
    </button>
  );
}

function SlotsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2 md:grid-cols-5" aria-label="در حال بارگذاری">
      {Array.from({ length: 12 }, (_, i) => (
        <Skeleton key={i} className="h-11 rounded-full" />
      ))}
    </div>
  );
}
