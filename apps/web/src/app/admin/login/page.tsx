import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';
import { siteConfig } from '@/shared/config/site';
import { LogoFull } from '@/shared/ui/logo';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

export const metadata: Metadata = {
  title: 'ورود کارکنان',
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center bg-[radial-gradient(50%_40%_at_50%_0%,color-mix(in_srgb,var(--color-accent)_12%,transparent),transparent)] px-4">
      <ThemeToggle className="absolute end-4 top-4" />
      <div className="w-full max-w-sm">
        <Link href="/" aria-label={siteConfig.name} className="mx-auto block w-fit">
          <LogoFull className="w-44" />
        </Link>
        <h1 className="mt-8 mb-8 text-center text-3xl font-black">ورود کارکنان</h1>
        <div className="rounded-[var(--radius-surface)] border border-line-strong bg-surface p-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
