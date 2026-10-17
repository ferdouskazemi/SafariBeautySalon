import { ArrowLeft, Clock } from '@phosphor-icons/react/dist/ssr';
import type { PackageDto } from '@safari/shared';
import Image from 'next/image';
import Link from 'next/link';
import { photos } from '@/shared/config/photos';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatPrice } from '@/shared/lib/format';
import { Container, SectionTitle } from '@/shared/ui/container';
import { EmptyState } from '@/shared/ui/feedback';
import { Reveal } from '@/shared/ui/reveal';
import { getCatalog } from '../api';

/** Background treatments for the non-featured tiles, so the grid does not read as identical cards. */
const TILE_TONES = ['bg-surface', 'bg-accent-soft', 'bg-raised'];

export async function PackagesSection() {
  const catalog = await getCatalog();
  const packages = catalog?.packages ?? [];
  const featured = packages.find((p) => p.isFeatured) ?? packages[0];
  const others = packages.filter((p) => p !== featured);

  return (
    <section id="packages" className="py-24 md:py-32">
      <Container>
        <p className="mb-4 text-sm font-medium text-accent">پکیج‌ها</p>
        <SectionTitle className="max-w-[18ch]">ترکیب‌هایی که بیشتر انتخاب می‌شوند</SectionTitle>

        {!featured ? (
          <EmptyState className="mt-12" title="پکیج‌ها به‌زودی اضافه می‌شوند" />
        ) : (
          <div className="mt-14 grid gap-4 lg:grid-cols-12">
            <Reveal className={cn('lg:col-span-7', others.length > 1 && 'lg:row-span-3')}>
              <FeaturedPackage pkg={featured} />
            </Reveal>
            {others.map((pkg, index) => (
              <Reveal key={pkg.id} delay={0.06 * (index + 1)} className="lg:col-span-5">
                <PackageTile pkg={pkg} tone={TILE_TONES[index % TILE_TONES.length]!} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

function PriceLine({ pkg }: { pkg: PackageDto }) {
  const saving = pkg.regularPrice - pkg.price;
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-2xl font-black">{formatPrice(pkg.price)}</span>
      {saving > 0 && (
        <span className="text-sm text-muted line-through decoration-accent/60">
          {formatPrice(pkg.regularPrice)}
        </span>
      )}
    </div>
  );
}

function FeaturedPackage({ pkg }: { pkg: PackageDto }) {
  return (
    <Link
      href={`/booking?package=${pkg.id}`}
      aria-label={`رزرو پکیج ${pkg.name}`}
      className="group relative flex h-full min-h-[30rem] flex-col justify-end overflow-hidden rounded-[var(--radius-surface)] border border-line-strong p-6 md:p-10"
    >
      <Image
        src={photos.featuredPackage}
        alt=""
        fill
        sizes="(min-width: 1024px) 55vw, 100vw"
        className="-z-10 object-cover transition duration-700 ease-out-expo group-hover:scale-105"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/80 to-bg/10"
      />

      <h3 className="text-4xl font-black md:text-5xl">{pkg.name}</h3>
      {pkg.description && (
        <p className="mt-3 max-w-[42ch] leading-relaxed text-fg/80">{pkg.description}</p>
      )}
      <ul className="mt-6 flex flex-wrap gap-2">
        {pkg.services.map((s) => (
          <li
            key={s.id}
            className="rounded-full border border-line-strong bg-bg/40 px-3 py-1 text-xs backdrop-blur"
          >
            {s.name}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <PriceLine pkg={pkg} />
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Clock size={14} /> {formatDuration(pkg.durationMinutes)}
          </p>
        </div>
        <span className="grid size-14 place-items-center rounded-full bg-accent text-on-accent transition duration-300 ease-out-expo group-hover:-translate-x-1">
          <ArrowLeft size={22} weight="bold" />
        </span>
      </div>
    </Link>
  );
}

function PackageTile({ pkg, tone }: { pkg: PackageDto; tone: string }) {
  return (
    <Link
      href={`/booking?package=${pkg.id}`}
      aria-label={`رزرو پکیج ${pkg.name}`}
      className={cn(
        'group flex h-full flex-col gap-4 rounded-[var(--radius-surface)] border border-line p-6 transition hover:border-accent/50',
        tone,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl font-black">{pkg.name}</h3>
        <ArrowLeft
          size={20}
          className="mt-1 text-muted transition duration-300 ease-out-expo group-hover:-translate-x-1 group-hover:text-accent"
        />
      </div>
      <p className="text-sm leading-relaxed text-muted">
        {pkg.services.map((s) => s.name).join('، ')}
      </p>
      <div className="mt-auto flex items-baseline justify-between gap-4">
        <PriceLine pkg={pkg} />
        <span className="text-sm text-muted">{formatDuration(pkg.durationMinutes)}</span>
      </div>
    </Link>
  );
}
