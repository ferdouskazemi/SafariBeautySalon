import { SiteFooter } from '@/features/landing/components/site-footer';
import { SiteHeader } from '@/features/landing/components/site-header';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[var(--z-overlay)] rounded-full bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:right-3"
      >
        رفتن به محتوای اصلی
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
