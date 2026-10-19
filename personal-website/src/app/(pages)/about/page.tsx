import type { Metadata } from 'next'
import { AboutIntro } from '@/components/features/about/about-intro'
import { ExperienceList } from '@/components/features/about/experience-list'
import { EducationSkills } from '@/components/features/about/education-skills'
import { profile } from '@/content/profile'

export const metadata: Metadata = {
  title: 'About',
  description: profile.headline,
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="site-page site-width">
      <AboutIntro />
      <ExperienceList />
      <EducationSkills />
    </div>
  )
}
