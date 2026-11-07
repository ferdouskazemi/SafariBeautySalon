/**
 * Salon contact details shown on the public site.
 * TODO(owner): replace the placeholder address, phone and social links with the real ones.
 */
export const siteConfig = {
  name: 'سالون آرایش سفری',
  latinName: 'Safari Beauty Salon',
  description: 'آرایشگاه مردانه سفری: اصلاح مو، طراحی ریش و مراقبت پوست با رزرو آنلاین نوبت.',
  address: 'کابل، شهر نو، سرک چهارم',
  phone: '0700000000',
  instagram: 'https://instagram.com/',
  mapUrl: 'https://maps.google.com/?q=Kabul',
  /** General opening hours. Each barber's bookable hours are managed in the admin panel. */
  openingHours: [
    { days: 'شنبه تا پنجشنبه', hours: '۹:۰۰ تا ۲۰:۰۰' },
    { days: 'جمعه', hours: '۱۴:۰۰ تا ۲۰:۰۰' },
  ],
} as const;

/** A wa.me link that opens WhatsApp to the salon with `text` already typed. */
export function salonWhatsAppUrl(text: string): string {
  // Local 07XXXXXXXX -> international 937XXXXXXXX, which wa.me requires.
  const international = `93${siteConfig.phone.slice(1)}`;
  return `https://wa.me/${international}?text=${encodeURIComponent(text)}`;
}

export const siteNav = [
  { href: '/#packages', label: 'پکیج‌ها' },
  { href: '/#services', label: 'خدمات' },
  { href: '/#team', label: 'تیم' },
  { href: '/#reviews', label: 'نظرات' },
  { href: '/#visit', label: 'تماس' },
] as const;
