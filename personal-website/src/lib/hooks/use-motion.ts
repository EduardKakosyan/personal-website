'use client'

import { useReducedMotion } from 'motion/react'
import type { Variants, Transition } from 'motion/react'

const defaultTransition: Transition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1],
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
}

export const blurIn: Variants = {
  hidden: { opacity: 0, filter: 'blur(10px)', y: 20 },
  visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export function useMotionConfig() {
  const prefersReducedMotion = useReducedMotion()

  const getTransition = (custom?: Partial<Transition>): Transition => {
    if (prefersReducedMotion) {
      return { duration: 0 }
    }
    return { ...defaultTransition, ...custom }
  }

  const getVariants = (variants: Variants): Variants => {
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    }
    return variants
  }

  return {
    prefersReducedMotion,
    getTransition,
    getVariants,
    transition: getTransition(),
  }
}
