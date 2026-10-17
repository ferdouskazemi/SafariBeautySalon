import { formatNumber, formatRating } from '@/shared/lib/format';
import { Container, SectionTitle } from '@/shared/ui/container';
import { EmptyState } from '@/shared/ui/feedback';
import { Reveal } from '@/shared/ui/reveal';
import { StarRating } from '@/shared/ui/star-rating';
import { getReviews } from '../api';

export async function ReviewsSection() {
  const reviews = await getReviews();
  const items = reviews?.items.slice(0, 6) ?? [];
  const { average, count } = reviews?.summary ?? { average: null, count: 0 };

  return (
    <section id="reviews" className="border-t border-line bg-surface/40 py-24 md:py-32">
      <Container className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionTitle>از زبان مشتری‌ها</SectionTitle>
          {average !== null && (
            <div className="mt-10">
              <p className="text-7xl font-black text-accent md:text-8xl">{formatRating(average)}</p>
              <StarRating value={average} size={20} className="mt-3" />
              <p className="mt-2 text-sm text-muted">
                میانگین {formatNumber(count)} نظر ثبت‌شده، فقط از مشتریانی که نوبتشان انجام شده است.
              </p>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState className="lg:col-span-8" title="هنوز نظری ثبت نشده است" />
        ) : (
          <div className="columns-1 gap-4 md:columns-2 lg:col-span-8">
            {items.map((review, index) => (
              <Reveal
                key={review.id}
                delay={(index % 2) * 0.08}
                className="mb-4 break-inside-avoid"
              >
                <figure className="rounded-[var(--radius-surface)] border border-line bg-bg/60 p-6">
                  <StarRating value={review.rating} size={14} />
                  <blockquote className="mt-4 line-clamp-3 leading-loose">
                    «{review.comment}»
                  </blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-bold">{review.customerName}</span>
                    <span className="text-muted"> - {review.offeringName}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
