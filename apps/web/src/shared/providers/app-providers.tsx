'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { ApiError } from '@/shared/lib/http';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Client errors (bad input, not found, forbidden) will not succeed on retry.
        retry: (count, error) =>
          count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
    },
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <Toaster
        dir="rtl"
        position="top-center"
        theme="dark"
        toastOptions={{
          className:
            '!bg-raised !text-fg !border-line-strong !font-sans !rounded-[var(--radius-field)]',
        }}
      />
    </QueryClientProvider>
  );
}
