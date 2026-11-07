'use client';

import { X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface SheetProps {
  open: boolean;
  /** Called when the person dismisses it (close button, backdrop, Escape). */
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * A bottom sheet on phones (within thumb reach) and a centered panel from `md` up.
 * Built on the native `<dialog>`: focus trapping, Escape and the top layer come from the browser.
 */
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  // Closing it from code fires the same `close` event; only a dismissal while open is reported.
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    // Keep the page behind still while the sheet is up (touch scrolling leaks through on phones).
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => openRef.current && onClose()}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        'm-0 mt-auto max-h-none w-full max-w-none border-0 bg-transparent p-0 text-fg',
        'md:m-auto md:w-[min(100%-2rem,30rem)]',
        'backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        className,
      )}
    >
      {open && (
        <motion.div
          initial={{ y: 56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
          className="flex max-h-[92dvh] flex-col rounded-t-[1.75rem] border border-b-0 border-line-strong bg-surface md:rounded-[var(--radius-surface)] md:border-b"
        >
          <div
            aria-hidden
            className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong md:hidden"
          />
          <header className="flex items-center justify-between gap-4 px-5 pt-3 pb-2 md:px-6 md:pt-5">
            <h2 className="text-lg font-black">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-fg/5 hover:text-fg"
            >
              <X size={18} />
            </button>
          </header>
          <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6">
            {children}
          </div>
        </motion.div>
      )}
    </dialog>
  );
}
