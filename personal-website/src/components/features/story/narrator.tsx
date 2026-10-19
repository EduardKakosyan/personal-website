'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { narratorLines, type ChapterId, type Persona } from '@/content/story'
import { useGuide } from '@/components/providers/guide-provider'
import { analyticsEvents } from '@/lib/analytics'

// Mirrors NarrateResult without importing the server pipeline (which pulls in Zod).
type Narration = { action: string; target: string; reply: string; href?: string } | null

const SAME_SITE_PATH = /^\/[\w/-]*(?:#[\w-]+)?$/
const CLIENT_TIMEOUT_MS = 5000
const BRIDGE_DELAY_MS = 900

function withTimeout(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS)
  if (!signal) return timeout
  if ('any' in AbortSignal) return AbortSignal.any([signal, timeout])
  return signal // older Safari: the caller's abort still applies
}

async function requestNarration(body: object, signal?: AbortSignal): Promise<Narration> {
  try {
    const response = await fetch('/api/narrate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: withTimeout(signal),
    })
    if (!response.ok) return null
    const data = (await response.json()) as Narration
    return data && typeof data.reply === 'string' ? data : null
  } catch {
    return null
  }
}

export function Narrator({ persona, chapter }: { persona: Persona; chapter: ChapterId }) {
  const router = useRouter()
  const { openGuide } = useGuide()
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const key = `${persona}:${chapter}`
  // Model lines are stored per persona and chapter, so moving on simply shows the script again.
  const [bridges, setBridges] = useState<Record<string, string | null>>({})
  const [asked, setAsked] = useState<{ key: string; question: string; reply: string } | null>(null)
  const bridge = bridges[key] ?? null
  const answer = asked?.key === key ? asked : null
  const requested = useRef(new Set<string>())
  // After one failed bridge, stop asking: the Spark is off and the script is the experience.
  const offline = useRef(false)

  useEffect(() => {
    if (offline.current || requested.current.has(key)) return
    const controller = new AbortController()
    // Only ask once the reader settles on a chapter, not while scrolling past it.
    const timer = setTimeout(async () => {
      requested.current.add(key)
      const result = await requestNarration({ kind: 'bridge', persona, chapter }, controller.signal)
      if (controller.signal.aborted) {
        requested.current.delete(key)
        return
      }
      const reply = result?.action === 'answer' ? result.reply : null
      if (!reply) offline.current = true
      setBridges((current) => ({ ...current, [key]: reply }))
    }, BRIDGE_DELAY_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key, persona, chapter])

  async function ask(event: FormEvent) {
    event.preventDefault()
    const text = question.trim()
    if (!text || asking) return
    setAsking(true)
    const result = await requestNarration({ kind: 'question', persona, chapter, text })
    setAsking(false)
    analyticsEvents.narratorAnswered(result ? 'dgx' : 'script')
    if (!result) {
      // No live model: the on-page guide answers from the project notes, as before.
      openGuide(text)
      return
    }
    setQuestion('')
    setAsked({ key, question: text, reply: result.reply })
    if (!result.href || !SAME_SITE_PATH.test(result.href)) return
    if (result.href.startsWith('/#')) {
      document.getElementById(result.href.slice(2))?.scrollIntoView({ behavior: 'smooth' })
    } else router.push(result.href)
  }

  const live = Boolean(bridge || answer)
  return (
    <div className="story-narrator">
      <div className="story-narrator-label">
        <strong>EK&mdash;01</strong>
        {live && <span className="story-live">live from my DGX Spark</span>}
      </div>
      <div className="story-narration" aria-live="polite" aria-atomic="true">
        {answer ? (
          <>
            <p className="site-muted">You asked: {answer.question}</p>
            <p className="story-bridge">{answer.reply}</p>
          </>
        ) : (
          <>
            <p>{narratorLines[persona][chapter]}</p>
            {bridge && <p className="story-bridge">{bridge}</p>}
          </>
        )}
      </div>
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
          <button type="submit" disabled={asking}>
            {asking ? 'Thinking…' : 'Ask'}
          </button>
        </div>
      </form>
      <p className="site-muted">
        Answers come from the case studies on this site. Questions are logged to improve the
        answers, so leave out personal details.
      </p>
      <noscript>
        <p>
          The interactive guide needs JavaScript. All case studies, experience and contact links
          work without it.
        </p>
      </noscript>
    </div>
  )
}
