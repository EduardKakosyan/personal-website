'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import cabin from './cabin.module.css'
import styles from './fire-talk.module.css'
import { FIRE_QUESTIONS, type FireQuestion } from './fire-questions'
import type { FireSpeech } from './arrival-scene'

/** The speech bubbles type at this rate (speech-bubble.tsx): how long a line takes to appear. */
const CHARS_PER_SECOND = 38
const typingTime = (text: string) => (text.length / CHARS_PER_SECOND) * 1000

const DIGITS: Record<string, number> = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Digit5: 4,
  Digit6: 5,
  Digit7: 6,
  Digit8: 7,
  Digit9: 8,
}

type Props = {
  /** The guest is sitting by the fire (and HUGO's card isn't up). */
  open: boolean
  touch: boolean
  /** The questions asked so far this visit (they get a tick). */
  asked: string[]
  onAsk: (id: string) => void
  /** "Get up": the guest leaves their chair. */
  onLeave: () => void
  /** "Something else": over to HUGO's card (A30). */
  onAskHugo: () => void
  /** What's being said, for the speech bubble over the speaker's head in the scene. */
  onSpeech: (speech: FireSpeech | null) => void
  /** Eduard's in the middle of an answer (he turns to the guest and talks with his free hand). */
  onTalking: (talking: boolean) => void
  /** The things to ask are up (the scene frames the fire above them). */
  onChoosing: (choosing: boolean) => void
}

/** Where the talk is: picking what to ask, the guest asking it, or Eduard on paragraph `i` of his answer. */
type Stage =
  | { kind: 'choices' }
  | { kind: 'asking'; q: FireQuestion }
  | { kind: 'answer'; q: FireQuestion; i: number }

type Option = { kind: 'question'; q: FireQuestion } | { kind: 'hugo' } | { kind: 'leave' }

/**
 * Talking with Eduard by the fire (scene 7; A26, A30), the way a game does
 * it (Eduard: "make the conversation log be something much more game like …
 * make the words come out of top of my head, and what the user is saying
 * above their head"). Along the bottom of the screen: the things to ask, to
 * pick with the arrow keys, a number, the mouse or a tap. Pick one and the
 * guest asks it, in a bubble over their own head; then Eduard answers in a
 * bubble over his, a paragraph at a time, and E, Space, a click or a tap
 * goes on to the next. The words themselves are drawn by the scene
 * (`onSpeech`); this is the choosing and the pacing.
 */
