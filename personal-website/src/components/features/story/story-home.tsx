import { chapters } from '@/content/story'
import { StoryHero } from '@/components/features/story/story-hero'
import { StoryScroller } from '@/components/features/story/story-scroller'
import { Chapter } from '@/components/features/story/chapter'

export function StoryHome() {
  return (
    <div className="story-home site-page">
      <StoryHero />
      <StoryScroller
        chapters={chapters.map((chapter) => ({
          id: chapter.id,
          content: <Chapter chapter={chapter} />,
        }))}
      />
    </div>
  )
}
