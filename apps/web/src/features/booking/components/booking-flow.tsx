'use client';

import { ArrowRight } from '@phosphor-icons/react';
import type { CatalogDto, PublicStaffDto } from '@safari/shared';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useReducer, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';
import {
  formatDuration,
  formatLongDate,
  formatNumber,
  formatPrice,
  formatTime,
} from '@/shared/lib/format';
import { ApiError, errorMessage } from '@/shared/lib/http';
import { Button } from '@/shared/ui/button';
import { offeringFields, useCreateAppointment } from '../api';
import {
  BOOKING_STEPS,
  STEP_LABELS,
  bookingReducer,
  clampStep,
  initialBookingState,
  isBookingStep,
  nextStep,
  type BookingState,
  type BookingStep,
} from '../booking-state';
import { BookingSuccess } from './booking-success';
import { BookingSummary, type CartItem } from './booking-summary';
import { ConfirmSheet, type BookingDetails } from './confirm-sheet';
import { ServicesStep } from './services-step';
import { TimeStep } from './time-step';

/** The confirm step is a sheet over the time screen, so only two screens have their own title. */
type Screen = Exclude<BookingStep, 'confirm'>;

const SCREEN_TITLES: Record<Screen, string> = {
  services: 'چه خدمتی می‌خواهید؟',
  time: 'چه روز و ساعتی؟',
};

interface BookingFlowProps {
  catalog: CatalogDto;
  team: PublicStaffDto[];
}

/**
 * Pick services, then tap a time: a sheet opens right there to confirm and book.
 * A running total and the main button stay in thumb reach throughout.
 */
export function BookingFlow({ catalog, team }: BookingFlowProps) {
  const params = useSearchParams();
  const [state, dispatch] = useReducer(bookingReducer, undefined, () => {
    // Links from the home page may preselect a package, service, barber or day; ignore stale ids.
    const known = (id: string | null, list: { id: string }[]) =>
      id && list.some((item) => item.id === id) ? id : null;
    return initialBookingState({
      packageId: known(params.get('package'), catalog.packages),
      serviceId: known(params.get('service'), catalog.services),
      staffId: known(
        params.get('staff'),
        team.filter((member) => member.isActive),
      ),
      date: params.get('date'),
    });
  });
  const queryClient = useQueryClient();
  const createAppointment = useCreateAppointment();

  // The step lives in the URL (?step=) through the native History API, which Next.js keeps in
  // sync with useSearchParams. The phone's back button then goes back one step, with no reload.
  const requested = params.get('step');
  const step = clampStep(state, isBookingStep(requested) ? requested : state.entryStep);
  const stepIndex = BOOKING_STEPS.indexOf(step);
  // The step the first history entry of this page shows; earlier steps have no entry to go back to.
  const entryRef = useRef(state.entryStep);

  const goTo = useCallback(
    (target: BookingStep, { replace = false, scroll = true } = {}) => {
      const next = new URLSearchParams(params);
      next.set('step', target);
      window.history[replace ? 'replaceState' : 'pushState'](null, '', `?${next}`);
      // Instant: the global smooth scroll would otherwise leave the new step half scrolled.
      if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
    },
    [params],
  );
  // The sheet is a history entry too, so the phone's back button closes it.
  const openConfirm = () => goTo('confirm', { scroll: false });

  const goBack = () => {
    if (stepIndex > BOOKING_STEPS.indexOf(entryRef.current)) {
      window.history.back();
      return;
    }
    const previous = BOOKING_STEPS[stepIndex - 1]!;
    entryRef.current = previous;
    goTo(previous, { replace: true });
  };

  const items = cartItems(catalog, state);
  const staffName = (id: string | null | undefined) => team.find((m) => m.id === id)?.fullName;

  const submit = (details: BookingDetails, turnstileToken?: string) => {
    const { offering, slot, staffId } = state;
    if (!offering || !slot) return;
    createAppointment.mutate(
      {
        ...details,
        turnstileToken,
        ...offeringFields(offering),
        // "Any barber" lets the server pick whoever is still free at that time.
        staffId: staffId ?? undefined,
        startsAt: slot.startsAt,
      },
      {
        onSuccess: (confirmation) => {
          dispatch({ type: 'confirmed', confirmation });
          window.scrollTo({ top: 0 });
        },
        onError: (error) => {
          // Someone else just took this time: back to the (refreshed) times with a clear message.
          // Other errors stay inside the sheet, next to the button.
          if (error instanceof ApiError && error.status === 409) {
            toast.error('این ساعت همین حالا رزرو شد. لطفاً ساعت دیگری انتخاب کنید.');
            dispatch({ type: 'slotLost' });
            void queryClient.invalidateQueries({ queryKey: ['availability'] });
            goBack();
          }
        },
      },
    );
  };

  if (state.confirmation) return <BookingSuccess confirmation={state.confirmation} />;

  const screen: Screen = step === 'confirm' ? 'time' : step;
  const canContinue = screen === 'services' ? items.length > 0 : !!state.slot;
  // After the sheet is closed, the same button reopens it for the chosen time.
  const action = (
    <Button
      size="lg"
      disabled={!canContinue}
      onClick={() => (screen === 'services' ? goTo(nextStep(step)!) : openConfirm())}
      className="w-full"
    >
      {screen === 'services' ? 'انتخاب زمان' : 'ادامه'}
    </Button>
  );
  const submitError =
    createAppointment.error &&
    !(createAppointment.error instanceof ApiError && createAppointment.error.status === 409)
      ? errorMessage(createAppointment.error)
      : null;
  const closeConfirm = () => {
    createAppointment.reset();
    if (step === 'confirm') goBack();
  };

  const summary = {
    items,
    // The barber is chosen on the time step; until then the summary leaves it out.
    staffName:
      step === 'services' && !state.staffId ? undefined : (staffName(state.staffId) ?? null),
    assignedStaffName: staffName(state.slot?.staffId),
    slot: state.slot,
  };

  return (
    <div className="pb-32 lg:pb-0">
      <StepProgress step={step} />

      <div className="mt-6 grid gap-10 md:mt-8 lg:grid-cols-12">
        {/* min-w-0: the swipeable day row must scroll inside the column, not widen the page. */}
        <div key={screen} className="min-w-0 animate-step-in lg:col-span-8">
          <div className="mb-5 flex items-center gap-3 md:mb-6">
            {stepIndex > 0 && <BackButton onClick={goBack} />}
            <h2 className="text-2xl font-black md:text-3xl">{SCREEN_TITLES[screen]}</h2>
          </div>

          {screen === 'services' && (
            <ServicesStep
              catalog={catalog}
              value={state.offering}
              onToggleService={(id) => dispatch({ type: 'toggleService', id })}
              onTogglePackage={(id) => dispatch({ type: 'togglePackage', id })}
            />
          )}
          {screen === 'time' && state.offering && (
            <TimeStep
              offering={state.offering}
              team={team}
              staffId={state.staffId}
              date={state.date}
              slot={state.slot}
              onStaffChange={(staffId) => dispatch({ type: 'selectStaff', staffId })}
              onDateChange={(date) => dispatch({ type: 'selectDate', date })}
              onSlotChange={(slot) => {
                dispatch({ type: 'selectSlot', slot });
                openConfirm();
              }}
            />
          )}
        </div>

        <aside className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-24">
            <BookingSummary {...summary} action={action} />
          </div>
        </aside>
      </div>

      <ConfirmSheet
        open={step === 'confirm'}
        onClose={closeConfirm}
        items={items}
        slot={state.slot}
        barberLabel={
          staffName(state.staffId) ?? staffName(state.slot?.staffId) ?? 'هر آرایشگر آزاد'
        }
        submitting={createAppointment.isPending}
        error={submitError}
        onSubmit={submit}
      />

      {items.length > 0 && (
        <MobileBar
          items={items}
          label={state.offering?.kind === 'package' ? 'پکیج' : `${formatNumber(items.length)} خدمت`}
          slot={state.slot}
          waitingForTime={screen === 'time' && !state.slot}
          action={action}
        />
      )}
    </div>
  );
}

