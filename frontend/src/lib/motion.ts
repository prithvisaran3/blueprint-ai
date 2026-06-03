import type { Variants, Transition } from 'framer-motion'

/** Shared spring tuned for smooth, premium UI motion. */
export const spring: Transition = { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 }

export const easeOut: Transition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] }

/** Fade + rise — the default entrance for most blocks. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: easeOut },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeOut },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: spring },
}

/** Stagger container — children should use `fadeInUp` or `scaleIn`. */
export const staggerContainer = (stagger = 0.08, delayChildren = 0.05): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
})

/** Page-level transition used by PageTransition wrapper. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: 'easeIn' } },
}

/** Subtle hover lift for cards. */
export const hoverLift = {
  whileHover: { y: -4, transition: spring },
  whileTap: { scale: 0.99 },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: easeOut },
  exit: { opacity: 0, x: 40, transition: { duration: 0.2 } },
}
