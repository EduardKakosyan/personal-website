'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GradientPlaceholder } from '@/components/ui/gradient-placeholder'
import { type Project } from '@/content/projects'
import { motion } from 'motion/react'
import { Clock, Users, Calendar, CheckCircle2, Trophy } from 'lucide-react'

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

type ProjectCardProps = {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [imageError, setImageError] = useState(false)
  const maxTags = 4
  const overflowCount = project.tags.length - maxTags

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -8, transition: { duration: 0.3 } }}>
      <Link href={`/projects/${project.slug}`} className="block h-full">
        <Card className="flex h-full flex-col overflow-hidden border-0 shadow-lg glass-card group">
          {/* Image area */}
          <div className="relative aspect-video overflow-hidden">
            {project.previewImageUrl && !imageError ? (
              <Image
                src={project.previewImageUrl}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <GradientPlaceholder category={project.category} className="absolute inset-0" />
            )}

            {/* Placement badge */}
            {project.placement && (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-amber-500/90 text-white border-0 backdrop-blur-sm gap-1">
                  <Trophy className="h-3 w-3" />
                  {project.placement}
                </Badge>
              </div>
            )}

            {/* Category pill */}
            {project.category && (
              <div className="absolute top-3 left-3 z-10">
                <Badge
                  variant="secondary"
                  className="backdrop-blur-sm bg-background/70 border-0 text-xs"
                >
                  {project.category}
                </Badge>
              </div>
            )}
          </div>

          {/* Header */}
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{project.title}</CardTitle>

            {/* Metadata row */}
            {(project.duration || project.teamSize || project.completionDate) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {project.duration && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {project.duration}
                  </span>
                )}
                {project.teamSize && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {project.teamSize === 1 ? 'Solo' : `${project.teamSize} people`}
                  </span>
                )}
                {project.completionDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {project.completionDate}
                  </span>
                )}
              </div>
            )}

            <CardDescription className="line-clamp-2">{project.description}</CardDescription>
          </CardHeader>

          {/* Highlights */}
          {project.highlights && project.highlights.length > 0 && (
            <CardContent className="pt-0 pb-3 flex-1">
              <ul className="space-y-1.5">
                {project.highlights.slice(0, 3).map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--accent-neon)]" />
                    <span className="line-clamp-1">{highlight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}

          {/* Tags */}
          <CardFooter className="pt-0">
            <div className="flex flex-wrap gap-1.5">
              {project.tags.slice(0, maxTags).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {overflowCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{overflowCount}
                </Badge>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
