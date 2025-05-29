'use client'

import { useEffect } from 'react'
import { analyticsEvents } from '@/lib/analytics'

interface ProjectAnalyticsProps {
  projectSlug: string
}

export function ProjectAnalytics({ projectSlug }: ProjectAnalyticsProps) {
  useEffect(() => {
    // Track that this project was viewed
    analyticsEvents.projectViewed(projectSlug)
  }, [projectSlug])

  return null
} 