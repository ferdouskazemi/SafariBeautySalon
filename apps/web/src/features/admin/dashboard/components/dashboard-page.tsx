'use client';

import {
  ArrowLeft,
  CalendarCheck,
  CalendarDots,
  Coins,
  Star,
  type Icon,
} from '@phosphor-icons/react';
import { toDateKey, type DashboardStatsDto } from '@safari/shared';
import { queryOptions, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { cn } from '@/shared/lib/cn';
import { formatNumber, formatPrice, formatRating } from '@/shared/lib/format';
import { http } from '@/shared/lib/http';
import { Skeleton } from '@/shared/ui/feedback';
import { ScheduleList } from '../../schedule/components/schedule-list';
import { PageHeader } from '../../shell/admin-shell';

const dashboardQuery = queryOptions({
  queryKey: ['admin', 'dashboard'],
  queryFn: () => http<DashboardStatsDto>('/admin/dashboard'),
  refetchInterval: 60_000,
});

interface Stat {
  label: string;
  value: string | undefined;
  icon: Icon;
  /** Where a tap on the card goes, if anywhere. */
  href?: string;
}

export function DashboardPage() {
  const { data } = useQuery(dashboardQuery);

  const stats: Stat[] = [
    {
      label: 'نوبت‌های امروز',
      value: data && formatNumber(data.todayAppointments),
      icon: CalendarCheck,
      href: '/admin/schedule',
    },
    {
      label: 'نوبت‌های آینده',
      value: data && formatNumber(data.upcomingAppointments),
      icon: CalendarDots,
      href: '/admin/schedule',
    },
    { label: 'درآمد ۳۰ روز اخیر', value: data && formatPrice(data.revenueLast30Days), icon: Coins },
    {
      label: `امتیاز (${data ? formatNumber(data.rating.count) : '-'} نظر)`,
      value: data && (data.rating.average === null ? '-' : formatRating(data.rating.average)),
      icon: Star,
      href: '/admin/reviews',
    },
  ];

  return (
    <>
      <PageHeader title="داشبورد" />
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </ul>

      <div className="mt-10 mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black">نوبت‌های امروز</h2>
        <Link
          href="/admin/schedule"
          className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover"
        >
          برنامه کامل
          <ArrowLeft size={16} />
        </Link>
      </div>
      <ScheduleList date={toDateKey(new Date())} showStaff />
    </>
  );
}

function StatCard({ label, value, icon: StatIcon, href }: Stat) {
  const body = (
    <>
      <p className="flex items-center gap-2 text-xs text-muted md:text-sm">
        <StatIcon size={18} className="shrink-0 text-accent" />
        {label}
      </p>
      <div className="mt-3 text-xl font-black md:text-2xl">
        {value ?? <Skeleton className="h-8 w-20" />}
      </div>
    </>
  );
  const className = cn(
    'block h-full rounded-[var(--radius-field)] border border-line bg-surface p-4 md:p-5',
    href && 'transition-colors hover:border-accent/50',
  );
  return (
    <li>
      {href ? (
        <Link href={href} className={className}>
          {body}
        </Link>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  );
}
