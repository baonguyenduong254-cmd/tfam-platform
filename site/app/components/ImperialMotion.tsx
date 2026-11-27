'use client';

import {
  MotionConfig,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {useRef, type ReactNode} from 'react';

export const IMPERIAL_EASE = [0.22, 1, 0.36, 1] as const;

export function ImperialMotionProvider({children}: {children: ReactNode}) {
  return (
    <MotionConfig
      reducedMotion="never"
      transition={{duration: 0.55, ease: IMPERIAL_EASE}}
    >
      {children}
    </MotionConfig>
  );
}

/**
 * Global gilded scroll progress hairline pinned to the top edge of the viewport.
 */
export function ImperialScrollProgress() {
  const {scrollYProgress} = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 170,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <div className="tfam-scroll-rail" aria-hidden="true">
      <motion.div className="tfam-scroll-rail-fill" style={{scaleX}} />
    </div>
  );
}

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale';

export function ImperialReveal({
  children,
  className,
  delay = 0,
  duration = 0.68,
  direction = 'up',
  distance = 34,
  amount = 0.1,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: RevealDirection;
  distance?: number;
  amount?: number | 'some' | 'all';
}) {
  const initial =
    direction === 'up'
      ? {opacity: 0, y: distance, scale: 0.988}
      : direction === 'down'
        ? {opacity: 0, y: -distance, scale: 0.988}
        : direction === 'left'
          ? {opacity: 0, x: distance}
          : direction === 'right'
            ? {opacity: 0, x: -distance}
            : {opacity: 0, scale: 0.94};

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{opacity: 1, x: 0, y: 0, scale: 1}}
      viewport={{once: true, amount}}
      transition={{duration, delay, ease: IMPERIAL_EASE}}
    >
      {children}
    </motion.div>
  );
}

export function ImperialStagger({
  children,
  className,
  stagger = 0.075,
  delayChildren = 0.05,
  amount = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  amount?: number | 'some' | 'all';
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{once: true, amount}}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function ImperialStaggerItem({
  children,
  className,
  distance = 26,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {opacity: 0, y: distance, scale: 0.975},
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {duration: 0.58, ease: IMPERIAL_EASE},
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * GPU-accelerated vertical parallax layer for full-bleed backdrops.
 */
export function ImperialParallax({
  children,
  className,
  range = 38,
}: {
  children: ReactNode;
  className?: string;
  range?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const {scrollYProgress} = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <div ref={ref} className={className} style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <motion.div
        style={{
          y,
          position: 'absolute',
          inset: `-${range + 8}px 0`,
          willChange: 'transform',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Route entrance transition with a subtle gilded light sweep across the top edge.
 */
export function ImperialPageVeil({children}: {children: ReactNode}) {
  return (
    <motion.div
      className="tfam-route-stage"
      initial={{opacity: 0, y: 18, scale: 0.994}}
      animate={{opacity: 1, y: 0, scale: 1}}
      transition={{duration: 0.46, ease: IMPERIAL_EASE}}
    >
      <motion.div
        className="tfam-route-sheen"
        aria-hidden="true"
        initial={{scaleX: 0, opacity: 0.95}}
        animate={{scaleX: 1, opacity: 0}}
        transition={{duration: 0.65, ease: IMPERIAL_EASE}}
      />
      {children}
    </motion.div>
  );
}
