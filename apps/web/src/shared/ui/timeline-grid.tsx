import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatMinuteOfDay } from '@/shared/lib/format';

const REM_PER_HOUR = 4.5;
const remAt = (minutes: number) => `${(minutes / 60) * REM_PER_HOUR}rem`;

/** Diagonal stripes for hours a barber does not work. */
const OFF_HOURS: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, var(--color-fg) 5%, transparent) 6px 12px)',
};

export interface TimelineBlock {
  key: string;
  /** Salon-local minutes since midnight. */
  startMinute: number;
  endMinute: number;
  className: string;
  /** Extra inline styles, e.g. CSS variables a block's class reads. */
  style?: CSSProperties;
  children: ReactNode;
  href?: string;
  title?: string;
}

export interface TimelineColumn {
  key: string;
  header: ReactNode;
  /** Working hours, or `null` on a day off. */
  shift: { startMinute: number; endMinute: number } | null;
  blocks: TimelineBlock[];
}

interface TimelineGridProps {
  columns: TimelineColumn[];
  /** Draws a "now" line when the day shown is today. */
  nowMinute?: number | null;
  label: string;
}

/**
 * A day calendar with one column per barber and hours down the side, like Fresha's calendar.
 * Scrolls sideways on phones while the hour labels stay pinned.
 */
export function TimelineGrid({ columns, nowMinute, label }: TimelineGridProps) {
  const edges = columns.flatMap((c) => [
    ...(c.shift ? [c.shift.startMinute, c.shift.endMinute] : []),
    ...c.blocks.flatMap((b) => [b.startMinute, b.endMinute]),
  ]);
  if (edges.length === 0) return null;

  const start = Math.floor(Math.min(...edges) / 60) * 60;
  const end = Math.ceil(Math.max(...edges) / 60) * 60;
  const height = remAt(end - start);
  const hours = Array.from({ length: (end - start) / 60 + 1 }, (_, i) => start + i * 60);
  const showNow = nowMinute != null && nowMinute >= start && nowMinute <= end;

  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="overflow-x-auto rounded-[var(--radius-surface)] border border-line-strong bg-surface"
    >
      <div
        className="grid min-w-max"
        style={{ gridTemplateColumns: `3.75rem repeat(${columns.length}, minmax(10rem, 1fr))` }}
      >
        <div className="sticky start-0 z-20 border-b border-line bg-surface" />
        {columns.map((column) => (
          <div key={column.key} className="border-s border-b border-line p-3">
            {column.header}
          </div>
        ))}

        <div className="sticky start-0 z-20 bg-surface" style={{ height }}>
          {hours.map((minute) => (
            <span
              key={minute}
              className="absolute inset-x-0 -translate-y-1/2 text-center text-[11px] text-muted first:translate-y-0 last:-translate-y-full"
              style={{ top: remAt(minute - start) }}
            >
              {formatMinuteOfDay(minute)}
            </span>
          ))}
        </div>

        {columns.map((column) => (
          <div
            key={column.key}
            className="relative border-s border-line"
            style={{
              height,
              backgroundImage: 'linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)',
              backgroundSize: `100% ${REM_PER_HOUR}rem`,
            }}
          >
            {column.shift ? (
              <>
                <OffHours from={0} to={column.shift.startMinute - start} />
                <OffHours from={column.shift.endMinute - start} to={end - start} />
              </>
            ) : (
              <div
                className="absolute inset-0 grid place-items-center text-sm text-muted"
                style={OFF_HOURS}
              >
                <span className="rounded-full bg-surface px-3 py-1">تعطیل</span>
              </div>
            )}

            {column.blocks.map((block) => {
              const style = {
                ...block.style,
                top: remAt(block.startMinute - start),
                height: remAt(block.endMinute - block.startMinute),
              };
              const className = cn(
                'absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1 text-xs leading-snug',
                block.className,
              );
              return block.href ? (
                <Link
                  key={block.key}
                  href={block.href}
                  title={block.title}
                  className={className}
                  style={style}
                >
                  {block.children}
                </Link>
              ) : (
                <div key={block.key} title={block.title} className={className} style={style}>
                  {block.children}
                </div>
              );
            })}

            {showNow && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-danger"
                style={{ top: remAt(nowMinute - start) }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OffHours({ from, to }: { from: number; to: number }) {
  if (to <= from) return null;
  return (
    <div
      aria-hidden
      className="absolute inset-x-0"
      style={{ ...OFF_HOURS, top: remAt(from), height: remAt(to - from) }}
    />
  );
}
