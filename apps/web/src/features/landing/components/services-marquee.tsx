import { Scissors } from '@phosphor-icons/react/dist/ssr';

const WORDS = [
  'فید مدرن',
  'طراحی ریش',
  'حوله داغ',
  'فیشال ذغال',
  'اصلاح کلاسیک',
  'پوشش موی سفید',
  'آماده‌سازی داماد',
];

/** The one marquee on the page: the breadth of services at a glance. */
export function ServicesMarquee() {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-10 pe-10">
      {WORDS.map((word) => (
        <li
          key={word}
          className="flex items-center gap-10 text-2xl font-bold whitespace-nowrap text-fg/80 md:text-3xl"
        >
          {word}
          <Scissors aria-hidden size={20} className="text-accent" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="overflow-hidden border-y border-line py-6" aria-label="خدمات سالون">
      <div className="flex w-max animate-marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
