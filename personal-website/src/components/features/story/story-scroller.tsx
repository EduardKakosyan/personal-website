'use client'
import { useState, type ReactNode } from 'react'
import { portfolioAudience, portfolioOrder, type ChapterId } from '@/content/story'
import { ChapterObserver } from '@/components/features/story/chapter-observer'
import { StoryStage } from '@/components/features/story/story-stage'
import { Narrator } from '@/components/features/story/narrator'

export function StoryScroller({ chapters }: { chapters: { id: ChapterId; content: ReactNode }[] }) {
  const [current, setCurrent] = useState<ChapterId>(portfolioOrder[0])
  return (
    <div id="selected-work" className="story-body">
      <div className="site-width">
        <h2>Selected work</h2>
        <a className="work-link" href="#next-step">
          Skip to résumé and contact
        </a>
      </div>
      <div className="story-layout site-width">
        <aside className="story-stage">
          <StoryStage current={current} order={portfolioOrder} />
          <Narrator persona={portfolioAudience} chapter={current} />
        </aside>
        <div className="story-chapters">
          {portfolioOrder.map((id) => (
            <div key={id}>{chapters.find((chapter) => chapter.id === id)!.content}</div>
          ))}
        </div>
      </div>
      <ChapterObserver persona={portfolioAudience} onChange={setCurrent} />
    </div>
  )
}
