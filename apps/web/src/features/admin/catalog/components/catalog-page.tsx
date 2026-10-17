'use client';

import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { SERVICE_CATEGORY_LABELS, type PackageDto, type ServiceDto } from '@safari/shared';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatDuration, formatNumber, formatPrice } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/http';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Badge, EmptyState, Skeleton } from '@/shared/ui/feedback';
import { Switch } from '@/shared/ui/switch';
import { PageHeader } from '../../shell/admin-shell';
import {
  adminCatalogQuery,
  useDeletePackage,
  useDeleteService,
  useSetCatalogItemActive,
  type CatalogKind,
} from '../api';
import { PackageFormDialog } from './package-form-dialog';
import { ServiceFormDialog } from './service-form-dialog';

type EditorState =
  { kind: 'service'; service?: ServiceDto } | { kind: 'package'; pkg?: PackageDto } | null;

type DeleteTarget = { kind: CatalogKind; id: string; name: string } | null;

export function CatalogPage() {
  const { data, isPending, isError, error } = useQuery(adminCatalogQuery);
  const [editor, setEditor] = useState<EditorState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const deleteService = useDeleteService();
  const deletePackage = useDeletePackage();
  const setActive = useSetCatalogItemActive();

  if (isPending) return <Skeleton className="h-96" />;
  if (isError)
    return <EmptyState title="فهرست خدمات بارگذاری نشد" description={errorMessage(error)} />;

  const onConfirmDelete = () => {
    if (!deleteTarget) return;
    const mutation = deleteTarget.kind === 'service' ? deleteService : deletePackage;
    mutation.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
  };

  return (
    <>
      <PageHeader
        title="خدمات و پکیج‌ها"
        description="با کلید کنار هر مورد، آن را در سایت نمایش دهید یا پنهان کنید؛ مورد پنهان پاک نمی‌شود و نوبت‌های قبلی‌اش سر جایش می‌ماند."
      />

      <CatalogSection
        title="پکیج‌ها"
        onAdd={() => setEditor({ kind: 'package' })}
        addLabel="پکیج جدید"
      >
        {data.packages.map((pkg) => (
          <CatalogRow
            key={pkg.id}
            title={pkg.name}
            meta={[
              formatPrice(pkg.price),
              formatDuration(pkg.durationMinutes),
              `${formatNumber(pkg.services.length)} خدمت`,
            ]}
            badges={
              <>
                {pkg.isFeatured && <Badge tone="accent">ویژه</Badge>}
                {!pkg.isActive && <Badge tone="danger">پنهان</Badge>}
              </>
            }
            active={pkg.isActive}
            toggling={setActive.isPending && setActive.variables?.id === pkg.id}
            onToggle={(isActive) => setActive.mutate({ kind: 'package', id: pkg.id, isActive })}
            onEdit={() => setEditor({ kind: 'package', pkg })}
            onDelete={() => setDeleteTarget({ kind: 'package', id: pkg.id, name: pkg.name })}
          />
        ))}
      </CatalogSection>

      <CatalogSection
        title="خدمات"
        onAdd={() => setEditor({ kind: 'service' })}
        addLabel="خدمت جدید"
      >
        {data.services.map((service) => (
          <CatalogRow
            key={service.id}
            title={service.name}
            meta={[
              SERVICE_CATEGORY_LABELS[service.category],
              formatPrice(service.price),
              formatDuration(service.durationMinutes),
            ]}
            badges={!service.isActive && <Badge tone="danger">پنهان</Badge>}
            active={service.isActive}
            toggling={setActive.isPending && setActive.variables?.id === service.id}
            onToggle={(isActive) => setActive.mutate({ kind: 'service', id: service.id, isActive })}
            onEdit={() => setEditor({ kind: 'service', service })}
            onDelete={() =>
              setDeleteTarget({ kind: 'service', id: service.id, name: service.name })
            }
          />
        ))}
      </CatalogSection>

      <ServiceFormDialog
        open={editor?.kind === 'service'}
        service={editor?.kind === 'service' ? editor.service : undefined}
        onClose={() => setEditor(null)}
      />
      <PackageFormDialog
        open={editor?.kind === 'package'}
        pkg={editor?.kind === 'package' ? editor.pkg : undefined}
        services={data.services}
        onClose={() => setEditor(null)}
      />

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="حذف">
        <p className="leading-relaxed text-muted">
          «{deleteTarget?.name}» برای همیشه حذف شود؟ اگر در نوبت‌های قبلی استفاده شده باشد، حذف ممکن
          نیست؛ به جایش با کلید کنارش آن را پنهان کنید.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            انصراف
          </Button>
          <Button
            variant="danger"
            loading={deleteService.isPending || deletePackage.isPending}
            onClick={onConfirmDelete}
          >
            حذف
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function CatalogSection({
  title,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black">{title}</h2>
        <Button size="sm" variant="secondary" onClick={onAdd}>
          <Plus size={16} />
          {addLabel}
        </Button>
      </div>
      <ul className="grid gap-2">{children}</ul>
    </section>
  );
}

interface CatalogRowProps {
  title: string;
  meta: string[];
  badges?: ReactNode;
  active: boolean;
  toggling: boolean;
  onToggle: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CatalogRow({
  title,
  meta,
  badges,
  active,
  toggling,
  onToggle,
  onEdit,
  onDelete,
}: CatalogRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-[var(--radius-field)] border border-line bg-surface py-3 ps-4 pe-2">
      <div className={cn('min-w-0 flex-1', !active && 'opacity-70')}>
        <p className="flex flex-wrap items-center gap-2 font-bold">
          {title}
          {badges}
        </p>
        <p className="mt-1 text-sm text-muted">{meta.join('  ·  ')}</p>
      </div>
      <Switch
        checked={active}
        disabled={toggling}
        onChange={onToggle}
        label={`نمایش «${title}» در سایت`}
      />
      <div className="flex">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`ویرایش ${title}`}
          title="ویرایش"
          className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-fg/5 hover:text-fg"
        >
          <PencilSimple size={18} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`حذف ${title}`}
          title="حذف"
          className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash size={18} />
        </button>
      </div>
    </li>
  );
}
