import { ButtonLink } from '@/shared/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-latin text-7xl text-accent" dir="ltr">
          404
        </p>
        <h1 className="mt-6 text-2xl font-black">این صفحه پیدا نشد</h1>
        <p className="mt-2 text-muted">شاید آدرس اشتباه وارد شده یا صفحه جابه‌جا شده است.</p>
        <ButtonLink href="/" className="mt-8">
          بازگشت به صفحه اصلی
        </ButtonLink>
      </div>
    </main>
  );
}
