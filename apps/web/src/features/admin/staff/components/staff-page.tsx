'use client';

import { Clock, Key, PencilSimple, Plus, Star, UserCircle, Users } from '@phosphor-icons/react';
import { ROLE_LABELS, type StaffDto } from '@safari/shared';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatRating } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/http';
import { Button } from '@/shared/ui/button';
import { Badge, EmptyState, Skeleton } from '@/shared/ui/feedback';
import { PageHeader } from '../../shell/admin-shell';
import { staffListQuery } from '../api';
import { CustomersDialog } from './customers-dialog';
import { PasswordDialog } from './password-dialog';
import { StaffFormDialog } from './staff-form-dialog';
import { WorkingHoursDialog } from './working-hours-dialog';

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit' | 'hours' | 'password' | 'customers'; member: StaffDto }
  | null;

export function StaffPage() {
  const { data, isPending, isError, error } = useQuery(staffListQuery);
  const [dialog, setDialog] = useState<DialogState>(null);
  const close = () => setDialog(null);

  return (
    <>
      <PageHeader
        title="کارکنان"
        description="هر آرایشگر با شماره موبایل و رمز خودش وارد پنل می‌شود و فقط برنامه خودش را می‌بیند."
        action={
          <Button onClick={() => setDialog({ kind: 'create' })}>
            <Plus size={18} />
            افزودن آرایشگر
          </Button>
        }
      />

      {isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title="فهرست کارکنان بارگذاری نشد" description={errorMessage(error)} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.map((member) => (
            <li
              key={member.id}
              className={cn(
                'flex flex-col rounded-[var(--radius-field)] border border-line bg-surface p-4',
                !member.isActive && 'opacity-70',
              )}
            >
              <div className="flex flex-1 items-center gap-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-raised">
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl}
                      alt=""
                      fill
                      sizes="56px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <UserCircle
                      aria-hidden
                      size={32}
                      className="absolute inset-0 m-auto text-muted"
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {member.fullName}
                    <Badge tone={member.role === 'ADMIN' ? 'accent' : 'neutral'}>
                      {ROLE_LABELS[member.role]}
                    </Badge>
                    {!member.isActive && <Badge tone="danger">غیرفعال</Badge>}
                  </p>
                  {member.title && <p className="mt-0.5 text-sm text-muted">{member.title}</p>}
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                    <span dir="ltr">{member.phone}</span>
                    {member.rating.average !== null && (
                      <span className="flex items-center gap-1">
                        <Star size={12} weight="fill" className="text-accent" />
                        {formatRating(member.rating.average)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1 border-t border-line pt-3">
                {member.role === 'STAFF' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setDialog({ kind: 'customers', member })}
                  >
                    <Users size={16} />
                    مشتری‌ها و نوبت‌ها
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 px-2"
                  onClick={() => setDialog({ kind: 'edit', member })}
                >
                  <PencilSimple size={16} />
                  ویرایش
                </Button>
                {member.role === 'STAFF' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 px-2"
                    onClick={() => setDialog({ kind: 'hours', member })}
                  >
                    <Clock size={16} />
                    ساعت کاری
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 px-2"
                  onClick={() => setDialog({ kind: 'password', member })}
                >
                  <Key size={16} />
                  تغییر رمز
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <StaffFormDialog
        open={dialog?.kind === 'create' || dialog?.kind === 'edit'}
        member={dialog?.kind === 'edit' ? dialog.member : undefined}
        onClose={close}
      />
      {dialog?.kind === 'customers' && <CustomersDialog member={dialog.member} onClose={close} />}
      {dialog?.kind === 'hours' && <WorkingHoursDialog member={dialog.member} onClose={close} />}
      {dialog?.kind === 'password' && <PasswordDialog member={dialog.member} onClose={close} />}
    </>
  );
}
