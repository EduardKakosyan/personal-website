import Link from 'next/link'
import { caseStudies, type Project } from '@/content/projects'
import { SecureContent } from '@/components/ui/secure-content'
import { FactsBox } from './facts-box'
import { beatLabels } from './case-study-card'

export function CaseStudy({ project, body }: { project: Project; body: string }) {
  const sections =
    project.slug === 'keystone'
      ? ['Discovery', 'Definitions', 'Architecture', 'Build', 'What broke']
      : ['Problem', 'System', 'Decisions', 'Result', 'What broke']
  const next =
    caseStudies[
      (caseStudies.findIndex((item) => item.slug === project.slug) + 1) % caseStudies.length
    ]
  return (
    <article className="site-page site-width work-study">
      <nav className="work-breadcrumb" aria-label="Breadcrumb">
        <Link href="/projects">Work</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{project.title}</span>
      </nav>
      <header>
        <p className="site-kicker">{project.beat && beatLabels[project.beat]} / Case study</p>
        <h1>{project.title}</h1>
        <p className="site-lead">{project.description}</p>
        <nav className="work-sections" aria-label="Case study sections">
          {sections.map((section) => (
            <a key={section} href={`#${section.toLowerCase().replaceAll(' ', '-')}`}>
              {section}
            </a>
          ))}
        </nav>
      </header>
      <div className="work-study-grid">
        <FactsBox project={project} />
        <SecureContent content={body} className="work-prose" />
      </div>
      <nav className="work-next" aria-label="Next case study">
        <Link href={`/projects/${next.slug}`}>Next case study: {next.title} &rarr;</Link>
        <Link href="/projects">All work</Link>
      </nav>
    </article>
  )
}
