'use client';

import { Check, Plus } from '@phosphor-icons/react';
import {
  MAX_SERVICES_PER_BOOKING,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  type CatalogDto,
} from '@safari/shared';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatNumber, formatPrice } from '@/shared/lib/format';
import type { OfferingSelection } from '../api';

interface ServicesStepProps {
  catalog: CatalogDto;
  value: OfferingSelection | null;
  onToggleService: (id: string) => void;
  onTogglePackage: (id: string) => void;
}

/** Fresha-style menu: category chips that follow the scroll, and a +/✓ button on every item. */
export function ServicesStep({
  catalog,
  value,
  onToggleService,
  onTogglePackage,
}: ServicesStepProps) {
  const sections = [
    ...(catalog.packages.length > 0 ? [{ id: 'packages', label: 'پکیج‌ها' }] : []),
    ...SERVICE_CATEGORIES.filter((c) => catalog.services.some((s) => s.category === c)).map(
      (c) => ({ id: c.toLowerCase(), label: SERVICE_CATEGORY_LABELS[c] }),
    ),
  ];
  const [active, setActive] = useState(sections[0]?.id);
  const listRef = useRef<HTMLDivElement>(null);

  // Highlight the chip of the section currently near the top of the screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id.replace('menu-', ''));
      },
      { rootMargin: '-30% 0px -65% 0px' },
    );
    listRef.current?.querySelectorAll('section').forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const selectedIds = value?.kind === 'services' ? value.ids : [];
  const atMax = selectedIds.length >= MAX_SERVICES_PER_BOOKING;

  return (
    <div>
      <nav
        aria-label="دسته‌بندی خدمات"
        className="sticky top-16 z-10 -mx-4 mb-6 flex [scrollbar-width:none] gap-2 overflow-x-auto bg-bg/90 px-4 py-3 backdrop-blur-xl md:mx-0 md:px-0"
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#menu-${section.id}`}
            onClick={() => setActive(section.id)}
            ref={(node) => {
              // Keep the highlighted chip in view when the row scrolls sideways.
              if (node && active === section.id) {
                node.scrollIntoView({ inline: 'nearest', block: 'nearest' });
              }
            }}
            aria-current={active === section.id ? 'true' : undefined}
            className={cn(
              'shrink-0 rounded-full border px-3 py-2.5 text-sm font-medium transition',
              active === section.id
                ? 'border-accent bg-accent text-on-accent'
                : 'border-line-strong text-muted hover:text-fg',
            )}
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div ref={listRef} className="flex flex-col gap-10">
        {catalog.packages.length > 0 && (
          <MenuSection
            id="packages"
            title="پکیج‌ها"
            hint="پکیج با تخفیف است و جای خدمات تکی را در سبد می‌گیرد."
          >
            {catalog.packages.map((pkg) => (
              <MenuItem
                key={pkg.id}
                name={pkg.name}
                badge={pkg.isFeatured ? 'پیشنهاد ویژه' : undefined}
                detail={pkg.services.map((s) => s.name).join('، ')}
                durationMinutes={pkg.durationMinutes}
                price={pkg.price}
                regularPrice={pkg.regularPrice > pkg.price ? pkg.regularPrice : undefined}
                selected={value?.kind === 'package' && value.id === pkg.id}
                onToggle={() => onTogglePackage(pkg.id)}
              />
            ))}
          </MenuSection>
        )}

        {SERVICE_CATEGORIES.map((category) => {
          const services = catalog.services.filter((s) => s.category === category);
          if (services.length === 0) return null;
          return (
            <MenuSection
              key={category}
              id={category.toLowerCase()}
              title={SERVICE_CATEGORY_LABELS[category]}
            >
              {services.map((service) => {
                const selected = selectedIds.includes(service.id);
                return (
                  <MenuItem
                    key={service.id}
                    name={service.name}
                    detail={service.description}
                    durationMinutes={service.durationMinutes}
                    price={service.price}
                    selected={selected}
                    disabled={!selected && atMax}
                    onToggle={() => onToggleService(service.id)}
                  />
                );
              })}
            </MenuSection>
          );
        })}
      </div>

      {atMax && (
        <p role="status" className="mt-6 text-sm text-muted">
          حداکثر {formatNumber(MAX_SERVICES_PER_BOOKING)} خدمت در یک نوبت قابل انتخاب است.
        </p>
      )}
    </div>
  );
}

function MenuSection({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section id={`menu-${id}`} aria-labelledby={`menu-${id}-title`} className="scroll-mt-36">
      <h3 id={`menu-${id}-title`} className="text-lg font-black">
        {title}
      </h3>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4 grid gap-2.5 md:grid-cols-2">{children}</div>
    </section>
  );
}

interface MenuItemProps {
  name: string;
  badge?: string;
  detail?: string | null;
  durationMinutes: number;
  price: number;
  regularPrice?: number;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

function MenuItem({
  name,
  badge,
  detail,
  durationMinutes,
  price,
  regularPrice,
  selected,
  disabled,
  onToggle,
}: MenuItemProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'group flex w-full items-center gap-4 rounded-[var(--radius-field)] border p-4 text-start transition active:scale-[0.99] md:p-5',
        'disabled:cursor-not-allowed disabled:opacity-40',
        selected ? 'border-accent bg-accent-soft' : 'border-line-strong hover:border-fg/30',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{name}</span>
          {badge && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-on-accent">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-bold">{formatPrice(price)}</span>
          {regularPrice && (
            <span className="text-xs text-muted line-through">{formatPrice(regularPrice)}</span>
          )}
          <span className="whitespace-nowrap text-muted">· {formatDuration(durationMinutes)}</span>
        </span>
        {detail && <span className="mt-1.5 line-clamp-2 block text-sm text-muted">{detail}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-full border transition',
          selected
            ? 'border-accent bg-accent text-on-accent'
            : 'border-line-strong text-fg group-hover:border-accent',
        )}
      >
        {selected ? <Check size={18} weight="bold" /> : <Plus size={18} />}
      </span>
    </button>
  );
}
