'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './cabin.module.css'
import { SPLIT_GOAL } from './world'

export type SplitHudState = {
  /** 0..1 along the bar. */
  marker: number
  /** Whether a swing can happen right now. */
  ready: boolean
  count: number
  /** The last thing that happened, for the pop-up word. */
  event: null | 'crack' | 'perfect' | 'thunk' | 'done'
}

/** How the frame loop hands the HUD its numbers without re-rendering React every frame. */
export type SplitHudHandle = { set: (s: SplitHudState) => void }

const WORDS = { crack: 'Crack!', perfect: 'Perfect!', thunk: 'Thunk.', done: 'That’s the lot!' }

/**
 * The splitting game's bar: a marker sweeps back and forth, and the green
 * middle is where to swing. A button for touch screens, and a Done button.
 */
export function SplitHud({
  touch,
  handleRef,
  onSwing,
  onDone,
}: {
  touch: boolean
  handleRef: React.MutableRefObject<SplitHudHandle | null>
  onSwing: () => void
  onDone: () => void
}) {
  const marker = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)
  const [word, setWord] = useState<{ text: string; key: number; kind: string } | null>(null)
  const wordKey = useRef(0)
  useEffect(() => {
    handleRef.current = {
      set: (s) => {
        if (marker.current) marker.current.style.left = `${(s.marker * 100).toFixed(1)}%`
        if (bar.current) bar.current.dataset.ready = s.ready ? 'yes' : 'no'
        setCount((c) => (c === s.count ? c : s.count))
        if (s.event) {
          wordKey.current += 1
          setWord({ text: WORDS[s.event], key: wordKey.current, kind: s.event })
        }
      },
    }
    return () => {
      handleRef.current = null
    }
  }, [handleRef])
  useEffect(() => {
    if (!word) return
    const id = window.setTimeout(() => setWord(null), 900)
    return () => window.clearTimeout(id)
  }, [word])

  return (
    <div className={`${styles.splitHud} ${styles.pixel}`} role="group" aria-label="Splitting wood">
      <div className={styles.splitTop}>
        <span>
          Split {count}/{SPLIT_GOAL}
        </span>
        <span className={styles.splitHint}>
          {touch ? 'Tap Swing in the green' : 'E or click in the green'}
        </span>
      </div>
      <div ref={bar} className={styles.splitBar} data-ready="no">
        <div className={styles.splitSweet} />
        <div className={styles.splitPerfect} />
        <div ref={marker} className={styles.splitMarker} />
      </div>
      <div className={styles.splitButtons}>
        {touch && (
          <button
            type="button"
            className={styles.splitSwing}
            onPointerDown={(e) => {
              e.stopPropagation()
              onSwing()
            }}
          >
            Swing
          </button>
        )}
        <button type="button" className={styles.splitDone} onClick={onDone}>
          Done
        </button>
      </div>
      {word && (
        <div
          key={word.key}
          className={`${styles.splitWord} ${styles[`splitWord_${word.kind}`] ?? ''}`}
          aria-live="polite"
        >
          {word.text}
        </div>
      )}
    </div>
  )
}
