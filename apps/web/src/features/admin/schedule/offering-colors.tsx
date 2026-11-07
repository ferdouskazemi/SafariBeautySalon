import { SERVICE_COLOR_COUNT, type AppointmentOfferingDto } from '@safari/shared';
import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';

/** Packages are not one of the service colors: they get the brand gold. */
const PACKAGE_COLOR = 'var(--color-accent)';

const serviceColor = (colorIndex: number) => `var(--svc-${colorIndex % SERVICE_COLOR_COUNT})`;

/** The colors an appointment shows: one per service, or the package gold. */
function colorsOf(offering: AppointmentOfferingDto): string[] {
  return offering.kind === 'package' || offering.parts.length === 0
    ? [PACKAGE_COLOR]
    : offering.parts.map((part) => serviceColor(part.colorIndex));
}

/**
 * Sets what `.svc-block` needs: the tint, plus a stripe split into one segment per service when
 * an appointment books several, so a glance at the schedule tells services apart.
 */
export function offeringStyle(offering: AppointmentOfferingDto): CSSProperties {
  const colors = colorsOf(offering);
  const style: Record<string, string> = { '--svc': colors[0]! };
  if (colors.length > 1) {
    const segments = colors.map((color, i) => {
      const from = (i / colors.length) * 100;
      const to = ((i + 1) / colors.length) * 100;
      return `${color} ${from}% ${to}%`;
    });
    style['--svc-stripe'] = `linear-gradient(to bottom, ${segments.join(', ')})`;
  }
  return style as CSSProperties;
}

interface LegendEntry {
  key: string;
  name: string;
  color: string;
}

/** Every distinct service (or package) booked in the given offerings, in first-seen order. */
function legendOf(offerings: AppointmentOfferingDto[]): LegendEntry[] {
  const entries = new Map<string, LegendEntry>();
  for (const offering of offerings) {
    if (offering.kind === 'package' || offering.parts.length === 0) {
      const key = `package:${offering.name}`;
      entries.set(key, { key, name: offering.name, color: PACKAGE_COLOR });
      continue;
    }
    for (const part of offering.parts) {
      const key = `${part.colorIndex}:${part.name}`;
      entries.set(key, { key, name: part.name, color: serviceColor(part.colorIndex) });
    }
  }
  return [...entries.values()];
}

function Swatch({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('size-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color }}
    />
  );
}

/** Which color is which service, for the services booked on the day shown. */
export function ServiceLegend({ offerings }: { offerings: AppointmentOfferingDto[] }) {
  const entries = legendOf(offerings);
  if (entries.length === 0) return null;
  return (
    <ul aria-label="رنگ خدمات" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
      {entries.map(({ key, name, color }) => (
        <li key={key} className="flex items-center gap-1.5">
          <Swatch color={color} />
          {name}
        </li>
      ))}
    </ul>
  );
}

/** An appointment's services as colored chips, for the list view. */
export function OfferingChips({ offering }: { offering: AppointmentOfferingDto }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {legendOf([offering]).map(({ key, name, color }) => (
        <li
          key={key}
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs"
          style={{
            borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
            backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
          }}
        >
          <Swatch color={color} />
          {name}
        </li>
      ))}
    </ul>
  );
}
