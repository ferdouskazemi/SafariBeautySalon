'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarBlank, PencilSimple, Plus, Scissors, User } from '@phosphor-icons/react';
import { optionalTextSchema, personNameSchema, phoneSchema, type SlotDto } from '@safari/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { formatDuration, formatLongDate, formatPrice, formatTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Field, Input, Textarea } from '@/shared/ui/field';
import { Sheet } from '@/shared/ui/sheet';
import { Turnstile, turnstileEnabled } from '@/shared/ui/turnstile';
import type { CartItem } from './booking-summary';

const detailsSchema = z.object({
  customerName: personNameSchema,
  customerPhone: phoneSchema,
  note: optionalTextSchema(300),
});
type DetailsInput = z.input<typeof detailsSchema>;
export type BookingDetails = z.output<typeof detailsSchema>;
type Contact = Pick<BookingDetails, 'customerName' | 'customerPhone'>;

/** Name and phone are kept on this device only, so a returning customer does not retype them. */
const CONTACT_KEY = 'safari:booking-contact';

function readSavedContact(): Contact | null {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) ?? 'null') as unknown;
    const parsed = detailsSchema.pick({ customerName: true, customerPhone: true }).safeParse(saved);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function saveContact({ customerName, customerPhone }: BookingDetails) {
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify({ customerName, customerPhone }));
  } catch {
    // Private mode or blocked storage: the customer simply types it next time.
  }
}

interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  slot: SlotDto | null;
  barberLabel: string;
  submitting: boolean;
  /** A failure to show inside the sheet (toasts sit behind the open sheet). */
  error: string | null;
  onSubmit: (details: BookingDetails, turnstileToken?: string) => void;
}

/** Opens as soon as a time is tapped: check the details, enter name and phone, book. */
export function ConfirmSheet({ open, onClose, slot, ...props }: ConfirmSheetProps) {
  return (
    <Sheet open={open && slot !== null} onClose={onClose} title="تأیید نوبت">
      {slot && <ConfirmContent slot={slot} onClose={onClose} {...props} />}
    </Sheet>
  );
}

function ConfirmContent({
  slot,
  items,
  barberLabel,
  submitting,
  error,
  onClose,
  onSubmit,
}: Omit<ConfirmSheetProps, 'open' | 'slot'> & { slot: SlotDto }) {
  // Only rendered on the client after a time is tapped, so localStorage is safe to read here.
  const [saved] = useState(readSavedContact);
  const [editingContact, setEditingContact] = useState(saved === null);
  const [showNote, setShowNote] = useState(false);
  // The bot check's one-time token; a new one is requested after every attempt.
  const [token, setToken] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const form = useForm<DetailsInput, unknown, BookingDetails>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      customerName: saved?.customerName ?? '',
      customerPhone: saved?.customerPhone ?? '',
      note: '',
    },
  });
  const { errors } = form.formState;
  // A saved contact that fails validation (e.g. edited elsewhere) opens the fields again.
  const contactError = Boolean(errors.customerName || errors.customerPhone);

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const duration = items.reduce((sum, item) => sum + item.durationMinutes, 0);
  const endsAt = new Date(Date.parse(slot.startsAt) + duration * 60_000).toISOString();

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[var(--radius-field)] border border-accent/30 bg-accent-soft p-4">
        <p className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-accent">{formatTime(slot.startsAt)}</span>
          <span className="text-sm text-muted">تا {formatTime(endsAt)}</span>
        </p>
        <ul className="mt-3 grid gap-2 text-sm">
          <li className="flex items-center gap-2">
            <CalendarBlank size={16} className="shrink-0 text-accent" />
            {formatLongDate(slot.startsAt)}
          </li>
          <li className="flex items-center gap-2">
            <User size={16} className="shrink-0 text-accent" />
            {barberLabel}
          </li>
          <li className="flex items-start gap-2">
            <Scissors size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>
              {items.map((item) => item.name).join('، ')}
              <span className="text-muted"> · {formatDuration(duration)}</span>
            </span>
          </li>
        </ul>
      </div>

      <form
        noValidate
        onSubmit={form.handleSubmit((details) => {
          saveContact(details);
          onSubmit(details, token ?? undefined);
          setToken(null);
          setAttempts((n) => n + 1);
        })}
        className="flex flex-col gap-4"
      >
        {editingContact || contactError ? (
          <>
            <Field label="نام" error={errors.customerName?.message}>
              {(control) => (
                <Input
                  {...control}
                  autoComplete="name"
                  enterKeyHint="next"
                  {...form.register('customerName')}
                />
              )}
            </Field>
            <Field
              label="شماره موبایل"
              error={errors.customerPhone?.message}
              hint="فقط برای پیگیری یا لغو نوبت؛ جایی نشان داده نمی‌شود."
            >
              {(control) => (
                <Input
                  {...control}
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  autoComplete="tel"
                  enterKeyHint="done"
                  placeholder="07XX XXX XXX"
                  className="text-start"
                  {...form.register('customerPhone')}
                />
              )}
            </Field>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-[var(--radius-field)] border border-line-strong px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">به نام</p>
              <p className="truncate font-bold">
                {saved?.customerName}{' '}
                <span className="font-normal text-muted" dir="ltr">
                  {saved?.customerPhone}
                </span>
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setEditingContact(true)}>
              <PencilSimple size={16} />
              تغییر
            </Button>
          </div>
        )}

        {showNote ? (
          <Field label="توضیحات" error={errors.note?.message}>
            {(control) => (
              <Textarea
                {...control}
                autoFocus
                placeholder="مثلاً مدل مدنظرتان"
                className="min-h-20"
                {...form.register('note')}
              />
            )}
          </Field>
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="flex items-center gap-2 self-start text-sm text-muted transition-colors hover:text-fg"
          >
            <Plus size={16} />
            افزودن توضیح (اختیاری)
          </button>
        )}

        <Turnstile onToken={setToken} resetKey={attempts} />

        {error && (
          <p
            role="alert"
            className="rounded-[var(--radius-field)] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-sm text-muted">جمع · پرداخت در سالون</span>
          <span className="text-xl font-black text-accent">{formatPrice(total)}</span>
        </div>
        <Button
          type="submit"
          size="lg"
          loading={submitting}
          disabled={turnstileEnabled && !token}
          className="w-full"
        >
          ثبت نوبت
        </Button>
        <Button variant="ghost" onClick={onClose} className="-mt-2 w-full">
          انتخاب ساعت دیگر
        </Button>
      </form>
    </div>
  );
}
