import Link from 'next/link';
import { siteConfig, siteNav } from '@/shared/config/site';
import { ButtonLink } from '@/shared/ui/button';
import { Container } from '@/shared/ui/container';
import { LogoMark } from '@/shared/ui/logo';
import { MobileNav } from './mobile-nav';

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-[var(--z-header)] border-b border-line bg-bg/70 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3" aria-label={siteConfig.name}>
          <LogoMark className="h-11" priority />
          <span className="leading-tight">
            <span className="block text-base font-black">سالون سفری</span>
            <span
              className="hidden font-latin text-[9px] tracking-[0.3em] text-accent sm:block"
              dir="ltr"
            >
              SAFARI
            </span>
          </span>
        </Link>

        <nav aria-label="منوی اصلی" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {siteNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm text-muted transition hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/calendar"
            className="hidden rounded-full px-4 py-2 text-sm text-muted transition hover:text-fg md:block"
          >
            تقویم نوبت‌ها
          </Link>
          <Link
            href="/track"
            className="hidden rounded-full px-4 py-2 text-sm text-muted transition hover:text-fg md:block"
          >
            پیگیری نوبت
          </Link>
          <ButtonLink href="/booking" size="sm">
            رزرو نوبت
          </ButtonLink>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
