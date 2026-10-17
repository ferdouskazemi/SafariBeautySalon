import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PublicBoard } from '@/features/booking/components/public-board';
import { Container } from '@/shared/ui/container';
import { Skeleton } from '@/shared/ui/feedback';

export const metadata: Metadata = {
  title: 'تقویم نوبت‌ها',
  description: 'ببینید هر آرایشگر کدام ساعت‌ها رزرو شده و کدام ساعت‌ها هنوز خالی است.',
};

export default function CalendarPage() {
  return (
    <Container className="pt-24 pb-16 md:pt-32 md:pb-24">
      <h1 className="text-3xl font-black md:text-5xl">تقویم نوبت‌ها</h1>
      <p className="mt-3 mb-6 max-w-[56ch] text-sm leading-relaxed text-muted md:mt-4 md:mb-10 md:text-base">
        برنامه هر روز سالون را ببینید: کدام ساعت‌ها گرفته شده و کدام ساعت‌ها هنوز خالی است. روی یک
        وقت آزاد بزنید تا همان روز با همان آرایشگر رزرو کنید.
      </p>
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-[var(--radius-surface)]" />}>
        <PublicBoard />
      </Suspense>
    </Container>
  );
}
