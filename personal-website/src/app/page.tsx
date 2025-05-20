import { HeroSection } from '@/components/features/hero-section'
import { ProjectHighlights } from '@/components/features/project-highlights'

export default async function HomePage() {
  return (
    <>
      <HeroSection />
      <ProjectHighlights />
      {/* You can add more sections here as needed */}
    </>
  )
}
