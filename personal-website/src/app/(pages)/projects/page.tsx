import type { Metadata } from 'next'
import { FeaturedCaseStudies } from '@/components/features/work/case-study-card'
import { ClientWork } from '@/components/features/work/client-work'
import { ArchiveTable } from '@/components/features/work/archive-table'

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Keystone, Keeper and dgx-autonomy: software I build at AI-First Solutions and my own experiments with local models.',
  alternates: { canonical: '/projects' },
}

export default function ProjectsPage() {
  return (
    <div className="site-page site-width">
      <header>
        <p className="site-kicker">Work / Eduard Kakosyan</p>
        <h1>
          Projects <em>and experiments.</em>
        </h1>
        <p className="site-lead">
          Software I build at AI-First, projects of my own, and a few hackathon projects.
        </p>
      </header>
      <FeaturedCaseStudies />
      <ClientWork />
      <ArchiveTable />
    </div>
  )
}
