import Link from 'next/link'
import { caseStudies, type Project } from '@/content/projects'
import { SecureContent } from '@/components/ui/secure-content'
import { FactsBox } from './facts-box'
import { beatLabels } from './case-study-card'

export function CaseStudy({ project, body }: { project: Project; body: string }) {
  // The section links follow the write-up's own headings, so every case study can share one shape.
  const sections = [...body.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)].map(([, id, title]) => ({
    id,
    title,
  }))
  const next =
    caseStudies[
      (caseStudies.findIndex((item) => item.slug === project.slug) + 1) % caseStudies.length
    ]
  return (
    <article className="site-page work-study">
      <div className="site-sheet">
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
              <a key={section.id} href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </nav>
        </header>
        <div className="work-study-grid">
          <FactsBox project={project} />
          <SecureContent content={body} className="work-prose" />
        </div>
        <nav className="work-next" aria-label="Next case study">
          <Link className="site-button" href={`/projects/${next.slug}`}>
            Next case study: {next.title} &rarr;
          </Link>
          <Link className="site-button site-button-quiet" href="/projects">
            All work
          </Link>
        </nav>
      </div>
    </article>
  )
}
