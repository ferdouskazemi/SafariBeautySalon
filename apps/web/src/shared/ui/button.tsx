import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary:
    'border border-line-strong bg-fg/[0.03] text-fg hover:border-accent/60 hover:bg-fg/[0.06]',
  ghost: 'text-muted hover:bg-fg/[0.06] hover:text-fg',
  danger: 'border border-danger/40 text-danger hover:bg-danger/10',
} as const;

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
  icon: 'size-10',
} as const;

interface ButtonStyleProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function buttonStyles({ variant = 'primary', size = 'md' }: ButtonStyleProps = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium',
    'transition duration-200 ease-out-expo active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
  );
}

type ButtonProps = ComponentProps<'button'> & ButtonStyleProps & { loading?: boolean };

export function Button({
  variant,
  size,
  loading,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-e-transparent"
        />
      )}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleProps;

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
