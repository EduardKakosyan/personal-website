import { BioSection } from '@/components/features/bio-section'
import { SkillsShowcase } from '@/components/features/skills-showcase'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Me | AI Developer',
  description: 'Learn more about my journey, skills, and philosophy as an AI Developer based in Halifax, Nova Scotia.',
}

export default function AboutPage() {
  return (
    <>
      <BioSection />
      <SkillsShowcase />
      {/* You can add more sections here, e.g., Experience, Education, Testimonials */}
    </>
  )
} 