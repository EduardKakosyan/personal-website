import { HeroSection } from '@/components/features/hero-section'
import { AIExpertiseSection } from '@/components/features/ai-expertise-section'
import { AIAssistantSection } from '@/components/features/ai-assistant-section'
import { AchievementsSection } from '@/components/features/achievements-section'
import { BioSection } from '@/components/features/bio-section'
import { CTASection } from '@/components/features/cta-section'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home | Eduard Kakosyan - Lead AI Developer',
  description:
    'Eduard Kakosyan — Lead AI Developer at AI-First Consulting. Building agents, voice pipelines, and full-stack tools in Halifax, NS.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AIExpertiseSection />
      <AchievementsSection />
      <BioSection />
      <AIAssistantSection />
      <CTASection />
    </>
  )
}
