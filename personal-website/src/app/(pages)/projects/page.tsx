import type { Metadata } from 'next'
import { FeaturedCaseStudies } from '@/components/features/work/case-study-card'
import { ClientWork } from '@/components/features/work/client-work'
import { ArchiveTable } from '@/components/features/work/archive-table'

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Keeper, Keystone, lyfe, dgx-autonomy and this website: software I build at AI-First Solutions and projects of my own.',
  alternates: { canonical: '/projects' },
}

export default function ProjectsPage() {
  return (
    <div className="site-page">
      <header className="site-sheet site-intro">
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
