'use client';

import {
  BellSimple,
  CalendarBlank,
  ChartLineUp,
  ChatCircleText,
  Scissors,
  SignOut,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react';
import type { Role } from '@safari/shared';
import { ROLE_LABELS } from '@safari/shared';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { sessionQuery, useLogout } from '@/features/auth/api';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/feedback';
import { formatNumber } from '@/shared/lib/format';
import { LogoMark } from '@/shared/ui/logo';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { useNotificationAlerts } from '../notifications/use-notification-alerts';

interface NavItem {
  href: string;
  label: string;
  /** Label under the icon in the phone tab bar. */
  short: string;
  icon: Icon;
  roles: Role[];
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'داشبورد', short: 'داشبورد', icon: ChartLineUp, roles: ['ADMIN'] },
  {
    href: '/admin/schedule',
    label: 'برنامه روز',
    short: 'برنامه',
    icon: CalendarBlank,
    roles: ['ADMIN', 'STAFF'],
  },
  {
    href: '/admin/notifications',
    label: 'پیام‌ها',
    short: 'پیام‌ها',
    icon: BellSimple,
    roles: ['ADMIN', 'STAFF'],
  },
  { href: '/admin/staff', label: 'کارکنان', short: 'کارکنان', icon: UsersThree, roles: ['ADMIN'] },
  {
    href: '/admin/catalog',
    label: 'خدمات و پکیج‌ها',
    short: 'خدمات',
    icon: Scissors,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/reviews',
    label: 'نظرات',
    short: 'نظرات',
    icon: ChatCircleText,
    roles: ['ADMIN'],
  },
];

const NOTIFICATIONS_HREF = '/admin/notifications';

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useQuery(sessionQuery);
  const logout = useLogout();
  const user = session.data;
  const unreadCount = useNotificationAlerts(Boolean(user));

  const current = NAV.find((item) => item.href === pathname);
  const forbidden = Boolean(user && current && !current.roles.includes(user.role));

  useEffect(() => {
    if (session.isError) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [session.isError, pathname, router]);

  useEffect(() => {
    // Barbers only have the schedule; send them there from manager-only pages.
    if (forbidden) router.replace('/admin/schedule');
  }, [forbidden, router]);

  // The frame and the page always render (the page shows its own loading state);
  // only the user-specific parts wait for the session.
  const items = user ? NAV.filter((item) => item.roles.includes(user.role)) : [];
  const onLogout = () =>
    logout.mutate(undefined, { onSettled: () => router.replace('/admin/login') });
  const unreadLabel = `${formatNumber(unreadCount)} پیام خوانده نشده`;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 z-[var(--z-header)] border-b border-line bg-surface/90 backdrop-blur lg:flex lg:h-dvh lg:flex-col lg:border-e lg:border-b-0">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:block lg:px-6 lg:py-8">
          <Link href="/" className="flex items-center gap-2 font-black" title="مشاهده سایت">
            <LogoMark className="h-9" />
            سالون سفری
          </Link>
          <div className="flex items-center gap-2 lg:mt-8 lg:block">
            {user ? (
              <div className="text-end lg:text-start">
                <p className="text-sm font-bold">{user.fullName}</p>
                <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>
              </div>
            ) : (
              <Skeleton className="h-9 w-28" />
            )}
            <div className="flex items-center gap-2 lg:mt-3 lg:gap-4">
              <ThemeToggle />
              <button
                type="button"
                onClick={onLogout}
                aria-label="خروج"
                title="خروج"
                className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger lg:flex lg:size-auto lg:gap-2 lg:px-0 lg:text-sm lg:hover:bg-transparent"
              >
                <SignOut size={20} />
                <span className="hidden lg:inline">خروج</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: a vertical menu in the sidebar. */}
        <nav aria-label="منوی پنل" className="hidden px-3 lg:block">
          {!user && <Skeleton className="h-48" />}
          <ul className="flex flex-col gap-1">
            {items.map(({ href, label, icon: ItemIcon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm whitespace-nowrap transition-colors',
                      active
                        ? 'bg-accent text-on-accent'
                        : 'text-muted hover:bg-fg/5 hover:text-fg',
                    )}
                  >
                    <ItemIcon size={18} />
                    {label}
                    {href === NOTIFICATIONS_HREF && unreadCount > 0 && (
                      <span
                        aria-label={unreadLabel}
                        className={cn(
                          'ms-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold',
                          active ? 'bg-on-accent text-accent' : 'bg-accent text-on-accent',
                        )}
                      >
                        {formatNumber(unreadCount)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="min-w-0 px-4 pt-6 pb-28 md:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          {forbidden ? <Skeleton className="h-64" /> : children}
        </div>
      </main>

      {/* Phones and tablets: every section one tap away at the bottom, within thumb reach. */}
      <nav
        aria-label="منوی پنل"
        className="fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {!user && <Skeleton className="m-2 h-12" />}
        <ul className="mx-auto flex max-w-xl">
          {items.map(({ href, short, icon: ItemIcon }) => {
            const active = pathname === href;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[11px] font-medium transition-colors',
                    active ? 'text-accent' : 'text-muted hover:text-fg',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-x-1/4 top-0 h-0.5 rounded-full',
                      active ? 'bg-accent' : 'bg-transparent',
                    )}
                  />
                  <ItemIcon size={22} weight={active ? 'fill' : 'regular'} />
                  {short}
                  {href === NOTIFICATIONS_HREF && unreadCount > 0 && (
                    <span
                      aria-label={unreadLabel}
                      className="absolute top-1 left-1/2 grid min-w-4.5 -translate-x-[110%] place-items-center rounded-full bg-accent px-1 text-[10px] leading-4.5 font-bold text-on-accent"
                    >
                      {formatNumber(unreadCount)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black md:text-3xl">{title}</h1>
        {action}
      </div>
      {description && (
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted">{description}</p>
      )}
    </div>
  );
}
