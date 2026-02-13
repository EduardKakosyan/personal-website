'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform } from 'motion/react'
import { HeroText } from './hero-text'

const HeroScene = dynamic(
  () => import('./hero-scene').then((mod) => ({ default: mod.HeroScene })),
  { ssr: false },
)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95])
  const y = useTransform(scrollYProgress, [0, 0.8], [0, 60])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
      data-section="hero"
    >
      {/* 3D Background */}
      <HeroScene />

      {/* Content with scroll exit animation */}
      <motion.div style={{ opacity, scale, y }} className="relative z-10 w-full py-20">
        <HeroText />
      </motion.div>
    </section>
  )
}
