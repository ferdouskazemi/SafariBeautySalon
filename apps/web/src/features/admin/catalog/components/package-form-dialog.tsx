'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPackageSchema,
  type CreatePackageData,
  type CreatePackageInput,
  type PackageDto,
  type ServiceDto,
} from '@safari/shared';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { formatPrice } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Checkbox, Field, Input, Textarea } from '@/shared/ui/field';
import { useSavePackage } from '../api';

interface PackageFormDialogProps {
  open: boolean;
  pkg?: PackageDto;
  services: ServiceDto[];
  onClose: () => void;
}

export function PackageFormDialog({ open, pkg, services, onClose }: PackageFormDialogProps) {
  const savePackage = useSavePackage();
  const form = useForm<CreatePackageInput, unknown, CreatePackageData>({
    resolver: zodResolver(createPackageSchema),
  });
  const { errors } = form.formState;
  const selectedIds = useWatch({ control: form.control, name: 'serviceIds' }) ?? [];
  const regularPrice = services
    .filter((s) => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: pkg?.name ?? '',
      description: pkg?.description ?? '',
      price: pkg?.price ?? 0,
      serviceIds: pkg?.services.map((s) => s.id) ?? [],
      isFeatured: pkg?.isFeatured ?? false,
      isActive: pkg?.isActive ?? true,
    });
  }, [open, pkg, form]);

  const onSubmit = form.handleSubmit((data) =>
    savePackage.mutate({ id: pkg?.id, ...data }, { onSuccess: onClose }),
  );

  return (
    <Dialog open={open} onClose={onClose} title={pkg ? `ویرایش پکیج ${pkg.name}` : 'پکیج جدید'}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <Field label="نام پکیج" error={errors.name?.message}>
          {(c) => <Input {...c} {...form.register('name')} />}
        </Field>

        <fieldset>
          <legend className="text-sm font-medium">خدمات این پکیج</legend>
          <div className="mt-2 grid gap-2 rounded-[var(--radius-field)] border border-line-strong p-3 sm:grid-cols-2">
            {services.map((service) => (
              <Checkbox
                key={service.id}
                label={service.name}
                value={service.id}
                {...form.register('serviceIds')}
              />
            ))}
          </div>
          {errors.serviceIds && (
            <p className="mt-2 text-xs text-danger">{errors.serviceIds.message}</p>
          )}
        </fieldset>

        <Field
          label="قیمت پکیج (افغانی)"
          error={errors.price?.message}
          hint={regularPrice > 0 ? `جمع قیمت جداگانه: ${formatPrice(regularPrice)}` : undefined}
        >
          {(c) => (
            <Input
              {...c}
              type="number"
              min={0}
              step={10}
              dir="ltr"
              {...form.register('price', { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="توضیح کوتاه" error={errors.description?.message}>
          {(c) => <Textarea {...c} {...form.register('description')} />}
        </Field>
        <Checkbox label="پکیج ویژه (نمایش بزرگ در صفحه اصلی)" {...form.register('isFeatured')} />
        <Checkbox label="فعال (نمایش در سایت و قابل رزرو)" {...form.register('isActive')} />
        <div className="mt-2 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={savePackage.isPending}>
            ذخیره
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
