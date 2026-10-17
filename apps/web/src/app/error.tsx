'use client';

import { Button } from '@/shared/ui/button';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-black">مشکلی پیش آمد</h1>
        <p className="mt-2 text-muted">
          لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت با سالون تماس بگیرید.
        </p>
        <Button onClick={reset} className="mt-8">
          تلاش دوباره
        </Button>
      </div>
    </main>
  );
}
