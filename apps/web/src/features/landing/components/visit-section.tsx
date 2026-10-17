import { InstagramLogo, MapPin, Phone } from '@phosphor-icons/react/dist/ssr';
import { siteConfig } from '@/shared/config/site';
import { formatNumber } from '@/shared/lib/format';
import { ButtonLink } from '@/shared/ui/button';
import { Container } from '@/shared/ui/container';

const persianPhone = siteConfig.phone.replace(/\d/g, (d) => formatNumber(Number(d)));

export function VisitSection() {
  return (
    <section id="visit" className="py-24 md:py-32">
      <Container>
        <div className="grid overflow-hidden rounded-[var(--radius-surface)] border border-line-strong lg:grid-cols-2">
          <div className="flex flex-col justify-between gap-10 bg-accent p-8 text-on-accent md:p-14">
            <h2 className="text-4xl leading-tight font-black text-balance md:text-5xl">
              صندلی‌تان آماده است.
            </h2>
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href="/booking"
                size="lg"
                className="bg-on-accent text-accent hover:bg-bg"
              >
                رزرو نوبت
              </ButtonLink>
              <ButtonLink
                href="/track"
                size="lg"
                variant="secondary"
                className="border-on-accent/30 bg-transparent text-on-accent hover:border-on-accent hover:bg-on-accent/5"
              >
                پیگیری نوبت
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-10 bg-surface p-8 md:p-14">
            <div>
              <h3 className="text-sm text-muted">ساعت کاری</h3>
              <dl className="mt-4 grid gap-3">
                {siteConfig.openingHours.map((row) => (
                  <div key={row.days} className="flex items-baseline justify-between gap-6">
                    <dt className="font-bold">{row.days}</dt>
                    <dd className="text-muted">{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ul className="grid gap-4">
              <li>
                <a
                  href={siteConfig.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 transition hover:text-accent"
                >
                  <MapPin size={20} className="text-accent" />
                  {siteConfig.address}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center gap-3 transition hover:text-accent"
                >
                  <Phone size={20} className="text-accent" />
                  <span dir="ltr">{persianPhone}</span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 transition hover:text-accent"
                >
                  <InstagramLogo size={20} className="text-accent" />
                  اینستاگرام سفری
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
