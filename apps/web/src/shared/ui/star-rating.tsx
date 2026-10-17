'use client';

import { Star } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/cn';
import { formatNumber } from '@/shared/lib/format';

export function StarRating({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`امتیاز ${formatNumber(value)} از ۵`}
      className={cn('inline-flex gap-0.5 text-accent', className)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} weight={star <= Math.round(value) ? 'fill' : 'regular'} />
      ))}
    </span>
  );
}

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  invalid?: boolean;
}

/** Radio-group semantics so the rating is usable with a keyboard and a screen reader. */
export function StarInput({ value, onChange, invalid }: StarInputProps) {
  return (
    <div role="radiogroup" aria-label="امتیاز شما" aria-invalid={invalid} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <label key={star} className="cursor-pointer text-accent transition hover:scale-110">
          <input
            type="radio"
            name="rating"
            value={star}
            checked={value === star}
            onChange={() => onChange(star)}
            className="peer sr-only"
            aria-label={`${formatNumber(star)} ستاره`}
          />
          <span className="block rounded-full p-1 peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
            <Star size={30} weight={star <= value ? 'fill' : 'regular'} />
          </span>
        </label>
      ))}
    </div>
  );
}
