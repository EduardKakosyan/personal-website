import { BioSection } from '@/components/features/bio-section'
import { SkillsShowcase } from '@/components/features/skills-showcase'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Me | AI Developer',
  description: 'Learn about my experience, skills, and background as an AI Developer based in Halifax, Nova Scotia.',
}

export default function AboutPage() {
  return (
    <>
      <BioSection />
      <SkillsShowcase />
    </>
  )
} 