import { SERVICE_CATEGORIES } from '@safari/shared';
import { Container, SectionTitle } from '@/shared/ui/container';
import { EmptyState } from '@/shared/ui/feedback';
import { getCatalog } from '../api';
import { ServiceMenu } from './service-menu';

export async function ServicesSection() {
  const catalog = await getCatalog();
  const services = catalog?.services ?? [];
  const categories = SERVICE_CATEGORIES.filter((c) => services.some((s) => s.category === c));

  return (
    <section id="services" className="border-t border-line bg-surface/40 py-24 md:py-32">
      <Container className="max-w-5xl">
        <SectionTitle>منوی خدمات</SectionTitle>
        <p className="mt-4 max-w-[52ch] leading-relaxed text-muted">
          هر خدمت را جداگانه رزرو کنید، یا با یک پکیج کمتر بپردازید.
        </p>
        {services.length === 0 ? (
          <EmptyState className="mt-12" title="فهرست خدمات در حال به‌روزرسانی است" />
        ) : (
          <ServiceMenu services={services} categories={categories} />
        )}
      </Container>
    </section>
  );
}
