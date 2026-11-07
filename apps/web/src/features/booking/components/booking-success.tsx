'use client';

import { CheckCircle, Copy, WhatsappLogo } from '@phosphor-icons/react';
import type { BookingConfirmationDto } from '@safari/shared';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { salonWhatsAppUrl } from '@/shared/config/site';
import { formatLongDate, formatPrice, formatTime } from '@/shared/lib/format';
import { buttonStyles, ButtonLink } from '@/shared/ui/button';

/** The message the customer sends to the salon's WhatsApp; the salon sees it from their real number. */
function confirmationMessage(c: BookingConfirmationDto) {
  return [
    'سلام، نوبتم را تأیید می‌کنم.',
    `کد نوبت: ${c.code}`,
    `${c.offeringName} با ${c.staffName}`,
    `${formatLongDate(c.startsAt)}، ساعت ${formatTime(c.startsAt)}`,
  ].join('\n');
}

export function BookingSuccess({ confirmation }: { confirmation: BookingConfirmationDto }) {
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(confirmation.code);
      toast.success('کد نوبت کپی شد');
    } catch {
      toast.error('کپی انجام نشد. کد را یادداشت کنید');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-xl rounded-[var(--radius-surface)] border border-line-strong bg-surface p-8 text-center md:p-12"
      role="status"
    >
      <CheckCircle size={56} weight="fill" className="mx-auto text-success" />
      <h2 className="mt-5 text-3xl font-black">نوبت شما ثبت شد</h2>
      <p className="mt-3 text-muted">
        {confirmation.offeringName} با {confirmation.staffName}
        <br />
        {formatLongDate(confirmation.startsAt)}، ساعت {formatTime(confirmation.startsAt)}
      </p>

      <div className="mt-8 rounded-[var(--radius-field)] border border-dashed border-accent/50 bg-accent-soft p-5">
        <p className="text-sm text-muted">کد پیگیری نوبت</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="font-latin text-3xl tracking-[0.3em] text-accent" dir="ltr">
            {confirmation.code}
          </span>
          <button
            type="button"
            onClick={copyCode}
            aria-label="کپی کد نوبت"
            className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-fg/5 hover:text-fg"
          >
            <Copy size={20} />
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          این کد را نگه دارید. برای لغو یا ثبت نظر، کد و شماره موبایل‌تان لازم است.
        </p>
      </div>

      <p className="mt-6 text-sm">
        مبلغ: <span className="font-bold">{formatPrice(confirmation.price)}</span>
        <span className="text-muted"> (پرداخت در سالون)</span>
      </p>

      <div className="mt-6 rounded-[var(--radius-field)] border border-line-strong p-4">
        <a
          href={salonWhatsAppUrl(confirmationMessage(confirmation))}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles({ variant: 'secondary' })}
        >
          <WhatsappLogo size={20} weight="fill" className="text-success" />
          تأیید نوبت در واتساپ
        </a>
        <p className="mt-3 text-xs text-muted">
          اختیاری: با یک پیام کوتاه، سالون مطمئن می‌شود شماره از خودتان است.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={`/track?code=${confirmation.code}`}>پیگیری نوبت</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          بازگشت به صفحه اصلی
        </ButtonLink>
      </div>
    </motion.div>
  );
}
