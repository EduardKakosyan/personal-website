import type { Metadata } from 'next'
import { Pixelify_Sans } from 'next/font/google'
import { ArrivalPreview } from '@/components/features/cabin/arrival-preview'
import type { BenchProject, CabinResume } from '@/components/features/cabin/cabin-content'
import { archiveProjects } from '@/content/projects'
import { profile, resumePdfPath } from '@/content/profile'

// Step 4 of the redesign: one small scene to test the look and feel.
// Not linked from anywhere and not indexed.

const pixel = Pixelify_Sans({
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Arrival (preview)',
  robots: { index: false, follow: false },
}

const month = (ym: string) =>
  new Date(`${ym}-01T12:00:00Z`).toLocaleDateString('en-CA', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

/** The résumé on the cabin table reads from the same facts as the rest of the site. */
function cabinResume(): CabinResume {
  const { identity } = profile
  return {
    name: identity.name,
    title: identity.title,
    company: identity.company,
    location: `${identity.location}, ${identity.country}`,
    headline: profile.headline,
    roles: profile.roles.map((r) => ({
      title: r.scope ? `${r.title} · ${r.scope}` : r.title,
      org: r.org,
      location: r.location,
      dates: `${month(r.start)} – ${r.end ? month(r.end) : 'present'}`,
      summary: r.summary,
    })),
    education: profile.education.map((e) => ({
      degree: e.degree,
      school: `${e.school}, ${e.location}`,
      dates: month(e.end),
      details: [...(e.gpa ? [`GPA ${e.gpa}`] : []), ...e.awards],
    })),
    skills: profile.skills,
    pdfPath: resumePdfPath,
  }
}

/**
 * The project boxes on the workbench (A84), newest first. Shoreline and Is the
 * Beach Open belong at the brook, Camp Yahtzee and HUGO at the fire
 * (storyboard), so they aren't here.
 */
const BENCH_SLUGS = [
  'dev-template',
  'healthbyte',
  'network-sim',
  'cargrep',
  'second-brain',
  'exosky',
]

function benchProjects(): BenchProject[] {
  const bySlug = new Map(archiveProjects.map((p) => [p.slug, p]))
  return BENCH_SLUGS.flatMap((slug) => {
    const p = bySlug.get(slug)
    return p ? [p] : []
  }).map((p) => ({
    slug: p.slug,
    title: p.title,
    tag: p.slug === 'network-sim' ? 'Q-Learning Sim' : p.title,
    when: p.facts.when,
    role: p.facts.role,
    what: p.description,
    detail: p.detail,
    links: p.facts.links,
  }))
}

export default function ArrivalPreviewPage() {
  return (
    <div className={pixel.variable}>
      <ArrivalPreview resume={cabinResume()} projects={benchProjects()} />
    </div>
  )
}
