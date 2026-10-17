import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-[var(--radius-field)] bg-fg/[0.06]', className)}
    />
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-[var(--radius-surface)] border border-dashed border-line-strong px-6 py-10 text-center',
        className,
      )}
    >
      {icon && <div className="text-accent">{icon}</div>}
      <p className="font-bold">{title}</p>
      {description && <p className="max-w-[40ch] text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

const badgeTones = {
  neutral: 'border-line-strong text-muted',
  accent: 'border-accent/40 bg-accent-soft text-accent',
  success: 'border-success/40 bg-success/10 text-success',
  danger: 'border-danger/40 bg-danger/10 text-danger',
} as const;

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
