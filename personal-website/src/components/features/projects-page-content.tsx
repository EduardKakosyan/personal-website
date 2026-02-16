'use client'

import { useRef, useState, useMemo } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { ProjectCard } from '@/components/features/project-card'
import { TextReveal } from '@/components/ui/text-reveal'
import { type Project } from '@/content/projects'
import { analyticsEvents } from '@/lib/analytics'

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

interface ProjectsPageContentProps {
  projects: Project[]
  categories: string[]
}

export function ProjectsPageContent({ projects, categories }: ProjectsPageContentProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'All') return projects
    return projects.filter((p) => p.category === activeCategory)
  }, [projects, activeCategory])

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    analyticsEvents.projectCategoryFiltered(category)
  }

  return (
    <section className="py-16 md:py-28 w-full relative overflow-hidden">
      {/* Decorative radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[var(--accent-neon)]/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl" ref={ref}>
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <span className="text-sm font-mono text-[var(--accent-neon)] tracking-widest uppercase">
              Portfolio
            </span>
          </motion.div>

          <TextReveal
            text="Featured Projects"
            as="h1"
            className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl justify-center"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-muted-foreground md:text-lg max-w-3xl mx-auto mt-4"
          >
            A collection of AI, full-stack, and research projects showcasing my work in software
            development.
          </motion.p>
        </div>

        {/* Category filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          role="tablist"
          aria-label="Filter projects by category"
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-[var(--accent-neon)] text-background shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Project grid */}
        <div aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              exit="hidden"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredProjects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {filteredProjects.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No projects in this category yet.
          </p>
        )}
      </div>
    </section>
  )
}
