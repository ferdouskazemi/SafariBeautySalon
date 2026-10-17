import Image from 'next/image';
import { siteConfig } from '@/shared/config/site';
import { cn } from '@/shared/lib/cn';
import logo from '../../../public/brand/logo.png';
import logoMark from '../../../public/brand/logo-mark.png';

/** The crown-and-profile mark, for tight spaces (header, admin). */
export function LogoMark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={logoMark}
      alt=""
      className={cn('h-10 w-auto', className)}
      sizes="80px"
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}

/** The full lockup: mark, SAFARI wordmark and "Beauty Salon". */
export function LogoFull({ className }: { className?: string }) {
  return (
    <Image
      src={logo}
      alt={`${siteConfig.latinName}، ${siteConfig.name}`}
      className={cn('h-auto w-48', className)}
      sizes="(min-width: 768px) 240px, 192px"
    />
  );
}
