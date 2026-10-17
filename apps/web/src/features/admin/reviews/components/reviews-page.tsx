'use client';

import { Eye, EyeSlash } from '@phosphor-icons/react';
import type { ReviewDto } from '@safari/shared';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatLongDate, formatNumber } from '@/shared/lib/format';
import { errorMessage, http } from '@/shared/lib/http';
import { Button } from '@/shared/ui/button';
import { Badge, EmptyState, Skeleton } from '@/shared/ui/feedback';
import { Segmented } from '@/shared/ui/segmented';
import { StarRating } from '@/shared/ui/star-rating';
import { useAdminMutation } from '../../shared/use-admin-mutation';
import { PageHeader } from '../../shell/admin-shell';

type Filter = 'all' | 'visible' | 'hidden';

const reviewsQuery = queryOptions({
  queryKey: ['admin', 'reviews'],
  queryFn: () => http<ReviewDto[]>('/admin/reviews'),
});

export function ReviewsPage() {
  const { data, isPending, isError, error } = useQuery(reviewsQuery);
  const setVisibility = useAdminMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      http<ReviewDto>(`/admin/reviews/${id}`, { method: 'PATCH', body: { isVisible } }),
    invalidates: [reviewsQuery.queryKey, ['admin', 'dashboard']],
  });
  const [filter, setFilter] = useState<Filter>('all');
  const hiddenCount = data?.filter((r) => !r.isVisible).length ?? 0;
  const shown = data?.filter((r) =>
    filter === 'all' ? true : filter === 'hidden' ? !r.isVisible : r.isVisible,
  );

  return (
    <>
      <PageHeader
        title="نظرات مشتریان"
        description="فقط مشتریانی که نوبتشان انجام شده می‌توانند نظر بدهند. نظرهای پنهان در سایت نشان داده نمی‌شوند و در میانگین امتیاز حساب نمی‌شوند."
      />
      {data && data.length > 0 && (
        <Segmented
          label="فیلتر نظرات"
          className="mb-4"
          value={filter}
          onChange={setFilter}
          options={[
            ['all', `همه (${formatNumber(data.length)})`],
            ['visible', `در سایت (${formatNumber(data.length - hiddenCount)})`],
            ['hidden', `پنهان (${formatNumber(hiddenCount)})`],
          ]}
        />
      )}

      {isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title="نظرات بارگذاری نشد" description={errorMessage(error)} />
      ) : data.length === 0 ? (
        <EmptyState title="هنوز نظری ثبت نشده است" />
      ) : shown?.length === 0 ? (
        <EmptyState title="در این دسته نظری نیست" />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown?.map((review) => (
            <li
              key={review.id}
              className={cn(
                'flex flex-col rounded-[var(--radius-field)] border border-line bg-surface p-4 md:p-5',
                !review.isVisible && 'opacity-60',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-bold">{review.customerName}</span>
                  <StarRating value={review.rating} size={14} />
                  {!review.isVisible && <Badge tone="danger">پنهان</Badge>}
                </div>
                <Button
                  size="sm"
                  variant={review.isVisible ? 'ghost' : 'secondary'}
                  loading={setVisibility.isPending && setVisibility.variables?.id === review.id}
                  onClick={() =>
                    setVisibility.mutate({ id: review.id, isVisible: !review.isVisible })
                  }
                >
                  {review.isVisible ? <EyeSlash size={16} /> : <Eye size={16} />}
                  {review.isVisible ? 'پنهان کردن' : 'نمایش در سایت'}
                </Button>
              </div>
              {review.comment && <p className="mt-3 leading-relaxed">{review.comment}</p>}
              <p className="mt-auto pt-3 text-xs text-muted">
                {review.offeringName} با {review.staffName} - {formatLongDate(review.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
