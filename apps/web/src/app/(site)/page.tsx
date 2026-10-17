import { Suspense } from 'react';
import { PackagesSection } from '@/features/catalog/components/packages-section';
import { ServicesSection } from '@/features/catalog/components/services-section';
import { AboutSection } from '@/features/landing/components/about-section';
import { Hero } from '@/features/landing/components/hero';
import { LookbookSection } from '@/features/landing/components/lookbook-section';
import { ServicesMarquee } from '@/features/landing/components/services-marquee';
import { VisitSection } from '@/features/landing/components/visit-section';
import { ReviewsSection } from '@/features/reviews/components/reviews-section';
import { TeamSection } from '@/features/team/components/team-section';
import { Container } from '@/shared/ui/container';
import { Skeleton } from '@/shared/ui/feedback';

/** Placeholder for a data-driven section while it streams in. */
function SectionFallback() {
  return (
    <Container className="py-24 md:py-32">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="mt-12 h-96" />
    </Container>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesMarquee />
      <AboutSection />
      <Suspense fallback={<SectionFallback />}>
        <PackagesSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <ServicesSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <TeamSection />
      </Suspense>
      <LookbookSection />
      <Suspense fallback={<SectionFallback />}>
        <ReviewsSection />
      </Suspense>
      <VisitSection />
    </>
  );
}
