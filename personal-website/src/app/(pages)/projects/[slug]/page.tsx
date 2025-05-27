import { getProjectBySlug, getAllProjects } from '@/content/projects'
import { markdownToHtml } from '@/lib/markdown'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarkdownContent } from '@/components/ui/secure-content'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export async function generateStaticParams() {
  const allProjects = await getAllProjects()
  
  return allProjects.map((project) => ({
    slug: project.slug,
  }))
}

type Props = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params
  const project = await getProjectBySlug(resolvedParams.slug)

  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: `${project.title} | Project Details`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: project.imageUrl ? [{ url: project.imageUrl, alt: project.title }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.description,
      images: project.imageUrl ? [project.imageUrl] : [],
    },
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const resolvedParams = await params
  const project = await getProjectBySlug(resolvedParams.slug)

  if (!project) {
    notFound() // Triggers 404 page
  }
  
  // Convert markdown to HTML with security
  const contentHtml = await markdownToHtml(project.longDescription)

  return (
    <ErrorBoundary>
      <article className='container py-12 md:py-16'>
        <div className='mb-8'>
          <Link
            href='/projects'
            className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors'
            aria-label="Back to projects">
            <ArrowLeftIcon className='mr-2 h-4 w-4' aria-hidden="true" />
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
          <div className='flex flex-wrap gap-2' role="list">
            {project.tags.map((tag) => (
              <Badge key={tag} variant='outline' role="listitem">
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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
          </div>
        )}
        
        <MarkdownContent 
          content={contentHtml}
          className="prose prose-zinc max-w-3xl mx-auto
            prose-headings:my-4 prose-headings:font-bold prose-headings:tracking-tighter
            prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-0
            prose-h2:text-3xl prose-h2:border-b prose-h2:pb-2
            prose-h3:text-2xl
            prose-p:my-4
            prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
            prose-strong:text-primary/90 prose-em:italic
            prose-pre:my-6 prose-pre:overflow-auto prose-pre:rounded-lg
            prose-code:bg-muted prose-code:p-1 prose-code:rounded-md prose-code:text-sm
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4
            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
            prose-li:my-2 prose-li:marker:text-primary
            dark:prose-invert lg:prose-lg"
        />
        
        {(project.liveUrl || project.repoUrl) && (
          <div className='mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center'>
            {project.liveUrl && (
              <Button asChild size='lg'>
                <a 
                  href={project.liveUrl} 
                  target='_blank' 
                  rel='noopener noreferrer'
                  aria-label={`View live demo of ${project.title}`}
                >
                  View Live Demo
                </a>
              </Button>
            )}
            {project.repoUrl && (
              <Button asChild variant='outline' size='lg'>
                <a 
                  href={project.repoUrl} 
                  target='_blank' 
                  rel='noopener noreferrer'
                  aria-label={`View source code for ${project.title}`}
                >
                  View Code Repository
                </a>
              </Button>
            )}
          </div>
        )}
        
        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": project.title,
              "description": project.description,
              "image": project.imageUrl,
              "url": project.liveUrl,
              "applicationCategory": "WebApplication",
              "operatingSystem": "Web",
              "author": {
                "@type": "Person",
                "name": "Eduard Kakosyan"
              }
            })
          }}
        />
      </article>
    </ErrorBoundary>
  );
} 
