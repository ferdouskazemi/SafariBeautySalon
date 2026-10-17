import type { PublicStaffDto } from '@safari/shared';
import { cachedGet } from '@/shared/lib/server-api';

export const getTeam = () => cachedGet<PublicStaffDto[]>('/staff');
