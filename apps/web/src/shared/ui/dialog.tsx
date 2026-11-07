'use client';

import { X } from '@phosphor-icons/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Native `<dialog>`: focus trapping, Escape and the top layer come from the browser. */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        'm-auto w-[min(100%-2rem,32rem)] rounded-[var(--radius-surface)] border border-line-strong bg-surface p-0 text-fg',
        'backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-fg/5 hover:text-fg"
            >
              <X size={18} />
            </button>
          </header>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
