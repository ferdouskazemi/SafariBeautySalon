import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingFlow } from '@/features/booking/components/booking-flow';
import { getCatalog } from '@/features/catalog/api';
import { getTeam } from '@/features/team/api';
import { Container } from '@/shared/ui/container';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';

export const metadata: Metadata = {
  title: 'رزرو نوبت',
  description: 'نوبت اصلاح مو، ریش و مراقبت پوست را آنلاین رزرو کنید.',
};

export default function BookingPage() {
  return (
    <Container className="pt-22 pb-24 md:pt-32">
      {/* The header already says "رزرو نوبت"; keep the heading for screen readers, not the eye. */}
      <h1 className="sr-only">رزرو نوبت</h1>
      <Suspense fallback={<FlowSkeleton />}>
        <BookingContent />
      </Suspense>
    </Container>
  );
}

async function BookingContent() {
  const [catalog, team] = await Promise.all([getCatalog(), getTeam()]);
  if (!catalog || !team) {
    return (
      <EmptyState
        title="رزرو آنلاین موقتاً در دسترس نیست"
        description="لطفاً چند دقیقه دیگر دوباره امتحان کنید یا با سالون تماس بگیرید."
      />
    );
  }
  return <BookingFlow catalog={catalog} team={team} />;
}

function FlowSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="grid gap-3 lg:col-span-8">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="hidden h-96 lg:col-span-4 lg:block" />
    </div>
  );
}
