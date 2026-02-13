'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion, useInView } from 'motion/react'

export function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section
      className="py-24 md:py-40 w-full relative overflow-hidden"
      data-section="cta"
      ref={ref}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="relative container mx-auto px-4 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
            Let&apos;s Build
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, var(--accent-neon), oklch(0.70 0.15 260))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Something Together
            </span>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Whether you need AI integration for your business, consultation on AI projects, or want
            to collaborate and build something cool — I&apos;m available to chat.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button asChild size="lg" className="text-base px-8 py-6 group">
              <Link href="/contact" className="flex items-center gap-2">
                Get in Touch
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 py-6">
              <Link href="/projects">View My Work</Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-sm text-muted-foreground pt-8"
          >
            Based in Halifax, Nova Scotia | Available for remote collaboration
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
