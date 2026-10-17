import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-[1320px] px-4 md:px-8', className)} {...props} />;
}

export function SectionTitle({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      className={cn(
        'text-3xl leading-tight font-black tracking-tight text-balance md:text-5xl',
        className,
      )}
      {...props}
    />
  );
}
