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

  const contentHtml = await markdownToHtml(project.longDescription)
  const { prev, next } = getAdjacentProjects(project.slug)

  return (
    <ErrorBoundary>
      <ProjectAnalytics projectSlug={project.slug} />
      <article className="container py-12 md:py-16">
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
