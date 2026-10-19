'use client'
import { useState, type FormEvent } from 'react'
import { narratorLines, type ChapterId, type Persona } from '@/content/story'
import { useGuide } from '@/components/providers/guide-provider'

export function Narrator({ persona, chapter }: { persona: Persona; chapter: ChapterId }) {
  const [question, setQuestion] = useState('')
  const { openGuide } = useGuide()
  function ask(event: FormEvent) {
    event.preventDefault()
    if (question.trim()) openGuide(question.trim())
  }
  return (
    <div className="story-narrator">
      <div className="story-narrator-label">
        <strong>EK&mdash;01</strong>
      </div>
      <p className="story-narration" aria-live="polite" aria-atomic="true">
        {narratorLines[persona][chapter]}
      </p>
      <form onSubmit={ask}>
        <label htmlFor="story-question">Ask EK&mdash;01 about the work</label>
        <div>
          <input
            id="story-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={500}
            required
            placeholder="e.g. What has he built with local models?"
          />
          <button type="submit">Ask</button>
        </div>
      </form>
      <p className="site-muted">Answers come from the case studies on this site.</p>
      <noscript>
        <p>
          The interactive guide needs JavaScript. All case studies, experience and contact links
          work without it.
        </p>
      </noscript>
    </div>
  )
}