export function FireTalk({
  open,
  touch,
  asked,
  onAsk,
  onLeave,
  onAskHugo,
  onSpeech,
  onTalking,
  onChoosing,
}: Props) {
  const [stage, setStage] = useState<Stage>({ kind: 'choices' })
  const [cursor, setCursor] = useState(0)
  /** The line showing now: its key (new for every line), when it began, and "show it all". */
  const [line, setLine] = useState({ key: 0, instant: false })
  const began = useRef(0)
  /** The last thing Eduard said stays up over him while the guest picks the next question. */
  const [last, setLast] = useState<FireSpeech | null>(null)
  const [columns, setColumns] = useState(2)
  const root = useRef<HTMLDivElement>(null)

  const options = useMemo<Option[]>(
    () => [
      ...FIRE_QUESTIONS.map((q) => ({ kind: 'question' as const, q })),
      { kind: 'hugo' },
      { kind: 'leave' },
    ],
    [],
  )

  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 640px)')
    const update = () => setColumns(narrow.matches ? 1 : 2)
    update()
    narrow.addEventListener('change', update)
    return () => narrow.removeEventListener('change', update)
  }, [])

  const newLine = useCallback(() => {
    began.current = performance.now()
    setLine((l) => ({ key: l.key + 1, instant: false }))
  }, [])

  // Getting up (or HUGO's card coming up) ends whatever was being said.
  useEffect(() => {
    if (open) {
      root.current?.focus({ preventScroll: true })
      return
    }
    const id = window.setTimeout(() => {
      setStage({ kind: 'choices' })
      setLast(null)
    }, 0)
    return () => window.clearTimeout(id)
  }, [open])

  // What's being said right now.
  const text =
    stage.kind === 'asking' ? stage.q.q : stage.kind === 'answer' ? stage.q.a[stage.i] : ''
  const speech = useMemo<FireSpeech | null>(() => {
    if (!open) return null
    if (stage.kind === 'asking')
      return { who: 'guest', key: line.key, text: stage.q.q, instant: line.instant }
    if (stage.kind === 'answer') {
      const end = stage.i === stage.q.a.length - 1
      return {
        who: 'eduard',
        key: line.key,
        text: stage.q.a[stage.i],
        instant: line.instant,
        draft: stage.q.draft,
        more: !end,
        links: end && stage.q.link ? [stage.q.link] : undefined,
      }
    }
    return last
  }, [open, stage, line, last])
  useEffect(() => {
    onSpeech(speech)
  }, [speech, onSpeech])
  useEffect(() => () => onSpeech(null), [onSpeech])

  const choosing = open && stage.kind === 'choices'
  useEffect(() => {
    onChoosing(choosing)
  }, [choosing, onChoosing])
  useEffect(() => () => onChoosing(false), [onChoosing])

  // He's talking while a paragraph of his is still being typed out.
  const [typing, setTyping] = useState(false)
  useEffect(() => {
    if (!open || stage.kind !== 'answer' || line.instant) {
      const id = window.setTimeout(() => setTyping(false), 0)
      return () => window.clearTimeout(id)
    }
    const on = window.setTimeout(() => setTyping(true), 0)
    const off = window.setTimeout(() => setTyping(false), typingTime(text))
    return () => {
      window.clearTimeout(on)
      window.clearTimeout(off)
    }
  }, [open, stage, line, text])
  useEffect(() => {
    onTalking(typing)
  }, [typing, onTalking])
  useEffect(() => () => onTalking(false), [onTalking])

  const ask = useCallback(
    (q: FireQuestion) => {
      onAsk(q.id)
      setLast(null)
      setStage({ kind: 'asking', q })
      newLine()
    },
    [onAsk, newLine],
  )

  /** On to the next thing: the rest of the line, the next paragraph, or back to the things to ask. */
  const next = useCallback(() => {
    if (stage.kind === 'choices') return
    const stillTyping = !line.instant && performance.now() - began.current < typingTime(text)
    if (stage.kind === 'asking') {
      setStage({ kind: 'answer', q: stage.q, i: 0 })
      newLine()
      return
    }
    if (stillTyping) {
      setLine((l) => ({ ...l, instant: true }))
      return
    }
    if (stage.i < stage.q.a.length - 1) {
      setStage({ kind: 'answer', q: stage.q, i: stage.i + 1 })
      newLine()
      return
    }
    // the end of his answer: it stays up over him (with its link) while the guest picks again
    const end = stage.q.a.length - 1
    setLast({
      who: 'eduard',
      key: line.key,
      text: stage.q.a[end],
      instant: true,
      draft: stage.q.draft,
      links: stage.q.link ? [stage.q.link] : undefined,
    })
    setStage({ kind: 'choices' })
  }, [stage, line, text, newLine])

  // The guest's question hangs over their head a moment, then Eduard answers.
  useEffect(() => {
    if (!open || stage.kind !== 'asking') return
    const id = window.setTimeout(next, Math.max(1400, typingTime(stage.q.q) + 800))
    return () => window.clearTimeout(id)
  }, [open, stage, next])

  const choose = useCallback(
    (o: Option) => {
      if (o.kind === 'question') ask(o.q)
      else if (o.kind === 'hugo') onAskHugo()
      else onLeave()
    },
    [ask, onAskHugo, onLeave],
  )

  // Keys (capture phase, so the scene never sees them and the guest stays in
  // their chair): choosing, the arrows or W A S D move the pointer, E, Enter
  // or Space asks, 1–6 ask straight away and Esc gets up; while someone's
  // speaking, E, Enter or Space goes on and Esc goes back to the choices.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const swallow = () => {
        e.stopPropagation()
        e.preventDefault()
      }
      const go = e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space'
      if (stage.kind !== 'choices') {
        if (go) {
          swallow()
          if (!e.repeat) next()
        } else if (e.code === 'Escape') {
          swallow()
          setLast(null)
          setStage({ kind: 'choices' })
        } else if (/^(Key[WASD]|Arrow)/.test(e.code)) swallow()
        return
      }
      const move = (by: number) => {
        swallow()
        setCursor((c) => Math.min(options.length - 1, Math.max(0, c + by)))
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') move(-columns)
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') move(columns)
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') move(-1)
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') move(1)
      else if (go) {
        swallow()
        if (!e.repeat) choose(options[cursor])
      } else if (e.code === 'Escape') {
        swallow()
        onLeave()
      } else {
        const n = DIGITS[e.code]
        const o = n === undefined ? undefined : options[n]
        if (o?.kind === 'question') {
          swallow()
          setCursor(n)
          ask(o.q)
        }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, stage, next, columns, options, cursor, choose, ask, onLeave])

  if (!open) return null

  if (stage.kind !== 'choices') {
    const end = stage.kind === 'answer' && stage.i === stage.q.a.length - 1
    return (
      <>
        {/* a click or a tap anywhere goes on */}
        <button
          type="button"
          className={styles.anywhere}
          aria-label="Go on"
          tabIndex={-1}
          onClick={next}
        />
        <div className={`${styles.goOn} ${cabin.pixel}`}>
          <button type="button" className={styles.goOnButton} onClick={next}>
            {!touch && <kbd className={styles.key}>E</kbd>}
            {stage.kind === 'asking' ? 'Skip' : end ? 'Ask more' : 'Next'}
            <span aria-hidden="true"> ▸</span>
          </button>
          {stage.kind === 'answer' && (
            <span
              className={styles.progress}
              aria-label={`Part ${stage.i + 1} of ${stage.q.a.length}`}
            >
              {stage.q.a.map((_, k) => (
                <span key={k} data-on={k <= stage.i ? 'true' : undefined} />
              ))}
            </span>
          )}
        </div>
      </>
    )
  }

  return (
    <div
      ref={root}
      className={`${styles.talk} ${cabin.pixel}`}
      role="dialog"
      aria-modal="false"
      aria-label="Ask Eduard, by the fire"
      tabIndex={-1}
    >
      <div className={styles.head}>
        <span className={styles.title}>Ask Eduard</span>
        {!touch && <span className={styles.hint}>↑ ↓ to choose · E to ask</span>}
      </div>
      <ul className={styles.options}>
        {options.map((o, i) => {
          const done = o.kind === 'question' && asked.includes(o.q.id)
          return (
            <li
              key={o.kind === 'question' ? `q:${o.q.id}` : o.kind}
              data-action={o.kind !== 'question'}
            >
              <button
                type="button"
                className={styles.option}
                data-on={i === cursor ? 'true' : undefined}
                data-asked={done ? 'true' : undefined}
                onPointerEnter={() => !touch && setCursor(i)}
                onFocus={() => setCursor(i)}
                onClick={() => {
                  setCursor(i)
                  choose(o)
                }}
              >
                <span className={styles.pointer} aria-hidden="true">
                  ▶
                </span>
                {!touch && o.kind === 'question' && <kbd className={styles.key}>{i + 1}</kbd>}
                {!touch && o.kind === 'hugo' && <kbd className={styles.key}>Q</kbd>}
                {!touch && o.kind === 'leave' && <kbd className={styles.key}>Esc</kbd>}
                <span className={styles.label}>
                  {o.kind === 'question'
                    ? o.q.q
                    : o.kind === 'hugo'
                      ? 'Ask HUGO something else'
                      : 'Get up'}
                </span>
                {done && (
                  <span className={styles.tick} aria-label="asked">
                    ✓
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
