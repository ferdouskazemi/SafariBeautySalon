'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { ApiError } from '@/shared/lib/http';
import { useTheme } from '@/shared/lib/theme';

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
  const theme = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <Toaster
        dir="rtl"
        position="top-center"
        theme={theme}
        toastOptions={{
          className:
            '!bg-raised !text-fg !border-line-strong !font-sans !rounded-[var(--radius-field)]',
        }}
      />
    </QueryClientProvider>
  );
}
