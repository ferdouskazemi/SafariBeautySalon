'use client';

import { List, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { siteNav } from '@/shared/config/site';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? 'بستن منو' : 'باز کردن منو'}
        className="grid size-10 place-items-center rounded-full border border-line-strong"
      >
        {open ? <X size={18} /> : <List size={18} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="منوی موبایل"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-16 z-[var(--z-overlay)] h-[calc(100dvh-4rem)] bg-bg/95 px-4 pt-6 backdrop-blur-xl"
          >
            <ul className="flex flex-col">
              {[
                ...siteNav,
                { href: '/calendar', label: 'تقویم نوبت‌ها' },
                { href: '/track', label: 'پیگیری نوبت' },
              ].map((item) => (
                <li key={item.href} className="border-b border-line">
                  <Link href={item.href} onClick={close} className="block py-4 text-2xl font-bold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
