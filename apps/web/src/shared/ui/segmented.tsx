import { cn } from '@/shared/lib/cn';

interface SegmentedProps<T extends string> {
  options: readonly (readonly [value: T, label: string])[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** A small pill switcher between a few views or filters. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex rounded-full border border-line-strong p-1', className)}
    >
      {options.map(([optionValue, optionLabel]) => (
        <button
          key={optionValue}
          type="button"
          aria-pressed={value === optionValue}
          onClick={() => onChange(optionValue)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
            value === optionValue ? 'bg-fg text-bg' : 'text-muted hover:text-fg',
          )}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  );
}
