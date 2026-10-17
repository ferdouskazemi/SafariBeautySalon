'use client';

import {
  WEEKDAY_DISPLAY_ORDER,
  WEEKDAY_LABELS,
  minutesToTime,
  timeToMinutes,
  type StaffDto,
} from '@safari/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { controlStyles } from '@/shared/ui/field';
import { cn } from '@/shared/lib/cn';
import { useSetWorkingHours } from '../api';

interface DayRow {
  enabled: boolean;
  start: string;
  end: string;
}

export function WorkingHoursDialog({ member, onClose }: { member: StaffDto; onClose: () => void }) {
  const setWorkingHours = useSetWorkingHours();
  const [rows, setRows] = useState<Record<number, DayRow>>(() =>
    Object.fromEntries(
      WEEKDAY_DISPLAY_ORDER.map((weekday) => {
        const day = member.workingHours.find((h) => h.weekday === weekday);
        return [
          weekday,
          {
            enabled: Boolean(day),
            start: minutesToTime(day?.startMinute ?? 9 * 60),
            end: minutesToTime(day?.endMinute ?? 20 * 60),
          },
        ];
      }),
    ),
  );

  const update = (weekday: number, patch: Partial<DayRow>) =>
    setRows((current) => ({ ...current, [weekday]: { ...current[weekday]!, ...patch } }));

  const onSave = () => {
    const days = WEEKDAY_DISPLAY_ORDER.filter((weekday) => rows[weekday]!.enabled).map(
      (weekday) => ({
        weekday,
        startMinute: timeToMinutes(rows[weekday]!.start),
        endMinute: timeToMinutes(rows[weekday]!.end),
      }),
    );
    if (days.some((d) => d.startMinute >= d.endMinute)) {
      toast.error('ساعت پایان باید بعد از ساعت شروع باشد');
      return;
    }
    setWorkingHours.mutate({ id: member.id, days }, { onSuccess: onClose });
  };

  return (
    <Dialog open onClose={onClose} title={`ساعت کاری ${member.fullName}`}>
      <ul className="grid gap-2">
        {WEEKDAY_DISPLAY_ORDER.map((weekday) => {
          const row = rows[weekday]!;
          return (
            <li key={weekday} className="grid grid-cols-[6.5rem_1fr_1fr] items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => update(weekday, { enabled: e.target.checked })}
                  className="size-4 accent-[var(--color-accent)]"
                />
                {WEEKDAY_LABELS[weekday]}
              </label>
              <input
                type="time"
                aria-label={`شروع ${WEEKDAY_LABELS[weekday]}`}
                value={row.start}
                disabled={!row.enabled}
                step={1800}
                onChange={(e) => update(weekday, { start: e.target.value })}
                className={cn(controlStyles, 'h-10 px-2 text-sm')}
                dir="ltr"
              />
              <input
                type="time"
                aria-label={`پایان ${WEEKDAY_LABELS[weekday]}`}
                value={row.end}
                disabled={!row.enabled}
                step={1800}
                onChange={(e) => update(weekday, { end: e.target.value })}
                className={cn(controlStyles, 'h-10 px-2 text-sm')}
                dir="ltr"
              />
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-muted">
        روزهایی که تیک ندارند، تعطیل حساب می‌شوند و قابل رزرو نیستند.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          انصراف
        </Button>
        <Button onClick={onSave} loading={setWorkingHours.isPending}>
          ذخیره
        </Button>
      </div>
    </Dialog>
  );
}
