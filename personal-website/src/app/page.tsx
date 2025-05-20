import { HeroSection } from '@/components/features/hero-section'
import { ProjectHighlights } from '@/components/features/project-highlights'
import { LatestBlogPosts } from '@/components/features/latest-blog-posts'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProjectHighlights />
      <LatestBlogPosts />
      {/* You can add more sections here as needed */}
    </>
  )
}
