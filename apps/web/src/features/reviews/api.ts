import type { PublicReviewsDto } from '@safari/shared';
import { cachedGet } from '@/shared/lib/server-api';

export const getReviews = () => cachedGet<PublicReviewsDto>('/reviews');
