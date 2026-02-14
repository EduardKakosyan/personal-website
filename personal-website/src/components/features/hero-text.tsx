'use client'

import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { analyticsEvents } from '@/lib/analytics'
import { blurIn } from '@/lib/hooks/use-motion'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, filter: 'blur(10px)', y: 30 },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function HeroText() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10 max-w-5xl mx-auto text-center space-y-8 px-4"
    >
      {/* Name */}
      <motion.h1
        variants={itemVariants}
        className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9]"
      >
        <span
          style={{
            background: 'linear-gradient(135deg, var(--accent-neon), oklch(0.70 0.15 260))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Eduard
        </span>
        <br />
        <span className="text-foreground">Kakosyan</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        variants={itemVariants}
        className="text-xl md:text-2xl lg:text-3xl font-medium text-muted-foreground tracking-tight"
      >
        Lead AI Developer
      </motion.p>

      {/* Description */}
      <motion.p
        variants={itemVariants}
        className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground/80 leading-relaxed"
      >
        I work as an AI Developer at{' '}
        <Link
          href="https://www.ai-first.ca/"
          className="text-[var(--accent-neon)] font-semibold hover:underline transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          AI-First Consulting
        </Link>
        , focusing on practical AI implementations. 2+ years of experience in automation and AI.
      </motion.p>

      {/* CTAs */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
      >
        <Button asChild size="lg" className="w-full sm:w-auto group text-base px-8 py-6">
          <Link
            href="/projects"
            className="flex items-center gap-2"
            onClick={() => analyticsEvents.heroCtaClicked('View My Work')}
          >
            View My Work
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full sm:w-auto text-base px-8 py-6"
        >
          <Link href="/contact" onClick={() => analyticsEvents.heroCtaClicked('Get in Touch')}>
            Get in Touch
          </Link>
        </Button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div variants={itemVariants} className="pt-12">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-muted-foreground/50"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-muted-foreground/50 to-transparent" />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
