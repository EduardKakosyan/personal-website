'use client'

import { useEffect, useRef, useState } from 'react'
import { useKeepOnScreen } from './use-keep-on-screen'
import styles from './cabin.module.css'

export type Speaker = 'Eduard' | 'HUGO'

const CHARS_PER_SECOND = 38

/** A speech bubble that types its line out a letter at a time and stays on screen. */
export function SpeechBubble({ speaker, text }: { speaker: Speaker; text: string }) {
  const [shown, setShown] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useKeepOnScreen(ref)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      const id = window.setTimeout(() => setShown(text.length), 0)
      return () => window.clearTimeout(id)
    }
    let count = 0
    const id = window.setInterval(() => {
      count += 1
      setShown(count)
      if (count >= text.length) window.clearInterval(id)
    }, 1000 / CHARS_PER_SECOND)
    return () => window.clearInterval(id)
  }, [text])

  const speakerClass = speaker === 'HUGO' ? styles.speakerHugo : styles.speakerEduard
  return (
    <div ref={ref} className={`${styles.bubble} ${styles.pixel}`} role="status" aria-live="polite">
      <span className={`${styles.speaker} ${speakerClass}`}>{speaker}</span>
      {/* The untyped rest is laid out but hidden, so the bubble doesn't grow as it types. */}
      <span aria-hidden="true">
        {text.slice(0, shown)}
        <span className={styles.untyped}>{text.slice(shown)}</span>
      </span>
      <span className="sr-only">{text}</span>
    </div>
  )
}