function cartItems(catalog: CatalogDto, { offering }: BookingState): CartItem[] {
  if (!offering) return [];
  if (offering.kind === 'package') {
    const pkg = catalog.packages.find((p) => p.id === offering.id);
    return pkg ? [pkg] : [];
  }
  return offering.ids.flatMap((id) => catalog.services.filter((s) => s.id === id));
}

/** Full width and centred: three equal bars, each with its label centred beneath it. */
function StepProgress({ step }: { step: BookingStep }) {
  const index = BOOKING_STEPS.indexOf(step);
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="مراحل رزرو">
      {BOOKING_STEPS.map((s, i) => (
        <li
          key={s}
          aria-current={s === step ? 'step' : undefined}
          className="flex flex-col items-center gap-2"
        >
          <span
            className={cn(
              'h-1 w-full rounded-full transition-colors',
              i <= index ? 'bg-accent' : 'bg-line-strong',
            )}
          />
          <span
            className={cn(
              'text-xs',
              s === step ? 'font-bold text-fg' : i < index ? 'text-muted' : 'text-muted/60',
            )}
          >
            {STEP_LABELS[s]}
          </span>
        </li>
      ))}
    </ol>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="مرحله قبل"
      className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong transition hover:border-accent/60"
    >
      <ArrowRight size={18} />
    </button>
  );
}

function MobileBar({
  items,
  label,
  slot,
  waitingForTime,
  action,
}: {
  items: CartItem[];
  label: string;
  slot: BookingState['slot'];
  waitingForTime: boolean;
  action: ReactNode;
}) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const duration = items.reduce((sum, item) => sum + item.durationMinutes, 0);
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
      className="fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-line bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-black text-accent">{formatPrice(total)}</p>
          <p className="truncate text-xs text-muted">
            {slot
              ? `${formatLongDate(slot.startsAt)}، ساعت ${formatTime(slot.startsAt)}`
              : waitingForTime
                ? 'یک ساعت را انتخاب کنید'
                : `${label} · ${formatDuration(duration)}`}
          </p>
        </div>
        <div className="w-40 shrink-0">{action}</div>
      </div>
    </motion.div>
  );
}
