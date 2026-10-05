import { getProjectBySlug, getAllProjects, getAdjacentProjects } from '@/content/projects'
import { markdownToHtml } from '@/lib/markdown'
import { ArrowLeftIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarkdownContent } from '@/components/ui/secure-content'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { ProjectAnalytics } from '@/components/features/project-analytics'
import { ProjectButtons } from '@/components/features/project-buttons'
import { ProjectDetailHeader } from '@/components/features/project-detail-header'
import { ProjectNavigation } from '@/components/features/project-navigation'
import { DgxCaseStudy } from '@/components/features/dgx-case-study'

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const project = await getProjectBySlug(resolvedParams.slug)

  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  const ogImage = project.previewImageUrl || project.imageUrl

  return {
    title: `${project.title} | Project Details`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: ogImage ? [{ url: ogImage, alt: project.title }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.description,
      images: ogImage ? [ogImage] : [],
    },
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const resolvedParams = await params
  const project = await getProjectBySlug(resolvedParams.slug)

  if (!project) {
    notFound()
  }

  if (project.slug === 'dgx-autonomy') {
    return (
      <>
        <ProjectAnalytics projectSlug={project.slug} />
        <DgxCaseStudy />
      </>
    )
  }

  // The page header owns the title; project Markdown starts with the introduction.
  const description = project.longDescription.replace(/^\s*# [^\n]*(?:\r?\n|$)/, '')
  const contentHtml = await markdownToHtml(description)
  const { prev, next } = getAdjacentProjects(project.slug)

  return (
    <ErrorBoundary>
      <ProjectAnalytics projectSlug={project.slug} />
      <article className="project-detail lab-section">
        <div className="mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to projects"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Back to Projects</span>
          </Link>
        </div>

        <ProjectDetailHeader project={project} />

        <MarkdownContent content={contentHtml} className="project-prose" />

        <ProjectButtons
          projectSlug={project.slug}
          projectTitle={project.title}
          liveUrl={project.liveUrl}
          repoUrl={project.repoUrl}
        />

        <ProjectNavigation prev={prev} next={next} />

        <div className="mt-8 text-center">
          <Link
            href="/projects"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to All Projects
          </Link>
        </div>

        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: project.title,
              description: project.description,
              image: project.previewImageUrl || project.imageUrl,
              url: project.liveUrl,
              applicationCategory: 'WebApplication',
              operatingSystem: 'Web',
              author: {
                '@type': 'Person',
                name: 'Eduard Kakosyan',
              },
            }),
          }}
        />
      </article>
    </ErrorBoundary>
  )
}
