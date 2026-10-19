'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { parsePersona, personaOrder, type ChapterId, type Persona } from '@/content/story'
import { analyticsEvents } from '@/lib/analytics'
import { PersonaChooser } from '@/components/features/story/persona-chooser'
import { ChapterObserver } from '@/components/features/story/chapter-observer'
import { StageStill } from '@/components/features/story/stage-still'
import { Narrator } from '@/components/features/story/narrator'

export function StoryScroller({ chapters }: { chapters: { id: ChapterId; content: ReactNode }[] }) {
  const [persona, setPersona] = useState<Persona>('hiring-manager')
  const [current, setCurrent] = useState<ChapterId>('systems')
  useEffect(() => {
    const sync = () => {
      const next = parsePersona(new URLSearchParams(window.location.search).get('for'))
      setPersona(next)
      setCurrent(personaOrder[next][0])
    }
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  function choose(next: Persona) {
    setPersona(next)
    setCurrent(personaOrder[next][0])
    const url = new URL(window.location.href)
    url.searchParams.set('for', next)
    window.history.replaceState(null, '', url)
    analyticsEvents.personaChosen(next)
  }
  return (
    <div id="selected-work" className="story-body">
      <div className="site-width">
        <PersonaChooser persona={persona} onChoose={choose} />
        <a className="work-link" href="#next-step">
          Skip to resume and contact
        </a>
      </div>
      <div className="story-layout site-width">
        <aside className="story-stage">
          <StageStill current={current} />
          <Narrator persona={persona} chapter={current} />
        </aside>
        <div className="story-chapters">
          {personaOrder[persona].map((id) => (
            <div key={id}>{chapters.find((chapter) => chapter.id === id)!.content}</div>
          ))}
        </div>
      </div>
      <ChapterObserver persona={persona} onChange={setCurrent} />
    </div>
  )
}
