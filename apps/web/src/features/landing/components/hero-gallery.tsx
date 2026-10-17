'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import Image from 'next/image';
import { useEffect, useId, type ReactNode } from 'react';
import { photos } from '@/shared/config/photos';
import { cn } from '@/shared/lib/cn';

/*
 * Three photos layered like a shop window under a desert arch.
 * Entrance (once): the arch line draws itself, the main photo is wiped in from the bottom
 * while it settles from a zoom, then the two smaller frames come into focus one after another.
 * Afterwards each layer drifts by its own depth with the mouse and with scroll.
 * Reduced motion: MotionConfig (reducedMotion="user") drops the transforms and depth drift is off.
 */

const easeOutExpo = [0.16, 1, 0.3, 1] as const;
const pointerSpring = { stiffness: 60, damping: 20, mass: 0.6 };
/** Scroll distance (px) over which the layers reach their full drift. */
const SCROLL_RANGE = 800;

interface DepthInput {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollY: MotionValue<number>;
  still: boolean;
}

/** A layer that follows the pointer by `depth` px and rises by `drift` px as the page scrolls. */
function DepthLayer({
  input,
  depth,
  drift,
  className,
  children,
}: {
  input: DepthInput;
  depth: number;
  drift: number;
  className?: string;
  children: ReactNode;
}) {
  const { pointerX, pointerY, scrollY, still } = input;
  const x = useTransform(pointerX, (p) => (still ? 0 : p * depth));
  const y = useTransform([pointerY, scrollY], ([p, s]: number[]) =>
    still ? 0 : p! * depth - (Math.min(s!, SCROLL_RANGE) / SCROLL_RANGE) * drift,
  );
  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

/** A four-point star, the keystone at the top of the arch. */
function Keystone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HeroGallery({ className }: { className?: string }) {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();
  const pointerX = useSpring(0, pointerSpring);
  const pointerY = useSpring(0, pointerSpring);
  const { scrollY } = useScroll();
  const input: DepthInput = { pointerX, pointerY, scrollY, still: Boolean(reduceMotion) };

  useEffect(() => {
    if (reduceMotion) return;
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointerX.set(event.clientX / window.innerWidth - 0.5);
      pointerY.set(event.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [reduceMotion, pointerX, pointerY]);

  return (
    <div className={cn('relative mx-auto w-full max-w-sm pb-10 lg:max-w-none', className)}>
      {/* Main photo under the arch. */}
      <DepthLayer input={input} depth={10} drift={30} className="relative ml-auto w-[80%]">
        <div className="relative aspect-[3/4]">
          <div aria-hidden className="absolute -inset-4">
            <svg
              viewBox="0 0 300 400"
              preserveAspectRatio="none"
              className="size-full overflow-visible"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                d="M1 400V150A149 149 0 0 1 299 150V400"
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="1.2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.2, delay: 0.3, ease: easeOutExpo }}
              />
            </svg>
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent"
              initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 1, bounce: 0.3, delay: 1.3 }}
            >
              <Keystone className="size-5 drop-shadow-[0_0_10px_rgb(214_179_112/0.6)]" />
            </motion.div>
          </div>

          <motion.div
            className="absolute inset-0 overflow-hidden rounded-t-[50%_37.5%] rounded-b-[var(--radius-surface)] border border-line-strong"
            initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            transition={{ duration: 1.5, delay: 0.15, ease: easeOutExpo }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.35 }}
              animate={{ scale: 1.04 }}
              transition={{ duration: 2.4, delay: 0.15, ease: easeOutExpo }}
            >
              <Image
                src={photos.hero}
                alt="نیم‌رخ مردی با فید تمیز و ریش فرم‌داده‌شده"
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 34vw, 75vw"
                className="object-cover"
              />
            </motion.div>
            {/* Warm duotone so any photo sits inside the palette. */}
            <div aria-hidden className="absolute inset-0 bg-accent opacity-25 mix-blend-multiply" />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent"
            />
          </motion.div>
        </div>
      </DepthLayer>

      {/* The craft: scissors at work, tilted like a print pinned to the wall. */}
      <DepthLayer input={input} depth={24} drift={90} className="absolute bottom-0 left-0 w-[44%]">
        <motion.div
          initial={{ opacity: 0, y: 56, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', duration: 1.2, bounce: 0, delay: 0.8 }}
        >
          <div className="relative aspect-[3/4] -rotate-[5deg] overflow-hidden rounded-[var(--radius-surface)] border border-line-strong shadow-2xl shadow-black/60 transition-[rotate,scale] duration-700 ease-out-expo hover:scale-[1.03] hover:rotate-0">
            <Image
              src={photos.heroCraft}
              alt="آرایشگر در حال فرم‌دادن موی کنار ریش با قیچی"
              fill
              sizes="(min-width: 1024px) 18vw, 40vw"
              className="object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-accent opacity-20 mix-blend-multiply" />
            <span className="absolute right-3 bottom-3 rounded-full border border-line bg-bg/70 px-3 py-1 text-xs text-fg backdrop-blur-md">
              فرم‌دهی ریش
            </span>
          </div>
        </motion.div>
      </DepthLayer>

      {/* The tools: a round window on the arch's shoulder. */}
      <DepthLayer
        input={input}
        depth={-16}
        drift={140}
        className="absolute top-[12%] -right-[3%] w-[32%]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ type: 'spring', duration: 1.2, bounce: 0, delay: 1 }}
        >
          <div className="relative aspect-square overflow-hidden rounded-full border border-accent/40 shadow-2xl ring-8 shadow-black/60 ring-bg">
            <Image
              src={photos.heroTools}
              alt="ماشین اصلاح طلایی و شانه‌ها روی میز آرایشگر"
              fill
              sizes="(min-width: 1024px) 14vw, 30vw"
              className="object-cover"
            />
          </div>
        </motion.div>
      </DepthLayer>
    </div>
  );
}
