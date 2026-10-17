import type { CatalogDto } from '@safari/shared';
import { cachedGet } from '@/shared/lib/server-api';

export const getCatalog = () => cachedGet<CatalogDto>('/catalog');
