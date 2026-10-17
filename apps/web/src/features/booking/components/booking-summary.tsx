import { CalendarBlank, Clock, MapPin, User } from '@phosphor-icons/react/dist/ssr';
import type { SlotDto } from '@safari/shared';
import type { ReactNode } from 'react';
import { siteConfig } from '@/shared/config/site';
import { formatDuration, formatLongDate, formatPrice, formatTime } from '@/shared/lib/format';
import { LogoMark } from '@/shared/ui/logo';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

interface BookingSummaryProps {
  items: CartItem[];
  /** `undefined` = not chosen yet, `null` = any barber. */
  staffName: string | null | undefined;
  /** The barber the server picked for "any barber". */
  assignedStaffName?: string;
  slot: SlotDto | null;
  /** The step's main button, at the bottom of the card. */
  action?: ReactNode;
}

/** The salon, the cart and the chosen barber and time, like Fresha's side panel. */
export function BookingSummary({
  items,
  staffName,
  assignedStaffName,
  slot,
  action,
}: BookingSummaryProps) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const duration = items.reduce((sum, item) => sum + item.durationMinutes, 0);
  const endsAt = slot && new Date(Date.parse(slot.startsAt) + duration * 60_000).toISOString();

  return (
    <div className="rounded-[var(--radius-surface)] border border-line-strong bg-surface p-6">
      <div className="flex items-center gap-3 border-b border-line pb-5">
        <LogoMark className="h-12" />
        <div className="min-w-0">
          <p className="font-black">{siteConfig.name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
            <MapPin size={12} className="shrink-0" />
            {siteConfig.address}
          </p>
        </div>
      </div>

      {(slot || staffName !== undefined) && (
        <dl className="grid gap-3 border-b border-line py-5 text-sm">
          {slot && (
            <div className="flex items-start gap-3">
              <dt className="sr-only">زمان</dt>
              <CalendarBlank size={18} className="mt-0.5 shrink-0 text-accent" />
              <dd>
                <span className="block font-bold">{formatLongDate(slot.startsAt)}</span>
                <span className="text-muted">
                  {formatTime(slot.startsAt)} تا {formatTime(endsAt!)}
                </span>
              </dd>
            </div>
          )}
          {staffName !== undefined && (
            <div className="flex items-center gap-3">
              <dt className="sr-only">آرایشگر</dt>
              <User size={18} className="shrink-0 text-accent" />
              <dd>
                {staffName ?? (slot && assignedStaffName ? assignedStaffName : 'هر آرایشگر آزاد')}
              </dd>
            </div>
          )}
        </dl>
      )}

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">هنوز خدمتی انتخاب نشده است.</p>
      ) : (
        <ul className="grid gap-4 py-5 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                <span className="block font-medium">{item.name}</span>
                <span className="text-xs text-muted">{formatDuration(item.durationMinutes)}</span>
              </span>
              <span className="shrink-0 font-medium">{formatPrice(item.price)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-baseline justify-between border-t border-line pt-5">
        <span className="flex items-center gap-1.5 text-muted">
          جمع
          {duration > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <Clock size={12} />
              {formatDuration(duration)}
            </span>
          )}
        </span>
        <span className="text-2xl font-black text-accent">{formatPrice(total)}</span>
      </div>
      <p className="mt-2 text-xs text-muted">پرداخت در سالون انجام می‌شود.</p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
