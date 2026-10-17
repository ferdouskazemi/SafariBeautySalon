'use client';

import { addDays, toDateKey, type DateKey } from '@safari/shared';
import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatDateKeyDayMonth, formatDateKeyWeekday } from '@/shared/lib/format';

function relativeLabel(day: DateKey, today: DateKey) {
  if (day === today) return 'امروز';
  if (day === addDays(today, 1)) return 'فردا';
  if (day === addDays(today, -1)) return 'دیروز';
  return formatDateKeyWeekday(day);
}

interface DayStripProps {
  days: DateKey[];
  value: DateKey;
  onChange: (day: DateKey) => void;
  label: string;
}

/** Horizontally scrollable day picker using the Afghan solar calendar. */
export function DayStrip({ days, value, onChange, label }: DayStripProps) {
  const today = toDateKey(new Date());
  const ref = useRef<HTMLDivElement>(null);

  // Start with the selected day in view (the admin strip also lists past days). Mount only.
  useEffect(() => {
    ref.current
      ?.querySelector('[aria-checked="true"]')
      ?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
  }, []);

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className="-mx-4 flex snap-x [scrollbar-width:thin] gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
    >
      {days.map((day) => {
        const selected = day === value;
        return (
          <button
            key={day}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(day)}
            className={cn(
              'flex min-w-[4.75rem] snap-start flex-col items-center gap-1 rounded-[var(--radius-field)] border px-3 py-3 text-sm transition',
              selected
                ? 'border-accent bg-accent text-on-accent'
                : 'border-line-strong text-fg hover:border-accent/60',
            )}
          >
            <span className={cn('text-xs', selected ? 'text-on-accent/80' : 'text-muted')}>
              {relativeLabel(day, today)}
            </span>
            <span className="font-bold">{formatDateKeyDayMonth(day)}</span>
          </button>
        );
      })}
    </div>
  );
}
