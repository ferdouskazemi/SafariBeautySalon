import Image from 'next/image';
import { photos } from '@/shared/config/photos';
import { Container, SectionTitle } from '@/shared/ui/container';

const WORK = [
  {
    name: 'فید با خط‌کشی دقیق',
    note: 'فید تمیز و خط کناره که با تیغ مرتب می‌شود.',
    src: photos.work.lineUp,
  },
  {
    name: 'فرم‌دهی ریش',
    note: 'ریش متناسب با خط فک، با قیچی شکل می‌گیرد.',
    src: photos.work.beardShape,
  },
  { name: 'تیپر با ماشین', note: 'انتقال نرم پشت گوش و گردن، بدون خط.', src: photos.work.taper },
  {
    name: 'حالت‌دهی نهایی',
    note: 'سشوار و محصول مناسب برای حالتی که تا شب بماند.',
    src: photos.work.styling,
  },
  {
    name: 'تکسچرد کراپ',
    note: 'کوتاهی با قیچی پیتاژ برای بافت طبیعی و سبک.',
    src: photos.work.texture,
  },
  {
    name: 'ریش پرپشت کلاسیک',
    note: 'مرتب کردن ریش بلند، بی‌آنکه حجمش از دست برود.',
    src: photos.work.fullBeard,
  },
];

export function LookbookSection() {
  return (
    <section id="lookbook" className="overflow-hidden border-t border-line py-24 md:py-32">
      <Container>
        <SectionTitle>کار ما از نزدیک</SectionTitle>
        <p className="mt-4 max-w-[52ch] leading-relaxed text-muted">
          عکس مدل دلخواه‌تان را بیاورید، یا یکی از این‌ها را انتخاب کنید.
        </p>
      </Container>

      <Container className="mt-12 max-w-none px-0 md:px-0">
        <ul className="flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-4 md:px-8">
          {WORK.map((item, index) => (
            <li
              key={item.name}
              className={`w-[72vw] shrink-0 snap-start sm:w-[19rem] ${index % 2 === 1 ? 'md:mt-12' : ''}`}
            >
              <figure>
                <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-surface)] bg-raised">
                  <Image
                    src={item.src}
                    alt={item.name}
                    fill
                    sizes="(min-width: 640px) 19rem, 72vw"
                    className="object-cover transition duration-700 ease-out-expo hover:scale-105"
                  />
                </div>
                <figcaption className="mt-4">
                  <p className="text-lg font-bold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted">{item.note}</p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
