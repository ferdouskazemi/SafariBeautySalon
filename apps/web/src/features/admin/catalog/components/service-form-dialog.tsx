'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  createServiceSchema,
  type CreateServiceData,
  type CreateServiceInput,
  type ServiceDto,
} from '@safari/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/field';
import { useSaveService } from '../api';

interface ServiceFormDialogProps {
  open: boolean;
  service?: ServiceDto;
  onClose: () => void;
}

export function ServiceFormDialog({ open, service, onClose }: ServiceFormDialogProps) {
  const saveService = useSaveService();
  const form = useForm<CreateServiceInput, unknown, CreateServiceData>({
    resolver: zodResolver(createServiceSchema),
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: service?.name ?? '',
      description: service?.description ?? '',
      category: service?.category ?? 'HAIR',
      durationMinutes: service?.durationMinutes ?? 30,
      isActive: service?.isActive ?? true,
    });
  }, [open, service, form]);

  const onSubmit = form.handleSubmit((data) =>
    saveService.mutate({ id: service?.id, ...data }, { onSuccess: onClose }),
  );

  return (
    <Dialog open={open} onClose={onClose} title={service ? `ویرایش ${service.name}` : 'خدمت جدید'}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <Field label="نام خدمت" error={errors.name?.message}>
          {(c) => <Input {...c} {...form.register('name')} />}
        </Field>
        <Field label="دسته‌بندی" error={errors.category?.message}>
          {(c) => (
            <Select {...c} {...form.register('category')}>
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {SERVICE_CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="مدت (دقیقه)" error={errors.durationMinutes?.message}>
            {(c) => (
              <Input
                {...c}
                type="number"
                min={10}
                step={5}
                dir="ltr"
                {...form.register('durationMinutes', { valueAsNumber: true })}
              />
            )}
          </Field>
        </div>
        <Field label="توضیح کوتاه" error={errors.description?.message}>
          {(c) => <Textarea {...c} {...form.register('description')} />}
        </Field>
        <Checkbox label="فعال (نمایش در سایت و قابل رزرو)" {...form.register('isActive')} />
        <div className="mt-2 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={saveService.isPending}>
            ذخیره
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
