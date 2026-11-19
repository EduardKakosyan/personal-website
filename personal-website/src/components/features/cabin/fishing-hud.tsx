'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './cabin.module.css'
import type { FishEvent, FishPhase } from './fishing'

export type FishingHudState = {
  phase: FishPhase
  /** 0..1, how much of the line is wound in (while reeling). */
  reel: number
  caught: number
  event: FishEvent
}

/** How the frame loop hands the HUD its numbers without re-rendering React every frame. */
export type FishingHudHandle = { set: (s: FishingHudState) => void }

/** DRAFT: the words that pop up while fishing (the agent's; Eduard to change). */
export const FISHING_WORDS: Partial<Record<NonNullable<FishEvent>, string>> = {
  bite: 'Now!',
  soon: 'Too soon.',
  away: 'It got away.',
  caught: 'Caught one!',
}

/** DRAFT: the line under the title, for each part of a go (the agent's). */
const HINTS: Partial<Record<FishPhase, { keys: string; touch: string }>> = {
  ready: { keys: 'E or click to cast', touch: 'Tap Cast' },
  waiting: { keys: 'Strike when it goes under', touch: 'Strike when it goes under' },
  bite: { keys: 'Strike! E or click', touch: 'Strike!' },
  reel: { keys: 'Keep pressing E to reel', touch: 'Keep tapping Reel' },
  landed: { keys: 'Back it goes. E to cast again', touch: 'Back it goes. Cast again?' },
}

/** The phone's one big button, for each part of a go. */
const BUTTON: Partial<Record<FishPhase, string>> = {
  ready: 'Cast',
  waiting: 'Strike',
  bite: 'Strike!',
  reel: 'Reel',
  landed: 'Cast again',
}

/**
 * Casting a line (fishing.ts): what to do now, how much of the line is in
 * while reeling, the catches, a button for touch screens, and Done. Styled
 * like the splitting game's bar.
 */
export function FishingHud({
  touch,
  handleRef,
  onPress,
  onDone,
}: {
  touch: boolean
  handleRef: React.MutableRefObject<FishingHudHandle | null>
  onPress: () => void
  onDone: () => void
}) {
  const fill = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<FishPhase>('walking')
  const [caught, setCaught] = useState(0)
  const [word, setWord] = useState<{ text: string; key: number; kind: string } | null>(null)
  const wordKey = useRef(0)
  useEffect(() => {
    handleRef.current = {
      set: (s) => {
        if (fill.current) fill.current.style.width = `${(s.reel * 100).toFixed(1)}%`
        setPhase((p) => (p === s.phase ? p : s.phase))
        setCaught((c) => (c === s.caught ? c : s.caught))
        const text = s.event ? FISHING_WORDS[s.event] : undefined
        if (text) {
          wordKey.current += 1
          setWord({ text, key: wordKey.current, kind: s.event ?? '' })
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

  const hint = HINTS[phase]
  const button = BUTTON[phase]
  const kind =
    word?.kind === 'caught' ? 'done' : word?.kind === 'bite' ? 'perfect' : word ? 'thunk' : ''
  return (
    <div className={`${styles.splitHud} ${styles.pixel}`} role="group" aria-label="Fishing">
      <div className={styles.splitTop}>
        <span>{caught > 0 ? `Fishing · caught ${caught}` : 'Fishing'}</span>
        <span className={styles.splitHint}>{hint ? (touch ? hint.touch : hint.keys) : '…'}</span>
      </div>
      {phase === 'reel' && (
        <div className={styles.splitBar} aria-label="Line wound in">
          <div
            ref={fill}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, background: '#79b24c' }}
          />
        </div>
      )}
      <div className={styles.splitButtons}>
        {touch && button && (
          <button
            type="button"
            className={styles.splitSwing}
            onPointerDown={(e) => {
              e.stopPropagation()
              onPress()
            }}
          >
            {button}
          </button>
        )}
        <button type="button" className={styles.splitDone} onClick={onDone}>
          Done
        </button>
      </div>
      {word && (
        <div
          key={word.key}
          className={`${styles.splitWord} ${styles[`splitWord_${kind}`] ?? ''}`}
          aria-live="polite"
        >
          {word.text}
        </div>
      )}
    </div>
  )
}
