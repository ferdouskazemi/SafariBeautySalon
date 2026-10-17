'use client';

import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { toDateKey, type DateKey, type DayAvailabilityDto } from '@safari/shared';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import {
  formatDateKeyDay,
  formatDateKeyMonthYear,
  formatDateKeyWeekday,
  formatNumber,
} from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/feedback';

interface DateScrollerProps {
  days: DayAvailabilityDto[] | undefined;
  value: DateKey | null;
  onChange: (date: DateKey) => void;
}

/**
 * Every bookable day in one swipeable row, Fresha-style. Full days stay clickable
 * (dimmed), so the customer sees why and can jump to the next free day.
 */
export function DateScroller({ days, value, onChange }: DateScrollerProps) {
  const today = toDateKey(new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current
      ?.querySelector('[aria-checked="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [value, days]);

  // In RTL, later days are to the left, which is a negative scroll offset.
  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: -direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const monthOf = value ?? days?.[0]?.date ?? today;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold" aria-live="polite">
          {formatDateKeyMonthYear(monthOf)}
        </p>
        <div className="flex gap-2">
          <ArrowButton label="روزهای قبل" onClick={() => scrollBy(-1)}>
            <CaretRight size={16} />
          </ArrowButton>
          <ArrowButton label="روزهای بعد" onClick={() => scrollBy(1)}>
            <CaretLeft size={16} />
          </ArrowButton>
        </div>
      </div>

      <div
        ref={ref}
        role="radiogroup"
        aria-label="انتخاب روز"
        className="-mx-4 flex snap-x [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
      >
        {!days
          ? Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-14 shrink-0 rounded-full" />
            ))
          : days.map((day) => {
              const selected = day.date === value;
              const free = day.freeSlots > 0;
              return (
                <button
                  key={day.date}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(day.date)}
                  className={cn(
                    'flex w-14 shrink-0 snap-start flex-col items-center gap-1 py-1 transition',
                    !free && !selected && 'opacity-40',
                  )}
                >
                  <span className="text-xs text-muted">
                    {day.date === today ? 'امروز' : formatDateKeyWeekday(day.date)}
                  </span>
                  <span
                    className={cn(
                      'grid size-11 place-items-center rounded-full border text-base font-black transition',
                      selected
                        ? 'border-accent bg-accent text-on-accent'
                        : free
                          ? 'border-line-strong hover:border-accent/60'
                          : 'border-transparent line-through decoration-1',
                    )}
                  >
                    {formatDateKeyDay(day.date)}
                  </span>
                  <span className={cn('text-[11px]', free ? 'text-accent' : 'text-muted')}>
                    {free ? `${formatNumber(day.freeSlots)} وقت` : day.open ? 'پر' : 'تعطیل'}
                  </span>
                </button>
              );
            })}
      </div>
    </div>
  );
}

function ArrowButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="hidden size-9 place-items-center rounded-full border border-line-strong transition hover:border-accent/60 md:grid"
    >
      {children}
    </button>
  );
}
