'use client';

import { Moon, Sun } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/cn';
import { setTheme, useTheme } from '@/shared/lib/theme';

/** Switches between the light and dark theme; the choice is remembered on this device. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'light' ? 'تم روشن' : 'تم تیره';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition-colors hover:border-accent/60 hover:text-fg',
        className,
      )}
    >
      {/* Shows where you will go: the sun in the dark theme, the moon in the light one. */}
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
