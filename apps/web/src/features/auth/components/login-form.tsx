'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginData, type LoginInput } from '@safari/shared';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { errorMessage } from '@/shared/lib/http';
import { Button } from '@/shared/ui/button';
import { Field, Input } from '@/shared/ui/field';
import { postLoginPath, useLogin } from '../api';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useLogin();
  const form = useForm<LoginInput, unknown, LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((data) =>
    login.mutate(data, {
      onSuccess: (user) => router.replace(postLoginPath(user, params.get('next'))),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field label="شماره موبایل" error={errors.phone?.message}>
        {(control) => (
          <Input
            {...control}
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="username"
            className="text-start"
            {...form.register('phone')}
          />
        )}
      </Field>
      <Field label="رمز عبور" error={errors.password?.message}>
        {(control) => (
          <Input
            {...control}
            type="password"
            dir="ltr"
            autoComplete="current-password"
            className="text-start"
            {...form.register('password')}
          />
        )}
      </Field>
      {login.isError && (
        <p
          role="alert"
          className="rounded-[var(--radius-field)] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {errorMessage(login.error)}
        </p>
      )}
      <Button type="submit" size="lg" loading={login.isPending}>
        ورود
      </Button>
    </form>
  );
}
