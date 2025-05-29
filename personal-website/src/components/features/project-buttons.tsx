'use client'

import { Button } from '@/components/ui/button'
import { analyticsEvents } from '@/lib/analytics'

interface ProjectButtonsProps {
  projectSlug: string
  projectTitle: string
  liveUrl?: string
  repoUrl?: string
}

export function ProjectButtons({ projectSlug, projectTitle, liveUrl, repoUrl }: ProjectButtonsProps) {
  if (!liveUrl && !repoUrl) {
    return null
  }

  return (
    <div className='mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center'>
      {liveUrl && (
        <Button asChild size='lg'>
          <a 
            href={liveUrl} 
            target='_blank' 
            rel='noopener noreferrer'
            aria-label={`View live demo of ${projectTitle}`}
            onClick={() => analyticsEvents.projectLinkClicked(projectSlug, 'live')}
          >
            View Live Demo
          </a>
        </Button>
      )}
      {repoUrl && (
        <Button asChild variant='outline' size='lg'>
          <a 
            href={repoUrl} 
            target='_blank' 
            rel='noopener noreferrer'
            aria-label={`View source code for ${projectTitle}`}
            onClick={() => analyticsEvents.projectLinkClicked(projectSlug, 'repo')}
          >
            View Code Repository
          </a>
        </Button>
      )}
    </div>
  )
} 