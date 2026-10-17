import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TrackAppointment } from '@/features/booking/components/track-appointment';
import { Container } from '@/shared/ui/container';

export const metadata: Metadata = {
  title: 'پیگیری نوبت',
  description: 'وضعیت نوبت خود را ببینید، آن را لغو کنید یا نظر بدهید.',
};

export default function TrackPage() {
  return (
    <Container className="pt-28 pb-24 md:pt-32">
      <h1 className="text-4xl font-black md:text-5xl">پیگیری نوبت</h1>
      <p className="mt-4 mb-10 max-w-[52ch] leading-relaxed text-muted">
        کد ۶ حرفی نوبت و شماره موبایلی را که هنگام رزرو وارد کردید بنویسید.
      </p>
      <Suspense>
        <TrackAppointment />
      </Suspense>
    </Container>
  );
}
