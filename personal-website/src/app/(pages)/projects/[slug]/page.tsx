import { getProjectBySlug, getAllProjects, type Project } from '@/content/projects'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import type { Metadata, ResolvingMetadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const allProjects = getAllProjects()
  
  return allProjects.map((project) => ({
    slug: project.slug,
  }))
}

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const project = getProjectBySlug(params.slug)

  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: `${project.title} | Project Details`,
    description: project.description,
  }
}

export default function ProjectDetailPage({ params }: Props) {
  const project = getProjectBySlug(params.slug)

  if (!project) {
    notFound() // Triggers 404 page
  }

  return (
    <article className='container py-12 md:py-16'>
      <div className='mb-8'>
        <Link
          href='/projects'
          className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground'>
          <ArrowLeftIcon className='mr-2 h-4 w-4' />
          <span>Back to Projects</span>
        </Link>
      </div>
      <header className='mb-8 md:mb-12'>
        <h1 className='mb-3 text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl'>
          {project.title}
        </h1>
        {project.placement && (
          <div className="mb-4">
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {project.placement}
            </Badge>
          </div>
        )}
        <div className='flex flex-wrap gap-2'>
          {project.tags.map((tag) => (
            <Badge key={tag} variant='outline'>
              {tag}
            </Badge>
          ))}
        </div>
      </header>
      {project.imageUrl && (
        <div className='mb-8 aspect-video w-full overflow-hidden rounded-lg md:mb-12'>
          <Image
            src={project.imageUrl}
            alt={project.title}
            width={1200}
            height={675}
            className='object-cover'
            priority
          />
        </div>
      )}
      <div className='prose prose-zinc mx-auto max-w-3xl dark:prose-invert lg:prose-lg xl:prose-xl'>
        <p>{project.longDescription}</p>
      </div>
      {(project.liveUrl || project.repoUrl) && (
        <div className='mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center'>
          {project.liveUrl && (
            <Button asChild size='lg'>
              <a href={project.liveUrl} target='_blank' rel='noopener noreferrer'>
                View Live Demo
              </a>
            </Button>
          )}
          {project.repoUrl && (
            <Button asChild variant='outline' size='lg'>
              <a href={project.repoUrl} target='_blank' rel='noopener noreferrer'>
                View Code Repository
              </a>
            </Button>
          )}
        </div>
      )}
    </article>
  );
} 
