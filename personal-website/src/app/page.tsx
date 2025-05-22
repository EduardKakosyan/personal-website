import { HeroSection } from '@/components/features/hero-section'
import { AIExpertiseSection } from '@/components/features/ai-expertise-section'
import { AchievementsSection } from '@/components/features/achievements-section'
import { ProjectHighlights } from '@/components/features/project-highlights'
import { CTASection } from '@/components/features/cta-section'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home | Eduard Kakosyan - AI Developer',
  description: 'Portfolio of Eduard Kakosyan, AI Developer and hackathon winner. Explore AI projects, LLM implementations, and technical solutions.',
}

export default async function HomePage() {
  return (
    <>
      <HeroSection />
      <AIExpertiseSection />
      <AchievementsSection />
      <ProjectHighlights />
      <CTASection />
    </>
  )
}
