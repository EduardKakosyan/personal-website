import type { Metadata } from 'next'
import { FeaturedCaseStudies } from '@/components/features/work/case-study-card'
import { ClientWork } from '@/components/features/work/client-work'
import { ArchiveTable } from '@/components/features/work/archive-table'

export const metadata: Metadata = {
  title: 'Work',
  description: 'Revenue and operations systems, private AI, and the decisions behind the builds.',
  alternates: { canonical: '/projects' },
}

export default function ProjectsPage() {
  return (
    <div className="site-page site-width">
      <header>
        <p className="site-kicker">Work / Eduard Kakosyan</p>
        <h1>
          Systems, with <em>the evidence.</em>
        </h1>
        <p className="site-lead">
          What I built, the decisions behind it, and what needed another pass.
        </p>
      </header>
      <FeaturedCaseStudies />
      <ClientWork />
      <ArchiveTable />
    </div>
  )
}
