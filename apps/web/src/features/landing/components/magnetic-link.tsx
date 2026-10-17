'use client';

import { motion, useReducedMotion, useSpring } from 'motion/react';
import Link from 'next/link';
import type { PointerEvent, ReactNode } from 'react';

const MotionLink = motion.create(Link);
const PULL = 0.3;
const spring = { stiffness: 220, damping: 18, mass: 0.4 };

interface MagneticLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

/** A link that leans toward the pointer. Motion values only, so no React re-renders. */
export function MagneticLink({ href, className, children }: MagneticLinkProps) {
  const reduceMotion = useReducedMotion();
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  const onPointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * PULL);
    y.set((event.clientY - rect.top - rect.height / 2) * PULL);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <MotionLink
      href={href}
      className={className}
      style={{ x, y }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      {children}
    </MotionLink>
  );
}
