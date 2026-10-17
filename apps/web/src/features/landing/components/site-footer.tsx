import Link from 'next/link';
import { siteConfig, siteNav } from '@/shared/config/site';
import { Container } from '@/shared/ui/container';
import { LogoFull } from '@/shared/ui/logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-12">
      <Container className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <LogoFull className="w-36" />
          <div>
            <p className="text-lg font-black">{siteConfig.name}</p>
            <p className="mt-1 text-sm text-muted">آرایشگاه مردانه، با رزرو آنلاین نوبت.</p>
          </div>
        </div>
        <nav aria-label="پیوندهای پایین صفحه">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {siteNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-fg">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/admin" className="transition hover:text-fg">
                ورود کارکنان
              </Link>
            </li>
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
