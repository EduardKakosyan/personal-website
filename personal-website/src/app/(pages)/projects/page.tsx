import type { Metadata } from 'next'
import { FeaturedCaseStudies } from '@/components/features/work/case-study-card'
import { ClientWork } from '@/components/features/work/client-work'
import { ArchiveTable } from '@/components/features/work/archive-table'

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Case studies: a sales and delivery scorecard, private meeting search, and a coding agent on my own hardware.',
  alternates: { canonical: '/projects' },
}

export default function ProjectsPage() {
  return (
    <div className="site-page site-width">
      <header>
        <p className="site-kicker">Work / Eduard Kakosyan</p>
        <h1>
          Things I&apos;ve built, <em>and how.</em>
        </h1>
        <p className="site-lead">What I built, why I built it that way, and what broke.</p>
      </header>
      <FeaturedCaseStudies />
      <ClientWork />
      <ArchiveTable />
    </div>
  )
}
