'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput, type StaffDto } from '@safari/shared';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, Input } from '@/shared/ui/field';
import { useResetPassword } from '../api';

export function PasswordDialog({ member, onClose }: { member: StaffDto; onClose: () => void }) {
  const resetPassword = useResetPassword();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = form.handleSubmit(({ password }) =>
    resetPassword.mutate({ id: member.id, password }, { onSuccess: onClose }),
  );

  return (
    <Dialog open onClose={onClose} title={`تغییر رمز عبور ${member.fullName}`}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <Field
          label="رمز عبور جدید"
          error={form.formState.errors.password?.message}
          hint="پس از تغییر، این کاربر از همه دستگاه‌ها خارج می‌شود."
        >
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
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={resetPassword.isPending}>
            ذخیره
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
