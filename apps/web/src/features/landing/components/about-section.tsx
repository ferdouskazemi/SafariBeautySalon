import { CalendarCheck, FaceMask, ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import { photos } from '@/shared/config/photos';
import { Container } from '@/shared/ui/container';
import { Reveal } from '@/shared/ui/reveal';

const PROMISES = [
  { icon: CalendarCheck, title: 'سر وقت', text: 'نوبت شما یعنی صندلی شما. بدون صف و انتظار.' },
  {
    icon: ShieldCheck,
    title: 'ابزار استریل',
    text: 'تیغ یک‌بار مصرف و ابزار ضدعفونی‌شده برای هر مشتری.',
  },
  {
    icon: FaceMask,
    title: 'مشاوره فرم صورت',
    text: 'در اولین مراجعه، مدل مناسب صورت‌تان را با هم انتخاب می‌کنیم.',
  },
];

export function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32">
      <Container className="grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="text-2xl leading-[1.7] font-bold text-balance md:text-4xl md:leading-[1.6]">
              سفری از یک باور ساده شروع شد: مردی که برای خودش وقت می‌گذارد، باید{' '}
              <span className="text-accent">دقیقاً همان چیزی را بگیرد که می‌خواهد.</span>
            </p>
          </Reveal>

          <dl className="mt-14 grid gap-8 sm:grid-cols-3">
            {PROMISES.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.08}>
                <dt className="flex items-center gap-2 font-bold">
                  <Icon size={22} className="text-accent" />
                  {title}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">{text}</dd>
              </Reveal>
            ))}
          </dl>
        </div>

        <div className="relative grid grid-cols-2 gap-4 lg:col-span-5">
          <Reveal className="relative mt-16 aspect-[4/5] overflow-hidden rounded-[var(--radius-surface)]">
            <Image
              src={photos.aboutInterior}
              alt="صندلی چرمی آرایشگری کنار دیوار آجری"
              fill
              sizes="(min-width: 1024px) 20vw, 45vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal
            delay={0.1}
            className="relative aspect-square overflow-hidden rounded-[var(--radius-surface)]"
          >
            <Image
              src={photos.aboutTools}
              alt="ماشین‌های اصلاح و شانه‌ها در جای ابزار"
              fill
              sizes="(min-width: 1024px) 20vw, 45vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
