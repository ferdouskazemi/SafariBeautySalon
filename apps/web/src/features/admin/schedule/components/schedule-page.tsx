'use client';

import { BOOKING_WINDOW_DAYS, addDays, toDateKey } from '@safari/shared';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { sessionQuery } from '@/features/auth/api';
import { formatDateKeyLong } from '@/shared/lib/format';
import { useHydrated } from '@/shared/lib/use-hydrated';
import { DayStrip } from '@/shared/ui/day-strip';
import { Select } from '@/shared/ui/field';
import { Segmented } from '@/shared/ui/segmented';
import { staffListQuery } from '../../staff/api';
import { PageHeader } from '../../shell/admin-shell';
import { ScheduleGrid } from './schedule-grid';
import { ScheduleList } from './schedule-list';

const DAYS_BACK = 7;
const DAYS_AHEAD = BOOKING_WINDOW_DAYS;

export function SchedulePage() {
  const today = toDateKey(new Date());
  const days = useMemo(
    () => Array.from({ length: DAYS_BACK + DAYS_AHEAD }, (_, i) => addDays(today, i - DAYS_BACK)),
    [today],
  );
  // The day lives in the URL (?date=), so links from messages open the right day.
  const router = useRouter();
  const pathname = usePathname();
  const requested = useSearchParams().get('date');
  const date = requested && days.includes(requested) ? requested : today;
  const setDate = (next: string) => router.replace(`${pathname}?date=${next}`, { scroll: false });
  const [staffId, setStaffId] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { data: user } = useQuery(sessionQuery);
  // The session is cached on the client only, so wait for hydration before showing admin tools.
  const isAdmin = useHydrated() && user?.role === 'ADMIN';
  const staff = useQuery({ ...staffListQuery, enabled: isAdmin });

  return (
    <>
      <PageHeader
        title="برنامه روز"
        action={
          isAdmin && (
            <div className="w-48 sm:w-56">
              <label htmlFor="staff-filter" className="sr-only">
                فیلتر آرایشگر
              </label>
              <Select
                id="staff-filter"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              >
                <option value="">همه آرایشگران</option>
                {staff.data
                  ?.filter((m) => m.role === 'STAFF')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
              </Select>
            </div>
          )
        }
      />
      <DayStrip key={date} days={days} value={date} onChange={setDate} label="انتخاب روز" />
      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-muted">{formatDateKeyLong(date)}</h2>
        {isAdmin && (
          <Segmented
            label="نمای برنامه"
            value={view}
            onChange={setView}
            options={[
              ['grid', 'تقویم'],
              ['list', 'فهرست'],
            ]}
          />
        )}
      </div>
      {isAdmin && view === 'grid' ? (
        <>
          <ScheduleGrid date={date} staffId={staffId || undefined} />
          <p className="mt-3 text-xs text-muted">
            برای تماس با مشتری، ثبت «انجام شد» یا کوتاه کردن زمان نوبت، نمای «فهرست» را باز کنید.
          </p>
        </>
      ) : (
        <ScheduleList date={date} staffId={staffId || undefined} showStaff={isAdmin} />
      )}
    </>
  );
}
