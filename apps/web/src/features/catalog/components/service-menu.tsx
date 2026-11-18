'use client';

import { SERVICE_CATEGORY_LABELS, type ServiceCategory, type ServiceDto } from '@safari/shared';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useId, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatDuration } from '@/shared/lib/format';

interface ServiceMenuProps {
  services: ServiceDto[];
  categories: ServiceCategory[];
}

/** Accessible tabs (one per category) over the list of services. */
export function ServiceMenu({ services, categories }: ServiceMenuProps) {
  const [active, setActive] = useState(categories[0]);
  const baseId = useId();
  const visible = services.filter((s) => s.category === active);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    // In RTL, ArrowLeft moves to the next tab.
    const step = event.key === 'ArrowLeft' ? 1 : event.key === 'ArrowRight' ? -1 : 0;
    if (!step) return;
    const next = categories[(index + step + categories.length) % categories.length]!;
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <div className="mt-10">
      <div role="tablist" aria-label="دسته‌بندی خدمات" className="flex flex-wrap gap-2">
        {categories.map((category, index) => {
          const selected = category === active;
          return (
            <button
              key={category}
              id={`${baseId}-tab-${category}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(category)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                // isolate: the gold pill sits at -z-10 and must stay inside this button, not behind
                // the section's own background (dark text on it would be unreadable).
                'relative isolate rounded-full px-5 py-2.5 text-sm font-medium transition',
                selected ? 'text-on-accent' : 'text-muted hover:text-fg',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${baseId}-pill`}
                  className="absolute inset-0 -z-10 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {SERVICE_CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>

      <ul
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="mt-8 divide-y divide-line"
      >
        {visible.map((service) => (
          <li key={service.id}>
            <Link
              href={`/booking?service=${service.id}`}
              className="group grid gap-1 py-5 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8"
            >
              <div>
                <p className="text-lg font-bold transition group-hover:text-accent">
                  {service.name}
                </p>
                {service.description && (
                  <p className="mt-1 text-sm text-muted">{service.description}</p>
                )}
              </div>
              <span className="text-sm text-muted">{formatDuration(service.durationMinutes)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
