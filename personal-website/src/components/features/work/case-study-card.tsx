import Link from 'next/link'
import { caseStudies, type Project } from '@/content/projects'

export const beatLabels = {
  systems: 'Revenue and operations',
  'private-local': 'Private and local',
  adoption: 'Adoption and leadership',
}

export function CaseStudyCard({ project }: { project: Project }) {
  return (
    <article className="work-feature">
      <p className="site-kicker">{project.beat && beatLabels[project.beat]}</p>
      <h3>
        <Link href={`/projects/${project.slug}`}>{project.title}</Link>
      </h3>
      <p>{project.description}</p>
      <p className="work-outcome">{project.outcome}</p>
      <Link
        className="work-link"
        href={`/projects/${project.slug}`}
        aria-label={`Learn more about ${project.title}`}
      >
        Learn more &rarr;
      </Link>
    </article>
  )
}

export function FeaturedCaseStudies() {
  return (
    <section className="site-section" aria-labelledby="featured-heading">
      <h2 id="featured-heading">Selected case studies</h2>
      <div className="work-features">
        {caseStudies.map((project) => (
          <CaseStudyCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  )
}
