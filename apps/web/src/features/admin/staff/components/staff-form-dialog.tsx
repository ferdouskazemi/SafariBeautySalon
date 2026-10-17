'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createStaffSchema, passwordSchema, type StaffDto } from '@safari/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Checkbox, Field, Input, Textarea } from '@/shared/ui/field';
import { useCreateStaff, useUpdateStaff } from '../api';

/** Same fields for create and edit; the password is only set on create (it has its own dialog). */
const staffFormSchema = (isEdit: boolean) =>
  createStaffSchema.extend({
    password: isEdit ? z.string().optional() : passwordSchema,
    isActive: z.boolean().optional(),
  });
type StaffFormInput = z.input<ReturnType<typeof staffFormSchema>>;
type StaffFormData = z.output<ReturnType<typeof staffFormSchema>>;

interface StaffFormDialogProps {
  open: boolean;
  /** Edit mode when provided, create mode otherwise. */
  member?: StaffDto;
  onClose: () => void;
}

export function StaffFormDialog({ open, member, onClose }: StaffFormDialogProps) {
  const isEdit = Boolean(member);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const form = useForm<StaffFormInput, unknown, StaffFormData>({
    resolver: zodResolver(staffFormSchema(isEdit)),
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      fullName: member?.fullName ?? '',
      phone: member?.phone ?? '',
      password: '',
      title: member?.title ?? '',
      bio: member?.bio ?? '',
      avatarUrl: member?.avatarUrl ?? '',
      isActive: member?.isActive ?? true,
    });
  }, [open, member, form]);

  const onSubmit = form.handleSubmit(({ password, ...data }) => {
    const options = { onSuccess: onClose };
    if (member) updateStaff.mutate({ id: member.id, ...data }, options);
    else createStaff.mutate({ ...data, password: password ?? '' }, options);
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? `ویرایش ${member!.fullName}` : 'افزودن آرایشگر'}
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <Field label="نام و تخلص" error={errors.fullName?.message}>
          {(c) => <Input {...c} {...form.register('fullName')} />}
        </Field>
        <Field label="شماره موبایل (نام کاربری)" error={errors.phone?.message}>
          {(c) => (
            <Input {...c} type="tel" dir="ltr" className="text-start" {...form.register('phone')} />
          )}
        </Field>
        {!isEdit && (
          <Field label="رمز عبور" error={errors.password?.message} hint="حداقل ۸ کاراکتر">
            {(c) => (
              <Input
                {...c}
                type="password"
                dir="ltr"
                autoComplete="new-password"
                className="text-start"
                {...form.register('password')}
              />
            )}
          </Field>
        )}
        <Field label="عنوان" error={errors.title?.message} hint="مثلاً «متخصص طراحی ریش»">
          {(c) => <Input {...c} {...form.register('title')} />}
        </Field>
        <Field label="معرفی کوتاه" error={errors.bio?.message}>
          {(c) => <Textarea {...c} {...form.register('bio')} />}
        </Field>
        <Field label="آدرس عکس" error={errors.avatarUrl?.message}>
          {(c) => (
            <Input
              {...c}
              type="url"
              dir="ltr"
              className="text-start"
              placeholder="https://"
              {...form.register('avatarUrl')}
            />
          )}
        </Field>
        {isEdit && member?.role === 'STAFF' && (
          <Checkbox label="فعال (قابل رزرو و ورود به پنل)" {...form.register('isActive')} />
        )}
        <div className="mt-2 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={createStaff.isPending || updateStaff.isPending}>
            {isEdit ? 'ذخیره' : 'افزودن'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
