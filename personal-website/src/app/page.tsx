import { HeroSection } from '@/components/features/hero-section'
import { SkillsShowcase } from '@/components/features/skills-showcase'
import { AIExpertiseSection } from '@/components/features/ai-expertise-section'
import { AIAssistantSection } from '@/components/features/ai-assistant-section'
import { AchievementsSection } from '@/components/features/achievements-section'
import { CTASection } from '@/components/features/cta-section'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home | Eduard Kakosyan - AI Developer',
  description: 'Portfolio of Eduard Kakosyan, AI Developer and hackathon winner. Explore AI projects, LLM implementations, and technical solutions.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AIAssistantSection />
      <SkillsShowcase />
      <AIExpertiseSection />
      <AchievementsSection />
      <CTASection />
    </>
  )
}
