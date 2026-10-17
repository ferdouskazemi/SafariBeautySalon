'use client';

import { motion } from 'motion/react';

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

/** Each word rises out of a mask, one after another. */
export function HeroHeadline({ lines }: { lines: string[] }) {
  let wordIndex = 0;
  return (
    <h1 className="text-[2.75rem] leading-[1.15] font-black tracking-tight text-balance sm:text-6xl lg:text-7xl">
      {lines.map((line) => (
        <span key={line} className="block">
          {line.split(' ').map((word) => {
            const delay = 0.15 + wordIndex++ * 0.08;
            return (
              <span key={word} className="inline-block overflow-hidden pb-2 align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay, ease: easeOutExpo }}
                >
                  {word}
                </motion.span>
                {' '}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
