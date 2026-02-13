'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { fadeUp, staggerContainer } from '@/lib/hooks/use-motion'
import type { Variants } from 'motion/react'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  variants?: Variants
  stagger?: boolean
  delay?: number
  once?: boolean
  amount?: number
}

export function AnimatedSection({
  children,
  className,
  variants = fadeUp,
  stagger = false,
  delay = 0,
  once = true,
  amount = 0.2,
}: AnimatedSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={stagger ? staggerContainer : variants}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedItem({
  children,
  className,
  variants = fadeUp,
}: {
  children: React.ReactNode
  className?: string
  variants?: Variants
}) {
  return (
    <motion.div
      variants={variants}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
