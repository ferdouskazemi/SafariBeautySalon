import type {
  CatalogDto,
  CreatePackageData,
  CreateServiceData,
  PackageDto,
  ServiceDto,
} from '@safari/shared';
import { queryOptions } from '@tanstack/react-query';
import { http } from '@/shared/lib/http';
import { useAdminMutation } from '../shared/use-admin-mutation';

const CATALOG_KEY = ['admin', 'catalog'];

export type CatalogKind = 'service' | 'package';

export const adminCatalogQuery = queryOptions({
  queryKey: CATALOG_KEY,
  queryFn: () => http<CatalogDto>('/admin/catalog'),
});

export const useSaveService = () =>
  useAdminMutation({
    mutationFn: ({ id, ...body }: CreateServiceData & { id?: string }) =>
      id
        ? http<ServiceDto>(`/admin/catalog/services/${id}`, { method: 'PATCH', body })
        : http<ServiceDto>('/admin/catalog/services', { method: 'POST', body }),
    invalidates: [CATALOG_KEY],
    successMessage: 'خدمت ذخیره شد',
  });

export const useDeleteService = () =>
  useAdminMutation({
    mutationFn: (id: string) => http<void>(`/admin/catalog/services/${id}`, { method: 'DELETE' }),
    invalidates: [CATALOG_KEY],
    successMessage: 'خدمت حذف شد',
  });

export const useSavePackage = () =>
  useAdminMutation({
    mutationFn: ({ id, ...body }: CreatePackageData & { id?: string }) =>
      id
        ? http<PackageDto>(`/admin/catalog/packages/${id}`, { method: 'PATCH', body })
        : http<PackageDto>('/admin/catalog/packages', { method: 'POST', body }),
    invalidates: [CATALOG_KEY],
    successMessage: 'پکیج ذخیره شد',
  });

export const useDeletePackage = () =>
  useAdminMutation({
    mutationFn: (id: string) => http<void>(`/admin/catalog/packages/${id}`, { method: 'DELETE' }),
    invalidates: [CATALOG_KEY],
    successMessage: 'پکیج حذف شد',
  });

/** Shows or hides a service or package on the site without opening its form. */
export const useSetCatalogItemActive = () =>
  useAdminMutation({
    mutationFn: ({ kind, id, isActive }: { kind: CatalogKind; id: string; isActive: boolean }) =>
      http<unknown>(`/admin/catalog/${kind}s/${id}`, { method: 'PATCH', body: { isActive } }),
    invalidates: [CATALOG_KEY],
  });
