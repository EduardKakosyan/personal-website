'use client'

import Link from 'next/link'
import { type Project } from '@/content/projects'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface ProjectNavigationProps {
  prev: Project | null
  next: Project | null
}

export function ProjectNavigation({ prev, next }: ProjectNavigationProps) {
  if (!prev && !next) return null

  return (
    <motion.nav
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      aria-label="Project navigation"
      className="grid gap-4 sm:grid-cols-2 mt-12"
    >
      {prev ? (
        <Link
          href={`/projects/${prev.slug}`}
          className="group flex items-center gap-3 px-5 py-4 rounded-lg glass-card border border-transparent transition-colors hover:border-[var(--accent-neon)]/40"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground">Previous</span>
            <p className="text-sm font-medium truncate">{prev.title}</p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/projects/${next.slug}`}
          className="group flex items-center justify-end gap-3 px-5 py-4 rounded-lg glass-card border border-transparent transition-colors hover:border-[var(--accent-neon)]/40 text-right"
        >
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground">Next</span>
            <p className="text-sm font-medium truncate">{next.title}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      ) : (
        <div />
      )}
    </motion.nav>
  )
}
