'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { GradientPlaceholder } from '@/components/ui/gradient-placeholder'
import { type Project } from '@/content/projects'
import { motion } from 'motion/react'
import { Clock, Users, Calendar, CheckCircle2, Trophy, Tag } from 'lucide-react'

interface ProjectDetailHeaderProps {
  project: Project
}

export function ProjectDetailHeader({ project }: ProjectDetailHeaderProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <header className="mb-8 md:mb-12">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className="mb-3 text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl"
      >
        {project.title}
      </motion.h1>

      {/* Placement badge */}
      {project.placement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4"
        >
          <Badge className="bg-amber-500/90 text-white border-0 text-lg px-3 py-1 gap-1.5">
            <Trophy className="h-4 w-4" />
            {project.placement}
          </Badge>
        </motion.div>
      )}

      {/* Metadata bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-wrap items-center gap-4 mb-4 px-4 py-3 rounded-lg glass-card"
      >
        {project.category && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Tag className="h-3.5 w-3.5 text-[var(--accent-neon)]" />
            {project.category}
          </span>
        )}
        {project.duration && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-[var(--accent-neon)]" />
            {project.duration}
          </span>
        )}
        {project.teamSize && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-[var(--accent-neon)]" />
            {project.teamSize === 1 ? 'Solo project' : `${project.teamSize} people`}
          </span>
        )}
        {project.completionDate && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-[var(--accent-neon)]" />
            {project.completionDate}
          </span>
        )}
      </motion.div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap gap-2 mb-6"
        role="list"
      >
        {project.tags.map((tag) => (
          <Badge key={tag} variant="outline" role="listitem">
            {tag}
          </Badge>
        ))}
      </motion.div>

      {/* Preview image */}
      {(project.previewImageUrl || project.imageUrl) && !imageError ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-8 aspect-video w-full overflow-hidden rounded-lg"
        >
          <Image
            src={(project.previewImageUrl || project.imageUrl)!}
            alt={project.title}
            width={1200}
            height={675}
            className="object-cover w-full h-full"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            onError={() => setImageError(true)}
          />
        </motion.div>
      ) : !project.previewImageUrl && !project.imageUrl ? null : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-8 aspect-video w-full overflow-hidden rounded-lg"
        >
          <GradientPlaceholder category={project.category} className="w-full h-full" />
        </motion.div>
      )}

      {/* Highlights */}
      {project.highlights && project.highlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid gap-3 sm:grid-cols-2 mb-8"
        >
          {project.highlights.map((highlight) => (
            <div key={highlight} className="flex items-start gap-3 px-4 py-3 rounded-lg glass-card">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-[var(--accent-neon)]" />
              <span className="text-sm">{highlight}</span>
            </div>
          ))}
        </motion.div>
      )}
    </header>
  )
}
