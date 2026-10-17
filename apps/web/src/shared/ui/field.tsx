import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export const controlStyles = cn(
  'w-full rounded-[var(--radius-field)] border border-line-strong bg-bg/60 px-4 text-fg',
  'placeholder:text-muted/70 transition-colors',
  'hover:border-fg/30 focus:border-accent focus:outline-none focus-visible:outline-none',
  'aria-invalid:border-danger disabled:opacity-60',
);

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  /** Receives the generated id and aria attributes for the control. */
  children: (control: {
    id: string;
    'aria-invalid'?: true;
    'aria-describedby'?: string;
  }) => ReactNode;
}

/** Label above, control, then hint or error below. */
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': message ? messageId : undefined,
      })}
      {message && (
        <p id={messageId} className={cn('text-xs', error ? 'text-danger' : 'text-muted')}>
          {message}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlStyles, 'h-12', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(controlStyles, 'min-h-24 resize-y py-3', className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(controlStyles, 'h-12 appearance-none', className)} {...props} />;
}

export function Checkbox({
  label,
  className,
  ...props
}: ComponentProps<'input'> & { label: string }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-3 text-sm', className)}>
      <input type="checkbox" className="size-4 accent-[var(--color-accent)]" {...props} />
      {label}
    </label>
  );
}
