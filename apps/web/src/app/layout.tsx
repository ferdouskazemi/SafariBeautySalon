import type { Metadata, Viewport } from 'next';
import { Unbounded, Vazirmatn } from 'next/font/google';
import { siteConfig } from '@/shared/config/site';
import { THEME_SCRIPT } from '@/shared/lib/theme-script';
import { AppProviders } from '@/shared/providers/app-providers';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

const unbounded = Unbounded({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-unbounded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | آرایشگاه مردانه`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    locale: 'fa_AF',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f2ea' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0e0c' },
  ],
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The theme script sets `data-theme` before React hydrates, hence suppressHydrationWarning.
    <html
      lang="fa-AF"
      dir="rtl"
      data-theme="dark"
      suppressHydrationWarning
      className={`${vazirmatn.variable} ${unbounded.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
