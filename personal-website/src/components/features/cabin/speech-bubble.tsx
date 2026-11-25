'use client'

import { useEffect, useRef, useState } from 'react'
import { useKeepOnScreen } from './use-keep-on-screen'
import styles from './cabin.module.css'

/** `You` is the guest (their question to Eduard by the fire, over their own head). */
export type Speaker = 'Eduard' | 'HUGO' | 'You'

/** Something to follow up on under what was said (HUGO's answers: a project's page, the résumé). */
export type BubbleLink = { label: string; href: string }

const CHARS_PER_SECOND = 38

type Props = {
  speaker: Speaker
  text: string
  /**
   * Shown in place of the line while there isn't one yet ("Thinking…"); it
   * isn't typed out.
   */
  status?: string | null
  /** Buttons under the line once it's all there. The first is the main one. */
  links?: BubbleLink[]
  /** Show the whole line at once (the guest pressed on while it was typing). */
  instant?: boolean
  /** A rubber stamp on the bubble's corner ("Draft": not Eduard's own words yet). */
  stamp?: string
  /** There's more to come after this: a little "go on" mark in the corner. */
  more?: boolean
  /** A longer line (a paragraph of Eduard's): a wider bubble. */
  wide?: boolean
  /**
   * A link was clicked: true if the cabin has dealt with it (a project's page
   * opens as a note over the scene), so the page isn't left. A click with
   * Cmd, Ctrl or Shift, or the middle button, still opens the page itself.
   */
  onLink?: (link: BubbleLink) => boolean
}

/**
 * A speech bubble that types its line out a letter at a time and stays on
 * screen. HUGO's answers to the guest's questions are said this way too,
 * over his head, with their links under them (Eduard: "put the stuff he is
 * saying above him instead of into a chatbot so its more realistic").
 */
export function SpeechBubble({
  speaker,
  text,
  status,
  links,
  instant,
  stamp,
  more,
  wide,
  onLink,
}: Props) {
  const [shown, setShown] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useKeepOnScreen(ref)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || instant) {
      const id = window.setTimeout(() => setShown(text.length), 0)
      return () => window.clearTimeout(id)
    }
    let count = 0
    const start = window.setTimeout(() => setShown(0), 0)
    const id = window.setInterval(() => {
      count += 1
      setShown(count)
      if (count >= text.length) window.clearInterval(id)
    }, 1000 / CHARS_PER_SECOND)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(id)
    }
  }, [text, instant])

  const speakerClass =
    speaker === 'HUGO'
      ? styles.speakerHugo
      : speaker === 'You'
        ? styles.speakerYou
        : styles.speakerEduard
  const answer = status !== undefined || links !== undefined || Boolean(wide)
  const done = !status && shown >= text.length
  return (
    <div
      ref={ref}
      className={`${styles.bubble} ${answer ? styles.bubbleAnswer : ''} ${styles.pixel}`}
      role="status"
      aria-live="polite"
    >
      <span className={`${styles.speaker} ${speakerClass}`}>{speaker}</span>
      {stamp && <span className={styles.bubbleStamp}>{stamp}</span>}
      {status ? (
        <span className={styles.bubbleStatus}>{status}</span>
      ) : (
        <>
          {/* The untyped rest is laid out but hidden, so the bubble doesn't grow as it types. */}
          <span aria-hidden="true">
            {text.slice(0, shown)}
            <span className={styles.untyped}>{text.slice(shown)}</span>
          </span>
          <span className="sr-only">{text}</span>
          {more && done && (
            <span className={styles.bubbleMore} aria-hidden="true">
              ▼
            </span>
          )}
        </>
      )}
      {links && links.length > 0 && !status && (
        // (laid out from the start, so the bubble doesn't jump when they appear)
        <span className={`${styles.bubbleLinks} ${done ? '' : styles.untyped}`}>
          {links.map((l, i) => {
            const inSite = l.href.startsWith('/') && !l.href.endsWith('.pdf')
            return (
              <a
                key={l.href}
                className={i === 0 ? styles.panelButton : styles.panelButtonQuiet}
                href={l.href}
                tabIndex={done ? 0 : -1}
                {...(inSite ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                // (a press on a link is not a tap on the ground behind it)
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                  if (onLink?.(l)) e.preventDefault()
                }}
              >
                {l.label}
              </a>
            )
          })}
        </span>
      )}
    </div>
  )
}
