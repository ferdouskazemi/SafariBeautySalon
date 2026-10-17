import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { siteConfig } from '@/shared/config/site';
import { buttonStyles, ButtonLink } from '@/shared/ui/button';
import { Container } from '@/shared/ui/container';
import { HeroGallery } from './hero-gallery';
import { HeroHeadline } from './hero-headline';
import { HeroShader } from './hero-shader';
import { MagneticLink } from './magnetic-link';

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100dvh] items-center overflow-hidden pt-24 pb-16 md:pt-20">
      {/* Fallback backdrop while (or if) WebGL is not available. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(60%_50%_at_25%_45%,rgb(214_179_112/0.14),transparent_70%),radial-gradient(40%_40%_at_80%_90%,rgb(214_179_112/0.06),transparent_70%)]"
      />
      <HeroShader className="absolute inset-0 -z-10 size-full" />

      <Container className="grid items-center gap-12 lg:grid-cols-12">
        <div className="flex flex-col items-start gap-7 lg:col-span-7">
          <p className="font-latin text-xs tracking-[0.3em] text-accent uppercase" dir="ltr">
            {siteConfig.latinName}
          </p>
          <HeroHeadline lines={['آراستگی برای', 'مردانِ ماجراجو']} />
          <p className="max-w-[46ch] text-base leading-loose text-muted md:text-lg">
            اصلاح مو و ریش با دقت یک صنعتگر، در فضایی آرام. نوبت‌تان را در کمتر از یک دقیقه آنلاین
            بگیرید.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <MagneticLink href="/booking" className={buttonStyles({ size: 'lg' })}>
              رزرو نوبت
              <ArrowLeft size={18} weight="bold" />
            </MagneticLink>
            <ButtonLink href="/#packages" variant="secondary" size="lg">
              مشاهده پکیج‌ها
            </ButtonLink>
          </div>
        </div>

        <HeroGallery className="lg:col-span-5" />
      </Container>
    </section>
  );
}
