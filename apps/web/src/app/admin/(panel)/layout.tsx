import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminShell } from '@/features/admin/shell/admin-shell';
import { Skeleton } from '@/shared/ui/feedback';

export const metadata: Metadata = {
  title: 'پنل مدیریت',
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      {/* Pages depend on "today", so they render per request rather than at build time. */}
      <Suspense fallback={<Skeleton className="h-64" />}>{children}</Suspense>
    </AdminShell>
  );
}
