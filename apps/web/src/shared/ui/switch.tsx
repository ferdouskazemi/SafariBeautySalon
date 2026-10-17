import { cn } from '@/shared/lib/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** An on/off toggle that saves immediately (no form submit). */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200',
        'disabled:cursor-wait disabled:opacity-60',
        checked ? 'border-accent bg-accent' : 'border-line-strong bg-raised',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mx-0.5 size-[1.125rem] rounded-full transition-transform duration-200 ease-out-expo',
          checked ? 'bg-on-accent ltr:translate-x-5 rtl:-translate-x-5' : 'bg-muted',
        )}
      />
    </button>
  );
}
