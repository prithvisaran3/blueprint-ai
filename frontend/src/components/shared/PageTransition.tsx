import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { pageVariants } from '@/lib/motion'

/** Wraps a route page in a smooth enter/exit transition. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
