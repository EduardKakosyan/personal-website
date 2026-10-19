import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { projects, getProjectBySlug } from '@/content/projects'
import { getProjectBody } from '@/lib/project-content'
import { SecureContent } from '@/components/ui/secure-content'
import { ProjectAnalytics } from '@/components/features/project-analytics'
import { DgxCaseStudy } from '@/components/features/dgx-case-study'
import { CaseStudy } from '@/components/features/work/case-study'
import { FactsBox } from '@/components/features/work/facts-box'

type Props = { params: Promise<{ slug: string }> }
export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }))
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProjectBySlug((await params).slug)
  if (!project) return { title: 'Project not found' }
  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: project.title,
      description: project.description,
      url: `/projects/${project.slug}`,
    },
  }
}
export default async function ProjectDetailPage({ params }: Props) {
  const project = getProjectBySlug((await params).slug)
  if (!project) notFound()
  if (project.slug === 'dgx-autonomy')
    return (
      <>
        <ProjectAnalytics projectSlug={project.slug} />
        <DgxCaseStudy />
      </>
    )
  const body = await getProjectBody(project.slug)
  return (
    <>
      <ProjectAnalytics projectSlug={project.slug} />
      {project.tier === 'case-study' ? (
        <CaseStudy project={project} body={body} />
      ) : (
        <article className="site-page site-width work-study">
          <nav className="work-breadcrumb" aria-label="Breadcrumb">
            <Link href="/projects">Work</Link>
            <span> / Archive / </span>
            <span aria-current="page">{project.title}</span>
          </nav>
          <header>
            <p className="site-kicker">Archive note</p>
            <h1>{project.title}</h1>
            <p className="site-lead">{project.description}</p>
          </header>
          <div className="work-study-grid">
            <FactsBox project={project} />
            <SecureContent content={body} className="work-prose" />
          </div>
          <Link className="work-link" href="/projects">
            Back to all work &rarr;
          </Link>
        </article>
      )}
    </>
  )
}
